"use client";

import { useEffect, useState } from "react";
import { Bot, ExternalLink, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
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
}

const statusVariant: Record<
  string,
  "default" | "teal" | "ok" | "warn" | "danger"
> = {
  pending: "default",
  running: "teal",
  completed: "ok",
  failed: "danger",
  cancelled: "warn",
};

export function AgentConsole() {
  const [jobs, setJobs] = useState<AgentJob[]>([]);
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
      const res = await fetch("/api/agents");
      if (!res.ok) throw new Error(`Failed to load agents (${res.status})`);
      const data = await res.json();
      setJobs(data.jobs ?? data.agents ?? data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load agents");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  async function handleDelegate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.prompt.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          title: form.title.trim(),
          prompt: form.prompt.trim(),
          repo: form.repo.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error(`Failed to delegate (${res.status})`);
      setForm({ type: "feature", title: "", prompt: "", repo: "" });
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
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                options={[
                  { value: "feature", label: "Feature" },
                  { value: "bugfix", label: "Bug fix" },
                  { value: "refactor", label: "Refactor" },
                  { value: "review", label: "Code review" },
                  { value: "research", label: "Research" },
                ]}
              />
              <Input
                label="Repository"
                value={form.repo}
                onChange={(e) => setForm({ ...form, repo: e.target.value })}
                placeholder="org/repo"
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
              <Button type="submit" disabled={submitting}>
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
        <div className="space-y-3">
          {jobs.map((job, i) => (
            <Panel
              key={job.id}
              className={cn(
                "transition-colors hover:border-teal/20",
                `animate-fade-up-delay-${Math.min(i + 1, 3)}`,
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-foam">{job.title}</h3>
                    <Badge variant={statusVariant[job.status] ?? "default"}>
                      {job.status}
                    </Badge>
                    <Badge variant="default">{job.type}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-mist">
                    {job.repo && <span>{job.repo}</span>}
                    {job.createdAt && (
                      <span>
                        {formatDistanceToNow(new Date(job.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    )}
                  </div>
                </div>
                {job.url && (
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm shrink-0"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View
                  </a>
                )}
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
