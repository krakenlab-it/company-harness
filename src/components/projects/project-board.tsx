"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderKanban, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  slug?: string;
  status: string;
  progress: number;
  goals?: string[];
  description?: string;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", goals: "" });

  async function loadProjects() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error(`Failed to load projects (${res.status})`);
      const data = await res.json();
      setProjects(data.projects ?? data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          goals: form.goals
            .split("\n")
            .map((g) => g.trim())
            .filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error(`Failed to create project (${res.status})`);
      setForm({ name: "", description: "", goals: "" });
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
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-mist">
          {projects.length} project{projects.length !== 1 ? "s" : ""}
        </p>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="h-4 w-4" />
          New project
        </Button>
      </div>

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
              <Button type="submit" disabled={submitting}>
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
          description="Create your first project to start tracking goals and progress."
          action={
            <Button size="sm" onClick={() => setShowForm(true)}>
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
                {project.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-mist">
                    {project.description}
                  </p>
                )}
                <div className="mt-4">
                  <Progress value={project.progress} label="Progress" />
                </div>
                {project.goals && project.goals.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {project.goals.slice(0, 3).map((goal) => (
                      <li
                        key={goal}
                        className="flex items-start gap-2 text-xs text-mist"
                      >
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-bright" />
                        {goal}
                      </li>
                    ))}
                    {project.goals.length > 3 && (
                      <li className="text-xs text-mist/60">
                        +{project.goals.length - 3} more
                      </li>
                    )}
                  </ul>
                )}
              </Panel>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
