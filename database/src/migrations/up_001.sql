-- ========================================
-- Resona Database Migration — Up 001
-- Version: 1.0.0
-- Description: Initial schema creation
-- ========================================

-- Users table (no FK dependencies)
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    spotify_id VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) DEFAULT '',
    username VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) DEFAULT '',
    avatar_url VARCHAR(500) DEFAULT '',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_display_name (display_name),
    INDEX idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chat threads
CREATE TABLE IF NOT EXISTS chat_threads (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id_1 INT UNSIGNED NOT NULL,
    user_id_2 INT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_chat_pair (user_id_1, user_id_2)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Spotify OAuth tokens
CREATE TABLE IF NOT EXISTS spotify_tokens (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL UNIQUE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_spotify_tokens_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Friendships
CREATE TABLE IF NOT EXISTS friendships (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sender_id INT UNSIGNED NOT NULL,
    receiver_id INT UNSIGNED NOT NULL,
    status ENUM('pending', 'accepted', 'rejected', 'blocked') NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_friendship_pair (sender_id, receiver_id),
    INDEX idx_friendships_status (status),
    INDEX idx_friendships_sender (sender_id),
    INDEX idx_friendships_receiver (receiver_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listening events
CREATE TABLE IF NOT EXISTS listening_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    spotify_track_id VARCHAR(255) NOT NULL,
    track_name VARCHAR(300) NOT NULL,
    artist_names VARCHAR(500) NOT NULL,
    album_name VARCHAR(300) DEFAULT '',
    album_art_url VARCHAR(500) DEFAULT '',
    track_duration_ms INT UNSIGNED DEFAULT 0,
    is_playing TINYINT(1) DEFAULT 0,
    progress_ms INT UNSIGNED DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_listening_events_user_time (user_id, created_at),
    INDEX idx_listening_events_track (user_id, spotify_track_id),
    INDEX idx_listening_events_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User artist tracking
CREATE TABLE IF NOT EXISTS user_artists (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    spotify_artist_id VARCHAR(255) NOT NULL,
    artist_name VARCHAR(300) NOT NULL,
    artist_image_url VARCHAR(500) DEFAULT '',
    play_count INT UNSIGNED DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_artist (user_id, spotify_artist_id),
    INDEX idx_user_artists_playcount (play_count DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Messages
CREATE TABLE IF NOT EXISTS messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    thread_id INT UNSIGNED NOT NULL,
    sender_id INT UNSIGNED NOT NULL,
    content TEXT NOT NULL,
    message_type ENUM('manual', 'auto') NOT NULL DEFAULT 'manual',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_messages_thread_time (thread_id, created_at),
    INDEX idx_messages_sender (sender_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Emoji reactions
CREATE TABLE IF NOT EXISTS reactions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    listening_event_id BIGINT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_reaction (listening_event_id, user_id, emoji),
    INDEX idx_reactions_event (listening_event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
