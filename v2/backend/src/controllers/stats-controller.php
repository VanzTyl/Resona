<?php

/**
 * Resona User Stats Controller
 *
 * Provides personal listening statistics summary for profile display.
 * v1.1: New controller for REV-003.
 *
 * @package Resona
 * @version 1.1.0
 */

/**
 * Get personal listening statistics summary.
 * Maps to: GET /api/user/stats
 * v1.1: Returns total tracks played, unique artists, top genre, listening time.
 *
 * @param array $params Route parameters (unused).
 *
 * @return void
 */
function handleGetUserStats(array $params): void
{
    $auth = requireAuth();
    $userId = $auth['userId'];

    $totalTracks = dbQueryOne(
        'SELECT COUNT(*) AS total FROM listening_events WHERE user_id = :userId',
        [':userId' => $userId]
    );

    $uniqueArtists = dbQueryOne(
        'SELECT COUNT(DISTINCT spotify_artist_id) AS total FROM user_artists WHERE user_id = :userId',
        [':userId' => $userId]
    );

    $listeningTime = dbQueryOne(
        'SELECT COALESCE(SUM(track_duration_ms), 0) / 60000.0 AS total_minutes
         FROM listening_events WHERE user_id = :userId',
        [':userId' => $userId]
    );

    // Top genre: use most-played artist name as a proxy for genre
    $topArtist = dbQueryOne(
        'SELECT artist_name FROM user_artists
         WHERE user_id = :userId
         ORDER BY play_count DESC
         LIMIT 1',
        [':userId' => $userId]
    );

    $topGenre = $topArtist !== null ? $topArtist['artist_name'] : null;

    sendJson([
        'success' => true,
        'data'    => [
            'totalTracksPlayed'    => (int)($totalTracks['total'] ?? 0),
            'uniqueArtists'        => (int)($uniqueArtists['total'] ?? 0),
            'topGenre'             => $topGenre,
            'listeningTimeMinutes' => round((float)($listeningTime['total_minutes'] ?? 0)),
        ],
    ]);
}
