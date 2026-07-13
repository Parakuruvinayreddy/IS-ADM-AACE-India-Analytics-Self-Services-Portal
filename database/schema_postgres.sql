-- ================================================================
-- ADM Analytics Platform — PostgreSQL Schema (adm_admin_db)
-- ================================================================
-- This schema file is the source of truth for the adm_admin_db database.
-- For users_db tables, see: database/schema_users.sql
--
-- Run: psql -U postgres -h localhost -d adm_admin_db -f schema_postgres.sql
-- ================================================================

CREATE TABLE IF NOT EXISTS aace_tickets (
  ticket_id SERIAL PRIMARY KEY,
  team_name TEXT,
  contact_person TEXT,
  contact_email TEXT,
  title TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  type TEXT DEFAULT 'query',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS aace_team_access (
  access_id SERIAL PRIMARY KEY,
  ticket_id INTEGER,
  team_name TEXT,
  user_email TEXT,
  access_token TEXT UNIQUE,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  status TEXT DEFAULT 'active',
  project_id INTEGER,
  dl_email TEXT DEFAULT '',
  feedback_id INTEGER,
  allowed_edits TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS aace_projects (
  project_id SERIAL PRIMARY KEY,
  version INTEGER DEFAULT 1,
  team_name TEXT,
  team_lead TEXT DEFAULT '',
  contact_person TEXT,
  contact_email TEXT DEFAULT '',
  alt_contact TEXT DEFAULT '',
  function TEXT,
  category TEXT DEFAULT '',
  title TEXT,
  description TEXT,
  business_case TEXT,
  tech_stack TEXT,
  fields_selected TEXT,
  why_we_use_it TEXT DEFAULT '',
  who_manages_it TEXT DEFAULT '',
  escalation1_name TEXT DEFAULT '',
  escalation1_email TEXT DEFAULT '',
  escalation2_name TEXT DEFAULT '',
  escalation2_email TEXT DEFAULT '',
  dashboard_link TEXT DEFAULT '',
  project_status TEXT DEFAULT 'Live',
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  data_source TEXT DEFAULT '',
  data_owner TEXT DEFAULT '',
  data_validated_by TEXT DEFAULT '',
  dashboard_developer TEXT DEFAULT '',
  data_developer TEXT DEFAULT '',
  dashboard_owner TEXT DEFAULT '',
  last_validated TEXT DEFAULT '',
  drill_down TEXT DEFAULT '',
  milestones TEXT DEFAULT '[]',
  status TEXT DEFAULT 'under_review',
  admin_comment TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS aace_project_files (
  file_id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES aace_projects(project_id) ON DELETE CASCADE,
  file_name TEXT,
  file_path TEXT,
  file_type TEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS aace_project_feedback (
  feedback_id SERIAL PRIMARY KEY,
  project_id INTEGER,
  project_name TEXT,
  user_name TEXT,
  user_email TEXT,
  user_role TEXT,
  rating INTEGER,
  comment TEXT,
  status TEXT DEFAULT 'pending',
  admin_note TEXT,
  type TEXT DEFAULT 'feedback',
  issue_title TEXT DEFAULT '',
  change_type TEXT DEFAULT '',
  project_title TEXT DEFAULT '',
  team_name TEXT DEFAULT '',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS aace_audit_log (
  log_id SERIAL PRIMARY KEY,
  entity_type TEXT,
  entity_id INTEGER,
  action TEXT,
  detail TEXT,
  user_email TEXT DEFAULT 'admin',
  user_id VARCHAR(50) NULL,
  azure_oid VARCHAR(100) NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS aace_published_projects (
  published_id SERIAL PRIMARY KEY,
  project_id INTEGER UNIQUE REFERENCES aace_projects(project_id) ON DELETE CASCADE,
  published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- Migration — add columns for existing databases
-- (Safe to re-run: uses ADD COLUMN IF NOT EXISTS)
-- ================================================================
ALTER TABLE aace_projects ADD COLUMN IF NOT EXISTS data_developer TEXT DEFAULT '';
ALTER TABLE aace_projects ADD COLUMN IF NOT EXISTS drill_down TEXT DEFAULT '';
ALTER TABLE aace_projects ADD COLUMN IF NOT EXISTS business_case TEXT DEFAULT '';
ALTER TABLE aace_projects ADD COLUMN IF NOT EXISTS tech_stack TEXT DEFAULT '';
