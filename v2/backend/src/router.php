<?php

/**
 * Resona Lightweight Router
 *
 * Dispatches HTTP requests to the appropriate controller method.
 * Implements Rule 24 (Keep Controllers Thin) by separating routing from business logic.
 *
 * @package Resona
 * @version 1.1.0
 */

require_once __DIR__ . '/controllers/auth-controller.php';
require_once __DIR__ . '/controllers/user-controller.php';
require_once __DIR__ . '/controllers/friend-controller.php';
require_once __DIR__ . '/controllers/sync-controller.php';
require_once __DIR__ . '/controllers/feed-controller.php';
require_once __DIR__ . '/controllers/reaction-controller.php';
require_once __DIR__ . '/controllers/message-controller.php';
require_once __DIR__ . '/controllers/dashboard-controller.php';
// v1.1: New controllers
require_once __DIR__ . '/controllers/stats-controller.php';
require_once __DIR__ . '/controllers/discover-controller.php';
require_once __DIR__ . '/controllers/onboarding-controller.php';

/**
 * Route definition structure.
 */
class Route
{
    public string $method;
    public string $pattern;
    public string $handler;
    public bool $requiresAuth;
    public bool $isInternal;

    public function __construct(
        string $method,
        string $pattern,
        string $handler,
        bool $requiresAuth = true,
        bool $isInternal = false
    ) {
        $this->method = $method;
        $this->pattern = $pattern;
        $this->handler = $handler;
        $this->requiresAuth = $requiresAuth;
        $this->isInternal = $isInternal;
    }
}

/**
 * Define all application routes.
 *
 * @return Route[] The array of route definitions.
 */
function defineRoutes(): array
{
    return [
        // Auth routes (public)
        new Route('GET',    '/api/auth/spotify/login',              'handleSpotifyLogin', false),
        new Route('GET',    '/api/auth/spotify/callback',           'handleSpotifyCallback', false),
        new Route('POST',   '/api/auth/refresh',                    'handleRefreshToken', false),

        // User routes (authenticated)
        new Route('GET',    '/api/user/profile',                    'handleGetProfile', true),
        new Route('PUT',    '/api/user/profile',                    'handleUpdateProfile', true),
        new Route('GET',    '/api/user/search',                     'handleSearchUsers', true),
        // v1.1: Username check
        new Route('GET',    '/api/user/check-username',             'handleCheckUsername', true),

        // Friend routes (authenticated)
        new Route('POST',   '/api/friends/request',                 'handleSendFriendRequest', true),
        new Route('PUT',    '/api/friends/request/:id',             'handleRespondToRequest', true),
        new Route('GET',    '/api/friends/requests/pending',        'handlePendingRequests', true),
        new Route('GET',    '/api/friends',                         'handleListFriends', true),
        new Route('DELETE', '/api/friends/:userId',                 'handleRemoveFriend', true),

        // Sync routes (internal cron)
        new Route('GET',    '/api/internal/sync/poll',             'handlePollPlayback', false, true),
        new Route('GET',    '/api/sync/current-track',             'handleGetCurrentTrack', true),

        // Feed routes (authenticated)
        new Route('GET',    '/api/feed',                            'handleGetFeed', true),
        new Route('GET',    '/api/feed/card/:cardId',              'handleGetFeedCard', true),
        new Route('GET',    '/api/feed/weekly-top/:friendId',     'handleGetWeeklyTop', true),
        new Route('GET',    '/api/feed/comparison/:friendId',     'handleGetComparison', true),

        // Reaction routes (authenticated)
        new Route('POST',   '/api/reactions',                       'handleAddReaction', true),
        new Route('DELETE', '/api/reactions/:reactionId',          'handleRemoveReaction', true),
        new Route('GET',    '/api/reactions/:cardId',              'handleGetReactions', true),

        // Message routes (authenticated)
        new Route('GET',    '/api/messages/thread/:friendId',     'handleGetThread', true),
        new Route('POST',   '/api/messages/send',                   'handleSendMessage', true),
        new Route('GET',    '/api/messages/:threadId',             'handleGetMessages', true),
        new Route('GET',    '/api/messages/unread',                 'handleGetUnreadCount', true),

        // Dashboard routes (authenticated)
        new Route('GET',    '/api/dashboard/stats',                 'handleGetPersonalStats', true),
        new Route('GET',    '/api/dashboard/top-artists',           'handleGetTopArtists', true),

        // v1.1: Stats route (profile listening summary)
        new Route('GET',    '/api/user/stats',                     'handleGetUserStats', true),

        // v1.1: Discovery route
        new Route('GET',    '/api/discover/random',                 'handleDiscoverRandom', true),

        // v1.1: Onboarding routes
        new Route('GET',    '/api/user/onboarding-status',         'handleOnboardingStatus', true),
        new Route('POST',   '/api/user/onboarding/step',           'handleOnboardingStep', true),
    ];
}

/**
 * Match a request URI against a route pattern and extract parameters.
 *
 * @param string $uri     The request URI path.
 * @param Route  $route   The route definition.
 *
 * @return array|null The matched parameters or null if no match.
 */
function matchRoute(string $uri, Route $route): ?array
{
    $patternParts = explode('/', trim($route->pattern, '/'));
    $uriParts = explode('/', trim($uri, '/'));

    if (count($patternParts) !== count($uriParts)) {
        return null;
    }

    $params = [];

    foreach ($patternParts as $index => $part) {
        if (str_starts_with($part, ':')) {
            $paramName = substr($part, 1);
            $params[$paramName] = $uriParts[$index];
        } elseif ($part !== $uriParts[$index]) {
            return null;
        }
    }

    return $params;
}

/**
 * Dispatch the current HTTP request to the matching route handler.
 *
 * @return void
 */
function dispatchRequest(): void
{
    $method = $_SERVER['REQUEST_METHOD'];
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

    if ($uri === false) {
        $uri = '/';
    }

    $routes = defineRoutes();

    foreach ($routes as $route) {
        if ($route->method !== $method) {
            continue;
        }

        $params = matchRoute($uri, $route);

        if ($params === null) {
            continue;
        }

        if ($route->requiresAuth) {
            requireAuth();
        }

        $handler = $route->handler;

        if (function_exists($handler)) {
            $handler($params);
            return;
        }
    }

    sendJson(['success' => false, 'error' => 'Route not found'], HTTP_NOT_FOUND);
}
