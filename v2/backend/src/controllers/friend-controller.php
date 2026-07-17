<?php

/**
 * Resona Friend Controller
 *
 * Handles friend request lifecycle and social graph management.
 * Implements contracts C-007, C-008, C-009, C-010.
 *
 * @package Resona
 * @version 1.0.0
 */

/**
 * Send a friend request to another user.
 * Maps to: POST /api/friends/request
 * Implements C-007.
 *
 * @param array $params Route parameters (unused).
 *
 * @return void
 */
function handleSendFriendRequest(array $params): void
{
    $auth = requireAuth();
    $userId = $auth['userId'];
    $body = parseJsonBody();

    $targetUsername = trim($body['username'] ?? '');

    if ($targetUsername === '') {
        sendJson(['success' => false, 'error' => 'Username is required'], HTTP_BAD_REQUEST);
        return;
    }

    $targetUser = dbQueryOne(
        'SELECT id FROM users WHERE username = :username',
        [':username' => $targetUsername]
    );

    if ($targetUser === null) {
        sendJson(['success' => false, 'error' => 'User not found'], HTTP_NOT_FOUND);
        return;
    }

    $targetId = $targetUser['id'];

    if ((int)$targetId === (int)$userId) {
        sendJson(['success' => false, 'error' => 'Cannot send friend request to yourself'], HTTP_BAD_REQUEST);
        return;
    }

    $existing = dbQueryOne(
        'SELECT id, status FROM friendships
         WHERE (sender_id = :userId AND receiver_id = :targetId)
            OR (sender_id = :targetId2 AND receiver_id = :userId2)',
        [
            ':userId'   => $userId,
            ':targetId' => $targetId,
            ':targetId2' => $targetId,
            ':userId2'  => $userId,
        ]
    );

    if ($existing !== null) {
        $status = $existing['status'];

        if ($status === FRIEND_STATUS_ACCEPTED) {
            sendJson(['success' => false, 'error' => 'Already friends with this user'], HTTP_CONFLICT);
            return;
        }

        if ($status === FRIEND_STATUS_PENDING) {
            sendJson(['success' => false, 'error' => 'Friend request already pending'], HTTP_CONFLICT);
            return;
        }
    }

    $requestId = dbExecute(
        'INSERT INTO friendships (sender_id, receiver_id, status, created_at, updated_at)
         VALUES (:senderId, :receiverId, :status, NOW(), NOW())',
        [
            ':senderId'   => $userId,
            ':receiverId' => $targetId,
            ':status'     => FRIEND_STATUS_PENDING,
        ]
    );

    if ($requestId === 0) {
        sendJson(['success' => false, 'error' => 'Failed to create friend request'], HTTP_INTERNAL_SERVER_ERROR);
        return;
    }

    sendJson([
        'success' => true,
        'data'    => [
            'friendRequestId' => dbLastInsertId(),
            'status'          => FRIEND_STATUS_PENDING,
        ],
    ], HTTP_CREATED);
}

/**
 * Accept or reject a pending friend request.
 * Maps to: PUT /api/friends/request/{id}
 * Implements C-008.
 *
 * @param array $params Route parameters with 'id'.
 *
 * @return void
 */
function handleRespondToRequest(array $params): void
{
    $auth = requireAuth();
    $userId = $auth['userId'];
    $requestId = $params['id'] ?? '';
    $body = parseJsonBody();

    $action = $body['action'] ?? '';

    if (!in_array($action, ['accept', 'reject'], true)) {
        sendJson(['success' => false, 'error' => 'Action must be accept or reject'], HTTP_BAD_REQUEST);
        return;
    }

    $friendship = dbQueryOne(
        'SELECT id, sender_id, receiver_id, status FROM friendships WHERE id = :id',
        [':id' => $requestId]
    );

    if ($friendship === null) {
        sendJson(['success' => false, 'error' => 'Friend request not found'], HTTP_NOT_FOUND);
        return;
    }

    if ((int)$friendship['receiver_id'] !== (int)$userId) {
        sendJson(['success' => false, 'error' => 'Not authorized to respond to this request'], HTTP_FORBIDDEN);
        return;
    }

    if ($friendship['status'] !== FRIEND_STATUS_PENDING) {
        sendJson(['success' => false, 'error' => 'Friend request is no longer pending'], HTTP_CONFLICT);
        return;
    }

    $newStatus = $action === 'accept'
        ? FRIEND_STATUS_ACCEPTED
        : FRIEND_STATUS_REJECTED;

    dbExecute(
        'UPDATE friendships SET status = :status, updated_at = NOW() WHERE id = :id',
        [':status' => $newStatus, ':id' => $requestId]
    );

    sendJson([
        'success' => true,
        'data'    => ['status' => $newStatus],
    ]);
}

/**
 * List all friends with current listening status.
 * Maps to: GET /api/friends?page={page}&limit={limit}
 * Implements C-009.
 *
 * @param array $params Route parameters (unused).
 *
 * @return void
 */
