"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, FolderKanban, GitBranch, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { HelpTip } from "@/components/ui/help-tip";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  slug?: string;
  status: string;
  progress: number;
  goals?: string[];
  description?: string;
  repo?: { id: string; name: string; url: string } | null;
}

interface RepoOption {
  id: string;
  name: string;
  url: string;
}

const statusVariant: Record<
  string,
  "default" | "teal" | "ok" | "warn" | "danger"
> = {
  active: "teal",
  planning: "default",
  paused: "warn",
  completed: "ok",
  archived: "default",
};

export function ProjectBoard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [repos, setRepos] = useState<RepoOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    goals: "",
    repoId: "",
  });

  async function loadProjects() {
    setLoading(true);
    setError(null);
    try {
      const [projectsRes, reposRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/access/repos"),
      ]);
      if (!projectsRes.ok) {
        throw new Error(`Failed to load projects (${projectsRes.status})`);
      }
      const data = await projectsRes.json();
      setProjects(data.projects ?? data ?? []);

      if (reposRes.ok) {
        const repoData = await reposRes.json();
        const list = (repoData.repos ?? []).map(
          (r: { id: string; name: string; url: string }) => ({
            id: r.id,
            name: r.name,
            url: r.url,
          }),
        );
        setRepos(list);
        if (list[0] && !form.repoId) {
          setForm((f) => ({ ...f, repoId: list[0].id }));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.repoId) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          repoId: form.repoId,
          goals: form.goals
            .split("\n")
            .map((g) => g.trim())
            .filter(Boolean),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error ?? `Failed to create project (${res.status})`);
      }
      setForm({ name: "", description: "", goals: "", repoId: repos[0]?.id ?? "" });
      setShowForm(false);
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
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
      <Panel className="p-4 bg-[var(--surface-muted)]/40 border-dashed">
        <p className="text-sm text-mist leading-relaxed">
          Every project is tied to one GitHub repository. Sprints and tickets live
          under that project — pick a repo first, then plan sprints on the project
          page.
          <HelpTip glossary="repository" size="sm" />
        </p>
      </Panel>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-mist">
          {projects.length} project{projects.length !== 1 ? "s" : ""}
        </p>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowForm(!showForm)}
          disabled={repos.length === 0}
        >
          <Plus className="h-4 w-4" />
          New project
        </Button>
      </div>

      {repos.length === 0 && (
        <Panel className="text-sm text-warn">
          No repositories available. An admin must add repos under Team & Access
          before you can create a project.
        </Panel>
      )}

      {error && (
        <Panel className="border-danger/30 bg-danger/5 text-sm text-danger">
          {error}
        </Panel>
      )}

      {showForm && (
        <Panel className="animate-fade-up">
          <form onSubmit={handleCreate} className="space-y-4">
            <h3 className="font-display text-sm font-semibold text-foam">
              Create project
            </h3>
            <Select
              label="GitHub repository (required)"
              value={form.repoId}
              onChange={(e) => setForm({ ...form, repoId: e.target.value })}
              options={repos.map((r) => ({ value: r.id, label: r.name }))}
              required
            />
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Project name"
              required
            />
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Brief description"
              rows={2}
            />
            <Textarea
              label="Goals (one per line)"
              value={form.goals}
              onChange={(e) => setForm({ ...form, goals: e.target.value })}
              placeholder="Launch MVP&#10;Reach 100 users"
              rows={3}
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting || !form.repoId}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Create"
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

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create a project linked to a repository to start tracking sprints and tickets."
          action={
            <Button size="sm" onClick={() => setShowForm(true)} disabled={repos.length === 0}>
              <Plus className="h-4 w-4" />
              Create project
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => (
            <Link
              key={project.id}
              href={`/projects/${project.slug ?? project.id}`}
              className={cn("group block", `animate-fade-up-delay-${Math.min(i + 1, 3)}`)}
            >
              <Panel className="h-full transition-colors hover:border-teal/30">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-semibold text-foam group-hover:text-teal-bright transition-colors">
                    {project.name}
                  </h3>
                  <Badge variant={statusVariant[project.status] ?? "default"}>
                    {project.status}
                  </Badge>
                </div>
                {project.repo && (
                  <p className="mt-2 inline-flex items-center gap-1 text-xs text-mist">
                    <GitBranch className="h-3 w-3 shrink-0" />
                    {project.repo.name}
                  </p>
                )}
                {project.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-mist">
                    {project.description}
                  </p>
                )}
                <div className="mt-4">
                  <Progress value={project.progress} label="Progress" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-[11px] text-teal-bright group-hover:underline">
                    Open project →
                  </span>
                  {project.repo && (
                    <a
                      href={`/repos/${project.repo.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[11px] text-mist hover:text-foam inline-flex items-center gap-0.5"
                    >
                      Repo activity
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </Panel>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
