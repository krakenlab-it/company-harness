"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, Scan } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorPanel } from "@/components/ui/error-panel";

export default function RepoDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<{
    repo: { id: string; name: string; url: string };
    stack: Array<{ name: string; version?: string; status: string; critical: boolean }>;
    project?: { id: string; name: string };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/repos/${params.id}`);
      if (!res.ok) throw new Error("Repo not found");
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (params.id) load();
  }, [params.id]);

  async function scanStack() {
    setScanning(true);
    try {
      const res = await fetch(`/api/repos/${params.id}`, { method: "POST" });
      if (!res.ok) throw new Error("Scan failed");
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-teal-bright" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <>
        <Topbar title="Repo" />
        <div className="p-6">
          <ErrorPanel message={error ?? "Not found"} />
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar
        title={data.repo.name}
        description={data.repo.url}
        actions={
          <Button size="sm" variant="outline" onClick={scanStack} disabled={scanning}>
            {scanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Scan className="h-4 w-4 mr-1" />
                Scan stack
              </>
            )}
          </Button>
        }
      />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {data.project && (
          <p className="text-sm text-mist">
            Linked project:{" "}
            <Link
              href={`/projects/${data.project.id}`}
              className="text-teal-bright hover:underline"
            >
              {data.project.name}
            </Link>
          </p>
        )}
        <Panel className="overflow-x-auto p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-mist uppercase tracking-wide border-b border-[rgba(122,154,171,0.15)]">
                <th className="text-left p-2">Package</th>
                <th className="text-left p-2">Version</th>
                <th className="text-left p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.stack.map((dep) => (
                <tr key={dep.name} className="border-b border-[rgba(122,154,171,0.08)]">
                  <td className="p-2 text-foam font-medium">
                    {dep.name}
                    {dep.critical && (
                      <Badge variant="warn" className="ml-1">
                        critical
                      </Badge>
                    )}
                  </td>
                  <td className="p-2 text-mist font-mono">{dep.version ?? "—"}</td>
                  <td className="p-2">
                    <Badge>{dep.status}</Badge>
                  </td>
                </tr>
              ))}
              {data.stack.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-4 text-mist text-center">
                    No stack scanned yet — run Scan stack
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Panel>
      </div>
    </>
  );
}
