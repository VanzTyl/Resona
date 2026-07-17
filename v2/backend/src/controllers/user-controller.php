<?php

/**
 * Resona User Controller
 *
 * Handles user profile retrieval, updates, and search.
 * Implements contracts C-004, C-005, C-006.
 * v1.2: Extracted validation helpers. Added USERNAME_REGEX. camelCase API response fields.
 *
 * @package Resona
 * @version 1.2.0
 */

// ---------------------------------------------------------------------------
// Validation Helpers (under 50 lines each)
// ---------------------------------------------------------------------------

/**
 * Validate display name.
 *
 * @param string $value The display name to validate.
 *
 * @return string|null Error message or null if valid.
 */
function validateDisplayName(string $value): ?string
{
    if (strlen($value) > 100) {
        return 'Display name too long (max 100 characters)';
    }
    return null;
}

/**
 * Validate avatar URL.
 *
 * @param string $value The avatar URL to validate.
 *
 * @return string|null Error message or null if valid.
 */
function validateAvatarUrl(string $value): ?string
{
    if (strlen($value) > 500) {
        return 'Avatar URL too long (max 500 characters)';
    }
    if (!filter_var($value, FILTER_VALIDATE_URL)) {
        return 'Invalid avatar URL format';
    }
    return null;
}

/**
 * Validate username format, length, uniqueness, and cooldown.
 *
 * @param string $value  The proposed username.
 * @param int    $userId The current user ID.
 *
 * @return string|null Error message or null if valid.
 */
function validateUsername(string $value, int $userId): ?string
{
    $len = strlen($value);
    if ($len < USERNAME_MIN_LENGTH || $len > USERNAME_MAX_LENGTH) {
        return 'Username must be between ' . USERNAME_MIN_LENGTH . ' and ' . USERNAME_MAX_LENGTH . ' characters';
    }
    if (!preg_match(USERNAME_REGEX, $value)) {
        return 'Username can only contain lowercase letters, numbers, and underscores';
    }

    $currentUserRow = dbQueryOne(
        'SELECT username, username_updated_at FROM users WHERE id = :id',
        [':id' => $userId]
    );

    // If unchanged, skip uniqueness and cooldown checks
    if ($currentUserRow !== null && $currentUserRow['username'] === $value) {
        return null;
    }

    // Check uniqueness
    $existing = dbQueryOne(
        'SELECT id FROM users WHERE username = :username AND id != :userId',
        [':username' => $value, ':userId' => $userId]
    );
    if ($existing !== null) {
        return 'Username is already taken';
    }

    // Check cooldown (7 days between changes)
    if ($currentUserRow !== null && $currentUserRow['username_updated_at'] !== null) {
        $lastChange = strtotime($currentUserRow['username_updated_at']);
        $daysSinceChange = (time() - $lastChange) / 86400;
        if ($daysSinceChange < USERNAME_CHANGE_COOLDOWN_DAYS) {
            $daysRemaining = ceil(USERNAME_CHANGE_COOLDOWN_DAYS - $daysSinceChange);
            return 'Username can only be changed once every ' . USERNAME_CHANGE_COOLDOWN_DAYS . ' days. '
                . $daysRemaining . ' day(s) remaining.';
        }
    }

    return null;
}

/**
 * Validate privacy level.
 *
 * @param string $value The privacy level to validate.
 *
 * @return string|null Error message or null if valid.
 */
function validatePrivacyLevel(string $value): ?string
{
    if (!in_array($value, PRIVACY_LEVELS, true)) {
        return 'Invalid privacy level. Must be public, friends_only, or private';
    }
    return null;
}

/**
 * Validate bio length.
 *
 * @param string $value The bio to validate.
 *
 * @return string|null Error message or null if valid.
 */
function validateBio(string $value): ?string
{
    if (strlen($value) > 200) {
        return 'Bio too long (max 200 characters)';
    }
    return null;
}

/**
 * Validate interests length.
 *
 * @param string $value The interests to validate.
 *
 * @return string|null Error message or null if valid.
 */
function validateInterests(string $value): ?string
{
    if (strlen($value) > 500) {
        return 'Interests too long (max 500 characters)';
    }
    return null;
}

/**
 * Validate favorite genres length.
 *
 * @param string $value The favorite genres to validate.
 *
 * @return string|null Error message or null if valid.
 */
function validateFavoriteGenres(string $value): ?string
{
    if (strlen($value) > 300) {
        return 'Favorite genres too long (max 300 characters)';
    }
    return null;
}

