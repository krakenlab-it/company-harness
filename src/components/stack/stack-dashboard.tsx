"use client";

import { useEffect, useState } from "react";
import { DollarSign, Layers, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { Input } from "@/components/ui/input";
import { Stat } from "@/components/ui/stat";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

interface StackDep {
  name: string;
  version?: string;
  category?: string;
  status?: string;
}

interface CostEntry {
  id?: string;
  provider: string;
  monthlyBudget: number;
  actualSpend: number;
  currency?: string;
}

export function StackDashboard() {
  const [deps, setDeps] = useState<StackDep[]>([]);
  const [costs, setCosts] = useState<CostEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [editedCosts, setEditedCosts] = useState<
    Record<string, { monthlyBudget: string; actualSpend: string }>
  >({});

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [stackRes, costsRes] = await Promise.all([
        fetch("/api/stack"),
        fetch("/api/costs"),
      ]);

      if (stackRes.ok) {
        const stackData = await stackRes.json();
        setDeps(stackData.dependencies ?? stackData.deps ?? stackData ?? []);
      }

      if (costsRes.ok) {
        const costsData = await costsRes.json();
        const entries: CostEntry[] =
          costsData.costs ?? costsData.providers ?? costsData ?? [];
        setCosts(entries);
        const edits: Record<
          string,
          { monthlyBudget: string; actualSpend: string }
        > = {};
        entries.forEach((c) => {
          edits[c.provider] = {
            monthlyBudget: String(c.monthlyBudget ?? 0),
            actualSpend: String(c.actualSpend ?? 0),
          };
        });
        setEditedCosts(edits);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function updateEdit(
    provider: string,
    field: "monthlyBudget" | "actualSpend",
    value: string,
  ) {
    setEditedCosts((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value,
      },
    }));
  }

  async function saveCost(entry: CostEntry) {
    const edits = editedCosts[entry.provider];
    if (!edits) return;

    setSaving(entry.provider);
    try {
      const body = {
        provider: entry.provider,
        monthlyBudget: parseFloat(edits.monthlyBudget) || 0,
        actualSpend: parseFloat(edits.actualSpend) || 0,
      };

      const method = entry.id ? "PATCH" : "POST";
      const res = await fetch("/api/costs", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry.id ? { id: entry.id, ...body } : body),
      });

      if (!res.ok) throw new Error(`Failed to save costs (${res.status})`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save costs");
    } finally {
      setSaving(null);
    }
  }

  const totalBudget = costs.reduce((s, c) => s + (c.monthlyBudget ?? 0), 0);
  const totalSpend = costs.reduce((s, c) => s + (c.actualSpend ?? 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-teal-bright" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-up">
      {error && (
        <Panel className="border-danger/30 bg-danger/5 text-sm text-danger">
          {error}
        </Panel>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Panel>
          <Stat label="Monthly budget" value={`$${totalBudget.toFixed(0)}`} icon={DollarSign} />
        </Panel>
        <Panel>
          <Stat
            label="Actual spend"
            value={`$${totalSpend.toFixed(0)}`}
            change={
              totalBudget > 0
                ? `${Math.round((totalSpend / totalBudget) * 100)}% of budget`
                : undefined
            }
            changeType={
              totalSpend > totalBudget
                ? "negative"
                : totalSpend > totalBudget * 0.8
                  ? "neutral"
                  : "positive"
            }
            icon={DollarSign}
          />
        </Panel>
        <Panel>
          <Stat
            label="Dependencies"
            value={deps.length}
            icon={Layers}
          />
        </Panel>
      </div>

      <section className="space-y-4">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-mist">
          Stack dependencies
        </h2>
        {deps.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No dependencies listed"
            description="Stack dependencies will appear here once configured."
          />
        ) : (
          <Panel padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(122,154,171,0.12)] text-left text-xs uppercase tracking-wide text-mist">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Version</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {deps.map((dep) => (
                    <tr
                      key={dep.name}
                      className="border-b border-[rgba(122,154,171,0.08)] last:border-0 hover:bg-[rgba(122,154,171,0.04)]"
                    >
                      <td className="px-4 py-3 font-medium text-foam">
                        {dep.name}
                      </td>
                      <td className="px-4 py-3 text-mist font-mono text-xs">
                        {dep.version ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-mist">
                        {dep.category ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {dep.status ? (
                          <Badge
                            variant={
                              dep.status === "active" ? "ok" : "default"
                            }
                          >
                            {dep.status}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-mist">
          Provider costs
        </h2>
        {costs.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title="No cost entries"
            description="Add provider cost tracking to monitor your monthly spend."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {costs.map((entry) => {
              const edits = editedCosts[entry.provider] ?? {
                monthlyBudget: "0",
                actualSpend: "0",
              };
              const budget = parseFloat(edits.monthlyBudget) || 0;
              const spend = parseFloat(edits.actualSpend) || 0;
              const overBudget = spend > budget && budget > 0;

              return (
                <Panel
                  key={entry.provider}
                  className={cn(overBudget && "border-warn/30")}
                >
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <h3 className="font-display font-semibold text-foam">
                      {entry.provider}
                    </h3>
                    {overBudget && <Badge variant="warn">Over budget</Badge>}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      label="Monthly budget"
                      type="number"
                      min="0"
                      step="0.01"
                      value={edits.monthlyBudget}
                      onChange={(e) =>
                        updateEdit(
                          entry.provider,
                          "monthlyBudget",
                          e.target.value,
                        )
                      }
                    />
                    <Input
                      label="Actual spend"
                      type="number"
                      min="0"
                      step="0.01"
                      value={edits.actualSpend}
                      onChange={(e) =>
                        updateEdit(
                          entry.provider,
                          "actualSpend",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => saveCost(entry)}
                    disabled={saving === entry.provider}
                  >
                    {saving === entry.provider ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save
                  </Button>
                </Panel>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
