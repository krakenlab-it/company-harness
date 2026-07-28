"use client";

import { formatDistanceToNow } from "date-fns";
import {
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  GitPullRequestClosed,
  Loader2,
  RefreshCw,
  Workflow,
  XCircle,
} from "lucide-react";
import type {
  GitHubActivityEvent,
  GitHubActivityFeed,
  GitHubActivityKind,
} from "@/lib/github/activity-types";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const KIND_META: Record<
  GitHubActivityKind,
  {
    label: string;
    icon: typeof GitCommit;
    tone: "default" | "ok" | "warn" | "danger" | "teal";
  }
> = {
  commit: { label: "Commit", icon: GitCommit, tone: "default" },
  pr_opened: { label: "PR opened", icon: GitPullRequest, tone: "teal" },
  pr_closed: { label: "PR closed", icon: GitPullRequestClosed, tone: "warn" },
  pr_merged: { label: "PR merged", icon: GitMerge, tone: "ok" },
  workflow_success: { label: "Actions · passed", icon: Workflow, tone: "ok" },
  workflow_failure: { label: "Actions · failed", icon: XCircle, tone: "danger" },
  workflow_cancelled: {
    label: "Actions · cancelled",
    icon: Workflow,
    tone: "warn",
  },
};

interface GitActivityGraphProps {
  feed: GitHubActivityFeed | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function GitActivityGraph({
  feed,
  loading,
  error,
  onRefresh,
  refreshing,
}: GitActivityGraphProps) {
  if (loading) {
    return (
      <Panel className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-teal-bright" />
        <span className="ml-2 text-sm text-mist">Loading git activity…</span>
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel className="text-sm text-danger">
        {error}
      </Panel>
    );
  }

  if (!feed) return null;

  return (
    <Panel padding="none" className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-foam">Git activity</h2>
          <p className="text-xs text-mist mt-0.5">
            Commits, pull requests, and GitHub Actions on{" "}
            <span className="font-mono text-foam/80">{feed.repoFullName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={feed.source === "github" ? "ok" : "warn"}>
            {feed.source === "github" ? "Live from GitHub" : "Demo timeline"}
          </Badge>
          {onRefresh && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onRefresh}
              disabled={refreshing}
              aria-label="Refresh git activity"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
              />
            </Button>
          )}
        </div>
      </div>

      <div className="relative px-4 py-2 max-h-[420px] overflow-y-auto">
        <div
          className="absolute left-[1.65rem] top-4 bottom-4 w-px bg-[var(--border-subtle)]"
          aria-hidden
        />
        <ul className="space-y-0">
          {feed.events.map((event, index) => (
            <ActivityRow key={event.id} event={event} isLast={index === feed.events.length - 1} />
          ))}
          {feed.events.length === 0 && (
            <li className="py-8 text-center text-sm text-mist">
              No recent activity found for this repo.
            </li>
          )}
        </ul>
      </div>

      <p className="border-t border-[var(--border-subtle)] px-4 py-2 text-[10px] text-sand">
        Updated {formatDistanceToNow(new Date(feed.fetchedAt), { addSuffix: true })}
        {feed.source === "demo" && (
          <> · Set <code className="text-foam">GITHUB_TOKEN</code> for live data</>
        )}
      </p>
    </Panel>
  );
}

function ActivityRow({
  event,
  isLast,
}: {
  event: GitHubActivityEvent;
  isLast: boolean;
}) {
  const meta = KIND_META[event.kind];
  const Icon = meta.icon;

  const content = (
    <>
      <div
        className={cn(
          "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-[var(--surface)]",
          meta.tone === "ok" && "border-emerald-500/40 text-emerald-600",
          meta.tone === "danger" && "border-red-500/40 text-red-600",
          meta.tone === "warn" && "border-amber-500/40 text-amber-600",
          meta.tone === "teal" && "border-teal-bright/40 text-teal-bright",
          meta.tone === "default" && "border-[var(--border)] text-mist",
        )}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </div>
      <div className={cn("min-w-0 flex-1 pb-4", isLast && "pb-2")}>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <Badge variant={meta.tone === "default" ? "default" : meta.tone}>
            {meta.label}
          </Badge>
          {event.sha && (
            <code className="text-[10px] font-mono text-sand">{event.sha}</code>
          )}
          {event.branch && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-sand font-mono">
              <GitBranch className="h-3 w-3" />
              {event.branch}
            </span>
          )}
          <time
            className="text-[10px] text-sand ml-auto shrink-0"
            dateTime={event.occurredAt}
          >
            {formatDistanceToNow(new Date(event.occurredAt), { addSuffix: true })}
          </time>
        </div>
        <p className="mt-1 text-sm text-foam font-medium leading-snug line-clamp-2">
          {event.title}
        </p>
        {(event.subtitle || event.actor) && (
          <p className="mt-0.5 text-xs text-mist">
            {[event.subtitle, event.actor ? `@${event.actor}` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </div>
    </>
  );

  return (
    <li className="flex gap-3 pt-3">
      {event.url ? (
        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex gap-3 min-w-0 flex-1 hover:opacity-90 transition-opacity"
        >
          {content}
        </a>
      ) : (
        <div className="flex gap-3 min-w-0 flex-1">{content}</div>
      )}
    </li>
  );
}
