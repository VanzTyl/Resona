<?php

/**
 * Resona Message Controller
 *
 * Handles peer-to-peer chat threads and messaging.
 * Implements contracts C-020, C-021, C-022, C-023.
 *
 * @package Resona
 * @version 1.0.0
 */

/**
 * Get or create a chat thread with a specific friend.
 * Maps to: GET /api/messages/thread/{friendId}
 * Implements C-020.
 *
 * @param array $params Route parameters with 'friendId'.
 *
 * @return void
 */
function handleGetThread(array $params): void
{
    $auth = requireAuth();
    $userId = $auth['userId'];
    $friendId = $params['friendId'] ?? '';

    if ($friendId === '') {
        sendJson(['success' => false, 'error' => 'Friend ID is required'], HTTP_BAD_REQUEST);
        return;
    }

    $thread = dbQueryOne(
        'SELECT ct.id, ct.user_id_1, ct.user_id_2, ct.created_at,
                (SELECT content FROM messages WHERE thread_id = ct.id ORDER BY created_at DESC LIMIT 1) AS last_message,
                (SELECT created_at FROM messages WHERE thread_id = ct.id ORDER BY created_at DESC LIMIT 1) AS last_message_at
         FROM chat_threads ct
         WHERE (ct.user_id_1 = :userId AND ct.user_id_2 = :friendId)
            OR (ct.user_id_1 = :friendId2 AND ct.user_id_2 = :userId2)',
        [
            ':userId'    => $userId,
            ':friendId'  => $friendId,
            ':friendId2' => $friendId,
            ':userId2'   => $userId,
        ]
    );

    if ($thread === null) {
        sendJson([
            'success' => true,
            'data'    => [
                'threadId' => null,
                'friend'   => null,
                'lastMessage' => null,
            ],
        ]);
        return;
    }

    $friendData = dbQueryOne(
        'SELECT id, username, display_name, avatar_url FROM users WHERE id = :id',
        [':id' => $friendId]
    );

    sendJson([
        'success' => true,
        'data'    => [
            'threadId'    => (int)$thread['id'],
            'friend'      => $friendData,
            'lastMessage' => [
                'content' => $thread['last_message'],
                'time'    => $thread['last_message_at'],
            ],
        ],
    ]);
}

/**
 * Send a message in a chat thread.
 * Maps to: POST /api/messages/send
 * Implements C-021.
 *
 * @param array $params Route parameters (unused).
 *
 * @return void
 */
function handleSendMessage(array $params): void
{
    $auth = requireAuth();
    $userId = $auth['userId'];
    $body = parseJsonBody();

    $threadId = $body['threadId'] ?? null;
    $friendId = $body['friendId'] ?? null;
    $content = trim($body['content'] ?? '');
    $messageType = $body['type'] ?? MESSAGE_TYPE_MANUAL;

    if ($content === '') {
        sendJson(['success' => false, 'error' => 'Message content is required'], HTTP_BAD_REQUEST);
        return;
    }

    if (strlen($content) > 1000) {
        sendJson(['success' => false, 'error' => 'Message too long (max 1000 characters)'], HTTP_BAD_REQUEST);
        return;
    }

    if (!in_array($messageType, [MESSAGE_TYPE_MANUAL, MESSAGE_TYPE_AUTO], true)) {
        $messageType = MESSAGE_TYPE_MANUAL;
    }

    // If no threadId but friendId is provided, create or find the thread
    if ($threadId === null || $threadId === '') {
        if ($friendId === null) {
            sendJson(['success' => false, 'error' => 'Friend ID is required to start a conversation'], HTTP_BAD_REQUEST);
            return;
        }

        // Check if thread already exists (race condition guard)
        $existing = dbQueryOne(
            'SELECT id FROM chat_threads WHERE (user_id_1 = :uid1 AND user_id_2 = :fid1) OR (user_id_1 = :fid2 AND user_id_2 = :uid2)',
            [':uid1' => $userId, ':fid1' => $friendId, ':fid2' => $friendId, ':uid2' => $userId]
        );

        if ($existing !== null) {
            $threadId = (int)$existing['id'];
        } else {
            // Create new thread with consistent user ID ordering
            dbExecute(
                'INSERT INTO chat_threads (user_id_1, user_id_2, created_at) VALUES (:u1, :u2, NOW())',
                [':u1' => min($userId, $friendId), ':u2' => max($userId, $friendId)]
            );
            $threadId = (int)dbLastInsertId();
        }
    }

    // Validate thread exists and user is a participant
    $thread = dbQueryOne(
        'SELECT id, user_id_1, user_id_2 FROM chat_threads WHERE id = :id',
        [':id' => $threadId]
    );

    if ($thread === null) {
        sendJson(['success' => false, 'error' => 'Thread not found'], HTTP_NOT_FOUND);
        return;
    }

    $isParticipant = (int)$thread['user_id_1'] === (int)$userId
        || (int)$thread['user_id_2'] === (int)$userId;

    if (!$isParticipant) {
        sendJson(['success' => false, 'error' => 'Not a participant in this thread'], HTTP_FORBIDDEN);
        return;
    }

    // Insert message
    dbExecute(
        'INSERT INTO messages (thread_id, sender_id, content, message_type, created_at)
         VALUES (:threadId, :senderId, :content, :msgType, NOW())',
        [
            ':threadId' => $threadId,
            ':senderId' => $userId,
            ':content'  => $content,
            ':msgType'  => $messageType,
        ]
    );

    $messageId = dbLastInsertId();

    // Fetch the full message row to return consistent shape
    $message = dbQueryOne(
        'SELECT id, thread_id AS threadId, sender_id AS senderId, content, created_at AS createdAt
         FROM messages WHERE id = :id',
        [':id' => $messageId]
    );

    sendJson(['success' => true, 'data' => $message], HTTP_CREATED);
}

