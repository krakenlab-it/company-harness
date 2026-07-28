"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Shield } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";

const REPO_ACTIONS = [
  "read",
  "write",
  "agents",
  "deploy",
  "secrets",
] as const;

interface MemberRow {
  member: { id: string; name: string; email: string; role: string };
  repos: Array<{
    repo: { id: string; name: string };
    access: { actions: string[] } | null;
  }>;
}

export function AccessMatrix() {
  const [matrix, setMatrix] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/access/repos");
      if (!res.ok) throw new Error("Failed to load access matrix");
      const data = await res.json();
      if (!data.matrix) {
        setMatrix([]);
        return;
      }
      setMatrix(data.matrix);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleAction(
    memberId: string,
    repoId: string,
    action: string,
    current: string[],
  ) {
    const key = `${memberId}-${repoId}`;
    setSaving(key);
    const next = current.includes(action)
      ? current.filter((a) => a !== action)
      : [...current, action];

    try {
      const res = await fetch("/api/access/repos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, repoId, actions: next }),
      });
      if (!res.ok) throw new Error("Failed to save");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-teal-bright" />
      </div>
    );
  }

  if (matrix.length === 0) {
    return (
      <p className="text-sm text-mist">
        Repo access matrix is visible to admins only.
      </p>
    );
  }

  const repos = matrix[0]?.repos.map((r) => r.repo) ?? [];

  return (
    <section className="space-y-4">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-mist flex items-center gap-2">
        <Shield className="h-4 w-4" />
        Member access matrix
      </h2>
      {error && (
        <Panel className="border-danger/30 bg-danger/5 text-sm text-danger">
          {error}
        </Panel>
      )}
      <Panel className="overflow-x-auto p-0">
        <table className="w-full text-xs min-w-[640px]">
          <thead>
            <tr className="border-b border-[rgba(122,154,171,0.15)] text-mist uppercase tracking-wide">
              <th className="text-left p-2 font-medium sticky left-0 bg-ocean-subtle">
                Member
              </th>
              {repos.map((repo) => (
                <th
                  key={repo.id}
                  className="text-left p-2 font-medium font-mono"
                  title={repo.name}
                >
                  {repo.name.split("/").pop()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row) => (
              <tr
                key={row.member.id}
                className="border-b border-[rgba(122,154,171,0.08)]"
              >
                <td className="p-2 sticky left-0 bg-ocean-subtle">
                  <p className="font-medium text-foam">{row.member.name}</p>
                  <p className="text-[10px] text-mist truncate max-w-[140px]">
                    {row.member.email}
                  </p>
                  <span className="text-[10px] text-mist">{row.member.role}</span>
                </td>
                {row.repos.map(({ repo, access }) => {
                  const actions =
                    row.member.role === "admin"
                      ? REPO_ACTIONS
                      : (access?.actions ?? []);
                  const isAdmin = row.member.role === "admin";
                  const saveKey = `${row.member.id}-${repo.id}`;

                  return (
                    <td key={repo.id} className="p-2 align-top">
                      {isAdmin ? (
                        <span className="text-[10px] text-mist">all</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {REPO_ACTIONS.map((action) => {
                            const checked = actions.includes(action);
                            return (
                              <button
                                key={action}
                                type="button"
                                disabled={saving === saveKey}
                                onClick={() =>
                                  toggleAction(
                                    row.member.id,
                                    repo.id,
                                    action,
                                    access?.actions ?? [],
                                  )
                                }
                                className={cn(
                                  "rounded px-1.5 py-0.5 text-[10px] border transition-colors",
                                  checked
                                    ? "border-teal bg-teal/15 text-teal-bright"
                                    : "border-[rgba(122,154,171,0.2)] text-mist hover:text-foam",
                                )}
                                title={action}
                              >
                                {action.slice(0, 3)}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </section>
  );
}
