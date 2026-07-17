# Resona Database Version History

## 1.0.0 (2026-07-14)
- Initial schema creation
- Tables: users, spotify_tokens, friendships, listening_events, user_artists, reactions, chat_threads, messages
- Indexes on foreign keys and frequently queried columns

## 1.2.0 (2026-07-17)
- reactions.emoji column widened to VARCHAR(30) for Lucide icon names
- chat_threads: added last_read_at_1, last_read_at_2 columns for unread tracking
- chat_threads: unique constraint re-applied for bidirectionality
- Foreign key constraints with ON DELETE CASCADE added to all tables
- Orphaned data cleanup before FK application