/**
 * Get paginated messages for a thread.
 * Maps to: GET /api/messages/{threadId}?page={page}&limit={limit}
 * Implements C-022.
 *
 * @param array $params Route parameters with 'threadId'.
 *
 * @return void
 */
function handleGetMessages(array $params): void
{
    $auth = requireAuth();
    $userId = $auth['userId'];
    $threadId = $params['threadId'] ?? '';
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min((int)($_GET['limit'] ?? DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
    $offset = ($page - 1) * $limit;
    $afterId = isset($_GET['afterId']) ? (int)$_GET['afterId'] : null;

    if ($threadId === '') {
        sendJson(['success' => false, 'error' => 'Thread ID is required'], HTTP_BAD_REQUEST);
        return;
    }

    $thread = dbQueryOne(
        'SELECT id, user_id_1, user_id_2 FROM chat_threads WHERE id = :id',
        [':id' => $threadId]
    );

    if ($thread === null) {
        sendJson(['success' => false, 'error' => 'Thread not found'], HTTP_NOT_FOUND);
        return;
    }

    $isParticipant = (int)$thread['user_id_1'] === (int)$userId
        || (int)$thread['user_id_2'] === (int)$userId;

    if (!$isParticipant) {
        sendJson(['success' => false, 'error' => 'Not a participant in this thread'], HTTP_FORBIDDEN);
        return;
    }

    try {
        $sql = "SELECT m.id, m.sender_id, u.username, u.display_name, u.avatar_url,
                       m.content, m.message_type, m.created_at
                FROM messages m
                JOIN users u ON u.id = m.sender_id
                WHERE m.thread_id = :threadId";

        $queryParams = [':threadId' => $threadId];

        // When afterId is provided, fetch only newer messages sorted ascending (for polling)
        if ($afterId !== null && $afterId > 0) {
            $sql .= " AND m.id > :afterId";
            $sql .= " ORDER BY m.created_at ASC";
            $queryParams[':afterId'] = $afterId;
        } else {
            $sql .= " ORDER BY m.created_at DESC";
        }

        $sql .= " LIMIT " . (int)$limit . " OFFSET " . (int)$offset;

        $messages = dbQuery($sql, $queryParams);
    } catch (\Throwable $e) {
        sendJson([
            'success' => false,
            'error'   => 'Failed to fetch messages: ' . $e->getMessage(),
        ], HTTP_INTERNAL_SERVER_ERROR);
        return;
    }

    // Reverse only when sorted DESC (no afterId) to return chronological order
    if ($afterId === null || $afterId <= 0) {
        $messages = array_reverse($messages);
    }

    sendJson([
        'success' => true,
        'data'    => [
            'messages' => $messages,
            'page'     => $page,
            'hasMore'  => count($messages) === $limit,
        ],
    ]);
}

/**
 * Get unread message count for all threads.
 * Maps to: GET /api/messages/unread
 * Implements C-023.
 *
 * @param array $params Route parameters (unused).
 *
 * @return void
 */
function handleGetUnreadCount(array $params): void
{
    $auth = requireAuth();
    $userId = $auth['userId'];

    // Count messages from other users in each thread.
    // True unread tracking (last_read_at) is not yet implemented —
    // this returns all messages where the current user is not the sender.
    $unreadData = dbQuery(
        'SELECT ct.id AS thread_id, COUNT(m.id) AS unread_count
         FROM chat_threads ct
         LEFT JOIN messages m ON m.thread_id = ct.id
         WHERE (ct.user_id_1 = :userId OR ct.user_id_2 = :userId)
           AND m.sender_id != :userId
         GROUP BY ct.id',
        [':userId' => $userId]
    );

    $totalUnread = 0;
    $threads = [];

    foreach ($unreadData as $row) {
        $count = (int)$row['unread_count'];
        $totalUnread += $count;
        $threads[] = [
            'threadId' => (int)$row['thread_id'],
            'count'    => $count,
        ];
    }

    sendJson([
        'success' => true,
        'data'    => [
            'totalUnread' => $totalUnread,
            'threads'     => $threads,
        ],
    ]);
}
