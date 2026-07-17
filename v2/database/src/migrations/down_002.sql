-- ========================================
-- Resona Database Migration — Down 002
-- Version: 1.1.0
-- Description: Rollback profile, privacy, and onboarding additions
-- ========================================

ALTER TABLE users DROP COLUMN onboarding_step;
ALTER TABLE users DROP COLUMN is_onboarded;
ALTER TABLE users DROP COLUMN about_me;
ALTER TABLE users DROP COLUMN favorite_genres;
ALTER TABLE users DROP COLUMN interests;
ALTER TABLE users DROP COLUMN privacy_level;
ALTER TABLE users DROP COLUMN username_updated_at;
ALTER TABLE users DROP COLUMN bio;
