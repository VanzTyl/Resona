<?php

/**
 * Resona Feed Controller
 *
 * Generates personalized social feed with friend music activity cards.
 * Implements contracts C-013, C-014, C-015, C-016.
 * v1.2: Batch-eager-loaded enrichment data (N+1 fix). getReactionSummary accepts $currentUserId param.
 *
 * @package Resona
 * @version 1.2.0
 */

/**
 * Get paginated friend activity feed.
 * Maps to: GET /api/feed?cursor={cursor}&limit={limit}
 * Implements C-013. v1.1: Excludes friends with privacy_level='private'.
 * v1.2: Batch-eager-loaded enrichment data (N+1 fix).
 *
 * @param array $params Route parameters (unused).
 *
 * @return void
 */
function handleGetFeed(array $params): void
{
    $auth = requireAuth();
    $userId = $auth['userId'];
    $cursor = $_GET['cursor'] ?? '';
    $limit = min((int)($_GET['limit'] ?? DEFAULT_CURSOR_LIMIT), MAX_CURSOR_LIMIT);

    $friendIds = getFriendIds((int)$userId);

    if (count($friendIds) === 0) {
        sendJson([
            'success' => true,
            'data'    => [
                'cards'     => [],
                'nextCursor' => null,
                'hasMore'   => false,
            ],
        ]);
        return;
    }

    // v1.1: Filter out friends with privacy_level = 'private'
    $placeholders = implode(', ', array_fill(0, count($friendIds), '?'));
    $filteredFriends = dbQuery(
        "SELECT id FROM users WHERE id IN ({$placeholders}) AND privacy_level != 'private'",
        $friendIds
    );
    $filteredFriendIds = array_map('intval', array_column($filteredFriends, 'id'));

    if (count($filteredFriendIds) === 0) {
        sendJson([
            'success' => true,
            'data'    => [
                'cards'     => [],
                'nextCursor' => null,
                'hasMore'   => false,
            ],
        ]);
        return;
    }

    $friendCount = count($filteredFriendIds);
    $placeholders = implode(', ', array_fill(0, $friendCount, '?'));
    $params_list = $filteredFriendIds;
    $cursorCondition = '';

    if ($cursor !== '') {
        $cursorCondition = ' AND le.created_at < ?';
        $params_list[] = $cursor;
    }

    $sql = "SELECT le.id, le.user_id, le.track_name, le.artist_names, le.album_name,
                   le.album_art_url, le.is_playing, le.progress_ms, le.created_at,
                   u.username, u.display_name, u.avatar_url
            FROM listening_events le
            JOIN users u ON u.id = le.user_id
            WHERE le.user_id IN ({$placeholders})
                  {$cursorCondition}
            ORDER BY le.created_at DESC
            LIMIT " . ($limit + 1);

    $events = dbQuery($sql, $params_list);

    $hasMore = count($events) > $limit;

    if ($hasMore) {
        $events = array_slice($events, 0, $limit);
    }

    // --- Batch eager-load enrichment data ---
    // Eager-load current user's top artists (same for all cards)
    $userArtists = dbQuery(
        'SELECT artist_name FROM user_artists WHERE user_id = :userId ORDER BY play_count DESC LIMIT 10',
        [':userId' => $userId]
    );
    $userArtistNames = array_column($userArtists, 'artist_name');

    $uniqueFriendIds = array_unique(array_column($events, 'user_id'));

    if (count($uniqueFriendIds) === 0) {
        $weeklyTopMap = [];
        $friendArtistsMap = [];
    } else {
        $friendIdPlaceholders = implode(',', array_fill(0, count($uniqueFriendIds), '?'));

        // Batch-fetch weekly top tracks for all friend IDs in one query
        $weeklyTops = dbQuery(
            "SELECT user_id, track_name, artist_names, album_art_url, COUNT(*) AS play_count
             FROM listening_events
             WHERE user_id IN ({$friendIdPlaceholders})
               AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
             GROUP BY user_id, spotify_track_id, track_name, artist_names, album_art_url
             ORDER BY user_id, play_count DESC",
            $uniqueFriendIds
        );
        $weeklyTopMap = [];
        foreach ($weeklyTops as $wt) {
            if (!isset($weeklyTopMap[$wt['user_id']])) {
                $weeklyTopMap[$wt['user_id']] = $wt;
            }
        }

        // Batch-fetch top artists for all friends
        $allFriendArtists = dbQuery(
            "SELECT user_id, artist_name FROM user_artists
             WHERE user_id IN ({$friendIdPlaceholders})
             ORDER BY user_id, play_count DESC",
            $uniqueFriendIds
        );
        $friendArtistsMap = [];
        foreach ($allFriendArtists as $row) {
            $friendArtistsMap[(int)$row['user_id']][] = $row['artist_name'];
        }
    }

    // Batch-fetch reaction summaries for all card IDs in one query
    $cardIds = array_column($events, 'id');

    if (count($cardIds) === 0) {
        $reactionsBatch = [];
        $userReactedMap = [];
    } else {
        $cardIdPlaceholders = implode(',', array_fill(0, count($cardIds), '?'));

        $reactionsBatch = dbQuery(
            "SELECT listening_event_id, emoji, COUNT(*) AS count
             FROM reactions
             WHERE listening_event_id IN ({$cardIdPlaceholders})
             GROUP BY listening_event_id, emoji",
            $cardIds
        );

        $userReactions = dbQuery(
            "SELECT listening_event_id FROM reactions
             WHERE listening_event_id IN ({$cardIdPlaceholders}) AND user_id = ?",
            array_merge($cardIds, [$userId])
        );
        $userReactedMap = array_fill_keys(array_column($userReactions, 'listening_event_id'), true);
    }

    // Build reaction summary lookup map
    $reactionSummaryMap = [];
    foreach ($reactionsBatch as $row) {
        $eid = (int)$row['listening_event_id'];
        if (!isset($reactionSummaryMap[$eid])) {
            $reactionSummaryMap[$eid] = ['count' => 0, 'topEmojis' => [], 'userReacted' => false];
        }
        $reactionSummaryMap[$eid]['count'] += (int)$row['count'];
        $reactionSummaryMap[$eid]['topEmojis'][] = [
            'emoji' => $row['emoji'],
            'count' => (int)$row['count'],
        ];
    }
    foreach ($userReactedMap as $eid => $val) {
        if (isset($reactionSummaryMap[$eid])) {
            $reactionSummaryMap[$eid]['userReacted'] = true;
        }
    }
    // --- End batch eager-load ---

    $cards = [];

    foreach ($events as $event) {
        $friendUserId = (int)$event['user_id'];

        // Weekly top track from batch map
        $weeklyTop = $weeklyTopMap[$friendUserId] ?? null;

        // Compute shared artists from cached user artists and batch-fetched friend artists
        $friendArtistNamesForFriend = $friendArtistsMap[$friendUserId] ?? [];
        $sharedArtists = array_values(array_intersect($userArtistNames, $friendArtistNamesForFriend));
        $totalUnique = count(array_unique(array_merge($userArtistNames, $friendArtistNamesForFriend)));
        $overlapScore = $totalUnique > 0
            ? round((count($sharedArtists) / $totalUnique) * 100, 1)
            : 0.0;

        // Reaction summary from batch map
        $summary = $reactionSummaryMap[(int)$event['id']] ?? [
            'count'       => 0,
            'topEmojis'   => [],
            'userReacted' => false,
        ];

        $cards[] = [
            'id'              => (int)$event['id'],
            'user'            => [
                'id'          => $friendUserId,
                'username'    => $event['username'],
                'displayName' => $event['display_name'],
                'avatarUrl'   => $event['avatar_url'],
            ],
            'track'           => [
                'name'      => $event['track_name'],
                'artists'   => explode(', ', $event['artist_names']),
                'albumName' => $event['album_name'],
                'albumArt'  => $event['album_art_url'],
            ],
            'isPlaying'       => (bool)$event['is_playing'],
            'weeklyTopTrack'  => $weeklyTop,
            'sharedArtists'   => $sharedArtists,
            'overlapScore'    => $overlapScore,
            'reactionSummary' => $summary,
            'createdAt'       => $event['created_at'],
        ];
    }

    $nextCursor = $hasMore && count($cards) > 0
        ? $cards[count($cards) - 1]['createdAt']
        : null;

    sendJson([
        'success' => true,
        'data'    => [
            'cards'     => $cards,
            'nextCursor' => $nextCursor,
            'hasMore'   => $hasMore,
        ],
    ]);
}

