-- ========================================
-- Resona Database Migration — Up 002
-- Version: 1.1.0
-- Description: Profile, privacy, and onboarding additions
-- ========================================

-- REV-001: Bio field
ALTER TABLE users ADD COLUMN bio VARCHAR(200) DEFAULT '' AFTER avatar_url;

-- REV-001: Username change tracking
ALTER TABLE users ADD COLUMN username_updated_at DATETIME DEFAULT NULL AFTER bio;

-- REV-004: Privacy level
ALTER TABLE users ADD COLUMN privacy_level ENUM('public','friends_only','private') DEFAULT 'friends_only' AFTER username_updated_at;

-- REV-005: Interests, genres, about me
ALTER TABLE users ADD COLUMN interests TEXT DEFAULT '' AFTER privacy_level;
ALTER TABLE users ADD COLUMN favorite_genres TEXT DEFAULT '' AFTER interests;
ALTER TABLE users ADD COLUMN about_me TEXT DEFAULT '' AFTER favorite_genres;

-- REV-011: Onboarding tracking
ALTER TABLE users ADD COLUMN is_onboarded BOOLEAN DEFAULT FALSE AFTER about_me;
ALTER TABLE users ADD COLUMN onboarding_step INT DEFAULT 0 AFTER is_onboarded;
