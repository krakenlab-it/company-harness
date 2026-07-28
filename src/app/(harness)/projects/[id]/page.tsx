"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  GitBranch,
  Loader2,
  Plus,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/utils";
import { FeatureGantt } from "@/components/projects/feature-gantt";

interface ProjectDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: string;
  goals: string[];
  startDate: string;
  targetDate: string;
  progress: number;
  stack: string[];
  repo?: { id: string; name: string; url: string } | null;
}

interface Sprint {
  id: string;
  name: string;
  goal: string;
  status: string;
  startDate: string;
  endDate: string;
  ticketCount?: number;
  tickets?: Ticket[];
}

interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  sprintId?: string;
  startDate?: string;
  dueDate?: string;
  labels: string[];
}

const statusVariant: Record<
  string,
  "default" | "teal" | "ok" | "warn" | "danger"
> = {
  active: "teal",
  planning: "default",
  paused: "warn",
  shipped: "ok",
  planned: "default",
  completed: "ok",
};

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [backlog, setBacklog] = useState<Ticket[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSprintForm, setShowSprintForm] = useState(false);
  const [sprintSubmitting, setSprintSubmitting] = useState(false);
  const [sprintForm, setSprintForm] = useState({ name: "", goal: "" });

  async function loadProject() {
    if (!params.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${params.id}`);
      if (!res.ok) throw new Error("Project not found");
      const data = await res.json();
      setProject(data.project);
      setSprints(data.sprints ?? []);
      setBacklog(data.backlog ?? []);
      setTickets(data.tickets ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleCreateSprint(e: React.FormEvent) {
    e.preventDefault();
    if (!project || !sprintForm.name.trim()) return;
    setSprintSubmitting(true);
    try {
      const res = await fetch("/api/sprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          name: sprintForm.name.trim(),
          goal: sprintForm.goal.trim(),
          status: "planned",
        }),
      });
      if (!res.ok) throw new Error("Failed to create sprint");
      setSprintForm({ name: "", goal: "" });
      setShowSprintForm(false);
      await loadProject();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create sprint");
    } finally {
      setSprintSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-teal-bright" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <>
        <Topbar title="Project" />
        <div className="p-6">
          <Panel className="border-danger/30 bg-danger/5 text-sm text-danger">
            {error ?? "Project not found"}
          </Panel>
          <Link
            href="/work?tab=projects"
            className="mt-4 inline-flex items-center gap-2 text-sm text-teal-bright hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to projects
          </Link>
        </div>
      </>
    );
  }

  const openTickets = tickets.filter((t) => t.status !== "done");

  return (
    <>
      <Topbar
        title={project.name}
        description={project.description}
        actions={
          <Badge variant={statusVariant[project.status] ?? "default"}>
            {project.status}
          </Badge>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 animate-fade-up">
        <Link
          href="/work?tab=projects"
          className="inline-flex items-center gap-2 text-sm text-mist hover:text-teal-bright transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All projects
        </Link>

        {project.repo && (
          <Panel className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-sand">
                Linked repository
              </p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-foam font-medium">
                <GitBranch className="h-4 w-4 text-teal-bright" />
                {project.repo.name}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={project.repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline inline-flex items-center gap-1"
              >
                GitHub
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <Link
                href={`/repos/${project.repo.id}`}
                className="btn btn-sm btn-primary"
              >
                Repo activity
              </Link>
            </div>
          </Panel>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <Panel className="lg:col-span-2 space-y-4">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-mist">
              Goals
            </h2>
            {project.goals.length === 0 ? (
              <p className="text-sm text-mist">No goals defined yet.</p>
            ) : (
              <ul className="space-y-2">
                {project.goals.map((goal) => (
                  <li
                    key={goal}
                    className="flex items-start gap-2 text-sm text-foam"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-bright" />
                    {goal}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel className="space-y-4">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-mist">
              Timeline
            </h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-mist text-xs uppercase tracking-wide">
                  Start
                </dt>
                <dd className="text-foam font-medium mt-0.5">
                  {formatDate(project.startDate)}
                </dd>
              </div>
              <div>
                <dt className="text-mist text-xs uppercase tracking-wide">
                  Target
                </dt>
                <dd className="text-foam font-medium mt-0.5">
                  {formatDate(project.targetDate)}
                </dd>
              </div>
            </dl>
            <Progress value={project.progress} label="Overall progress" />
          </Panel>
        </div>

        {project.stack.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-mist">
              Stack
            </h2>
            <div className="flex flex-wrap gap-2">
              {project.stack.map((tech) => (
                <Badge key={tech} variant="teal">
                  {tech}
                </Badge>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-mist">
              Sprints ({sprints.length})
            </h2>
            <Button size="sm" onClick={() => setShowSprintForm(!showSprintForm)}>
              <Plus className="h-4 w-4" />
              New sprint
            </Button>
          </div>

          {showSprintForm && (
            <Panel>
              <form onSubmit={handleCreateSprint} className="space-y-3">
                <Input
                  label="Sprint name"
                  value={sprintForm.name}
                  onChange={(e) =>
                    setSprintForm({ ...sprintForm, name: e.target.value })
                  }
                  required
                />
                <Textarea
                  label="Goal"
                  value={sprintForm.goal}
                  onChange={(e) =>
                    setSprintForm({ ...sprintForm, goal: e.target.value })
                  }
                  rows={2}
                />
                <Button type="submit" disabled={sprintSubmitting}>
                  {sprintSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Create sprint"
                  )}
                </Button>
              </form>
            </Panel>
          )}

          {sprints.length === 0 ? (
            <Panel>
              <p className="text-sm text-mist">
                No sprints yet — create one to group tickets for this project.
              </p>
            </Panel>
          ) : (
            <div className="space-y-4">
              {sprints.map((sprint) => (
                <Panel key={sprint.id} padding="none" className="overflow-hidden">
                  <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-foam">{sprint.name}</h3>
                      {sprint.goal && (
                        <p className="text-sm text-mist mt-0.5">{sprint.goal}</p>
                      )}
                      <p className="text-xs text-sand mt-1">
                        {formatDate(sprint.startDate)} → {formatDate(sprint.endDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant[sprint.status] ?? "default"}>
                        {sprint.status}
                      </Badge>
                      <Badge variant="default">
                        {sprint.ticketCount ?? sprint.tickets?.length ?? 0} tickets
                      </Badge>
                      <Link
                        href={`/work?tab=tickets&projectId=${project.id}&sprintId=${sprint.id}`}
                        className="text-xs text-teal-bright hover:underline"
                      >
                        Open board →
                      </Link>
                    </div>
                  </div>
                  {(sprint.tickets?.length ?? 0) > 0 ? (
                    <ul className="divide-y divide-[var(--border-subtle)]">
                      {sprint.tickets!.map((ticket) => (
                        <li
                          key={ticket.id}
                          className="flex items-center justify-between gap-3 px-4 py-2.5"
                        >
                          <span className="text-sm text-foam">{ticket.title}</span>
                          <Badge variant="teal">{ticket.status}</Badge>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-4 py-3 text-xs text-mist">
                      No tickets assigned — add from the ticket board.
                    </p>
                  )}
                </Panel>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-mist">
            Sprint timeline
          </h2>
          <Panel className="p-3">
            <FeatureGantt
              sprints={sprints.map((s) => ({
                id: s.id,
                name: s.name,
                startDate: s.startDate,
                endDate: s.endDate,
              }))}
              tickets={tickets.map((t) => ({
                id: t.id,
                title: t.title,
                status: t.status,
                startDate: t.startDate,
                dueDate: t.dueDate,
                labels: t.labels ?? [],
              }))}
            />
          </Panel>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-mist">
              Backlog ({backlog.length}) · {openTickets.length} open total
            </h2>
            <Link
              href={`/work?tab=tickets&projectId=${project.id}`}
              className="text-xs text-teal-bright hover:underline"
            >
              Ticket board →
            </Link>
          </div>
          {backlog.length === 0 ? (
            <Panel>
              <p className="text-sm text-mist">
                All tickets are assigned to sprints, or none created yet.
              </p>
            </Panel>
          ) : (
            <Panel padding="none" className="overflow-hidden">
              <ul className="divide-y divide-[rgba(122,154,171,0.08)]">
                {backlog.map((ticket) => (
                  <li
                    key={ticket.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <span className="text-sm text-foam">{ticket.title}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{ticket.priority}</Badge>
                      <Badge variant="teal">{ticket.status}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </section>
      </div>
    </>
  );
}
