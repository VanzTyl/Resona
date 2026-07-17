<?php

/**
 * Resona Onboarding Controller
 *
 * Handles first-time user onboarding flow.
 * v1.1: New controller for REV-011.
 *
 * @package Resona
 * @version 1.1.0
 */

/**
 * Get the current user's onboarding status.
 * Maps to: GET /api/user/onboarding-status
 * v1.1: Returns onboarding progress.
 *
 * @param array $params Route parameters (unused).
 *
 * @return void
 */
function handleOnboardingStatus(array $params): void
{
    $auth = requireAuth();
    $userId = $auth['userId'];

    $user = dbQueryOne(
        'SELECT is_onboarded, onboarding_step FROM users WHERE id = :id',
        [':id' => $userId]
    );

    if ($user === null) {
        sendJson(['success' => false, 'error' => 'User not found'], HTTP_NOT_FOUND);
        return;
    }

    sendJson([
        'success' => true,
        'data'    => [
            'isOnboarded'   => (bool) $user['is_onboarded'],
            'onboardingStep' => (int) $user['onboarding_step'],
        ],
    ]);
}

/**
 * Save onboarding step progress or mark onboarding as complete.
 * Maps to: POST /api/user/onboarding/step
 * v1.1: Saves profile data per step and marks user as onboarded on step 4.
 *
 * @param array $params Route parameters (unused).
 *
 * @return void
 */
function handleOnboardingStep(array $params): void
{
    $auth = requireAuth();
    $userId = $auth['userId'];
    $body = parseJsonBody();

    $step = (int) ($body['step'] ?? 0);
    $data = $body['data'] ?? [];

    if ($step < ONBOARDING_STEP_IDENTITY || $step > ONBOARDING_STEP_COMPLETE) {
        sendJson(['success' => false, 'error' => 'Invalid onboarding step'], HTTP_BAD_REQUEST);
        return;
    }

    // Step 4: Mark onboarding as complete
    if ($step === ONBOARDING_STEP_COMPLETE) {
        dbExecute(
            'UPDATE users SET is_onboarded = TRUE, onboarding_step = :step, updated_at = NOW() WHERE id = :id',
            [':step' => ONBOARDING_STEP_COMPLETE, ':id' => $userId]
        );

        sendJson([
            'success' => true,
            'data'    => [
                'isOnboarded'   => true,
                'onboardingStep' => ONBOARDING_STEP_COMPLETE,
            ],
        ]);
        return;
    }

    $stepFieldMap = [
        ONBOARDING_STEP_IDENTITY => ['display_name', 'username'],
        ONBOARDING_STEP_ABOUT    => ['bio', 'interests', 'favorite_genres'],
        ONBOARDING_STEP_PRIVACY  => ['avatar_url', 'privacy_level'],
    ];

    $allowedFields = $stepFieldMap[$step] ?? [];
    $updateFields = [];
    $updateParams = [':id' => $userId];

    foreach ($allowedFields as $field) {
        // Map database field names to camelCase body keys
        $camelMap = [
            'display_name' => 'displayName',
            'avatar_url'   => 'avatarUrl',
            'privacy_level' => 'privacyLevel',
            'favorite_genres' => 'favoriteGenres',
        ];
        $bodyKey = $camelMap[$field] ?? $field;

        $value = $data[$bodyKey] ?? $data[$field] ?? null;

        if ($value !== null && $value !== '') {
            $value = trim($value);

            // Validation
            if ($field === 'username') {
                $value = strtolower($value);
                if (strlen($value) < USERNAME_MIN_LENGTH || strlen($value) > USERNAME_MAX_LENGTH) {
                    sendJson([
                        'success' => false,
                        'error'   => 'Username must be between ' . USERNAME_MIN_LENGTH . ' and ' . USERNAME_MAX_LENGTH . ' characters',
                    ], HTTP_BAD_REQUEST);
                    return;
                }
                if (!preg_match(USERNAME_REGEX, $value)) {
                    sendJson([
                        'success' => false,
                        'error'   => 'Username can only contain lowercase letters, numbers, and underscores',
                    ], HTTP_BAD_REQUEST);
                    return;
                }
                $existing = dbQueryOne(
                    'SELECT id FROM users WHERE username = :username AND id != :userId',
                    [':username' => $value, ':userId' => $userId]
                );
                if ($existing !== null) {
                    sendJson(['success' => false, 'error' => 'Username is already taken'], HTTP_CONFLICT);
                    return;
                }
                $updateFields[] = 'username_updated_at = NOW()';
            }

            if ($field === 'bio' && strlen($value) > 200) {
                sendJson(['success' => false, 'error' => 'Bio too long (max 200 characters)'], HTTP_BAD_REQUEST);
                return;
            }

            if ($field === 'privacy_level' && !in_array($value, PRIVACY_LEVELS, true)) {
                sendJson(['success' => false, 'error' => 'Invalid privacy level'], HTTP_BAD_REQUEST);
                return;
            }

            if ($field === 'avatar_url' && strlen($value) > 500) {
                sendJson(['success' => false, 'error' => 'Avatar URL too long'], HTTP_BAD_REQUEST);
                return;
            }

            $updateFields[] = "$field = :$field";
            $updateParams[":$field"] = $value;
        }
    }

    if (count($updateFields) === 0) {
        sendJson(['success' => false, 'error' => 'No valid fields to update'], HTTP_BAD_REQUEST);
        return;
    }

    $updateFields[] = 'onboarding_step = :step';
    $updateFields[] = 'updated_at = NOW()';
    $updateParams[':step'] = $step;

    $sql = 'UPDATE users SET ' . implode(', ', $updateFields) . ' WHERE id = :id';
    dbExecute($sql, $updateParams);

    sendJson([
        'success' => true,
        'data'    => [
            'isOnboarded'    => false,
            'onboardingStep' => $step,
        ],
    ]);
}
