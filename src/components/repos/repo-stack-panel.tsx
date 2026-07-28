"use client";

import { Scan } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/help-tip";

interface StackDependency {
  name: string;
  version?: string;
  status: string;
  critical: boolean;
}

interface RepoStackPanelProps {
  stack: StackDependency[];
  scanning: boolean;
  onScan: () => void;
}

const STATUS_LABEL: Record<string, { label: string; variant: "ok" | "warn" | "default" | "danger" }> = {
  healthy: { label: "Up to date", variant: "ok" },
  outdated: { label: "Update available", variant: "warn" },
  deprecated: { label: "Needs attention", variant: "danger" },
  unknown: { label: "Unknown", variant: "default" },
};

export function RepoStackPanel({ stack, scanning, onScan }: RepoStackPanelProps) {
  return (
    <Panel padding="none" className="overflow-hidden">
      <div className="border-b border-[var(--border-subtle)] px-4 py-4 sm:px-5">
        <SectionHeader
          title="Technology in this repo"
          description="Main libraries and services detected from the project file on GitHub. Useful for spotting outdated or critical dependencies."
          glossary="stackScan"
          action={
            <Button size="sm" variant="outline" onClick={onScan} disabled={scanning}>
              <Scan className="h-4 w-4 mr-1.5" />
              {scanning ? "Scanning…" : "Refresh list"}
            </Button>
          }
        />
      </div>

      {stack.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm font-medium text-foam">No technology list yet</p>
          <p className="text-xs text-mist mt-2 max-w-md mx-auto leading-relaxed">
            Click <strong className="text-foam font-medium">Refresh list</strong> to
            pull the dependency file from GitHub. This helps developers see what
            powers the app — you can skip this unless something is marked critical.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-4"
            onClick={onScan}
            disabled={scanning}
          >
            Refresh list
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] text-sand uppercase tracking-wide border-b border-[var(--border-subtle)]">
                <th className="p-3 font-medium">Tool / library</th>
                <th className="p-3 font-medium">Version</th>
                <th className="p-3 font-medium">Health</th>
              </tr>
            </thead>
            <tbody>
              {stack.map((dep) => {
                const status = STATUS_LABEL[dep.status] ?? STATUS_LABEL.unknown;
                return (
                  <tr
                    key={dep.name}
                    className="border-b border-[var(--border-subtle)] last:border-0"
                  >
                    <td className="p-3 text-foam font-medium">
                      {dep.name}
                      {dep.critical && (
                        <Badge variant="warn" className="ml-2 text-[10px]">
                          Critical
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 text-mist font-mono text-xs">
                      {dep.version ?? "—"}
                    </td>
                    <td className="p-3">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
