-- ========================================
-- Resona Database Initialization Script
-- Version: 1.1.0
-- 
-- Run this script to create all tables.
-- Usage: mysql -h <host> -P <port> -u <user> -p < init.sql
-- ========================================

-- Begin transaction for atomic migration
START TRANSACTION;

-- Source migration 001 (initial schema)
SOURCE migrations/up_001.sql;

-- Source migration 002 (v1.1 additions)
SOURCE migrations/up_002.sql;

-- Record schema version
CREATE TABLE IF NOT EXISTS schema_version (
    version VARCHAR(20) NOT NULL PRIMARY KEY,
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO schema_version (version, applied_at) VALUES ('1.1.0', NOW());

COMMIT;
