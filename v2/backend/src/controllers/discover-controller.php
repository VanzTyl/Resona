<?php

/**
 * Resona Discover Controller
 *
 * Provides random user discovery for finding new friends.
 * v1.1: New controller for REV-009.
 *
 * @package Resona
 * @version 1.1.0
 */

/**
 * Get random users to discover (excludes friends and private users).
 * Maps to: GET /api/discover/random?limit={limit}
 * v1.1: New discovery endpoint.
 *
 * @param array $params Route parameters (unused).
 *
 * @return void
 */
function handleDiscoverRandom(array $params): void
{
    $auth = requireAuth();
    $userId = $auth['userId'];
    $limit = min((int)($_GET['limit'] ?? 5), 20);

    // Get current user's friend IDs
    $friendIds = getFriendIds((int)$userId);

    $excludeIds = [$userId];
    $excludePlaceholders = [];

    if (count($friendIds) > 0) {
        $excludeIds = array_merge($excludeIds, $friendIds);
    }

    $excludePlaceholders = implode(', ', array_fill(0, count($excludeIds), '?'));

    $users = dbQuery(
        "SELECT u.id, u.username, u.display_name, u.avatar_url,
                u.interests, u.favorite_genres, u.about_me
         FROM users u
         WHERE u.id NOT IN ({$excludePlaceholders})
           AND (u.privacy_level IS NULL OR u.privacy_level != 'private')
         ORDER BY RAND()
         LIMIT :limitVal",
        array_merge($excludeIds, [':limitVal' => $limit])
    );

    $result = [];

    foreach ($users as $user) {
        $recentTrack = dbQueryOne(
            'SELECT track_name, artist_names, album_art_url
             FROM listening_events
             WHERE user_id = :userId
             ORDER BY created_at DESC
             LIMIT 1',
            [':userId' => $user['id']]
        );

        $result[] = [
            'id'             => (int)$user['id'],
            'username'       => $user['username'],
            'displayName'    => $user['display_name'],
            'avatarUrl'      => $user['avatar_url'],
            'interests'      => $user['interests'] ?? '',
            'favoriteGenres' => $user['favorite_genres'] ?? '',
            'aboutMe'        => $user['about_me'] ?? '',
            'recentTrack'    => $recentTrack !== null ? [
                'trackName'   => $recentTrack['track_name'],
                'artistNames' => $recentTrack['artist_names'],
                'albumArtUrl' => $recentTrack['album_art_url'],
            ] : null,
        ];
    }

    sendJson([
        'success' => true,
        'data'    => $result,
    ]);
}