/**
 * Get a single feed card with full detail.
 * Maps to: GET /api/feed/card/{cardId}
 * Implements C-014.
 *
 * @param array $params Route parameters with 'cardId'.
 *
 * @return void
 */
function handleGetFeedCard(array $params): void
{
    $auth = requireAuth();
    $userId = $auth['userId'];
    $cardId = $params['cardId'] ?? '';

    $event = dbQueryOne(
        'SELECT le.*, u.username, u.display_name, u.avatar_url
         FROM listening_events le
         JOIN users u ON u.id = le.user_id
         WHERE le.id = :cardId',
        [':cardId' => $cardId]
    );

    if ($event === null) {
        sendJson(['success' => false, 'error' => 'Feed card not found'], HTTP_NOT_FOUND);
        return;
    }

    $computedData = computeFeedCardData((int)$userId, (int)$event['user_id']);

    $reactions = dbQuery(
        'SELECT r.id, r.emoji, r.user_id, u.username, r.created_at
         FROM reactions r
         JOIN users u ON u.id = r.user_id
         WHERE r.listening_event_id = :cardId
         ORDER BY r.created_at DESC',
        [':cardId' => $cardId]
    );

    $card = [
        'id'              => (int)$event['id'],
        'user'            => [
            'id'          => (int)$event['user_id'],
            'username'    => $event['username'],
            'displayName' => $event['display_name'],
            'avatarUrl'   => $event['avatar_url'],
        ],
        'track'           => [
            'name'        => $event['track_name'],
            'artists'     => explode(', ', $event['artist_names']),
            'albumName'   => $event['album_name'],
            'albumArt'    => $event['album_art_url'],
            'durationMs'  => (int)$event['track_duration_ms'],
        ],
        'isPlaying'       => (bool)$event['is_playing'],
        'progressMs'      => (int)$event['progress_ms'],
        'weeklyTopTrack'  => $computedData['weeklyTopTrack'],
        'sharedArtists'   => $computedData['sharedArtists'],
        'overlapScore'    => $computedData['overlapScore'],
        'reactions'       => $reactions,
        'createdAt'       => $event['created_at'],
    ];

    sendJson([
        'success' => true,
        'data'    => $card,
    ]);
}

