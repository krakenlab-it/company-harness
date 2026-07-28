-- Invitation modes: preset templates + per-member view settings

ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS invite_mode TEXT CHECK (
    invite_mode IN ('admin', 'dev', 'marketing', 'custom')
  );

ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS view_settings JSONB;

ALTER TABLE team_invites
  ADD COLUMN IF NOT EXISTS invite_mode TEXT CHECK (
    invite_mode IN ('admin', 'dev', 'marketing', 'custom')
  );

ALTER TABLE team_invites
  ADD COLUMN IF NOT EXISTS view_settings JSONB;

ALTER TABLE team_invites
  ADD COLUMN IF NOT EXISTS repo_actions JSONB;

ALTER TABLE project_assignments
  DROP CONSTRAINT IF EXISTS project_assignments_role_check;

ALTER TABLE project_assignments
  ADD CONSTRAINT project_assignments_role_check
  CHECK (role IN ('admin', 'lead', 'dev', 'marketing', 'viewer'));
