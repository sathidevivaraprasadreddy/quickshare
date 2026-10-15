-- QuickShare Database Schema for MySQL / TiDB / MariaDB
CREATE DATABASE IF NOT EXISTS quickshare_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE quickshare_db;

-- Table: share_sessions
-- Represents a single upload session (which can contain one or multiple files)
CREATE TABLE IF NOT EXISTS share_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  share_token VARCHAR(64) NOT NULL UNIQUE,
  revoke_token VARCHAR(64) NOT NULL,
  total_size_bytes BIGINT NOT NULL DEFAULT 0,
  file_count INT NOT NULL DEFAULT 1,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_revoked TINYINT(1) NOT NULL DEFAULT 0,
  download_count INT NOT NULL DEFAULT 0,
  INDEX idx_share_token (share_token),
  INDEX idx_expires_at (expires_at),
  INDEX idx_is_revoked (is_revoked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: share_files
-- Represents individual files uploaded in a session
CREATE TABLE IF NOT EXISTS share_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(127) NOT NULL DEFAULT 'application/octet-stream',
  storage_driver VARCHAR(32) NOT NULL DEFAULT 'local',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_session_id (session_id),
  CONSTRAINT fk_session_files FOREIGN KEY (session_id) 
    REFERENCES share_sessions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
