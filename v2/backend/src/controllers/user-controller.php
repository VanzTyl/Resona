<?php

/**
 * Resona User Controller
 *
 * Handles user profile retrieval, updates, and search.
 * Implements contracts C-004, C-005, C-006.
 * v1.1: Extended with bio, username validation, privacy, interests/genres/about-me, username check.
 *
 * @package Resona
 * @version 1.1.0
 */

/**
 * Get the authenticated user's profile.
 * Maps to: GET /api/user/profile
 * Implements C-004. v1.1: Extended response with bio, username_updated_at, privacy_level,
 *                         interests, favorite_genres, about_me, is_onboarded, onboarding_step.
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
        'SELECT u.id, u.username, u.display_name, u.avatar_url, u.email,
                u.bio, u.username_updated_at, u.privacy_level,
                u.interests, u.favorite_genres, u.about_me,
                u.is_onboarded, u.onboarding_step,
                (st.access_token IS NOT NULL) AS spotify_connected,
                u.created_at
         FROM users u
         LEFT JOIN spotify_tokens st ON st.user_id = u.id
         WHERE u.id = :userId',
        [':userId' => $userId]
    );

    if ($user === null) {
        sendJson(['success' => false, 'error' => 'User not found'], HTTP_NOT_FOUND);
        return;
    }

    $user['spotify_connected'] = (bool) $user['spotify_connected'];
    $user['is_onboarded'] = (bool) $user['is_onboarded'];
    $user['onboarding_step'] = (int) $user['onboarding_step'];

    sendJson([
        'success' => true,
        'data'    => $user,
    ]);
}

/**
 * Update the authenticated user's profile.
 * Maps to: PUT /api/user/profile
 * Implements C-005. v1.1: Extended with bio, username, privacy_level, interests, genres, about_me.
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

    $displayName = trim($body['displayName'] ?? '');
    $avatarUrl = trim($body['avatarUrl'] ?? '');
    $bio = trim($body['bio'] ?? '');
    $username = trim($body['username'] ?? '');
    $privacyLevel = trim($body['privacyLevel'] ?? '');
    $interests = trim($body['interests'] ?? '');
    $favoriteGenres = trim($body['favoriteGenres'] ?? '');
    $aboutMe = trim($body['aboutMe'] ?? '');

    $hasUpdates = false;
    $updateFields = [];
    $updateParams = [':userId' => $userId];

    if ($displayName !== '') {
        if (strlen($displayName) > 100) {
            sendJson(['success' => false, 'error' => 'Display name too long (max 100 characters)'], HTTP_BAD_REQUEST);
            return;
        }

        $updateFields[] = 'display_name = :displayName';
        $updateParams[':displayName'] = $displayName;
        $hasUpdates = true;
    }

    if ($avatarUrl !== '') {
        if (strlen($avatarUrl) > 500) {
            sendJson(['success' => false, 'error' => 'Avatar URL too long (max 500 characters)'], HTTP_BAD_REQUEST);
            return;
        }

        if (!filter_var($avatarUrl, FILTER_VALIDATE_URL)) {
            sendJson(['success' => false, 'error' => 'Invalid avatar URL format'], HTTP_BAD_REQUEST);
            return;
        }

        $updateFields[] = 'avatar_url = :avatarUrl';
        $updateParams[':avatarUrl'] = $avatarUrl;
        $hasUpdates = true;
    }

    // v1.1: Bio field
    if (isset($body['bio'])) {
        if (strlen($bio) > 200) {
            sendJson(['success' => false, 'error' => 'Bio too long (max 200 characters)'], HTTP_BAD_REQUEST);
            return;
        }

        $updateFields[] = 'bio = :bio';
        $updateParams[':bio'] = $bio;
        $hasUpdates = true;
    }

    // v1.1: Username change
    if (isset($body['username'])) {
        if (strlen($username) < USERNAME_MIN_LENGTH || strlen($username) > USERNAME_MAX_LENGTH) {
            sendJson([
                'success' => false,
                'error'   => 'Username must be between ' . USERNAME_MIN_LENGTH . ' and ' . USERNAME_MAX_LENGTH . ' characters',
            ], HTTP_BAD_REQUEST);
            return;
        }

        if (!preg_match(USERNAME_REGEX, $username)) {
            sendJson([
                'success' => false,
                'error'   => 'Username can only contain lowercase letters, numbers, and underscores',
            ], HTTP_BAD_REQUEST);
            return;
        }

        // Check uniqueness
        $existing = dbQueryOne(
            'SELECT id FROM users WHERE username = :username AND id != :userId',
            [':username' => $username, ':userId' => $userId]
        );

        if ($existing !== null) {
            sendJson(['success' => false, 'error' => 'Username is already taken'], HTTP_CONFLICT);
            return;
        }

        // Check cooldown (30 days between changes)
        $currentUser = dbQueryOne(
            'SELECT username_updated_at FROM users WHERE id = :id',
            [':id' => $userId]
        );

        if ($currentUser !== null && $currentUser['username_updated_at'] !== null) {
            $lastChange = strtotime($currentUser['username_updated_at']);
            $daysSinceChange = (time() - $lastChange) / 86400;

            if ($daysSinceChange < USERNAME_CHANGE_COOLDOWN_DAYS) {
                $daysRemaining = ceil(USERNAME_CHANGE_COOLDOWN_DAYS - $daysSinceChange);
                sendJson([
                    'success' => false,
                    'error'   => 'Username can only be changed once every ' . USERNAME_CHANGE_COOLDOWN_DAYS . ' days. '
                                . $daysRemaining . ' day(s) remaining.',
                ], HTTP_BAD_REQUEST);
                return;
            }
        }

        $updateFields[] = 'username = :username';
        $updateFields[] = 'username_updated_at = NOW()';
        $updateParams[':username'] = $username;
        $hasUpdates = true;
    }

    // v1.1: Privacy level
    if (isset($body['privacyLevel'])) {
        if (!in_array($privacyLevel, PRIVACY_LEVELS, true)) {
            sendJson(['success' => false, 'error' => 'Invalid privacy level. Must be public, friends_only, or private'], HTTP_BAD_REQUEST);
            return;
        }

        $updateFields[] = 'privacy_level = :privacyLevel';
        $updateParams[':privacyLevel'] = $privacyLevel;
        $hasUpdates = true;
    }

    // v1.1: Interests
    if (isset($body['interests'])) {
        if (strlen($interests) > 500) {
            sendJson(['success' => false, 'error' => 'Interests too long (max 500 characters)'], HTTP_BAD_REQUEST);
            return;
        }

        $updateFields[] = 'interests = :interests';
        $updateParams[':interests'] = $interests;
        $hasUpdates = true;
    }

    // v1.1: Favorite genres
    if (isset($body['favoriteGenres'])) {
        if (strlen($favoriteGenres) > 300) {
            sendJson(['success' => false, 'error' => 'Favorite genres too long (max 300 characters)'], HTTP_BAD_REQUEST);
            return;
        }

        $updateFields[] = 'favorite_genres = :favoriteGenres';
        $updateParams[':favoriteGenres'] = $favoriteGenres;
        $hasUpdates = true;
    }

    // v1.1: About me
    if (isset($body['aboutMe'])) {
        if (strlen($aboutMe) > 500) {
            sendJson(['success' => false, 'error' => 'About me too long (max 500 characters)'], HTTP_BAD_REQUEST);
            return;
        }

        $updateFields[] = 'about_me = :aboutMe';
        $updateParams[':aboutMe'] = $aboutMe;
        $hasUpdates = true;
    }

    if (!$hasUpdates) {
        sendJson(['success' => false, 'error' => 'No fields to update'], HTTP_BAD_REQUEST);
        return;
    }

    $updateFields[] = 'updated_at = NOW()';
    $sql = 'UPDATE users SET ' . implode(', ', $updateFields) . ' WHERE id = :userId';

    dbExecute($sql, $updateParams);

    $user = dbQueryOne(
        'SELECT id, username, display_name, avatar_url, email, bio, username_updated_at,
                privacy_level, interests, favorite_genres, about_me,
                is_onboarded, onboarding_step, created_at
         FROM users WHERE id = :userId',
        [':userId' => $userId]
    );

    $user['is_onboarded'] = (bool) $user['is_onboarded'];
    $user['onboarding_step'] = (int) $user['onboarding_step'];

    sendJson([
        'success' => true,
        'data'    => $user,
    ]);
}

/**
 * Search for users by username (partial match).
 * Maps to: GET /api/user/search?q={query}&limit={limit}
 * Implements C-006.
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

    $users = dbQuery(
        'SELECT id, username, display_name, avatar_url FROM users
         WHERE (username LIKE :query OR display_name LIKE :query)
           AND id != :userId
         LIMIT :limitVal',
        [
            ':query'    => '%' . $query . '%',
            ':userId'   => $userId,
            ':limitVal' => $limit,
        ]
    );

    sendJson([
        'success' => true,
        'data'    => $users,
    ]);
}

/**
 * Check if a username is available.
 * Maps to: GET /api/user/check-username?username={username}
 * v1.1: New endpoint for onboarding and profile editing.
 *
 * @param array $params Route parameters (unused).
 *
 * @return void
 */
function handleCheckUsername(array $params): void
{
    $auth = requireAuth();
    $userId = $auth['userId'];
    $username = trim($_GET['username'] ?? '');

    if ($username === '') {
        sendJson(['success' => false, 'error' => 'Username is required'], HTTP_BAD_REQUEST);
        return;
    }

    // Validate format
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
