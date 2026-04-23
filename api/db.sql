-- Main Database Creation. Create if not existed
CREATE DATABASE IF NOT EXISTS realDB;

-- Use the Database
USE realDB;

-- ==================== USER TABLE ====================
CREATE TABLE IF NOT EXISTS user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_logged_in TINYINT(1) DEFAULT 0,
    two_factor_pin VARCHAR(6) DEFAULT NULL,
    two_factor_enabled TINYINT(1) DEFAULT 0
);

-- ==================== USER SESSIONS TABLE ====================
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    session_name VARCHAR(255) DEFAULT 'New Session',
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active TINYINT(1) DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    INDEX idx_user_active (user_id, is_active),
    INDEX idx_session_token (session_token)
);

-- ==================== CHECKS TABLE (enhanced) ====================
CREATE TABLE IF NOT EXISTS checks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_id INT NULL,
    query TEXT NOT NULL,
    verdict VARCHAR(50) DEFAULT 'mixed',
    check_type VARCHAR(50) DEFAULT 'text',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fake_news_score INT DEFAULT NULL,
    sources_checked INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE SET NULL,
    INDEX idx_user_created (user_id, created_at DESC),
    INDEX idx_check_type (check_type),
    INDEX idx_verdict (verdict)
);

-- ==================== USER ACTIVITIES TABLE ====================
CREATE TABLE IF NOT EXISTS user_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_id INT NOT NULL,
    activity_type ENUM('search', 'url_check', 'article_view', 'sentiment_analysis', 'fact_check', 'compare_articles') NOT NULL,
    query_text TEXT NULL,
    article_title TEXT NULL,
    article_url VARCHAR(500) NULL,
    source_name VARCHAR(255) NULL,
    verdict VARCHAR(50) NULL,
    fake_news_score INT NULL,
    sentiment_score DECIMAL(5,2) NULL,
    response_time_ms INT NULL,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE CASCADE,
    INDEX idx_user_session (user_id, session_id),
    INDEX idx_user_activities (user_id, created_at DESC),
    INDEX idx_activity_type (activity_type),
    INDEX idx_verdict (verdict),
    FULLTEXT INDEX ft_query_text (query_text)
);

-- ==================== ADD MISSING COLUMNS TO EXISTING TABLES ====================
-- (safe to run even if columns already exist)

-- For user table (add any missing columns from above definition)
ALTER TABLE user 
    ADD COLUMN IF NOT EXISTS two_factor_pin VARCHAR(6) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS two_factor_enabled TINYINT(1) DEFAULT 0;

-- For checks table (add missing columns)
ALTER TABLE checks
    ADD COLUMN IF NOT EXISTS session_id INT NULL,
    ADD COLUMN IF NOT EXISTS fake_news_score INT NULL,
    ADD COLUMN IF NOT EXISTS sources_checked INT DEFAULT 0,
    ADD FOREIGN KEY IF NOT EXISTS (session_id) REFERENCES user_sessions(id) ON DELETE SET NULL;

-- ==================== OPTIONAL: CLEAN UP OLD SESSIONS (run occasionally) ====================
-- This will delete inactive sessions older than 30 days
-- Run this manually or schedule as a cron job
-- DELETE FROM user_sessions WHERE is_active = 0 AND ended_at < DATE_SUB(NOW(), INTERVAL 30 DAY);