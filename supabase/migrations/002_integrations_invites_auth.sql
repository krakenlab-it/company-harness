-- KrakenLab Harness — integrations, team invites, project assignments
-- Migration 002

-- Link team members to Supabase Auth users
ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_team_members_auth_user_id ON team_members(auth_user_id);

-- Integration connections (OAuth tokens stored server-side only)
CREATE TABLE integration_connections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  provider TEXT NOT NULL CHECK (provider IN (
    'openrouter', 'trigger', 'google', 'gcp', 'github', 'resend'
  )),
  status TEXT NOT NULL CHECK (status IN ('connected', 'disconnected', 'error', 'syncing')),
  label TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider)
);

CREATE TRIGGER integration_connections_updated_at
  BEFORE UPDATE ON integration_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Team invites with project assignment
CREATE TABLE team_invites (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'lead', 'dev', 'viewer')),
  token TEXT NOT NULL UNIQUE,
  project_ids JSONB NOT NULL DEFAULT '[]',
  invited_by_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_team_invites_token ON team_invites(token);
CREATE INDEX idx_team_invites_email ON team_invites(email);
CREATE INDEX idx_team_invites_status ON team_invites(status);

-- Project assignments (email or member)
CREATE TABLE project_assignments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  member_id TEXT REFERENCES team_members(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'lead', 'dev', 'viewer')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, email)
);

CREATE INDEX idx_project_assignments_project_id ON project_assignments(project_id);
CREATE INDEX idx_project_assignments_member_id ON project_assignments(member_id);

-- OpenRouter usage snapshots
CREATE TABLE openrouter_usage_snapshots (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  usage_usd NUMERIC(12, 4) NOT NULL DEFAULT 0,
  limit_usd NUMERIC(12, 4),
  tokens_used BIGINT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_openrouter_usage_recorded_at ON openrouter_usage_snapshots(recorded_at DESC);

-- Trigger.dev job runs
CREATE TABLE trigger_job_runs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  external_run_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  status TEXT NOT NULL,
  duration_ms INTEGER,
  cost_usd NUMERIC(12, 4),
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (external_run_id)
);

CREATE INDEX idx_trigger_job_runs_started_at ON trigger_job_runs(started_at DESC);

-- GitHub repository sync
CREATE TABLE github_repositories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  external_id BIGINT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  url TEXT NOT NULL,
  default_branch TEXT NOT NULL DEFAULT 'main',
  last_push_at TIMESTAMPTZ,
  open_issues INTEGER NOT NULL DEFAULT 0,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Google calendar events (summary cache)
CREATE TABLE google_calendar_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  external_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  attendees JSONB NOT NULL DEFAULT '[]',
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Gmail thread summaries
CREATE TABLE google_gmail_threads (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  external_id TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  from_address TEXT NOT NULL,
  snippet TEXT NOT NULL DEFAULT '',
  received_at TIMESTAMPTZ NOT NULL,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- GCP health checks
CREATE TABLE gcp_health_checks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  service TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down', 'unknown')),
  message TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gcp_health_checked_at ON gcp_health_checks(checked_at DESC);

-- RLS
ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE openrouter_usage_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE trigger_job_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_gmail_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE gcp_health_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integration_connections_select" ON integration_connections FOR SELECT TO authenticated USING (true);
CREATE POLICY "integration_connections_write" ON integration_connections FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "team_invites_select" ON team_invites FOR SELECT TO authenticated USING (true);
CREATE POLICY "team_invites_write" ON team_invites FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "project_assignments_select" ON project_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "project_assignments_write" ON project_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "openrouter_usage_select" ON openrouter_usage_snapshots FOR SELECT TO authenticated USING (true);
CREATE POLICY "openrouter_usage_insert" ON openrouter_usage_snapshots FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "trigger_runs_select" ON trigger_job_runs FOR SELECT TO authenticated USING (true);
CREATE POLICY "trigger_runs_write" ON trigger_job_runs FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "github_repos_select" ON github_repositories FOR SELECT TO authenticated USING (true);
CREATE POLICY "github_repos_write" ON github_repositories FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "google_calendar_select" ON google_calendar_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "google_calendar_write" ON google_calendar_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "google_gmail_select" ON google_gmail_threads FOR SELECT TO authenticated USING (true);
CREATE POLICY "google_gmail_write" ON google_gmail_threads FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "gcp_health_select" ON gcp_health_checks FOR SELECT TO authenticated USING (true);
CREATE POLICY "gcp_health_insert" ON gcp_health_checks FOR INSERT TO authenticated WITH CHECK (true);

-- Public read for pending invite lookup by token (anon can validate invite before login)
CREATE POLICY "team_invites_anon_read_by_token" ON team_invites
  FOR SELECT TO anon
  USING (status = 'pending' AND expires_at > NOW());
