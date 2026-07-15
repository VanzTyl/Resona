# Resona Database Schema Documentation

Version: 1.0.0

## Overview

Resona uses a MySQL-compatible database (TiDB Cloud) with 8 core tables for
user management, Spotify integration, social graph, feed generation,
reactions, and messaging.

## Entity Relationship

```
users 1---* spotify_tokens
users 1---* friendships
users 1---* listening_events
users 1---* user_artists
users 1---* reactions
users 1---* chat_threads (as user_id_1 or user_id_2)
users 1---* messages (as sender_id)

listening_events 1---* reactions
chat_threads 1---* messages
```

## Tables

### users
| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED AUTO_INCREMENT | Primary key |
| spotify_id | VARCHAR(255) UNIQUE | Spotify user ID |
| email | VARCHAR(255) | User email from Spotify |
| username | VARCHAR(50) UNIQUE | Unique app username |
| display_name | VARCHAR(100) | Display name |
| avatar_url | VARCHAR(500) | Profile picture URL |
| created_at | DATETIME | Account creation time |
| updated_at | DATETIME | Last update time |

Indexes: `spotify_id` (UNIQUE), `username` (UNIQUE), `display_name`

### spotify_tokens
| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED AUTO_INCREMENT | Primary key |
| user_id | INT UNSIGNED UNIQUE | FK to users.id |
| access_token | TEXT (encrypted) | Encrypted Spotify access token |
| refresh_token | TEXT (encrypted) | Encrypted Spotify refresh token |
| expires_at | DATETIME | Token expiry timestamp |
| created_at | DATETIME | Record creation time |
| updated_at | DATETIME | Last update time |

Indexes: `user_id` (UNIQUE), `expires_at`

### friendships
| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED AUTO_INCREMENT | Primary key |
| sender_id | INT UNSIGNED | FK to users.id |
| receiver_id | INT UNSIGNED | FK to users.id |
| status | ENUM('pending','accepted','rejected','blocked') | Friendship status |
| created_at | DATETIME | Request time |
| updated_at | DATETIME | Last update time |

Indexes: `(sender_id, receiver_id)` UNIQUE, `status`

### listening_events
| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT UNSIGNED AUTO_INCREMENT | Primary key |
| user_id | INT UNSIGNED | FK to users.id |
| spotify_track_id | VARCHAR(255) | Spotify track URI/ID |
| track_name | VARCHAR(300) | Track title |
| artist_names | VARCHAR(500) | Comma-separated artist names |
| album_name | VARCHAR(300) | Album title |
| album_art_url | VARCHAR(500) | Album art image URL |
| track_duration_ms | INT UNSIGNED | Track length in ms |
| is_playing | TINYINT(1) | Currently playing flag |
| progress_ms | INT UNSIGNED | Playback position in ms |
| created_at | DATETIME | Event timestamp |

Indexes: `(user_id, created_at)`, `(user_id, spotify_track_id)`, `created_at`

### user_artists
| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED AUTO_INCREMENT | Primary key |
| user_id | INT UNSIGNED | FK to users.id |
| spotify_artist_id | VARCHAR(255) | Spotify artist ID |
| artist_name | VARCHAR(300) | Artist name |
| artist_image_url | VARCHAR(500) | Artist image URL |
| play_count | INT UNSIGNED DEFAULT 1 | Cumulative play count |
| created_at | DATETIME | First tracked time |
| updated_at | DATETIME | Last play time |

Indexes: `(user_id, spotify_artist_id)` UNIQUE, `play_count`

### reactions
| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED AUTO_INCREMENT | Primary key |
| listening_event_id | BIGINT UNSIGNED | FK to listening_events.id |
| user_id | INT UNSIGNED | FK to users.id (reactor) |
| emoji | VARCHAR(10) | Emoji character |
| created_at | DATETIME | Reaction timestamp |

Indexes: `(listening_event_id, user_id, emoji)` UNIQUE, `listening_event_id`

### chat_threads
| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED AUTO_INCREMENT | Primary key |
| user_id_1 | INT UNSIGNED | FK to users.id (participant A) |
| user_id_2 | INT UNSIGNED | FK to users.id (participant B) |
| created_at | DATETIME | Thread creation time |

Indexes: `(user_id_1, user_id_2)` UNIQUE

### messages
| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT UNSIGNED AUTO_INCREMENT | Primary key |
| thread_id | INT UNSIGNED | FK to chat_threads.id |
| sender_id | INT UNSIGNED | FK to users.id |
| content | TEXT | Message content |
| message_type | ENUM('manual','auto') | Manual or auto-generated |
| created_at | DATETIME | Message timestamp |

Indexes: `(thread_id, created_at)`, `sender_id`

## Migration Strategy

All schema changes must go through migration files:

- `up_XXX.sql` — Applies a migration
- `down_XXX.sql` — Reverts a migration
- `init.sql` — Runs all up migrations in order
