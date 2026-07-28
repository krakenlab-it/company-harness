"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { PageLoader } from "@/components/ui/page-loader";
import { ErrorPanel } from "@/components/ui/error-panel";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";

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
      <Topbar title="Repos" description="GitHub repositories you can access." />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading && <PageLoader />}
        {error && <ErrorPanel message={error} />}
        <Panel className="overflow-x-auto p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-mist uppercase border-b border-[rgba(122,154,171,0.15)]">
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">URL</th>
                <th className="text-left p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {repos.map((r) => (
                <tr key={r.id} className="border-b border-[rgba(122,154,171,0.08)]">
                  <td className="p-2">
                    <Link
                      href={`/repos/${r.id}`}
                      className="text-teal-bright hover:underline font-medium"
                    >
                      {r.name}
                    </Link>
                  </td>
                  <td className="p-2 text-mist truncate max-w-xs">{r.url}</td>
                  <td className="p-2">
                    <Badge variant={r.enabled ? "ok" : "default"}>
                      {r.enabled ? "enabled" : "disabled"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </>
  );
}
