<?php

/**
 * Resona Reaction Controller
 *
 * Handles emoji reactions on feed cards and triggers contextual chat messages.
 * Implements contracts C-017, C-018, C-019.
 *
 * @package Resona
 * @version 1.0.0
 */

/**
 * Add an emoji reaction to a feed card.
 * Maps to: POST /api/reactions
 * Implements C-017.
 *
 * @param array $params Route parameters (unused).
 *
 * @return void
 */
function handleAddReaction(array $params): void
{
    $auth = requireAuth();
    $userId = $auth['userId'];
    $body = parseJsonBody();

    $cardId = $body['cardId'] ?? '';
    $emoji = $body['emoji'] ?? '';

    if ($cardId === '' || $emoji === '') {
        sendJson(['success' => false, 'error' => 'Card ID and emoji are required'], HTTP_BAD_REQUEST);
        return;
    }

    if (!in_array($emoji, VALID_EMOJIS, true)) {
        sendJson(['success' => false, 'error' => 'Invalid emoji type'], HTTP_BAD_REQUEST);
        return;
    }

    $card = dbQueryOne(
        'SELECT id, user_id FROM listening_events WHERE id = :cardId',
        [':cardId' => $cardId]
    );

    if ($card === null) {
        sendJson(['success' => false, 'error' => 'Feed card not found'], HTTP_NOT_FOUND);
        return;
    }

    $existing = dbQueryOne(
        'SELECT id FROM reactions
         WHERE listening_event_id = :cardId AND user_id = :userId AND emoji = :emoji',
        [':cardId' => $cardId, ':userId' => $userId, ':emoji' => $emoji]
    );

    if ($existing !== null) {
        sendJson(['success' => false, 'error' => 'Reaction already exists'], HTTP_CONFLICT);
        return;
    }

    $reactionId = dbExecute(
        'INSERT INTO reactions (listening_event_id, user_id, emoji, created_at)
         VALUES (:cardId, :userId, :emoji, NOW())',
        [':cardId' => $cardId, ':userId' => $userId, ':emoji' => $emoji]
    );

    if ($reactionId === 0) {
        sendJson(['success' => false, 'error' => 'Failed to add reaction'], HTTP_INTERNAL_SERVER_ERROR);
        return;
    }

    $insertId = dbLastInsertId();

    // Trigger contextual message in the chat thread with the card owner.
    $cardOwnerId = (int)$card['user_id'];

    if ($cardOwnerId !== $userId) {
        triggerReactionMessage($userId, $cardOwnerId, $cardId, $emoji);
    }

    sendJson([
        'success' => true,
        'data'    => [
            'reactionId' => $insertId,
            'emoji'      => $emoji,
            'createdAt'  => date('Y-m-d H:i:s'),
        ],
    ], HTTP_CREATED);
}

/**
 * Remove an emoji reaction from a feed card.
 * Maps to: DELETE /api/reactions/{reactionId}
 * Implements C-018.
 *
 * @param array $params Route parameters with 'reactionId'.
 *
 * @return void
 */
function handleRemoveReaction(array $params): void
{
    $auth = requireAuth();
    $userId = $auth['userId'];
    $reactionId = $params['reactionId'] ?? '';

    if ($reactionId === '') {
        sendJson(['success' => false, 'error' => 'Reaction ID is required'], HTTP_BAD_REQUEST);
        return;
    }

    $reaction = dbQueryOne(
        'SELECT id, user_id FROM reactions WHERE id = :reactionId',
        [':reactionId' => $reactionId]
    );

    if ($reaction === null) {
        sendJson(['success' => false, 'error' => 'Reaction not found'], HTTP_NOT_FOUND);
        return;
    }

    if ((int)$reaction['user_id'] !== (int)$userId) {
        sendJson(['success' => false, 'error' => 'Cannot remove another user\'s reaction'], HTTP_FORBIDDEN);
        return;
    }

    dbExecute(
        'DELETE FROM reactions WHERE id = :reactionId',
        [':reactionId' => $reactionId]
    );

    sendJson(['success' => true, 'data' => ['message' => 'Reaction removed successfully']]);
}

/**
 * Get all reactions for a feed card.
 * Maps to: GET /api/reactions/{cardId}
 * Implements C-019.
 *
 * @param array $params Route parameters with 'cardId'.
 *
 * @return void
 */
function handleGetReactions(array $params): void
{
    $cardId = $params['cardId'] ?? '';

    if ($cardId === '') {
        sendJson(['success' => false, 'error' => 'Card ID is required'], HTTP_BAD_REQUEST);
        return;
    }

    $reactions = dbQuery(
        'SELECT r.id, r.emoji, r.user_id, u.username, r.created_at
         FROM reactions r
         JOIN users u ON u.id = r.user_id
         WHERE r.listening_event_id = :cardId
         ORDER BY r.created_at DESC',
        [':cardId' => $cardId]
    );

    sendJson([
        'success' => true,
        'data'    => $reactions,
    ]);
}

/**
 * Trigger an automated contextual message when a user reacts to a friend's card.
 *
 * @param int    $reactorUserId The user who added the reaction.
 * @param int    $cardOwnerId   The owner of the feed card.
 * @param int    $cardId        The listening event ID.
 * @param string $emoji         The emoji that was used.
 *
 * @return void
 */
function triggerReactionMessage(
    int $reactorUserId,
    int $cardOwnerId,
    int $cardId,
    string $emoji
): void {
    $reactor = dbQueryOne(
        'SELECT username, display_name FROM users WHERE id = :id',
        [':id' => $reactorUserId]
    );

    $card = dbQueryOne(
        'SELECT track_name, artist_names FROM listening_events WHERE id = :id',
        [':id' => $cardId]
    );

    if ($reactor === null || $card === null) {
        return;
    }

    $reactorName = $reactor['display_name'] ?: $reactor['username'];
    $trackName = $card['track_name'];
    $artistNames = $card['artist_names'];

    $messageContent = sprintf(
        '%s reacted %s to your track "%s" by %s',
        $reactorName,
        $emoji,
        $trackName,
        $artistNames
    );

    // Find or create the chat thread between the two users.
    $existingThread = dbQueryOne(
        'SELECT id FROM chat_threads
         WHERE (user_id_1 = :user1 AND user_id_2 = :user2)
            OR (user_id_1 = :user2_2 AND user_id_2 = :user1_2)',
        [
            ':user1'   => $reactorUserId,
            ':user2'   => $cardOwnerId,
            ':user1_2' => $reactorUserId,
            ':user2_2' => $cardOwnerId,
        ]
    );

    $threadId = null;

    if ($existingThread !== null) {
        $threadId = (int)$existingThread['id'];
    } else {
        dbExecute(
            'INSERT INTO chat_threads (user_id_1, user_id_2, created_at)
             VALUES (:user1, :user2, NOW())',
            [':user1' => $reactorUserId, ':user2' => $cardOwnerId]
        );

        $threadId = (int)dbLastInsertId();
    }

    // Insert the auto-generated message.
    dbExecute(
        'INSERT INTO messages (thread_id, sender_id, content, message_type, created_at)
         VALUES (:threadId, :senderId, :content, :msgType, NOW())',
        [
            ':threadId' => $threadId,
            ':senderId' => $reactorUserId,
            ':content'  => $messageContent,
            ':msgType'  => MESSAGE_TYPE_AUTO,
        ]
    );
}
