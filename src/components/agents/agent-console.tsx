"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Bot, ExternalLink, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorPanel } from "@/components/ui/error-panel";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface AgentJob {
  id: string;
  type: string;
  title: string;
  status: string;
  repo?: string;
  createdAt?: string;
  url?: string;
  actor?: { name: string };
}

const statusVariant: Record<
  string,
  "default" | "teal" | "ok" | "warn" | "danger"
> = {
  pending: "default",
  queued: "default",
  running: "teal",
  completed: "ok",
  failed: "danger",
  cancelled: "warn",
};

export function AgentConsole() {
  const searchParams = useSearchParams();
  const repoParam = searchParams.get("repo") ?? "";
  const [jobs, setJobs] = useState<AgentJob[]>([]);
  const [repos, setRepos] = useState<Array<{ name: string; url: string }>>([]);
  const [canDelegate, setCanDelegate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    type: "feature",
    title: "",
    prompt: "",
    repo: "",
  });

  async function loadJobs() {
    setLoading(true);
    setError(null);
    try {
      const [agentsRes, reposRes] = await Promise.all([
        fetch("/api/agents"),
        fetch("/api/access/repos"),
      ]);
      if (!agentsRes.ok) throw new Error(`Failed to load agents (${agentsRes.status})`);
      const data = await agentsRes.json();
      setJobs(data.jobs ?? data.agents ?? []);
      setCanDelegate(data.canDelegate ?? false);

      if (reposRes.ok) {
        const repoData = await reposRes.json();
        const list = (repoData.repos ?? []).map(
          (r: { name: string; url: string }) => ({
            name: r.name,
            url: r.url,
          }),
        );
        setRepos(list);
        const match =
          list.find(
            (r: { name: string; url: string }) =>
              r.url === repoParam ||
              r.name === repoParam ||
              r.url.includes(repoParam),
          ) ?? list[0];
        if (match) {
          setForm((f) => ({ ...f, repo: match.url }));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load agents");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoParam]);

  async function handleDelegate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.prompt.trim() || !form.repo.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          title: form.title.trim(),
          prompt: form.prompt.trim(),
          repo: form.repo.trim(),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `Failed to delegate (${res.status})`);
      setForm({ type: "feature", title: "", prompt: "", repo: form.repo });
      setShowForm(false);
      await loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delegate");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-teal-bright" />
      </div>
    );
  }

  if (!canDelegate) {
    return (
      <ErrorPanel message="You need admin or lead role with agents permission on at least one repo to delegate Cursor jobs." />
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-mist">
          {jobs.length} agent job{jobs.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          Delegate task
        </Button>
      </div>

      {error && (
        <Panel className="border-danger/30 bg-danger/5 text-sm text-danger">
          {error}
        </Panel>
      )}

      {showForm && (
        <Panel elevated className="animate-fade-up">
          <form onSubmit={handleDelegate} className="space-y-4">
            <h3 className="font-display text-sm font-semibold text-foam">
              Delegate to Cursor agent
            </h3>
            <p className="text-xs text-mist">
              Always creates a new branch and PR. Merge conflict jobs resolve
              conflicts without force-push.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Job type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                options={[
                  { value: "feature", label: "Feature (new PR)" },
                  { value: "bugfix", label: "Bug fix" },
                  { value: "refactor", label: "Refactor" },
                  { value: "merge_conflict", label: "Merge conflict" },
                  { value: "issue", label: "Issue" },
                  { value: "pr", label: "PR review" },
                ]}
              />
              <Select
                label="Repository"
                value={form.repo}
                onChange={(e) => setForm({ ...form, repo: e.target.value })}
                options={repos.map((r) => ({
                  value: r.url,
                  label: r.name,
                }))}
              />
            </div>
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Short task title"
              required
            />
            <Textarea
              label="Prompt"
              value={form.prompt}
              onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              placeholder="Detailed instructions for the agent…"
              rows={5}
              required
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting || !form.repo}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Delegate"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Panel>
      )}

      {jobs.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="No agent jobs"
          description="Delegate a task to a Cursor cloud agent to automate development work."
          action={
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />
              Delegate task
            </Button>
          }
        />
      ) : (
        <Panel className="overflow-x-auto p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[rgba(122,154,171,0.15)] text-mist uppercase tracking-wide">
                <th className="text-left p-2 font-medium">Title</th>
                <th className="text-left p-2 font-medium">Type</th>
                <th className="text-left p-2 font-medium">Repo</th>
                <th className="text-left p-2 font-medium">Actor</th>
                <th className="text-left p-2 font-medium">Status</th>
                <th className="text-left p-2 font-medium">When</th>
                <th className="text-left p-2 font-medium">PR</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr
                  key={job.id}
                  className="border-b border-[rgba(122,154,171,0.08)] hover:bg-[rgba(122,154,171,0.04)]"
                >
                  <td className="p-2 text-foam font-medium max-w-[200px] truncate">
                    {job.title}
                  </td>
                  <td className="p-2 text-mist">{job.type}</td>
                  <td className="p-2 text-mist font-mono truncate max-w-[120px]">
                    {job.repo ?? "—"}
                  </td>
                  <td className="p-2 text-mist">{job.actor?.name ?? "—"}</td>
                  <td className="p-2">
                    <Badge variant={statusVariant[job.status] ?? "default"}>
                      {job.status}
                    </Badge>
                  </td>
                  <td className="p-2 text-mist whitespace-nowrap">
                    {job.createdAt
                      ? formatDistanceToNow(new Date(job.createdAt), {
                          addSuffix: true,
                        })
                      : "—"}
                  </td>
                  <td className="p-2">
                    {job.url ? (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-bright hover:underline inline-flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Link
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}
