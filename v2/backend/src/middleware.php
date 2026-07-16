<?php

/**
 * Resona Middleware Handlers
 *
 * Provides CORS, authentication, and request parsing middleware.
 * Implements Rule 14 (Input Validation) and Rule 19 (Error Handling).
 *
 * @package Resona
 * @version 1.0.0
 */

/**
 * Set CORS headers for cross-origin requests from the frontend.
 *
 * @return void
 */
function handleCors(): void
{
    $appConfig = getAppConfig();
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if ($origin === $appConfig['corsOrigin'] || $appConfig['corsOrigin'] === '*') {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');
    }

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(HTTP_NO_CONTENT);
        exit;
    }
}

/**
 * Parse the JSON request body into an associative array.
 *
 * @return array The parsed request body.
 */
function parseJsonBody(): array
{
    $rawBody = file_get_contents('php://input');

    if ($rawBody === false || $rawBody === '') {
        return [];
    }

    $data = json_decode($rawBody, true);

    if (!is_array($data)) {
        return [];
    }

    return $data;
}

/**
 * Extract the JWT token from the Authorization header.
 *
 * @return string|null The raw JWT string or null if not present.
 */
function extractBearerToken(): ?string
{
    // Try standard $_SERVER keys first (Apache mod_php, some CGI setups).
    $authHeader = $_SERVER['HTTP_AUTHORIZATION']
        ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
        ?? $_SERVER['Authorization']
        ?? '';

    // Fallback: getallheaders() works across all PHP SAPIs
    // (mod_php, FastCGI, PHP-FPM, etc.) and is not stripped by Apache.
    if ($authHeader === '' && function_exists('getallheaders')) {
        $allHeaders = getallheaders();

        if (is_array($allHeaders)) {
            // HTTP header names are case-insensitive.
            $authHeader = $allHeaders['Authorization']
                ?? $allHeaders['authorization']
                ?? $allHeaders['AUTHORIZATION']
                ?? '';
        }
    }

    if ($authHeader === '') {
        return null;
    }

    if (!str_starts_with($authHeader, TOKEN_TYPE_BEARER . ' ')) {
        return null;
    }

    return substr($authHeader, strlen(TOKEN_TYPE_BEARER) + 1);
}

/**
 * Validate and decode a JWT token.
 *
 * @param string $token The JWT token string.
 *
 * @return array|null The decoded payload or null if invalid.
 */
function validateJwt(string $token): ?array
{
    $jwtConfig = getJwtConfig();
    $parts = explode('.', $token);

    if (count($parts) !== 3) {
        return null;
    }

    [$headerB64, $payloadB64, $signatureB64] = $parts;

    $headerJson = base64UrlDecode($headerB64);

    if ($headerJson === null) {
        return null;
    }

    $header = json_decode($headerJson, true);

    if (!is_array($header)) {
        return null;
    }

    $payloadJson = base64UrlDecode($payloadB64);

    if ($payloadJson === null) {
        return null;
    }

    $payload = json_decode($payloadJson, true);

    if (!is_array($payload)) {
        return null;
    }

    $dataToVerify = $headerB64 . '.' . $payloadB64;
    $expectedSignature = hash_hmac('sha256', $dataToVerify, $jwtConfig['secret'], true);
    $providedSignature = base64UrlDecode($signatureB64);

    if ($providedSignature === null) {
        return null;
    }

    if (!hash_equals($expectedSignature, $providedSignature)) {
        return null;
    }

    $now = time();

    if (!isset($payload['exp']) || $payload['exp'] < $now) {
        return null;
    }

    return $payload;
}

/**
 * Require a valid authenticated session. Sends 401 if invalid.
 *
 * @return array The decoded JWT payload with user data.
 */
function requireAuth(): array
{
    $token = extractBearerToken();

    if ($token === null) {
        sendJson(['success' => false, 'error' => 'Authentication required'], HTTP_UNAUTHORIZED);
        exit;
    }

    $payload = validateJwt($token);

    if ($payload === null) {
        sendJson(['success' => false, 'error' => 'Invalid or expired token'], HTTP_UNAUTHORIZED);
        exit;
    }

    return $payload;
}

/**
 * Decode a base64url encoded string.
 *
 * @param string $data The base64url encoded string.
 *
 * @return string|null The decoded bytes or null on failure.
 */
function base64UrlDecode(string $data): ?string
{
    $remainder = strlen($data) % 4;

    if ($remainder !== 0) {
        $data .= str_repeat('=', 4 - $remainder);
    }

    $decoded = base64_decode(strtr($data, '-_', '+/'), true);

    if ($decoded === false) {
        return null;
    }

    return $decoded;
}

/**
 * Base64url encode data.
 *
 * @param string $data The raw bytes to encode.
 *
 * @return string The base64url encoded string.
 */
function base64UrlEncode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

/**
 * Generate a JWT token with the given payload.
 *
 * @param array $payload  The claims to include.
 * @param int   $expiry   Expiry time in seconds from now.
 *
 * @return string The signed JWT string.
 */
function generateJwt(array $payload, int $expiry): string
{
    $jwtConfig = getJwtConfig();

    $header = base64UrlEncode(json_encode([
        'alg' => 'HS256',
        'typ' => 'JWT',
    ]));

    $payload['iat'] = time();
    $payload['exp'] = time() + $expiry;

    $encodedPayload = base64UrlEncode(json_encode($payload));
    $dataToSign = $header . '.' . $encodedPayload;
    $signature = base64UrlEncode(
        hash_hmac('sha256', $dataToSign, $jwtConfig['secret'], true)
    );

    return $dataToSign . '.' . $signature;
}

/**
 * Send a JSON response with the given status code.
 *
 * @param mixed $data       The data to encode as JSON.
 * @param int   $statusCode The HTTP status code (default 200).
 *
 * @return void
 */
function sendJson(mixed $data, int $statusCode = HTTP_OK): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
