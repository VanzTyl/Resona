-- ========================================
-- Resona Database Migration — Up 003
-- Version: 1.2.0
-- Description: Schema hardening, FK constraints, reaction column width, unread tracking
-- ========================================

-- 1. Increase emoji column from VARCHAR(10) to VARCHAR(30) for Lucide icon names
ALTER TABLE reactions MODIFY COLUMN emoji VARCHAR(30) NOT NULL;

-- 2. Add last_read_at columns to chat_threads for proper unread tracking
ALTER TABLE chat_threads ADD COLUMN last_read_at_1 DATETIME DEFAULT NULL AFTER created_at;
ALTER TABLE chat_threads ADD COLUMN last_read_at_2 DATETIME DEFAULT NULL AFTER last_read_at_1;

-- 3. Drop and re-add the unique constraint on chat_threads to ensure bidirectionality
ALTER TABLE chat_threads DROP INDEX uk_chat_pair;
ALTER TABLE chat_threads ADD UNIQUE KEY uk_chat_pair (user_id_1, user_id_2);

-- 4. Clean up orphaned data before adding foreign key constraints
DELETE FROM chat_threads WHERE user_id_1 NOT IN (SELECT id FROM users) OR user_id_2 NOT IN (SELECT id FROM users);
DELETE FROM friendships WHERE sender_id NOT IN (SELECT id FROM users) OR receiver_id NOT IN (SELECT id FROM users);
DELETE FROM messages WHERE thread_id NOT IN (SELECT id FROM chat_threads);
DELETE FROM listening_events WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM user_artists WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM reactions WHERE listening_event_id NOT IN (SELECT id FROM listening_events);
DELETE FROM spotify_tokens WHERE user_id NOT IN (SELECT id FROM users);

-- 5. Add foreign key constraints with ON DELETE CASCADE
ALTER TABLE chat_threads
    ADD CONSTRAINT fk_chat_threads_user1 FOREIGN KEY (user_id_1) REFERENCES users(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_chat_threads_user2 FOREIGN KEY (user_id_2) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE friendships
    ADD CONSTRAINT fk_friendships_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_friendships_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE messages
    ADD CONSTRAINT fk_messages_thread FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE listening_events
    ADD CONSTRAINT fk_listening_events_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_artists
    ADD CONSTRAINT fk_user_artists_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE reactions
    ADD CONSTRAINT fk_reactions_event FOREIGN KEY (listening_event_id) REFERENCES listening_events(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_reactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE spotify_tokens
    ADD CONSTRAINT fk_spotify_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