/**
 * Get a friend's weekly top tracks.
 * Maps to: GET /api/feed/weekly-top/{friendId}
 * Implements C-015.
 *
 * @param array $params Route parameters with 'friendId'.
 *
 * @return void
 */
function handleGetWeeklyTop(array $params): void
{
    $auth = requireAuth();
    $friendId = $params['friendId'] ?? '';

    if ($friendId === '') {
        sendJson(['success' => false, 'error' => 'Friend ID is required'], HTTP_BAD_REQUEST);
        return;
    }

    $topTracks = dbQuery(
        'SELECT track_name, artist_names, album_art_url, COUNT(*) AS play_count
         FROM listening_events
         WHERE user_id = :friendId
           AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
         GROUP BY spotify_track_id, track_name, artist_names, album_art_url
         ORDER BY play_count DESC
         LIMIT 10',
        [':friendId' => $friendId]
    );

    sendJson([
        'success' => true,
        'data'    => $topTracks,
    ]);
}

/**
 * Get music taste comparison between current user and a friend.
 * Maps to: GET /api/feed/comparison/{friendId}
 * Implements C-016.
 *
 * @param array $params Route parameters with 'friendId'.
 *
 * @return void
 */
function handleGetComparison(array $params): void
{
    $auth = requireAuth();
    $userId = $auth['userId'];
    $friendId = $params['friendId'] ?? '';

    if ($friendId === '') {
        sendJson(['success' => false, 'error' => 'Friend ID is required'], HTTP_BAD_REQUEST);
        return;
    }

    $comparison = computeFeedCardData((int)$userId, (int)$friendId);

    sendJson([
        'success' => true,
        'data'    => [
            'sharedArtists'   => $comparison['sharedArtists'],
            'userTopArtists'  => $comparison['userTopArtists'],
            'friendTopArtists' => $comparison['friendTopArtists'],
            'overlapScore'    => $comparison['overlapScore'],
        ],
    ]);
}

