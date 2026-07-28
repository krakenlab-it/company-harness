"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface TrackedJob {
  id: string;
  title: string;
  status: string;
  type?: string;
  repo?: string;
  prUrl?: string;
  cursorAgentId?: string;
  resultSummary?: string;
  updatedAt?: string;
}

const statusVariant: Record<
  string,
  "default" | "teal" | "ok" | "warn" | "danger"
> = {
  queued: "default",
  running: "teal",
  completed: "ok",
  failed: "danger",
  cancelled: "warn",
};

export function CursorJobCard({
  job,
  compact = false,
}: {
  job: TrackedJob;
  compact?: boolean;
}) {
  const isActive = job.status === "running" || job.status === "queued";
  const dashboardUrl = job.cursorAgentId
    ? `https://cursor.com/agents?id=${job.cursorAgentId}`
    : null;

  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-xs",
        compact && "mt-2",
      )}
    >
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <Badge variant={statusVariant[job.status] ?? "default"}>
          {isActive && (
            <Loader2 className="h-3 w-3 animate-spin mr-1 inline" />
          )}
          {job.status}
        </Badge>
        {job.type && (
          <span className="text-mist font-mono uppercase">{job.type}</span>
        )}
      </div>
      <p className="font-medium text-foam">{job.title}</p>
      {job.repo && (
        <p className="text-mist font-mono mt-1 truncate">{job.repo}</p>
      )}
      {job.resultSummary && (
        <p className="text-mist mt-2 leading-relaxed">{job.resultSummary}</p>
      )}
      <div className="flex flex-wrap gap-3 mt-2">
        {job.prUrl && (
          <a
            href={job.prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="action-link inline-flex items-center gap-1"
          >
            Pull request
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {dashboardUrl && (
          <a
            href={dashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="action-link inline-flex items-center gap-1"
          >
            Cursor dashboard
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
        <a href="/agents" className="action-link">
          Mission control →
        </a>
      </div>
    </div>
  );
}
