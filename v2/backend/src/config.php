<?php

/**
 * Resona Configuration Loader
 *
 * Loads environment variables and provides typed accessors.
 * Implements Rule 25 (No Hardcoded Secrets) by sourcing all credentials from environment.
 *
 * @package Resona
 * @version 1.0.0
 */

/**
 * Load environment variables from .env file if it exists.
 */
function loadEnvironment(): void
{
    $envPath = __DIR__ . '/../.env';

    if (!file_exists($envPath)) {
        return;
    }

    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);

        if (str_starts_with($line, '#')) {
            continue;
        }

        $parts = explode('=', $line, 2);

        if (count($parts) !== 2) {
            continue;
        }

        $key = trim($parts[0]);
        $value = trim($parts[1]);

        $_ENV[$key] = $value;
        putenv("$key=$value");
    }
}

/**
 * Get a string environment variable with optional default.
 *
 * @param string $key     The environment variable name.
 * @param string $default The default value if not set.
 *
 * @return string The value or default.
 */
function envString(string $key, string $default = ''): string
{
    $value = getenv($key);

    if ($value === false || $value === '') {
        return $default;
    }

    return $value;
}

/**
 * Get an integer environment variable with optional default.
 *
 * @param string $key     The environment variable name.
 * @param int    $default The default value if not set.
 *
 * @return int The parsed integer value.
 */
function envInt(string $key, int $default = 0): int
{
    $value = getenv($key);

    if ($value === false || $value === '') {
        return $default;
    }

    return (int) $value;
}

/**
 * Get database configuration as an associative array.
 *
 * @return array{host: string, port: int, name: string, user: string, password: string}
 */
function getDatabaseConfig(): array
{
    return [
        'host'     => envString('DB_HOST', 'localhost'),
        'port'     => envInt('DB_PORT', 4000),
        'name'     => envString('DB_NAME', envString('DB_DATABASE', 'resona')),
        'user'     => envString('DB_USER', envString('DB_USERNAME', 'root')),
        'password' => envString('DB_PASSWORD', ''),
    ];
}

/**
 * Get Spotify API configuration.
 *
 * @return array{clientId: string, clientSecret: string, redirectUri: string}
 */
function getSpotifyConfig(): array
{
    return [
        'clientId'     => envString('SPOTIFY_CLIENT_ID'),
        'clientSecret' => envString('SPOTIFY_CLIENT_SECRET'),
        'redirectUri'  => envString('SPOTIFY_REDIRECT_URI'),
    ];
}

/**
 * Get JWT configuration.
 *
 * @return array{secret: string, accessExpiry: int, refreshExpiry: int}
 */
function getJwtConfig(): array
{
    return [
        'secret'         => envString('JWT_SECRET'),
        'accessExpiry'   => envInt('JWT_ACCESS_EXPIRY', 900),
        'refreshExpiry'  => envInt('JWT_REFRESH_EXPIRY', 604800),
    ];
}

/**
 * Get token encryption configuration.
 * Uses a separate key from JWT to avoid key reuse vulnerabilities.
 *
 * @return array{key: string} Encryption key.
 */
function getTokenEncryptionConfig(): array
{
    return [
        'key' => envString('TOKEN_ENCRYPTION_KEY'),
    ];
}

/**
 * Get application configuration.
 *
 * @return array{env: string, url: string, corsOrigin: string}
 */
function getAppConfig(): array
{
    return [
        'env'         => envString('APP_ENV', 'production'),
        'url'         => envString('APP_URL', 'http://localhost:8000'),
        'corsOrigin'  => envString('CORS_ALLOWED_ORIGIN', '*'),
    ];
}
