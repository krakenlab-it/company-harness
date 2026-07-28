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
        title="Command Center"
        description="Multi-repo visibility — stack, tickets, agents, and spend."
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
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {loading && <PageLoader />}
        {error && <ErrorPanel message={error} />}

        {data && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              <DenseStat label="Repos" value={data.stats.repos} />
              <DenseStat label="Open tickets" value={data.stats.openTickets} />
              <DenseStat label="Agents" value={data.stats.activeAgents} />
              <DenseStat label="Spend" value={formatUsd(data.stats.spendUsd)} />
              <DenseStat
                label="Stack"
                value={`${Math.round(data.stats.stackHealthPct)}%`}
              />
            </div>

            <ConnectorStrip connectors={data.connectors} />

            <Panel className="overflow-x-auto p-0">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[rgba(122,154,171,0.15)] text-mist uppercase tracking-wide">
                    <th className="text-left p-2 font-medium">Repo</th>
                    <th className="text-left p-2 font-medium">Stack</th>
                    <th className="text-right p-2 font-medium">Tickets</th>
                    <th className="text-right p-2 font-medium">Agents</th>
                    <th className="text-right p-2 font-medium">Spend</th>
                    <th className="text-left p-2 font-medium">Health</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr
                      key={row.repo.id}
                      className="border-b border-[rgba(122,154,171,0.08)] hover:bg-[rgba(122,154,171,0.04)]"
                    >
                      <td className="p-2">
                        <Link
                          href={`/repos/${row.repo.id}`}
                          className="text-teal-bright hover:underline font-medium"
                        >
                          {row.repo.name}
                        </Link>
                        {row.project && (
                          <span className="block text-[10px] text-mist truncate">
                            {row.project.name}
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-mist tabular-nums">
                        {row.stackCount} deps
                        {row.stackHealthPct != null && (
                          <span className="text-foam ml-1">
                            ({row.stackHealthPct}%)
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-right tabular-nums text-foam">
                        {row.openTickets}
                      </td>
                      <td className="p-2 text-right tabular-nums text-foam">
                        {row.activeAgents || "—"}
                      </td>
                      <td className="p-2 text-right tabular-nums text-foam">
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>

            <div className="grid lg:grid-cols-2 gap-4">
              <Panel className="p-3">
                <h2 className="text-xs uppercase tracking-wide text-mist mb-2">
                  Active agent jobs
                </h2>
                <ul className="space-y-1 text-xs">
                  {data.agentJobs.slice(0, 6).map((j) => (
                    <li key={j.id} className="flex justify-between gap-2">
                      <span className="truncate text-foam">{j.title}</span>
                      <span className="text-mist shrink-0">{j.status}</span>
                    </li>
                  ))}
                  {data.agentJobs.length === 0 && (
                    <li className="text-mist">No agent jobs</li>
                  )}
                </ul>
                {data.canDelegate && (
                  <Link href="/agents" className="text-xs text-teal-bright mt-2 inline-block hover:underline">
                    Delegate via Agents →
                  </Link>
                )}
              </Panel>
              <Panel className="p-3">
                <h2 className="text-xs uppercase tracking-wide text-mist mb-2">
                  Recent activity
                </h2>
                <ul className="space-y-1 text-xs text-mist">
                  {data.recentActivity.map((a, i) => (
                    <li key={i} className="truncate">
                      {a.summary}
                    </li>
                  ))}
                </ul>
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