/**
 * Validate about me length.
 *
 * @param string $value The about me to validate.
 *
 * @return string|null Error message or null if valid.
 */
function validateAboutMe(string $value): ?string
{
    if (strlen($value) > 500) {
        return 'About me too long (max 500 characters)';
    }
    return null;
}

// ---------------------------------------------------------------------------
// Controller Handlers
// ---------------------------------------------------------------------------

/**
 * Get the authenticated user's profile.
 * Maps to: GET /api/user/profile
 * Implements C-004. v1.2: camelCase response fields via SQL AS aliases.
 *
 * @param array $params Route parameters (unused).
 *
 * @return void
 */
function handleGetProfile(array $params): void
{
    $auth = requireAuth();
    $userId = $auth['userId'];

    $user = dbQueryOne(
        'SELECT u.id, u.username, u.display_name AS displayName, u.avatar_url AS avatarUrl,
                u.email,
                u.bio, u.username_updated_at AS usernameUpdatedAt,
                u.privacy_level AS privacyLevel,
                u.interests, u.favorite_genres AS favoriteGenres, u.about_me AS aboutMe,
                u.is_onboarded AS isOnboarded, u.onboarding_step AS onboardingStep,
                (st.access_token IS NOT NULL) AS spotifyConnected,
                u.created_at AS createdAt
         FROM users u
         LEFT JOIN spotify_tokens st ON st.user_id = u.id
         WHERE u.id = :userId',
        [':userId' => $userId]
    );

    if ($user === null) {
        sendJson(['success' => false, 'error' => 'User not found'], HTTP_NOT_FOUND);
        return;
    }

    $user['spotifyConnected'] = (bool) $user['spotifyConnected'];
    $user['isOnboarded'] = (bool) $user['isOnboarded'];
    $user['onboardingStep'] = (int) $user['onboardingStep'];

    sendJson([
        'success' => true,
        'data'    => $user,
    ]);
}

/**
 * Update the authenticated user's profile.
 * Maps to: PUT /api/user/profile
 * Implements C-005. v1.2: Uses validation helpers, camera-ready camelCase response.
 *
 * @param array $params Route parameters (unused).
 *
 * @return void
 */
function handleUpdateProfile(array $params): void
{
    $auth = requireAuth();
    $userId = $auth['userId'];
    $body = parseJsonBody();

    // Field definitions: [dbColumn, camelCaseKey, validator, transform]
    $fieldDefs = [
        ['display_name',  'displayName',     'validateDisplayName',  null],
        ['avatar_url',    'avatarUrl',       'validateAvatarUrl',    null],
        ['bio',           'bio',             'validateBio',          null],
        ['username',      'username',        'validateUsername',     'strtolower'],
        ['privacy_level', 'privacyLevel',    'validatePrivacyLevel', null],
        ['interests',     'interests',       'validateInterests',    null],
        ['favorite_genres','favoriteGenres', 'validateFavoriteGenres', null],
        ['about_me',      'aboutMe',         'validateAboutMe',      null],
    ];

    $updateFields = [];
    $updateParams = [':userId' => $userId];

    // Special handling: username changed check to avoid extra cooldown query
    $usernameChanged = false;

    foreach ($fieldDefs as [$dbCol, $bodyKey, $validator, $transform]) {
        // Build a fallback chain: try the camelCase bodyKey, then the snake_case dbCol,
        // then a direct key derived from the dbCol (mirrors onboarding-controller pattern).
        $rawValue = $body[$bodyKey] ?? $body[$dbCol] ?? null;

        if ($rawValue === null) {
            continue;
        }

        $value = trim((string) $rawValue);

        // Allow empty strings to clear fields by setting them to NULL.
        // The frontend always sends bio, interests, favoriteGenres, aboutMe
        // even when empty; without this they can never be cleared.
        if ($value === '') {
            $updateFields[] = "{$dbCol} = NULL";
            continue;
        }

        if ($transform !== null) {
            $value = $transform($value);
        }

        if ($dbCol === 'username') {
            $error = $validator($value, $userId);
        } else {
            $error = $validator($value);
        }

        if ($error !== null) {
            sendJson(['success' => false, 'error' => $error], HTTP_BAD_REQUEST);
            return;
        }

        if ($dbCol === 'username') {
            $currentRow = dbQueryOne(
                'SELECT username FROM users WHERE id = :id',
                [':id' => $userId]
            );
            if ($currentRow !== null && $currentRow['username'] !== $value) {
                $usernameChanged = true;
            }
        }

        $updateFields[] = "{$dbCol} = :{$dbCol}";
        $updateParams[":{$dbCol}"] = $value;
    }

    if ($usernameChanged) {
        $updateFields[] = 'username_updated_at = NOW()';
    }

    if (count($updateFields) === 0) {
        sendJson(['success' => false, 'error' => 'No fields to update'], HTTP_BAD_REQUEST);
        return;
    }

    $updateFields[] = 'updated_at = NOW()';
    $sql = 'UPDATE users SET ' . implode(', ', $updateFields) . ' WHERE id = :userId';

    dbExecute($sql, $updateParams);

    $user = dbQueryOne(
        'SELECT id, username, display_name AS displayName, avatar_url AS avatarUrl,
                email, bio, username_updated_at AS usernameUpdatedAt,
                privacy_level AS privacyLevel, interests,
                favorite_genres AS favoriteGenres, about_me AS aboutMe,
                is_onboarded AS isOnboarded, onboarding_step AS onboardingStep,
                created_at AS createdAt
         FROM users WHERE id = :userId',
        [':userId' => $userId]
    );

    $user['isOnboarded'] = (bool) $user['isOnboarded'];
    $user['onboardingStep'] = (int) $user['onboardingStep'];

    sendJson([
        'success' => true,
        'data'    => $user,
    ]);
}