/**
 * Get the list of friend IDs for a given user.
 *
 * @param int $userId The user ID.
 *
 * @return array Array of friend user IDs.
 */
function getFriendIds(int $userId): array
{
    $friendships = dbQuery(
        'SELECT CASE WHEN sender_id = :userId THEN receiver_id ELSE sender_id END AS friend_id
         FROM friendships
         WHERE (sender_id = :userId2 OR receiver_id = :userId3)
           AND status = :status',
        [
            ':userId'  => $userId,
            ':userId2' => $userId,
            ':userId3' => $userId,
            ':status'  => FRIEND_STATUS_ACCEPTED,
        ]
    );

    return array_map('intval', array_column($friendships, 'friend_id'));
}

/**
 * Compute feed card enrichment data including weekly top track, shared artists, and overlap.
 *
 * @param int $userId   The requesting user's ID.
 * @param int $friendId The friend's user ID.
 *
 * @return array{weeklyTopTrack: ?array, sharedArtists: array, overlapScore: float, userTopArtists: array, friendTopArtists: array}
 */
function computeFeedCardData(int $userId, int $friendId): array
{
    $weeklyTop = dbQueryOne(
        'SELECT track_name, artist_names, album_art_url, COUNT(*) AS play_count
         FROM listening_events
         WHERE user_id = :friendId
           AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
         GROUP BY spotify_track_id, track_name, artist_names, album_art_url
         ORDER BY play_count DESC
         LIMIT 1',
        [':friendId' => $friendId]
    );

    $userArtists = dbQuery(
        'SELECT artist_name FROM user_artists
         WHERE user_id = :userId
         ORDER BY play_count DESC LIMIT 10',
        [':userId' => $userId]
    );

    $friendArtists = dbQuery(
        'SELECT artist_name FROM user_artists
         WHERE user_id = :friendId
         ORDER BY play_count DESC LIMIT 10',
        [':friendId' => $friendId]
    );

    $userArtistNames = array_column($userArtists, 'artist_name');
    $friendArtistNames = array_column($friendArtists, 'artist_name');

    $sharedArtists = array_values(array_intersect($userArtistNames, $friendArtistNames));

    $totalUnique = count(array_unique(array_merge($userArtistNames, $friendArtistNames)));
    $overlapScore = $totalUnique > 0
        ? round((count($sharedArtists) / $totalUnique) * 100, 1)
        : 0.0;

    $userTopArtists = array_slice($userArtistNames, 0, 5);
    $friendTopArtists = array_slice($friendArtistNames, 0, 5);

    return [
        'weeklyTopTrack'   => $weeklyTop,
        'sharedArtists'    => $sharedArtists,
        'overlapScore'     => $overlapScore,
        'userTopArtists'   => $userTopArtists,
        'friendTopArtists' => $friendTopArtists,
    ];
}

/**
 * Get a summary of reactions for a given feed card.
 * v1.2: Accepts $currentUserId as parameter instead of calling requireAuth() internally.
 *
 * @param int $cardId         The listening event ID.
 * @param int $currentUserId  The authenticated user ID.
 *
 * @return array{count: int, topEmojis: array, userReacted: bool}
 */
function getReactionSummary(int $cardId, int $currentUserId): array
{
    $reactions = dbQuery(
        'SELECT emoji, COUNT(*) AS count FROM reactions
         WHERE listening_event_id = :cardId
         GROUP BY emoji
         ORDER BY count DESC
         LIMIT 5',
        [':cardId' => $cardId]
    );

    $userReacted = dbQueryOne(
        'SELECT id FROM reactions
         WHERE listening_event_id = :cardId AND user_id = :userId
         LIMIT 1',
        [':cardId' => $cardId, ':userId' => $currentUserId]
    );

    $totalCount = 0;
    $topEmojis = [];

    foreach ($reactions as $reaction) {
        $totalCount += (int)$reaction['count'];
        $topEmojis[] = [
            'emoji' => $reaction['emoji'],
            'count' => (int)$reaction['count'],
        ];
    }

    return [
        'count'       => $totalCount,
        'topEmojis'   => $topEmojis,
        'userReacted' => $userReacted !== null,
    ];
}
