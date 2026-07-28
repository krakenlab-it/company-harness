-- KrakenLab Media Harness Schema
-- Migration 001: Core tables with RLS

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Team members
CREATE TABLE team_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'lead', 'dev', 'viewer')),
  avatar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('planning', 'active', 'paused', 'shipped')),
  goals JSONB NOT NULL DEFAULT '[]',
  start_date DATE NOT NULL,
  target_date DATE NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  repo_url TEXT,
  stack JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sprints
CREATE TABLE sprints (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT NOT NULL DEFAULT '',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('planned', 'active', 'completed')),
  ticket_ids JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tickets
CREATE TABLE tickets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sprint_id TEXT REFERENCES sprints(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('backlog', 'todo', 'in_progress', 'review', 'done')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assignee_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
  labels JSONB NOT NULL DEFAULT '[]',
  hermes_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Activity events
CREATE TABLE activity_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  summary TEXT NOT NULL,
  actor_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Provider costs
CREATE TABLE provider_costs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  provider TEXT NOT NULL CHECK (provider IN (
    'vercel', 'supabase', 'stripe', 'openai', 'groq',
    'trigger', 'resend', 'gcp', 'redis', 'openrouter', 'other'
  )),
  name TEXT NOT NULL,
  monthly_budget_usd NUMERIC(12, 2) NOT NULL DEFAULT 0,
  actual_spend_usd NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER provider_costs_updated_at
  BEFORE UPDATE ON provider_costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Stack dependencies
CREATE TABLE stack_dependencies (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'framework', 'database', 'ai', 'payments', 'email',
    'infra', 'background', 'cache', 'hosting', 'other'
  )),
  version TEXT,
  critical BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'outdated', 'deprecated', 'unknown')),
  notes TEXT
);

-- Cursor agent jobs
CREATE TABLE cursor_agent_jobs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type TEXT NOT NULL CHECK (type IN ('issue', 'pr', 'feature', 'bugfix', 'refactor')),
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  cursor_agent_id TEXT,
  pr_url TEXT,
  repo TEXT,
  result_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER cursor_agent_jobs_updated_at
  BEFORE UPDATE ON cursor_agent_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CRM contacts
CREATE TABLE crm_contacts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  email TEXT,
  company TEXT,
  status TEXT NOT NULL CHECK (status IN ('lead', 'active', 'churned', 'partner')),
  owner_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
  notes TEXT,
  hermes_insight TEXT,
  last_contact_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CRM deals
CREATE TABLE crm_deals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  contact_id TEXT NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  value_usd NUMERIC(12, 2) NOT NULL DEFAULT 0,
  stage TEXT NOT NULL CHECK (stage IN ('discovery', 'proposal', 'negotiation', 'won', 'lost')),
  probability INTEGER NOT NULL DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  expected_close DATE,
  hermes_insight TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Team repos
CREATE TABLE team_repos (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  allowed_actions JSONB NOT NULL DEFAULT '["read"]',
  budget_usd_monthly NUMERIC(12, 2) NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true
);

-- Team budgets
CREATE TABLE team_budgets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  category TEXT NOT NULL,
  monthly_limit_usd NUMERIC(12, 2) NOT NULL DEFAULT 0,
  spent_usd NUMERIC(12, 2) NOT NULL DEFAULT 0,
  alert_threshold_pct INTEGER NOT NULL DEFAULT 80 CHECK (alert_threshold_pct >= 0 AND alert_threshold_pct <= 100)
);

-- Hermes messages
CREATE TABLE hermes_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  channel TEXT NOT NULL CHECK (channel IN ('in_app', 'webhook')),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  context_type TEXT,
  context_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_sprints_project_id ON sprints(project_id);
