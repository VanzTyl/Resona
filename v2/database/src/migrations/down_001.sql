-- ========================================
-- Resona Database Migration — Down 001
-- Version: 1.0.0
-- Description: Revert initial schema creation
-- ========================================

DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS chat_threads;
DROP TABLE IF EXISTS reactions;
DROP TABLE IF EXISTS user_artists;
DROP TABLE IF EXISTS listening_events;
DROP TABLE IF EXISTS friendships;
DROP TABLE IF EXISTS spotify_tokens;
DROP TABLE IF EXISTS users;