function handleListFriends(array $params): void
{
    $auth = requireAuth();
    $userId = $auth['userId'];
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min((int)($_GET['limit'] ?? DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
    $offset = ($page - 1) * $limit;

    $result = [];

    try {
        // Query 1: Fetch friends — uses UNION instead of CASE in JOIN, no subqueries in ON clause
        $friends = dbQuery(
            "SELECT u.id, u.username, u.display_name AS displayName, u.avatar_url AS avatarUrl
             FROM (
                 SELECT receiver_id AS friend_id FROM friendships
                 WHERE sender_id = :userId AND status = :status
                 UNION
                 SELECT sender_id AS friend_id FROM friendships
                 WHERE receiver_id = :userId AND status = :status
             ) AS f
             JOIN users u ON u.id = f.friend_id
             ORDER BY u.display_name ASC
             LIMIT " . (int)$limit . " OFFSET " . (int)$offset,
            [
                ':userId' => $userId,
                ':status' => FRIEND_STATUS_ACCEPTED,
            ]
        );

        $friendIds = array_column($friends, 'id');
        $listeningMap = [];
        $unreadMap = [];

        // Query 2: Batch-fetch latest listening event per friend (subquery in FROM, which TiDB supports)
        if (!empty($friendIds)) {
            $placeholders = implode(',', array_fill(0, count($friendIds), '?'));

            $listeningEvents = dbQuery(
                "SELECT le.user_id,
                        le.track_name AS currentlyPlayingTrack,
                        le.artist_names AS currentlyPlayingArtist,
                        le.album_art_url AS albumArtUrl,
                        le.is_playing AS isPlaying
                 FROM listening_events le
                 INNER JOIN (
                     SELECT user_id, MAX(created_at) AS max_created
                     FROM listening_events
                     WHERE user_id IN ($placeholders)
                     GROUP BY user_id
                 ) latest ON le.user_id = latest.user_id AND le.created_at = latest.max_created",
                $friendIds
            );

            foreach ($listeningEvents as $le) {
                $listeningMap[$le['user_id']] = $le;
            }
        }

        // Query 3: Batch-fetch unread counts per friend (no correlated subquery)
        if (!empty($friendIds)) {
            $placeholders = implode(',', array_fill(0, count($friendIds), '?'));
            $params = array_merge(
                [$userId, $userId, $userId, $userId],
                $friendIds,
                $friendIds
            );

            $unreadCounts = dbQuery(
                "SELECT
                    CASE WHEN ct.user_id_1 = ? THEN ct.user_id_2 ELSE ct.user_id_1 END AS friend_id,
                    COUNT(*) AS unreadCount
                 FROM messages m
                 JOIN chat_threads ct ON ct.id = m.thread_id
                 WHERE (ct.user_id_1 = ? OR ct.user_id_2 = ?)
                   AND m.sender_id != ?
                   AND (ct.user_id_1 IN ($placeholders) OR ct.user_id_2 IN ($placeholders))
                 GROUP BY friend_id",
                $params
            );

            foreach ($unreadCounts as $uc) {
                $unreadMap[$uc['friend_id']] = (int)$uc['unreadCount'];
            }
        }

        // Merge: attach listening data and unread counts to each friend
        foreach ($friends as $friend) {
            $friendId = $friend['id'];
            $listening = $listeningMap[$friendId] ?? null;

            $result[] = [
                'id'                     => $friendId,
                'username'               => $friend['username'],
                'displayName'            => $friend['displayName'],
                'avatarUrl'              => $friend['avatarUrl'],
                'currentlyPlayingTrack'  => $listening['currentlyPlayingTrack'] ?? null,
                'currentlyPlayingArtist' => $listening['currentlyPlayingArtist'] ?? null,
                'albumArtUrl'            => $listening['albumArtUrl'] ?? null,
                'isPlaying'              => $listening['isPlaying'] ?? null,
                'unreadCount'            => $unreadMap[$friendId] ?? 0,
            ];
        }
    } catch (\Throwable $e) {
        sendJson([
            'success' => false,
            'error'   => 'Failed to list friends: ' . $e->getMessage(),
        ], HTTP_INTERNAL_SERVER_ERROR);
        return;
    }

    sendJson([
        'success' => true,
        'data'    => $result,
    ]);
}

/**
 * List pending incoming friend requests for the authenticated user.
 * Maps to: GET /api/friends/requests/pending
 * Implements C-007 (partial: read side of friend requests).
 *
 * @param array $params Route parameters (unused).
 *
 * @return void
 */
function handlePendingRequests(array $params): void
{
    $auth = requireAuth();
    $userId = $auth['userId'];

    $requests = dbQuery(
        'SELECT f.id, f.sender_id, u.username, u.display_name AS displayName, u.avatar_url AS avatarUrl, f.created_at AS createdAt
         FROM friendships f
         JOIN users u ON u.id = f.sender_id
         WHERE f.receiver_id = :userId AND f.status = :status
         ORDER BY f.created_at DESC',
        [
            ':userId' => $userId,
            ':status' => FRIEND_STATUS_PENDING,
        ]
    );

    sendJson([
        'success' => true,
        'data'    => $requests,
    ]);
}

/**
 * Remove an existing friendship.
 * Maps to: DELETE /api/friends/{userId}
 * Implements C-010.
 *
 * @param array $params Route parameters with 'userId'.
 *
 * @return void
 */
function handleRemoveFriend(array $params): void
{
    $auth = requireAuth();
    $userId = $auth['userId'];
    $friendUserId = $params['userId'] ?? '';

    if ($friendUserId === '') {
        sendJson(['success' => false, 'error' => 'User ID is required'], HTTP_BAD_REQUEST);
        return;
    }

    $deleted = dbExecute(
        'DELETE FROM friendships
         WHERE ((sender_id = :userId AND receiver_id = :friendId)
            OR (sender_id = :friendId2 AND receiver_id = :userId2))
           AND status = :status',
        [
            ':userId'   => $userId,
            ':friendId' => $friendUserId,
            ':friendId2' => $friendUserId,
            ':userId2'  => $userId,
            ':status'   => FRIEND_STATUS_ACCEPTED,
        ]
    );

    if ($deleted === 0) {
        sendJson(['success' => false, 'error' => 'Friendship not found'], HTTP_NOT_FOUND);
        return;
    }

    sendJson(['success' => true, 'data' => ['message' => 'Friend removed successfully']]);
}
