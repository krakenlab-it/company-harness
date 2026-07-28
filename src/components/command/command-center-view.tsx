"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { RepoSelector } from "@/components/layout/repo-selector";
import { DenseStat } from "@/components/ui/dense-stat";
import { PageLoader } from "@/components/ui/page-loader";
import { ErrorPanel } from "@/components/ui/error-panel";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { ConnectorStrip } from "@/components/command/connector-strip";
import { formatUsd } from "@/lib/utils";

interface CommandCenterData {
  stats: {
    repos: number;
    openTickets: number;
    activeAgents: number;
    spendUsd: number;
    stackHealthPct: number;
  };
  rows: Array<{
    repo: { id: string; name: string; url: string };
    project?: { id: string; name: string; slug: string };
    stackCount: number;
    stackHealthPct: number | null;
    openTickets: number;
    activeAgents: number;
    spendUsd: number;
    health: string;
  }>;
  connectors: Array<{ provider: string; configured: boolean }>;
  recentActivity: Array<{ summary: string; createdAt: string }>;
  agentJobs: Array<{
    id: string;
    title: string;
    status: string;
    repo?: string;
    prUrl?: string;
    type: string;
  }>;
  canDelegate: boolean;
}

function CommandCenterContent() {
  const searchParams = useSearchParams();
  const repoFilter = searchParams.get("repo") ?? "";
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = repoFilter ? `?repo=${encodeURIComponent(repoFilter)}` : "";
      const res = await fetch(`/api/command-center${qs}`);
      if (!res.ok) throw new Error("Failed to load command center");
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [repoFilter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Topbar
        mission="01 · Observe"
        title="Command Center"
        description="Entity-level telemetry across repos, stack, tickets, agents, and spend."
        actions={
          <div className="flex items-center gap-2">
            <Suspense fallback={null}>
              <RepoSelector />
            </Suspense>
            <button
              type="button"
              onClick={load}
              className="btn btn-ghost btn-sm"
              aria-label="Refresh command center"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-[var(--canvas)]">
        {loading && <PageLoader />}
        {error && <ErrorPanel message={error} />}

        {data && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              <DenseStat label="Entities" value={data.stats.repos} />
              <DenseStat
                label="Open tickets"
                value={data.stats.openTickets}
                alert={data.stats.openTickets > 10 ? "warn" : undefined}
              />
              <DenseStat
                label="Active agents"
                value={data.stats.activeAgents}
                alert={data.stats.activeAgents > 0 ? "ok" : undefined}
              />
              <DenseStat label="Spend MTD" value={formatUsd(data.stats.spendUsd)} />
              <DenseStat
                label="Stack health"
                value={`${Math.round(data.stats.stackHealthPct)}%`}
                alert={
                  data.stats.stackHealthPct < 80
                    ? "warn"
                    : data.stats.stackHealthPct >= 90
                      ? "ok"
                      : undefined
                }
              />
            </div>

            <ConnectorStrip connectors={data.connectors} />

            <Panel className="overflow-x-auto p-0">
              <table className="data-table w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left p-2 pl-3">Entity</th>
                    <th className="text-left p-2">Stack</th>
                    <th className="text-right p-2">TKT</th>
                    <th className="text-right p-2">AGT</th>
                    <th className="text-right p-2">Spend</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-right p-2 pr-3">Loop</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr
                      key={row.repo.id}
                      className="border-b border-[var(--border-subtle)]"
                    >
                      <td className="p-2 pl-3">
                        <Link
                          href={`/repos/${row.repo.id}`}
                          className="text-foam font-medium hover:text-teal-bright font-mono text-[11px]"
                        >
                          {row.repo.name}
                        </Link>
                        {row.project && (
                          <span className="block text-[10px] text-mist truncate mt-0.5">
                            {row.project.name}
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-mist font-mono text-[11px]">
                        {row.stackCount}
                        {row.stackHealthPct != null && (
                          <span className="text-foam ml-1">
                            · {row.stackHealthPct}%
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-right font-mono text-[11px] text-foam">
                        {row.openTickets}
                      </td>
                      <td className="p-2 text-right font-mono text-[11px] text-foam">
                        {row.activeAgents || "—"}
                      </td>
                      <td className="p-2 text-right font-mono text-[11px] text-foam">
                        {formatUsd(row.spendUsd)}
                      </td>
                      <td className="p-2">
                        <Badge
                          variant={
                            row.health === "ok"
                              ? "ok"
                              : row.health === "warn"
                                ? "warn"
                                : "default"
                          }
                        >
                          {row.health}
                        </Badge>
                      </td>
                      <td className="p-2 pr-3 text-right whitespace-nowrap">
                        <Link
                          href={`/hermes?repo=${encodeURIComponent(row.repo.name)}`}
                          className="action-link mr-2"
                        >
                          Intel
                        </Link>
                        {data.canDelegate && (
                          <Link
                            href={`/agents?repo=${encodeURIComponent(row.repo.url)}`}
                            className="action-link"
                          >
                            Act
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>

            <div className="grid lg:grid-cols-2 gap-3">
              <Panel className="p-0 overflow-hidden">
                <div className="px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--surface-muted)]">
                  <h2 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-sand">
                    Mission queue
                  </h2>
                </div>
                <ul className="px-3 py-1 max-h-48 overflow-y-auto">
                  {data.agentJobs.slice(0, 8).map((j) => (
                    <li key={j.id} className="audit-line">
                      <span className="font-mono text-sand uppercase shrink-0 w-16">
                        {j.status}
                      </span>
                      <span className="truncate text-foam flex-1">{j.title}</span>
                      {j.repo && (
                        <span className="font-mono text-sand shrink-0 hidden sm:inline">
                          {j.repo.split("/").pop()}
                        </span>
                      )}
                    </li>
                  ))}
                  {data.agentJobs.length === 0 && (
                    <li className="py-3 text-mist text-xs">No active missions</li>
                  )}
                </ul>
                {data.canDelegate && (
                  <div className="px-3 py-2 border-t border-[var(--border-subtle)]">
                    <Link href="/agents" className="action-link">
                      Open Act panel →
                    </Link>
                  </div>
                )}
              </Panel>

              <Panel className="p-0 overflow-hidden">
                <div className="px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--surface-muted)]">
                  <h2 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-sand">
                    Audit trail
                  </h2>
                </div>
                <ul className="px-3 py-1 max-h-48 overflow-y-auto">
                  {data.recentActivity.map((a, i) => (
                    <li key={i} className="audit-line">
                      <time className="shrink-0">
                        {a.createdAt
                          ? new Date(a.createdAt).toISOString().slice(11, 16)
                          : "—"}
                      </time>
                      <span className="truncate text-mist">{a.summary}</span>
                    </li>
                  ))}
                  {data.recentActivity.length === 0 && (
                    <li className="py-3 text-mist text-xs">No recent events</li>
                  )}
                </ul>
                <div className="px-3 py-2 border-t border-[var(--border-subtle)]">
                  <Link href="/work?tab=tickets" className="action-link">
                    Full audit log →
                  </Link>
                </div>
              </Panel>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export function CommandCenterView() {
  return (
    <Suspense fallback={<PageLoader />}>
      <CommandCenterContent />
    </Suspense>
  );
}
