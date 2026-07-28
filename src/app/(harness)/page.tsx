"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Bot,
  DollarSign,
  FolderKanban,
  Layers,
  Loader2,
  MessageSquare,
  Ticket,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Panel } from "@/components/ui/panel";
import { Stat } from "@/components/ui/stat";
import { Badge } from "@/components/ui/badge";
import { formatUsd, formatDate } from "@/lib/utils";

interface DashboardData {
  stats: {
    projectsActive: number;
    openTickets: number;
    agentJobs: number;
    costSpendUsd: number;
    costBudgetUsd: number;
    costUtilizationPct: number;
    stackHealthPct: number;
    stackTotal: number;
  };
  recentActivity: Array<{
    id: string;
    summary: string;
    action: string;
    createdAt: string;
  }>;
  activeProjects: Array<{
    id: string;
    name: string;
    slug: string;
    progress: number;
    status: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load dashboard");
        return res.json();
      })
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      )
      .finally(() => setLoading(false));
  }, []);

  const spendChangeType =
    (data?.stats.costUtilizationPct ?? 0) > 100
      ? "negative"
      : (data?.stats.costUtilizationPct ?? 0) > 80
        ? "neutral"
        : "positive";

  return (
    <>
      <Topbar
        title="Dashboard"
        description="KrakenLab Media operations at a glance — projects, tickets, agents, and spend."
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-teal-bright" />
          </div>
        )}

        {error && (
          <Panel className="border-danger/30 bg-danger/5 text-sm text-danger">
            {error}
          </Panel>
        )}

        {data && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 animate-fade-up">
              <Panel>
                <Stat
                  label="Active projects"
                  value={data.stats.projectsActive}
                  icon={FolderKanban}
                />
              </Panel>
              <Panel>
                <Stat
                  label="Open tickets"
                  value={data.stats.openTickets}
                  icon={Ticket}
                />
              </Panel>
              <Panel>
                <Stat
                  label="Agent jobs"
                  value={data.stats.agentJobs}
                  icon={Bot}
                />
              </Panel>
              <Panel>
                <Stat
                  label="Monthly spend"
                  value={formatUsd(data.stats.costSpendUsd)}
                  change={
                    data.stats.costBudgetUsd > 0
                      ? `${data.stats.costUtilizationPct}% of ${formatUsd(data.stats.costBudgetUsd)} budget`
                      : undefined
                  }
                  changeType={spendChangeType}
                  icon={DollarSign}
                />
              </Panel>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <section className="lg:col-span-2 space-y-4 animate-fade-up-delay-1">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-mist flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Recent activity
                  </h2>
                </div>
                <Panel padding="none" className="overflow-hidden">
                  {data.recentActivity.length === 0 ? (
                    <p className="p-4 text-sm text-mist">No recent activity.</p>
                  ) : (
                    <ul className="divide-y divide-[rgba(122,154,171,0.08)]">
                      {data.recentActivity.map((event) => (
                        <li
                          key={event.id}
                          className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-[rgba(122,154,171,0.04)]"
                        >
                          <div className="min-w-0">
                            <p className="text-sm text-foam">{event.summary}</p>
                            <p className="text-xs text-mist/70 mt-0.5">
                              {event.action}
                            </p>
                          </div>
                          <time className="shrink-0 text-xs text-mist tabular-nums">
                            {formatDate(event.createdAt)}
                          </time>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
              </section>

              <section className="space-y-4 animate-fade-up-delay-2">
                <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-mist">
                  Quick links
                </h2>
                <div className="space-y-3">
                  <Link href="/hermes" className="block group">
                    <Panel className="transition-colors hover:border-teal/30">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal/20">
                          <MessageSquare className="h-4 w-4 text-teal-bright" />
                        </div>
                        <div>
                          <p className="font-medium text-foam group-hover:text-teal-bright transition-colors">
                            Ask Hermes
                          </p>
                          <p className="text-xs text-mist">
                            Projects, costs, CRM & more
                          </p>
                        </div>
                      </div>
                    </Panel>
                  </Link>
                  <Link href="/stack" className="block group">
                    <Panel className="transition-colors hover:border-teal/30">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal/20">
                          <Layers className="h-4 w-4 text-teal-bright" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foam group-hover:text-teal-bright transition-colors">
                            Stack health
                          </p>
                          <p className="text-xs text-mist">
                            {data.stats.stackTotal} dependencies tracked
                          </p>
                        </div>
                        <Badge
                          variant={
                            data.stats.stackHealthPct >= 80 ? "ok" : "warn"
                          }
                        >
                          {data.stats.stackHealthPct}%
                        </Badge>
                      </div>
                    </Panel>
                  </Link>
                </div>

                {data.activeProjects.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-mist/80">
                      Active projects
                    </h3>
                    {data.activeProjects.slice(0, 3).map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.slug}`}
                        className="block"
                      >
                        <Panel padding="sm" className="hover:border-teal/25">
                          <p className="text-sm font-medium text-foam">
                            {project.name}
                          </p>
                          <p className="text-xs text-mist mt-0.5">
                            {project.progress}% complete
                          </p>
                        </Panel>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </>
  );
}
