<?php

/**
 * Resona Token Helper
 *
 * Extracted from sync-controller.php v1.0.0 to keep files under 500 lines.
 * Provides Spotify token decryption and refresh logic for sync and other controllers.
 *
 * @package Resona
 * @version 1.0.0
 */

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

    $encryptionConfig = getTokenEncryptionConfig();
    $key = $encryptionConfig['key'];

    if ($key === '') {
        error_log('[Resona Security] TOKEN_ENCRYPTION_KEY is not configured. Cannot decrypt tokens for user ' . $userId);
        return null;
    }

    $decryptedAccess = decryptTokenValue(
        $tokens['access_token'],
        $key,
        'access',
        $userId
    );

    $decryptedRefresh = decryptTokenValue(
        $tokens['refresh_token'],
        $key,
        'refresh',
        $userId
    );

    if ($decryptedAccess === null) {
        return null;
    }

    return [
        'access_token'  => $decryptedAccess,
        'refresh_token' => $decryptedRefresh !== null ? $decryptedRefresh : '',
        'expires_at'    => $tokens['expires_at'],
    ];
}

/**
 * Decrypt a single token value, supporting both new (IV-prefixed) and legacy formats.
 *
 * @param string $storedValue The stored encrypted token (base64_iv:ciphertext or legacy).
 * @param string $key         The token encryption key.
 * @param string $type        Token type ('access' or 'refresh') for logging.
 * @param int    $userId      User ID for logging.
 *
 * @return string|null Decrypted token or null on failure.
 */
function decryptTokenValue(
    string $storedValue,
    string $key,
    string $type,
    int $userId
): ?string {
    // New format: base64_iv:base64_ciphertext
    if (str_contains($storedValue, ':')) {
        $parts = explode(':', $storedValue, 2);
        $iv = base64_decode($parts[0], true);
        $ciphertext = $parts[1];

        if ($iv === false || strlen($iv) !== 16) {
            error_log(sprintf(
                '[Resona Token Decryption] user=%d type=%s invalid IV in new-format token',
                $userId,
                $type
            ));
            return null;
        }

        $decrypted = openssl_decrypt(
            $ciphertext,
            TOKEN_ENCRYPTION_CIPHER,
            $key,
            0,
            $iv
        );

        if ($decrypted === false) {
            error_log(sprintf(
                '[Resona Token Decryption Failed] user=%d type=%s cipher=%s',
                $userId,
                $type,
                TOKEN_ENCRYPTION_CIPHER
            ));
        }

        return $decrypted !== false ? $decrypted : null;
    }

    // Legacy format: no IV prefix — decrypt with JWT secret and deterministic IV.
    $oldKey = getJwtConfig()['secret'];
    $iv = $type === 'access'
        ? substr(hash('sha256', $oldKey), 0, 16)
        : substr(hash('sha256', $oldKey), 16, 16);

    $decrypted = openssl_decrypt(
        $storedValue,
        'aes-256-cbc',
        $oldKey,
        0,
        $iv
    );

    if ($decrypted === false) {
        error_log(sprintf(
            '[Resona Token Decryption Failed] user=%d type=%s fallback=legacy',
            $userId,
            $type
        ));
        return null;
    }

    error_log(sprintf(
        '[Resona Token Migration] user=%d type=%s decrypted with legacy key',
        $userId,
        $type
    ));

    return $decrypted;
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
