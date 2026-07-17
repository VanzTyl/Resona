<?php

/**
 * Resona Dashboard Controller
 *
 * Provides personal listening statistics and top artists.
 * Implements contracts C-024, C-025.
 *
 * @package Resona
 * @version 1.0.0
 */

/**
 * Get personal listening statistics summary.
 * Maps to: GET /api/dashboard/stats
 * Implements C-024.
 *
 * @param array $params Route parameters (unused).
 *
 * @return void
 */
function handleGetPersonalStats(array $params): void
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

    $totalArtists = dbQueryOne(
        'SELECT COUNT(*) AS total FROM user_artists WHERE user_id = :userId',
        [':userId' => $userId]
    );

    $totalListeningMinutes = dbQueryOne(
        'SELECT COALESCE(SUM(track_duration_ms), 0) / 60000.0 AS total_minutes
         FROM listening_events WHERE user_id = :userId',
        [':userId' => $userId]
    );

    // Estimate listening period from earliest event.
    $earliestEvent = dbQueryOne(
        'SELECT MIN(created_at) AS first_event FROM listening_events WHERE user_id = :userId',
        [':userId' => $userId]
    );

    $periodDays = 0;

    if ($earliestEvent !== null && $earliestEvent['first_event'] !== null) {
        $periodDays = max(1, (int)ceil(
            (time() - strtotime($earliestEvent['first_event'])) / 86400
        ));
    }

    $topGenres = [];

    sendJson([
        'success' => true,
        'data'    => [
            'totalTracksPlayed'    => (int)($totalTracks['total'] ?? 0),
            'uniqueArtists'        => (int)($uniqueArtists['total'] ?? 0),
            'totalArtistEntries'   => (int)($totalArtists['total'] ?? 0),
            'topGenres'            => $topGenres,
            'listeningTimeMinutes' => round((float)($totalListeningMinutes['total_minutes'] ?? 0), 1),
            'periodDays'           => $periodDays,
        ],
    ]);
}

/**
 * Get user's top artists from tracked listening data.
 * Maps to: GET /api/dashboard/top-artists?period={week|month|all}&limit={limit}
 * Implements C-025.
 *
 * @param array $params Route parameters (unused).
 *
 * @return void
 */
function handleGetTopArtists(array $params): void
{
    $auth = requireAuth();
    $userId = $auth['userId'];

    $period = $_GET['period'] ?? PERIOD_ALL;
    $limit = min((int)($_GET['limit'] ?? 10), 50);

    if (!in_array($period, VALID_PERIODS, true)) {
        $period = PERIOD_ALL;
    }

    $dateCondition = '';
    $queryParams = [':userId' => $userId];

    if ($period === PERIOD_WEEK) {
        $dateCondition = 'AND ua.updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    } elseif ($period === PERIOD_MONTH) {
        $dateCondition = 'AND ua.updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    }

    // Note: LIMIT uses literal integer not a bound parameter
    // because TiDB/MySQL rejects bound parameters in LIMIT clauses.
    $artists = dbQuery(
        "SELECT ua.artist_name, ua.artist_image_url, ua.play_count,
                (SELECT le.album_art_url
                 FROM listening_events le
                 WHERE le.user_id = ua.user_id
                   AND le.artist_names LIKE CONCAT('%', ua.artist_name, '%')
                   AND le.album_art_url IS NOT NULL
                   AND le.album_art_url != ''
                 ORDER BY le.created_at DESC
                 LIMIT 1
                ) AS album_image_url
         FROM user_artists ua
         WHERE ua.user_id = :userId
               {$dateCondition}
         ORDER BY ua.play_count DESC
         LIMIT {$limit}",
        $queryParams
    );

    sendJson([
        'success' => true,
        'data'    => $artists,
    ]);
}
