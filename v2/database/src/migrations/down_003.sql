-- ========================================
-- Resona Database Migration — Down 003
-- Version: 1.2.0
-- Description: Rollback schema hardening, FK constraints, reaction column width, unread tracking
-- ========================================

-- 1. Drop foreign key constraints (reverse order of creation)
ALTER TABLE spotify_tokens DROP FOREIGN KEY IF EXISTS fk_spotify_tokens_user;

ALTER TABLE reactions DROP FOREIGN KEY IF EXISTS fk_reactions_user;
ALTER TABLE reactions DROP FOREIGN KEY IF EXISTS fk_reactions_event;

ALTER TABLE user_artists DROP FOREIGN KEY IF EXISTS fk_user_artists_user;

ALTER TABLE listening_events DROP FOREIGN KEY IF EXISTS fk_listening_events_user;

ALTER TABLE messages DROP FOREIGN KEY IF EXISTS fk_messages_sender;
ALTER TABLE messages DROP FOREIGN KEY IF EXISTS fk_messages_thread;

ALTER TABLE friendships DROP FOREIGN KEY IF EXISTS fk_friendships_receiver;
ALTER TABLE friendships DROP FOREIGN KEY IF EXISTS fk_friendships_sender;

ALTER TABLE chat_threads DROP FOREIGN KEY IF EXISTS fk_chat_threads_user2;
ALTER TABLE chat_threads DROP FOREIGN KEY IF EXISTS fk_chat_threads_user1;

-- 2. Drop the unique key and recreate with original name
ALTER TABLE chat_threads DROP INDEX uk_chat_pair;
ALTER TABLE chat_threads ADD UNIQUE KEY uk_chat_pair (user_id_1, user_id_2);

-- 3. Drop last_read_at columns from chat_threads (reverse order of addition)
ALTER TABLE chat_threads DROP COLUMN last_read_at_2;
ALTER TABLE chat_threads DROP COLUMN last_read_at_1;

-- 4. Restore emoji column to VARCHAR(10)
ALTER TABLE reactions MODIFY COLUMN emoji VARCHAR(10) NOT NULL;
