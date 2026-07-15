<?php

/**
 * Resona Sync Controller
 *
 * Handles periodic polling of Spotify playback data.
 * Implements contracts C-011, C-012.
 *
 * @package Resona
 * @version 1.0.0
 */

/**
 * Cron-triggered batch polling of Spotify playback for all active users.
 * Maps to: GET /api/internal/sync/poll
 * Implements C-011.
 *
 * @param array $params Route parameters (unused).
 *
 * @return void
 */
function handlePollPlayback(array $params): void
{
    $startTime = microtime(true);
    $usersPolled = 0;
    $updated = 0;
    $errors = 0;

    $activeUsers = dbQuery(
        'SELECT u.id, u.spotify_id
         FROM users u
         JOIN spotify_tokens st ON st.user_id = u.id
         WHERE st.expires_at > NOW()
         ORDER BY st.updated_at ASC
         LIMIT :limit',
        [':limit' => MAX_USERS_PER_SYNC_RUN]
    );

    foreach ($activeUsers as $user) {
        $usersPolled++;
        $spotifyTokens = getDecryptedTokens((int)$user['id']);

        if ($spotifyTokens === null) {
            $errors++;
            continue;
        }

        $accessToken = $spotifyTokens['access_token'];
        $tokenExpiresAt = strtotime($spotifyTokens['expires_at']);

        if ($accessToken === '') {
            $errors++;
            continue;
        }

        // Refresh token if it's about to expire.
        if ($tokenExpiresAt - time() < 300) {
            $newTokens = refreshSpotifyToken($spotifyTokens['refresh_token']);

            if ($newTokens === null) {
                $errors++;
                continue;
            }

            storeSpotifyTokens(
                (int)$user['id'],
                $newTokens['access_token'],
                $newTokens['refresh_token'] ?? $spotifyTokens['refresh_token'],
                time() + (int)($newTokens['expires_in'] ?? 3600)
            );

            $accessToken = $newTokens['access_token'];
        }

        // Fetch recently played tracks (works with free accounts).
        $recentTracks = fetchRecentTracks($accessToken);

        if ($recentTracks === null) {
            $errors++;
            continue;
        }

        foreach ($recentTracks as $track) {
            saveListeningEvent((int)$user['id'], $track);
            $updated++;
        }

        // Update token last used time.
        dbExecute(
            'UPDATE spotify_tokens SET updated_at = NOW() WHERE user_id = :userId',
            [':userId' => $user['id']]
        );
    }

    $duration = round((microtime(true) - $startTime) * 1000);

    sendJson([
        'success'      => true,
        'data'         => [
            'usersPolled' => $usersPolled,
            'updated'     => $updated,
            'errors'      => $errors,
            'durationMs'  => $duration,
        ],
    ]);
}

/**
 * Get the currently playing track for the authenticated user.
 * Maps to: GET /api/sync/current-track
 * Implements C-012.
 *
 * @param array $params Route parameters (unused).
 *
 * @return void
 */
function handleGetCurrentTrack(array $params): void
{
    $auth = requireAuth();
    $userId = $auth['userId'];

    $latest = dbQueryOne(
        'SELECT track_name, artist_names, album_art_url, is_playing, progress_ms, track_duration_ms, created_at
         FROM listening_events
         WHERE user_id = :userId
         ORDER BY created_at DESC
         LIMIT 1',
        [':userId' => $userId]
    );

    if ($latest === null) {
        sendJson([
            'success' => true,
            'data'    => null,
        ]);
        return;
    }

    sendJson([
        'success' => true,
        'data'    => [
            'trackName'     => $latest['track_name'],
            'artists'       => explode(', ', $latest['artist_names']),
            'albumArt'      => $latest['album_art_url'],
            'isPlaying'     => (bool)$latest['is_playing'],
            'progressMs'    => (int)$latest['progress_ms'],
            'trackDurationMs' => (int)$latest['track_duration_ms'],
            'lastUpdated'   => $latest['created_at'],
        ],
    ]);
}

/**
 * Get decrypted Spotify tokens for a user.
 *
 * @param int $userId The internal user ID.
 *
 * @return array|null Token data or null if not found.
 */
function getDecryptedTokens(int $userId): ?array
{
    $tokens = dbQueryOne(
        'SELECT access_token, refresh_token, expires_at
         FROM spotify_tokens WHERE user_id = :userId',
        [':userId' => $userId]
    );

    if ($tokens === null) {
        return null;
    }

    $jwtSecret = getJwtConfig()['secret'];
    $iv1 = substr(hash('sha256', $jwtSecret), 0, 16);
    $iv2 = substr(hash('sha256', $jwtSecret), 16, 16);

    $decryptedAccess = openssl_decrypt(
        $tokens['access_token'],
        'aes-256-cbc',
        $jwtSecret,
        0,
        $iv1
    );

    $decryptedRefresh = openssl_decrypt(
        $tokens['refresh_token'],
        'aes-256-cbc',
        $jwtSecret,
        0,
        $iv2
    );

    if ($decryptedAccess === false) {
        return null;
    }

    return [
        'access_token'  => $decryptedAccess,
        'refresh_token' => $decryptedRefresh !== false ? $decryptedRefresh : '',
        'expires_at'    => $tokens['expires_at'],
    ];
}

