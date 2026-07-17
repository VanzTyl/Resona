<?php

/**
 * Resona Authentication Controller
 *
 * Handles Spotify OAuth 2.0 authentication flow and JWT session management.
 * Implements contracts C-001, C-002, C-003.
 *
 * @package Resona
 * @version 1.0.0
 */

/**
 * Initiate Spotify OAuth login by redirecting to Spotify's authorization page.
 * Maps to: GET /api/auth/spotify/login
 * Implements C-001.
 *
 * @param array $params Route parameters (unused).
 *
 * @return void
 */
function handleSpotifyLogin(array $params): void
{
    $spotifyConfig = getSpotifyConfig();
    $state = bin2hex(random_bytes(16));

    $_SESSION['spotify_oauth_state'] = $state;

    $queryParams = http_build_query([
        'client_id'     => $spotifyConfig['clientId'],
        'response_type' => 'code',
        'redirect_uri'  => $spotifyConfig['redirectUri'],
        'scope'         => SPOTIFY_SCOPES,
        'state'         => $state,
        'show_dialog'   => 'true',
    ]);

    $authUrl = SPOTIFY_AUTH_URL . '?' . $queryParams;

    header('Location: ' . $authUrl);
    exit;
}

/**
 * Handle Spotify OAuth callback, exchange code for tokens, create session.
 * Maps to: GET /api/auth/spotify/callback
 * Implements C-002.
 *
 * @param array $params Route parameters (unused).
 *
 * @return void
 */
function handleSpotifyCallback(array $params): void
{
    $error = $_GET['error'] ?? '';

    if ($error !== '') {
        $frontendUrl = getAppConfig()['url'];
        header('Location: ' . $frontendUrl . '/login?error=' . urlencode($error));
        exit;
    }

    $code = $_GET['code'] ?? '';
    $state = $_GET['state'] ?? '';

    if ($code === '' || $state === '') {
        sendJson(['success' => false, 'error' => 'Missing authorization code or state'], HTTP_BAD_REQUEST);
        return;
    }

    // Validate state parameter to prevent CSRF attacks on OAuth callback.
    $storedState = $_SESSION['spotify_oauth_state'] ?? '';

    if ($storedState === '' || $state !== $storedState) {
        sendJson(['success' => false, 'error' => 'Invalid state parameter - possible CSRF attack'], HTTP_FORBIDDEN);
        return;
    }

    // Clear the consumed state to prevent replay attacks.
    unset($_SESSION['spotify_oauth_state']);

    $spotifyConfig = getSpotifyConfig();

    // Exchange authorization code for access and refresh tokens.
    $tokenData = exchangeSpotifyCode($code, $spotifyConfig);

    if ($tokenData === null) {
        sendJson(['success' => false, 'error' => 'Failed to exchange authorization code'], HTTP_INTERNAL_SERVER_ERROR);
        return;
    }

    // Fetch the Spotify user profile to get their Spotify ID.
    $spotifyUser = fetchSpotifyUserProfile($tokenData['access_token']);

    if ($spotifyUser === null) {
        sendJson(['success' => false, 'error' => 'Failed to fetch Spotify profile'], HTTP_INTERNAL_SERVER_ERROR);
        return;
    }

    $spotifyId = $spotifyUser['id'];
    $email = $spotifyUser['email'] ?? '';
    $displayName = $spotifyUser['display_name'] ?? 'Spotify User';
    $avatarUrl = $spotifyUser['images'][0]['url'] ?? '';

    // Find or create user in our database.
    $user = findOrCreateUser($spotifyId, $email, $displayName, $avatarUrl);

    if ($user === null) {
        sendJson(['success' => false, 'error' => 'Failed to create user account'], HTTP_INTERNAL_SERVER_ERROR);
        return;
    }

    // Store Spotify tokens.
    storeSpotifyTokens(
        $user['id'],
        $tokenData['access_token'],
        $tokenData['refresh_token'],
        time() + (int)($tokenData['expires_in'] ?? 3600)
    );

    // Generate JWT session tokens.
    $jwtConfig = getJwtConfig();
    $accessToken = generateJwt(
        ['userId' => $user['id'], 'spotifyId' => $spotifyId, 'type' => 'access'],
        $jwtConfig['accessExpiry']
    );
    $refreshToken = generateJwt(
        ['userId' => $user['id'], 'type' => 'refresh'],
        $jwtConfig['refreshExpiry']
    );

    $frontendUrl = getAppConfig()['url'];
    $redirectUrl = $frontendUrl . '/callback?access_token=' . urlencode($accessToken)
        . '&refresh_token=' . urlencode($refreshToken);

    header('Location: ' . $redirectUrl);
    exit;
}

