"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, GitBranch } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { PageLoader } from "@/components/ui/page-loader";
import { ErrorPanel } from "@/components/ui/error-panel";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/ui/help-tip";

export default function ReposPage() {
  const [repos, setRepos] = useState<
    Array<{ id: string; name: string; url: string; enabled: boolean }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/access/repos")
      .then((r) => r.json())
      .then((d) => setRepos(d.repos ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Topbar
        mission="Observe"
        title="Repositories"
        description="Your team’s codebases on GitHub. Pick one to see recent activity, change requests, and health — no terminal required."
      />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 max-w-4xl">
        <Panel className="bg-[var(--surface-muted)]/40 border-dashed">
          <SectionHeader
            title="How to use this page"
            description="Each card is a GitHub repository. Open it to see a plain-language timeline of what changed, which pull requests are open or merged, and whether automated checks passed."
            glossary="github"
          />
        </Panel>

        {loading && <PageLoader label="Loading repositories…" />}
        {error && <ErrorPanel message={error} />}

        {!loading && !error && repos.length === 0 && (
          <Panel className="text-center py-12">
            <p className="text-sm font-medium text-foam">No repositories yet</p>
            <p className="text-xs text-mist mt-2 max-w-sm mx-auto leading-relaxed">
              An admin can sync GitHub from Connect or add repos under Team &amp; Access.
            </p>
          </Panel>
        )}

        <ul className="grid gap-3 sm:grid-cols-2">
          {repos.map((r) => {
            const shortName = r.name.includes("/")
              ? r.name.split("/").pop()!
              : r.name;
            return (
              <li key={r.id}>
                <Link
                  href={`/repos/${r.id}`}
                  className="group block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-teal-bright/30 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--canvas)] text-mist group-hover:text-teal-bright transition-colors">
                      <GitBranch className="h-4 w-4" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-sand group-hover:text-teal-bright shrink-0 mt-1 transition-colors" />
                  </div>
                  <p className="mt-3 font-semibold text-foam group-hover:text-teal-bright transition-colors">
                    {shortName}
                  </p>
                  <p className="text-xs text-mist mt-0.5 truncate">{r.name}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant={r.enabled ? "ok" : "default"}>
                      {r.enabled ? "Active" : "Inactive"}
                    </Badge>
                    <span className="text-[11px] text-sand">View activity →</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