/**
 * Fetch recently played tracks from Spotify API (works with free accounts).
 *
 * @param string $accessToken A valid Spotify access token.
 *
 * @return array|null Array of track items or null on failure.
 */
function fetchRecentTracks(string $accessToken): ?array
{
    $ch = curl_init();

    if ($ch === false) {
        return null;
    }

    curl_setopt_array($ch, [
        CURLOPT_URL            => SPOTIFY_API_BASE_URL . '/me/player/recently-played?limit=50',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json',
        ],
        CURLOPT_TIMEOUT        => 15,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false || $httpCode !== 200) {
        return null;
    }

    $data = json_decode($response, true);

    if (!is_array($data) || !isset($data['items'])) {
        return null;
    }

    return $data['items'];
}

/**
 * Refresh an expired Spotify access token.
 *
 * @param string $refreshToken The Spotify refresh token.
 *
 * @return array|null New token data or null on failure.
 */
function refreshSpotifyToken(string $refreshToken): ?array
{
    if ($refreshToken === '') {
        return null;
    }

    $spotifyConfig = getSpotifyConfig();

    $postData = http_build_query([
        'grant_type'    => 'refresh_token',
        'refresh_token' => $refreshToken,
        'client_id'     => $spotifyConfig['clientId'],
        'client_secret' => $spotifyConfig['clientSecret'],
    ]);

    $ch = curl_init();

    if ($ch === false) {
        return null;
    }

    curl_setopt_array($ch, [
        CURLOPT_URL            => SPOTIFY_TOKEN_URL,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $postData,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/x-www-form-urlencoded'],
        CURLOPT_TIMEOUT        => 30,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false || $httpCode !== 200) {
        return null;
    }

    $data = json_decode($response, true);

    if (!is_array($data) || !isset($data['access_token'])) {
        return null;
    }

    return $data;
}

/**
 * Save a listening event to the database from recently-played data.
 *
 * @param int   $userId      The internal user ID.
 * @param array $trackData   A single item from the recently-played response.
 *
 * @return void
 */
function saveListeningEvent(int $userId, array $trackData): void
{
    $track = $trackData['track'] ?? [];

    if (!isset($track['id'])) {
        return;
    }

    $trackId = $track['id'];
    $trackName = $track['name'] ?? 'Unknown Track';
    $artistNames = implode(', ', array_column($track['artists'] ?? [], 'name'));
    $albumName = $track['album']['name'] ?? '';
    $albumArtUrl = $track['album']['images'][0]['url'] ?? '';
    $trackDurationMs = $track['duration_ms'] ?? 0;

    // Use Spotify's played_at timestamp if available.
    $playedAt = $trackData['played_at'] ?? date('Y-m-d\TH:i:s\Z');
    $playedAtDb = date('Y-m-d H:i:s', strtotime($playedAt));

    dbExecute(
        'INSERT INTO listening_events
            (user_id, spotify_track_id, track_name, artist_names, album_name,
             album_art_url, track_duration_ms, is_playing, progress_ms, created_at)
         VALUES
            (:userId, :trackId, :trackName, :artistNames, :albumName,
             :albumArt, :duration, 0, 0, :playedAt)',
        [
            ':userId'    => $userId,
            ':trackId'   => $trackId,
            ':trackName' => $trackName,
            ':artistNames' => $artistNames,
            ':albumName' => $albumName,
            ':albumArt'  => $albumArtUrl,
            ':duration'  => $trackDurationMs,
            ':playedAt'  => $playedAtDb,
        ]
    );

    // Update or insert into user_artists for top artist tracking.
    $artists = $track['artists'] ?? [];

    foreach ($artists as $artist) {
        $artistId = $artist['id'];
        $artistName = $artist['name'];
        $artistImageUrl = $artist['images'][0]['url'] ?? '';

        $existingArtist = dbQueryOne(
            'SELECT id, play_count FROM user_artists
             WHERE user_id = :userId AND spotify_artist_id = :artistId',
            [':userId' => $userId, ':artistId' => $artistId]
        );

        if ($existingArtist === null) {
            dbExecute(
                'INSERT INTO user_artists (user_id, spotify_artist_id, artist_name, artist_image_url, play_count, created_at)
                 VALUES (:userId, :artistId, :artistName, :artistImage, 1, NOW())',
                [
                    ':userId'     => $userId,
                    ':artistId'   => $artistId,
                    ':artistName' => $artistName,
                    ':artistImage' => $artistImageUrl,
                ]
            );
        } else {
            dbExecute(
                'UPDATE user_artists SET play_count = play_count + 1, updated_at = NOW()
                 WHERE user_id = :userId AND spotify_artist_id = :artistId',
                [':userId' => $userId, ':artistId' => $artistId]
            );
        }
    }
}