/**
 * Refresh an expired JWT access token using a refresh token.
 * Maps to: POST /api/auth/refresh
 * Implements C-003.
 *
 * @param array $params Route parameters (unused).
 *
 * @return void
 */
function handleRefreshToken(array $params): void
{
    $body = parseJsonBody();
    $refreshToken = $body['refreshToken'] ?? '';

    if ($refreshToken === '') {
        sendJson(['success' => false, 'error' => 'Refresh token is required'], HTTP_BAD_REQUEST);
        return;
    }

    $payload = validateJwt($refreshToken);

    if ($payload === null || ($payload['type'] ?? '') !== 'refresh') {
        sendJson(['success' => false, 'error' => 'Invalid refresh token'], HTTP_UNAUTHORIZED);
        return;
    }

    $userId = $payload['userId'] ?? '';

    if ($userId === '') {
        sendJson(['success' => false, 'error' => 'Invalid token payload'], HTTP_UNAUTHORIZED);
        return;
    }

    $jwtConfig = getJwtConfig();
    $newAccessToken = generateJwt(
        ['userId' => $userId, 'type' => 'access'],
        $jwtConfig['accessExpiry']
    );

    sendJson([
        'success'   => true,
        'data'      => [
            'accessToken' => $newAccessToken,
            'expiresIn'   => $jwtConfig['accessExpiry'],
        ],
    ]);
}

/**
 * Exchange an authorization code for Spotify access and refresh tokens.
 *
 * @param string $code          The authorization code from Spotify.
 * @param array  $spotifyConfig Spotify API configuration.
 *
 * @return array|null Token data or null on failure.
 */