/**
 * Search for users by username (partial match).
 * Maps to: GET /api/user/search?q={query}&limit={limit}
 * Implements C-006. v1.2: camelCase response fields.
 *
 * @param array $params Route parameters (unused).
 *
 * @return void
 */
function handleSearchUsers(array $params): void
{
    $auth = requireAuth();
    $userId = $auth['userId'];
    $query = trim($_GET['q'] ?? '');
    $limit = min((int)($_GET['limit'] ?? DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);

    if ($query === '') {
        sendJson(['success' => false, 'error' => 'Search query is required'], HTTP_BAD_REQUEST);
        return;
    }

    if (strlen($query) < 2) {
        sendJson(['success' => false, 'error' => 'Search query must be at least 2 characters'], HTTP_BAD_REQUEST);
        return;
    }

    try {
        $users = dbQuery(
            "SELECT id, username, display_name AS displayName, avatar_url AS avatarUrl
             FROM users
             WHERE (username LIKE :query1 OR display_name LIKE :query2)
               AND id != :userId
             LIMIT " . (int)$limit,
            [
                ':query1'   => '%' . $query . '%',
                ':query2'   => '%' . $query . '%',
                ':userId'   => $userId,
            ]
        );
    } catch (\Throwable $e) {
        sendJson([
            'success' => false,
            'error'   => 'Search failed: ' . $e->getMessage(),
        ], HTTP_INTERNAL_SERVER_ERROR);
        return;
    }

    sendJson([
        'success' => true,
        'data'    => $users,
    ]);
}

/**
 * Check if a username is available.
 * Maps to: GET /api/user/check-username?username={username}
 * v1.2: Added USERNAME_REGEX validation.
 *
 * @param array $params Route parameters (unused).
 *
 * @return void
 */
function handleCheckUsername(array $params): void
{
    $auth = requireAuth();
    $userId = $auth['userId'];
    $username = strtolower(trim($_GET['username'] ?? ''));

    if ($username === '') {
        sendJson(['success' => false, 'error' => 'Username is required'], HTTP_BAD_REQUEST);
        return;
    }

    // Validate length
    if (strlen($username) < USERNAME_MIN_LENGTH || strlen($username) > USERNAME_MAX_LENGTH) {
        sendJson([
            'success' => true,
            'data'    => [
                'available' => false,
                'reason'    => 'Username must be between ' . USERNAME_MIN_LENGTH . ' and ' . USERNAME_MAX_LENGTH . ' characters',
            ],
        ]);
        return;
    }

    // Validate regex (lowercase letters, numbers, underscores)
    if (!preg_match(USERNAME_REGEX, $username)) {
        sendJson([
            'success' => true,
            'data'    => [
                'available' => false,
                'reason'    => 'Username can only contain lowercase letters, numbers, and underscores',
            ],
        ]);
        return;
    }

    // Check uniqueness (exclude current user)
    $existing = dbQueryOne(
        'SELECT id FROM users WHERE username = :username AND id != :userId',
        [':username' => $username, ':userId' => $userId]
    );

    sendJson([
        'success' => true,
        'data'    => [
            'available' => $existing === null,
            'reason'    => $existing !== null ? 'Username is already taken' : null,
        ],
    ]);
}
