"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
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
}

interface Sprint {
  id: string;
  name: string;
  goal: string;
  status: string;
  startDate: string;
  endDate: string;
}

interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
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
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;

    fetch(`/api/projects/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Project not found");
        return res.json();
      })
      .then((data) => {
        setProject(data.project);
        setSprints(data.sprints ?? []);
        setTickets(data.tickets ?? []);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      )
      .finally(() => setLoading(false));
  }, [params.id]);

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
            href="/projects"
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
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-mist hover:text-teal-bright transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All projects
        </Link>

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
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-mist">
            Sprints ({sprints.length})
          </h2>
          {sprints.length === 0 ? (
            <Panel>
              <p className="text-sm text-mist">No sprints for this project.</p>
            </Panel>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {sprints.map((sprint) => (
                <Panel key={sprint.id}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-foam">{sprint.name}</h3>
                    <Badge variant={statusVariant[sprint.status] ?? "default"}>
                      {sprint.status}
                    </Badge>
                  </div>
                  {sprint.goal && (
                    <p className="mt-1 text-sm text-mist">{sprint.goal}</p>
                  )}
                  <p className="mt-2 text-xs text-mist/70">
                    {formatDate(sprint.startDate)} → {formatDate(sprint.endDate)}
                  </p>
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
              Related tickets ({openTickets.length} open)
            </h2>
            <Link
              href="/tickets"
              className="text-xs text-teal-bright hover:underline"
            >
              View all tickets
            </Link>
          </div>
          {tickets.length === 0 ? (
            <Panel>
              <p className="text-sm text-mist">No tickets linked to this project.</p>
            </Panel>
          ) : (
            <Panel padding="none" className="overflow-hidden">
              <ul className="divide-y divide-[rgba(122,154,171,0.08)]">
                {tickets.map((ticket) => (
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
