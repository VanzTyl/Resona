# Resona Backend Architecture

Version: 1.0.0

## Overview

Resona's backend is a Vanilla PHP REST API that serves as the bridge between
Spotify's Web API and the frontend application. It handles OAuth authentication,
playback data synchronization, social graph management, feed generation,
reactions, and messaging.

## Architecture

```
┌─────────────┐     ┌─────────────────────┐     ┌─────────────┐
│  Frontend   │────▶│   PHP REST API      │────▶│  TiDB Cloud │
│ (Netlify)   │◀────│  (Render)           │◀────│  (MySQL)    │
└─────────────┘     └─────────┬───────────┘     └─────────────┘
                              │
                              ▼
                      ┌─────────────────┐
                      │  Spotify Web API │
                      └─────────────────┘
```

## Entry Point

All requests are routed through `src/index.php` which:
1. Bootstraps constants, config, database, middleware
2. Handles CORS preflight
3. Dispatches to the matching route handler

## Route Map

| Method | Path | Controller |
|--------|------|------------|
| GET | /api/auth/spotify/login | AuthController |
| GET | /api/auth/spotify/callback | AuthController |
| POST | /api/auth/refresh | AuthController |
| GET | /api/user/profile | UserController |
| PUT | /api/user/profile | UserController |
| GET | /api/user/search | UserController |
| POST | /api/friends/request | FriendController |
| PUT | /api/friends/request/:id | FriendController |
| GET | /api/friends | FriendController |
| DELETE | /api/friends/:userId | FriendController |
| GET | /api/internal/sync/poll | SyncController (cron) |
| GET | /api/sync/current-track | SyncController |
| GET | /api/feed | FeedController |
| GET | /api/feed/card/:cardId | FeedController |
| GET | /api/feed/weekly-top/:friendId | FeedController |
| GET | /api/feed/comparison/:friendId | FeedController |
| POST | /api/reactions | ReactionController |
| DELETE | /api/reactions/:reactionId | ReactionController |
| GET | /api/reactions/:cardId | ReactionController |
| GET | /api/messages/thread/:friendId | MessageController |
| POST | /api/messages/send | MessageController |
| GET | /api/messages/:threadId | MessageController |
| GET | /api/messages/unread | MessageController |
| GET | /api/dashboard/stats | DashboardController |
| GET | /api/dashboard/top-artists | DashboardController |

## Directory Structure

```
backend/
├── .env.example          ← Environment variable template
└── src/
    ├── index.php         ← Entry point, bootstrapping, error handler
    ├── constants.php     ← Centralized constants (no magic values)
    ├── config.php        ← Environment variable loader
    ├── database.php      ← PDO connection + query helpers (prepared stmts)
    ├── middleware.php     ← CORS, JWT auth, JSON response helpers
    ├── router.php        ← Lightweight route matcher + dispatcher
    ├── controllers/      ← Request handlers (thin controllers)
    │   ├── auth-controller.php
    │   ├── user-controller.php
    │   ├── friend-controller.php
    │   ├── sync-controller.php
    │   ├── feed-controller.php
    │   ├── reaction-controller.php
    │   ├── message-controller.php
    │   └── dashboard-controller.php
    ├── models/           ← Data access layer (future)
    ├── schema.md         ← This file
    └── version.md        ← Version history
```

## Key Design Decisions

- **No frameworks**: Pure Vanilla PHP for simplicity and full control
- **Prepared statements**: All SQL uses PDO prepared statements (Rule 15)
- **JWT auth**: Stateless authentication with access + refresh token pattern
- **AES encryption**: Spotify tokens encrypted at rest using AES-256-CBC
- **Cron-based sync**: Playback polling via scheduled cron job every 2 minutes
- **Single entry point**: All requests through index.php with URL routing
- **Constants file**: No magic strings or numbers anywhere (Rules 7 & 8)

## Security

- All credentials from environment variables (Rule 25)
- Input validation on all endpoints (Rule 14)
- CORS restricted to frontend origin
- Prepared statements prevent SQL injection (Rule 15)
- Tokens never logged (Rule 20)