CREATE INDEX idx_sprints_status ON sprints(status);
CREATE INDEX idx_tickets_project_id ON tickets(project_id);
CREATE INDEX idx_tickets_sprint_id ON tickets(sprint_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_assignee_id ON tickets(assignee_id);
CREATE INDEX idx_activity_events_project_id ON activity_events(project_id);
CREATE INDEX idx_activity_events_created_at ON activity_events(created_at DESC);
CREATE INDEX idx_provider_costs_provider ON provider_costs(provider);
CREATE INDEX idx_stack_dependencies_project_id ON stack_dependencies(project_id);
CREATE INDEX idx_cursor_agent_jobs_status ON cursor_agent_jobs(status);
CREATE INDEX idx_crm_contacts_status ON crm_contacts(status);
CREATE INDEX idx_crm_contacts_owner_id ON crm_contacts(owner_id);
CREATE INDEX idx_crm_deals_contact_id ON crm_deals(contact_id);
CREATE INDEX idx_crm_deals_stage ON crm_deals(stage);
CREATE INDEX idx_hermes_messages_created_at ON hermes_messages(created_at DESC);
CREATE INDEX idx_hermes_messages_context ON hermes_messages(context_type, context_id);

-- Row Level Security
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stack_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursor_agent_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_repos ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE hermes_messages ENABLE ROW LEVEL SECURITY;

-- Authenticated user policies (basic read/write for team members)
CREATE POLICY "team_members_select" ON team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "team_members_insert" ON team_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "team_members_update" ON team_members FOR UPDATE TO authenticated USING (true);

CREATE POLICY "projects_select" ON projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "projects_insert" ON projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "projects_update" ON projects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "projects_delete" ON projects FOR DELETE TO authenticated USING (true);

CREATE POLICY "sprints_select" ON sprints FOR SELECT TO authenticated USING (true);
CREATE POLICY "sprints_insert" ON sprints FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "sprints_update" ON sprints FOR UPDATE TO authenticated USING (true);
CREATE POLICY "sprints_delete" ON sprints FOR DELETE TO authenticated USING (true);

CREATE POLICY "tickets_select" ON tickets FOR SELECT TO authenticated USING (true);
CREATE POLICY "tickets_insert" ON tickets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "tickets_update" ON tickets FOR UPDATE TO authenticated USING (true);
CREATE POLICY "tickets_delete" ON tickets FOR DELETE TO authenticated USING (true);

CREATE POLICY "activity_events_select" ON activity_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "activity_events_insert" ON activity_events FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "provider_costs_select" ON provider_costs FOR SELECT TO authenticated USING (true);
CREATE POLICY "provider_costs_insert" ON provider_costs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "provider_costs_update" ON provider_costs FOR UPDATE TO authenticated USING (true);

CREATE POLICY "stack_dependencies_select" ON stack_dependencies FOR SELECT TO authenticated USING (true);
CREATE POLICY "stack_dependencies_insert" ON stack_dependencies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "stack_dependencies_update" ON stack_dependencies FOR UPDATE TO authenticated USING (true);
CREATE POLICY "stack_dependencies_delete" ON stack_dependencies FOR DELETE TO authenticated USING (true);

CREATE POLICY "cursor_agent_jobs_select" ON cursor_agent_jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "cursor_agent_jobs_insert" ON cursor_agent_jobs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "cursor_agent_jobs_update" ON cursor_agent_jobs FOR UPDATE TO authenticated USING (true);

CREATE POLICY "crm_contacts_select" ON crm_contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "crm_contacts_insert" ON crm_contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "crm_contacts_update" ON crm_contacts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "crm_contacts_delete" ON crm_contacts FOR DELETE TO authenticated USING (true);

CREATE POLICY "crm_deals_select" ON crm_deals FOR SELECT TO authenticated USING (true);
CREATE POLICY "crm_deals_insert" ON crm_deals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "crm_deals_update" ON crm_deals FOR UPDATE TO authenticated USING (true);
CREATE POLICY "crm_deals_delete" ON crm_deals FOR DELETE TO authenticated USING (true);

CREATE POLICY "team_repos_select" ON team_repos FOR SELECT TO authenticated USING (true);
CREATE POLICY "team_repos_insert" ON team_repos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "team_repos_update" ON team_repos FOR UPDATE TO authenticated USING (true);

CREATE POLICY "team_budgets_select" ON team_budgets FOR SELECT TO authenticated USING (true);
CREATE POLICY "team_budgets_insert" ON team_budgets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "team_budgets_update" ON team_budgets FOR UPDATE TO authenticated USING (true);

CREATE POLICY "hermes_messages_select" ON hermes_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "hermes_messages_insert" ON hermes_messages FOR INSERT TO authenticated WITH CHECK (true);
