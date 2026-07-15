<?php

/**
 * Resona API Entry Point
 *
 * Single entry point for all HTTP requests.
 * Handles bootstrapping, error handling, and request dispatching.
 * Implements Rule 19 (Error Handling) and Rule 29 (Consistent Formatting).
 *
 * @package Resona
 * @version 1.0.0
 */

// Bootstrap the application.
require_once __DIR__ . '/constants.php';
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/middleware.php';
require_once __DIR__ . '/router.php';

// Required extensions check — fail fast if missing critical dependencies.
$requiredExtensions = ['pdo', 'pdo_mysql', 'json', 'openssl'];

foreach ($requiredExtensions as $extension) {
    if (!extension_loaded($extension)) {
        http_response_code(HTTP_INTERNAL_SERVER_ERROR);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error'   => "Missing required PHP extension: {$extension}",
        ]);
        exit;
    }
}

// Load environment configuration.
loadEnvironment();

// Set up error handling.
set_exception_handler(function (Throwable $exception): void {
    $appConfig = getAppConfig();
    $isProduction = $appConfig['env'] === 'production';

    error_log(sprintf(
        '[Resona Error] %s in %s:%d',
        $exception->getMessage(),
        $exception->getFile(),
        $exception->getLine()
    ));

    $errorMessage = $isProduction
        ? 'An internal server error occurred'
        : $exception->getMessage();

    sendJson([
        'success' => false,
        'error'   => $errorMessage,
    ], HTTP_INTERNAL_SERVER_ERROR);
});

// Handle CORS preflight requests.
handleCors();

// Dispatch the request to the appropriate controller.
dispatchRequest();
