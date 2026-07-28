"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  GitBranch,
  Loader2,
  Mail,
  Save,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { AccessMatrix } from "@/components/team/access-matrix";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

interface RepoAccess {
  id: string;
  name: string;
  allowedActions: string[];
}

interface Budget {
  id?: string;
  name: string;
  monthlyLimit: number;
  alertThreshold: number;
  currentSpend?: number;
}

const ALL_ACTIONS = ["read", "write", "deploy", "admin"] as const;

interface ProjectOption {
  id: string;
  name: string;
}

const ROLES = ["admin", "lead", "dev", "viewer"] as const;

export function TeamConsole() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("dev");
  const [inviteProjectIds, setInviteProjectIds] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<string | null>(null);
  const [repos, setRepos] = useState<RepoAccess[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [editedBudgets, setEditedBudgets] = useState<
    Record<string, { monthlyLimit: string; alertThreshold: string }>
  >({});
  const [repoActions, setRepoActions] = useState<
    Record<string, string[]>
  >({});

  async function loadTeam() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/team");
      if (!res.ok) throw new Error(`Failed to load team (${res.status})`);
      const data = await res.json();
      setMembers(data.members ?? []);
      setRepos(data.repos ?? []);
      setBudgets(data.budgets ?? []);

      const projRes = await fetch("/api/projects");
      if (projRes.ok) {
        const projData = await projRes.json();
        const list = projData.projects ?? projData ?? [];
        setProjects(
          list.map((p: { id: string; name: string }) => ({
            id: p.id,
            name: p.name,
          })),
        );
      }

      const budgetEdits: Record<
        string,
        { monthlyLimit: string; alertThreshold: string }
      > = {};
      (data.budgets ?? []).forEach((b: Budget) => {
        budgetEdits[b.name] = {
          monthlyLimit: String(b.monthlyLimit ?? 0),
          alertThreshold: String(b.alertThreshold ?? 80),
        };
      });
      setEditedBudgets(budgetEdits);

      const actions: Record<string, string[]> = {};
      (data.repos ?? []).forEach((r: RepoAccess) => {
        actions[r.id] = r.allowedActions ?? [];
      });
      setRepoActions(actions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load team");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeam();
  }, []);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setInviteResult(null);
    setError(null);
    try {
      const res = await fetch("/api/team/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          name: inviteName || undefined,
          role: inviteRole,
          projectIds: inviteProjectIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invite failed");

      const parts = [`Invite created for ${data.invite.email}.`];
      if (data.emailSent) {
        parts.push("Email sent via Resend.");
      } else if (data.acceptUrl) {
        parts.push(`Share link: ${data.acceptUrl}`);
      }
      if (data.emailError) {
        parts.push(`Email error: ${data.emailError}`);
      }
      setInviteResult(parts.join(" "));
      setInviteEmail("");
      setInviteName("");
      setInviteProjectIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setInviting(false);
    }
  }

  function toggleInviteProject(projectId: string) {
    setInviteProjectIds((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId],
    );
  }

  function toggleAction(repoId: string, action: string) {
    setRepoActions((prev) => {
      const current = prev[repoId] ?? [];
      const next = current.includes(action)
        ? current.filter((a) => a !== action)
        : [...current, action];
      return { ...prev, [repoId]: next };
    });
  }

  async function saveRepoAccess(repo: RepoAccess) {
    setSaving(`repo-${repo.id}`);
    try {
      const res = await fetch("/api/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "repo",
          id: repo.id,
          allowedActions: repoActions[repo.id] ?? [],
        }),
      });
      if (!res.ok) throw new Error(`Failed to save repo access (${res.status})`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save repo access");
    } finally {
      setSaving(null);
    }
  }

  async function saveBudget(budget: Budget) {
    const edits = editedBudgets[budget.name];
    if (!edits) return;

    setSaving(`budget-${budget.name}`);
    try {
      const res = await fetch("/api/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "budget",
          id: budget.id,
          name: budget.name,
          monthlyLimit: parseFloat(edits.monthlyLimit) || 0,
          alertThreshold: parseFloat(edits.alertThreshold) || 80,
        }),
      });
      if (!res.ok) throw new Error(`Failed to save budget (${res.status})`);
      await loadTeam();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save budget");
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-teal-bright" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-up">
      {error && (
        <Panel className="border-danger/30 bg-danger/5 text-sm text-danger">
          {error}
        </Panel>
      )}

      {/* Invite */}
      <section className="space-y-4">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-mist flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Invite teammate
        </h2>
        <Panel className="p-4 space-y-4">
          <p className="text-sm text-mist">
            Assign projects, send a Resend invite email, and let them accept via
            login or join link.
          </p>
          {inviteResult && (
            <p className="text-sm text-teal-bright break-all">{inviteResult}</p>
          )}
          <form onSubmit={sendInvite} className="grid gap-3 sm:grid-cols-2">
            <Input
              type="email"
              placeholder="Email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
            <Input
              placeholder="Name (optional)"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
            />
            <Select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              options={ROLES.map((role) => ({ value: role, label: role }))}
            />
            <Button type="submit" disabled={inviting}>
              {inviting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send invite
                </>
              )}
            </Button>
          </form>
          {projects.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {projects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleInviteProject(p.id)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs border transition-colors",
                    inviteProjectIds.includes(p.id)
                      ? "border-teal bg-teal/15 text-teal-bright"
                      : "border-[rgba(122,154,171,0.2)] text-mist hover:text-foam",
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </Panel>
      </section>

      {/* Members */}
      <section className="space-y-4">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-mist flex items-center gap-2">
          <Users className="h-4 w-4" />
          Members
          <span className="text-mist/60">({members.length})</span>
        </h2>
        {members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No team members"
            description="Team members will appear here once configured."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <Panel key={member.id} padding="sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal/15 text-sm font-semibold text-teal-bright">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foam truncate">
                      {member.name}
                    </p>
                    {member.email && (
                      <p className="text-xs text-mist truncate">
                        {member.email}
                      </p>
                    )}
                    {member.role && (
                      <Badge variant="default" className="mt-1.5">
                        {member.role}
                      </Badge>
                    )}
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        )}
      </section>

      <AccessMatrix />

      {/* Repos — team-level allowed actions (legacy) */}
      <section className="space-y-4">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-mist flex items-center gap-2">
          <GitBranch className="h-4 w-4" />
          Repository access
        </h2>
        {repos.length === 0 ? (
          <EmptyState
            icon={GitBranch}
            title="No repositories"
            description="Configure repository access and allowed actions."
          />
        ) : (
          <div className="space-y-3">
            {repos.map((repo) => (
              <Panel key={repo.id}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-medium text-foam font-mono text-sm">
                      {repo.name}
                    </h3>
                    <p className="mt-1 text-xs text-mist">
                      Allowed actions for team agents
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ALL_ACTIONS.map((action) => {
                      const checked = (repoActions[repo.id] ?? []).includes(
                        action,
                      );
                      return (
                        <label
                          key={action}
                          className={cn(
                            "flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors",
                            checked
                              ? "border-teal/30 bg-teal/10 text-teal-bright"
                              : "border-[rgba(122,154,171,0.15)] text-mist hover:border-[rgba(122,154,171,0.3)]",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleAction(repo.id, action)}
                            className="sr-only"
                          />
                          {action}
                        </label>
                      );
                    })}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-3"
                  onClick={() => saveRepoAccess(repo)}
                  disabled={saving === `repo-${repo.id}`}
                >
                  {saving === `repo-${repo.id}` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save access
                </Button>
              </Panel>
            ))}
          </div>
        )}
      </section>

      {/* Budgets */}
      <section className="space-y-4">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-mist flex items-center gap-2">
          <UserCog className="h-4 w-4" />
          Budgets & alerts
        </h2>
        {budgets.length === 0 ? (
          <EmptyState
            icon={UserCog}
            title="No budgets configured"
            description="Set monthly limits and alert thresholds for team spending."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {budgets.map((budget) => {
              const edits = editedBudgets[budget.name] ?? {
                monthlyLimit: "0",
                alertThreshold: "80",
              };
              const limit = parseFloat(edits.monthlyLimit) || 0;
              const threshold = parseFloat(edits.alertThreshold) || 80;
              const spend = budget.currentSpend ?? 0;
              const pct = limit > 0 ? (spend / limit) * 100 : 0;
              const alertTriggered = pct >= threshold;

              return (
                <Panel
                  key={budget.name}
                  className={cn(alertTriggered && "border-warn/30")}
                >
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <h3 className="font-display font-semibold text-foam">
                      {budget.name}
                    </h3>
                    {alertTriggered && (
                      <Badge variant="warn">
                        <AlertTriangle className="h-3 w-3" />
                        Alert
                      </Badge>
                    )}
                  </div>
                  {budget.currentSpend != null && (
                    <p className="mb-3 text-sm text-mist">
                      Current spend:{" "}
                      <span className="font-medium text-foam">
                        ${spend.toLocaleString()}
                      </span>
                      {limit > 0 && (
                        <span className="text-mist/70">
                          {" "}
                          ({Math.round(pct)}% of limit)
                        </span>
                      )}
                    </p>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      label="Monthly limit ($)"
                      type="number"
                      min="0"
                      value={edits.monthlyLimit}
                      onChange={(e) =>
                        setEditedBudgets((prev) => ({
                          ...prev,
                          [budget.name]: {
                            ...prev[budget.name],
                            monthlyLimit: e.target.value,
                          },
                        }))
                      }
                    />
                    <Input
                      label="Alert threshold (%)"
                      type="number"
                      min="0"
                      max="100"
                      value={edits.alertThreshold}
                      onChange={(e) =>
                        setEditedBudgets((prev) => ({
                          ...prev,
                          [budget.name]: {
                            ...prev[budget.name],
                            alertThreshold: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => saveBudget(budget)}
                    disabled={saving === `budget-${budget.name}`}
                  >
                    {saving === `budget-${budget.name}` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save
                  </Button>
                </Panel>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
