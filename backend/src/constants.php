<?php

/**
 * Resona Application Constants
 *
 * Centralized constants for magic strings and numbers used across the application.
 * Follows Rule 7 (No Magic Numbers) and Rule 8 (No Magic Strings) of code standards.
 *
 * @package Resona
 * @version 1.0.0
 */

// HTTP Status Codes
const HTTP_OK = 200;
const HTTP_CREATED = 201;
const HTTP_NO_CONTENT = 204;
const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;
const HTTP_CONFLICT = 409;
const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_INTERNAL_SERVER_ERROR = 500;

// Authentication Constants
const JWT_ALGORITHM = 'HS256';
const TOKEN_TYPE_BEARER = 'Bearer';
const AUTH_HEADER_NAME = 'Authorization';

// Spotify OAuth Constants
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1';
const SPOTIFY_SCOPES = 'user-read-private user-read-email user-read-recently-played user-top-read';

// Database Constants
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const DEFAULT_CURSOR_LIMIT = 20;
const MAX_CURSOR_LIMIT = 50;

// Relationship Status Constants
const FRIEND_STATUS_PENDING = 'pending';
const FRIEND_STATUS_ACCEPTED = 'accepted';
const FRIEND_STATUS_REJECTED = 'rejected';
const FRIEND_STATUS_BLOCKED = 'blocked';

// Message Type Constants
const MESSAGE_TYPE_MANUAL = 'manual';
const MESSAGE_TYPE_AUTO = 'auto';

// Reaction Type Constants
const VALID_EMOJIS = ['🔥', '❤️', '🎵', '💃', '🎸', '😤', '💯', '👀', '🤝', '🎧'];

// Time Period Constants
const PERIOD_WEEK = 'week';
const PERIOD_MONTH = 'month';
const PERIOD_ALL = 'all';
const VALID_PERIODS = [PERIOD_WEEK, PERIOD_MONTH, PERIOD_ALL];

// Sync Constants
const DEFAULT_SYNC_INTERVAL = 120;
const MAX_USERS_PER_SYNC_RUN = 50;
