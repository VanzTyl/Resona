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

    $threadId = $body['threadId'] ?? '';
    $content = trim($body['content'] ?? '');
    $messageType = $body['type'] ?? MESSAGE_TYPE_MANUAL;

    if ($threadId === '' || $content === '') {
        sendJson(['success' => false, 'error' => 'Thread ID and content are required'], HTTP_BAD_REQUEST);
        return;
    }

    if (strlen($content) > 1000) {
        sendJson(['success' => false, 'error' => 'Message too long (max 1000 characters)'], HTTP_BAD_REQUEST);
        return;
    }

    if (!in_array($messageType, [MESSAGE_TYPE_MANUAL, MESSAGE_TYPE_AUTO], true)) {
        $messageType = MESSAGE_TYPE_MANUAL;
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

    $messageId = dbExecute(
        'INSERT INTO messages (thread_id, sender_id, content, message_type, created_at)
         VALUES (:threadId, :senderId, :content, :msgType, NOW())',
        [
            ':threadId' => $threadId,
            ':senderId' => $userId,
            ':content'  => $content,
            ':msgType'  => $messageType,
        ]
    );

    if ($messageId === 0) {
        sendJson(['success' => false, 'error' => 'Failed to send message'], HTTP_INTERNAL_SERVER_ERROR);
        return;
    }

    sendJson([
        'success' => true,
        'data'    => [
            'messageId' => dbLastInsertId(),
            'content'   => $content,
            'createdAt' => date('Y-m-d H:i:s'),
        ],
    ], HTTP_CREATED);
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

    $messages = dbQuery(
        'SELECT m.id, m.sender_id, u.username, u.display_name, u.avatar_url,
                m.content, m.message_type, m.created_at
         FROM messages m
         JOIN users u ON u.id = m.sender_id
         WHERE m.thread_id = :threadId
         ORDER BY m.created_at DESC
         LIMIT :limitVal OFFSET :offsetVal',
        [
            ':threadId' => $threadId,
            ':limitVal' => $limit,
            ':offsetVal' => $offset,
        ]
    );

    sendJson([
        'success' => true,
        'data'    => [
            'messages' => array_reverse($messages),
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

    $unreadData = dbQuery(
        'SELECT ct.id AS thread_id, COUNT(m.id) AS unread_count
         FROM chat_threads ct
         LEFT JOIN messages m ON m.thread_id = ct.id
         WHERE (ct.user_id_1 = :userId OR ct.user_id_2 = :userId)
           AND m.sender_id != :userId
           AND (m.created_at IS NULL OR m.created_at > COALESCE(
               (SELECT MAX(last_read_at) FROM (
                   SELECT :userId2 AS uid, NOW() AS last_read_at
               ) AS dummy), 
               DATE_SUB(NOW(), INTERVAL 30 DAY)
           ))
         GROUP BY ct.id',
        [':userId' => $userId, ':userId2' => $userId]
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