function exchangeSpotifyCode(string $code, array $spotifyConfig): ?array
{
    $postData = http_build_query([
        'grant_type'    => 'authorization_code',
        'code'          => $code,
        'redirect_uri'  => $spotifyConfig['redirectUri'],
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
    $curlError = curl_error($ch);
    $curlErrno = curl_errno($ch);
    curl_close($ch);

    if ($response === false || $httpCode !== 200) {
        error_log(sprintf(
            '[Resona Token Exchange Failed] errno=%d error=%s httpCode=%d body=%s',
            $curlErrno,
            $curlError,
            $httpCode,
            $response !== false ? substr($response, 0, 500) : 'N/A'
        ));
        return null;
    }

    $data = json_decode($response, true);

    if (!is_array($data) || !isset($data['access_token'])) {
        return null;
    }

    return $data;
}

/**
 * Fetch the Spotify user profile with the given access token.
 *
 * @param string $accessToken A valid Spotify access token.
 *
 * @return array|null User profile data or null on failure.
 */
function fetchSpotifyUserProfile(string $accessToken): ?array
{
    $ch = curl_init();

    if ($ch === false) {
        return null;
    }

    curl_setopt_array($ch, [
        CURLOPT_URL            => SPOTIFY_API_BASE_URL . '/me',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json',
        ],
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_IPRESOLVE      => CURL_IPRESOLVE_V4,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    $curlErrno = curl_errno($ch);
    curl_close($ch);

    if ($response === false || $httpCode !== 200) {
        error_log(sprintf(
            '[Resona Spotify Profile Fetch Failed] errno=%d error=%s httpCode=%d body=%s',
            $curlErrno,
            $curlError,
            $httpCode,
            $response !== false ? substr($response, 0, 500) : 'N/A'
        ));
        return null;
    }

    $data = json_decode($response, true);

    if (!is_array($data)) {
        return null;
    }

    return $data;
}

/**
 * Find a user by Spotify ID or create a new user record.
 *
 * @param string $spotifyId   The Spotify user ID.
 * @param string $email       The user's email address.
 * @param string $displayName The display name.
 * @param string $avatarUrl   The avatar image URL.
 *
 * @return array|null The user record or null on failure.
 */
function findOrCreateUser(
    string $spotifyId,
    string $email,
    string $displayName,
    string $avatarUrl
): ?array {
    $existingUser = dbQueryOne(
        'SELECT id, spotify_id, username, display_name, avatar_url, created_at
         FROM users WHERE spotify_id = :spotifyId',
        [':spotifyId' => $spotifyId]
    );

    if ($existingUser !== null) {
        return $existingUser;
    }

    $username = generateUniqueUsername($displayName);

    $inserted = dbExecute(
        'INSERT INTO users (spotify_id, email, username, display_name, avatar_url, created_at, updated_at)
         VALUES (:spotifyId, :email, :username, :displayName, :avatarUrl, NOW(), NOW())',
        [
            ':spotifyId'   => $spotifyId,
            ':email'       => $email,
            ':username'    => $username,
            ':displayName' => $displayName,
            ':avatarUrl'   => $avatarUrl,
        ]
    );

    if ($inserted === 0) {
        return null;
    }

    return dbQueryOne(
        'SELECT id, spotify_id, username, display_name, avatar_url, created_at
         FROM users WHERE id = :id',
        [':id' => dbLastInsertId()]
    );
}

/**
 * Generate a unique username from the display name.
 *
 * @param string $displayName The base name for the username.
 *
 * @return string A unique username.
 */
function generateUniqueUsername(string $displayName): string
{
    // Lowercase and strip non-alphanumeric characters (keep underscores).
    $base = strtolower(preg_replace('/[^a-zA-Z0-9_]/', '', $displayName));
    $base = preg_replace('/_{2,}/', '_', trim($base, '_'));

    if ($base === '' || strlen($base) < 3) {
        $base = 'user';
    }

    // Truncate to max username length minus room for a suffix.
    $base = substr($base, 0, USERNAME_MAX_LENGTH - 5);

    // Check if the base username is available.
    $existing = dbQueryOne(
        'SELECT id FROM users WHERE username = :username LIMIT 1',
        [':username' => $base]
    );

    if ($existing === null) {
        return $base;
    }

    // Base taken — append incremental numbers until we find a free one.
    for ($suffix = 1; $suffix < 1000; $suffix++) {
        $candidate = $base . $suffix;
        $candidate = substr($candidate, 0, USERNAME_MAX_LENGTH);

        $existing = dbQueryOne(
            'SELECT id FROM users WHERE username = :username LIMIT 1',
            [':username' => $candidate]
        );

        if ($existing === null) {
            return $candidate;
        }
    }

    // Last resort: append a short hex suffix.
    return substr($base, 0, USERNAME_MAX_LENGTH - 9) . '_' . substr(bin2hex(random_bytes(4)), 0, 8);
}

/**
 * Store Spotify OAuth tokens for a user.
 *
 * @param int    $userId       The internal user ID.
 * @param string $accessToken  The Spotify access token.
 * @param string $refreshToken The Spotify refresh token.
 * @param int    $expiresAt    Unix timestamp when the access token expires.
 *
 * @return void
 */
function storeSpotifyTokens(
    int $userId,
    string $accessToken,
    string $refreshToken,
    int $expiresAt
): void {
    $encryptionConfig = getTokenEncryptionConfig();
    $key = $encryptionConfig['key'];

    if ($key === '') {
        error_log('[Resona Security] TOKEN_ENCRYPTION_KEY is not configured. Cannot encrypt tokens.');
        sendJson(['success' => false, 'error' => 'Server encryption configuration error'], HTTP_INTERNAL_SERVER_ERROR);
        return;
    }

    // Encrypt access token with random IV and store IV alongside ciphertext.
    $accessIv = openssl_random_pseudo_bytes(16);
    $encryptedAccess = openssl_encrypt(
        $accessToken,
        TOKEN_ENCRYPTION_CIPHER,
        $key,
        0,
        $accessIv
    );
    $storedAccess = base64_encode($accessIv) . ':' . $encryptedAccess;

    // Encrypt refresh token with a separate random IV.
    $refreshIv = openssl_random_pseudo_bytes(16);
    $encryptedRefresh = openssl_encrypt(
        $refreshToken,
        TOKEN_ENCRYPTION_CIPHER,
        $key,
        0,
        $refreshIv
    );
    $storedRefresh = base64_encode($refreshIv) . ':' . $encryptedRefresh;

    dbExecute(
        'INSERT INTO spotify_tokens (user_id, access_token, refresh_token, expires_at, created_at, updated_at)
         VALUES (:userId, :accessToken, :refreshToken, :expiresAt, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
             access_token = :accessToken2,
             refresh_token = :refreshToken2,
             expires_at = :expiresAt2,
             updated_at = NOW()',
        [
            ':userId'       => $userId,
            ':accessToken'  => $storedAccess,
            ':refreshToken' => $storedRefresh,
            ':expiresAt'    => date('Y-m-d H:i:s', $expiresAt),
            ':accessToken2' => $storedAccess,
            ':refreshToken2' => $storedRefresh,
            ':expiresAt2'   => date('Y-m-d H:i:s', $expiresAt),
        ]
    );
}
