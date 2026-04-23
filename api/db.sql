-- Main Database Creation. Create if not existed
CREATE DATABASE IF NOT EXISTS realDB;

-- Use the Database
USE realDB;

-- User Table Creation. Create if not existed
CREATE TABLE
    IF NOT EXISTS user (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        is_logged_in TINYINT (1) DEFAULT 0,
        two_factor_pin VARCHAR(6) DEFAULT NULL,
        two_factor_enabled TINYINT (1) DEFAULT 0
    );

CREATE TABLE
    IF NOT EXISTS checks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        query TEXT NOT NULL,
        verdict VARCHAR(50) DEFAULT 'mixed',
        check_type VARCHAR(50) DEFAULT 'text',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    session_name VARCHAR(255) DEFAULT 'New Session',
    ip_address VARCHAR(45),
    user_agent TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active TINYINT(1) DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    INDEX idx_user_active (user_id, is_active),
    INDEX idx_session_token (session_token)
);

CREATE TABLE IF NOT EXISTS user_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_id INT NOT NULL,
    activity_type ENUM('search', 'url_check', 'article_view', 'sentiment_analysis', 'fact_check', 'compare_articles') NOT NULL,
    query_text TEXT,
    article_title TEXT,
    article_url VARCHAR(500),
    source_name VARCHAR(255),
    verdict VARCHAR(50),
    fake_news_score INT DEFAULT NULL,
    sentiment_score DECIMAL(5,2) DEFAULT NULL,
    response_time_ms INT DEFAULT NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE CASCADE,
    INDEX idx_user_session (user_id, session_id),
    INDEX idx_user_activities (user_id, created_at DESC),
    INDEX idx_activity_type (activity_type),
    FULLTEXT INDEX ft_query_text (query_text)
);

ALTER TABLE checks ADD COLUMN IF NOT EXISTS session_id INT NULL;
ALTER TABLE checks ADD COLUMN IF NOT EXISTS fake_news_score INT DEFAULT NULL;
ALTER TABLE checks ADD COLUMN IF NOT EXISTS sentiment_score DECIMAL(5,2) DEFAULT NULL;
ALTER TABLE checks ADD COLUMN IF NOT EXISTS sources_checked INT DEFAULT 0;
ALTER TABLE checks ADD FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE SET NULL;

CREATE INDEX idx_checks_user_created ON checks(user_id, created_at DESC);
CREATE INDEX idx_activities_user_created ON user_activities(user_id, created_at DESC);