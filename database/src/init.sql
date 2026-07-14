-- ========================================
-- Resona Database Initialization Script
-- Version: 1.0.0
-- 
-- Run this script to create all tables.
-- Usage: mysql -h <host> -P <port> -u <user> -p < init.sql
-- ========================================

-- Begin transaction for atomic migration
START TRANSACTION;

-- Source migration 001
SOURCE migrations/up_001.sql;

-- Record schema version
CREATE TABLE IF NOT EXISTS schema_version (
    version VARCHAR(20) NOT NULL PRIMARY KEY,
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO schema_version (version, applied_at) VALUES ('1.0.0', NOW());

COMMIT;
