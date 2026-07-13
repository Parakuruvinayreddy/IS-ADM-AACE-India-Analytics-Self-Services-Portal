-- ================================================================
-- ADM Analytics Platform — PostgreSQL Schema (users_db)
-- ================================================================
-- This schema file is the source of truth for the users_db database.
-- Tables are also auto-created by the auth module on startup.
-- Run: psql -U postgres -h localhost -d users_db -f schema_users.sql
-- ================================================================

CREATE TABLE IF NOT EXISTS aace_users (
  user_id       VARCHAR(50) PRIMARY KEY,
  email         VARCHAR(120) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NULL,
  name          VARCHAR(100) NOT NULL,
  org           VARCHAR(100) NOT NULL,
  location      VARCHAR(100) NOT NULL,
  roles         VARCHAR(500) DEFAULT 'public',
  azure_oid     VARCHAR(100) UNIQUE NULL,
  azure_tid     VARCHAR(100) NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS aace_access_requests (
  id             SERIAL PRIMARY KEY,
  user_id        VARCHAR(50) REFERENCES aace_users(user_id),
  dashboard_id   VARCHAR(100) NOT NULL,
  resource_type  VARCHAR(50) NOT NULL,
  project_name   VARCHAR(200),
  justification  TEXT NOT NULL,
  status         VARCHAR(20) DEFAULT 'pending',
  requested_at   TIMESTAMP DEFAULT NOW(),
  reviewed_at    TIMESTAMP,
  reviewed_by    VARCHAR(50),
  admin_notes    TEXT
);

CREATE TABLE IF NOT EXISTS aace_api_keys (
  id           SERIAL PRIMARY KEY,
  user_id      VARCHAR(50) REFERENCES aace_users(user_id),
  key_value    VARCHAR(255) UNIQUE NOT NULL,
  dashboard_id VARCHAR(100) NOT NULL,
  created_at   TIMESTAMP DEFAULT NOW(),
  expires_at   TIMESTAMP,
  is_active    BOOLEAN DEFAULT TRUE,
  last_used    TIMESTAMP
);
