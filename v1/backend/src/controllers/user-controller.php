<?php

/**
 * Resona User Controller
 *
 * Handles user profile retrieval, updates, and search.
 * Implements contracts C-004, C-005, C-006.
 *
 * @package Resona
 * @version 1.0.0
 */

/**
 * Get the authenticated user's profile.
 * Maps to: GET /api/user/profile
 * Implements C-004.
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

    sendJson([
        'success' => true,
        'data'    => $user,
    ]);
}

/**
 * Update the authenticated user's profile.
 * Maps to: PUT /api/user/profile
 * Implements C-005.
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

    if ($displayName === '' && $avatarUrl === '') {
        sendJson(['success' => false, 'error' => 'No fields to update'], HTTP_BAD_REQUEST);
        return;
    }

    $updateFields = [];
    $updateParams = [':userId' => $userId];

    if ($displayName !== '') {
        if (strlen($displayName) > 100) {
            sendJson(['success' => false, 'error' => 'Display name too long (max 100 characters)'], HTTP_BAD_REQUEST);
            return;
        }

        $updateFields[] = 'display_name = :displayName';
        $updateParams[':displayName'] = $displayName;
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
    }

    $updateFields[] = 'updated_at = NOW()';
    $sql = 'UPDATE users SET ' . implode(', ', $updateFields) . ' WHERE id = :userId';

    dbExecute($sql, $updateParams);

    $user = dbQueryOne(
        'SELECT id, username, display_name, avatar_url, email, created_at
         FROM users WHERE id = :userId',
        [':userId' => $userId]
    );

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
