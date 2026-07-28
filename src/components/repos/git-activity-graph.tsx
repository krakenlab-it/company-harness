"use client";

import { formatDistanceToNow } from "date-fns";
import {
  GitBranch,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type {
  GitHubActivityEvent,
  GitHubActivityFeed,
} from "@/lib/github/activity-types";
import { ACTIVITY_FRIENDLY } from "@/lib/github/activity-labels";
import { ACTIVITY_KIND_META } from "@/lib/github/activity-kind-meta";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HelpTip, SectionHeader } from "@/components/ui/help-tip";
import { cn } from "@/lib/utils";

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
        <span className="ml-2 text-sm text-mist">Loading recent GitHub activity…</span>
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel className="p-4">
        <p className="text-sm text-danger font-medium">Couldn&apos;t load activity</p>
        <p className="text-xs text-mist mt-1">{error}</p>
      </Panel>
    );
  }

  if (!feed) return null;

  const isLive = feed.source === "github";

  return (
    <Panel padding="none" className="overflow-hidden">
      <div className="border-b border-[var(--border-subtle)] px-4 py-4 sm:px-5">
        <SectionHeader
          title="What's happening on GitHub"
          description={
            isLive
              ? `Live updates from ${feed.repoFullName} — code changes, review requests, and automated check results.`
              : "You're viewing a sample timeline. Connect GitHub to see real activity for this repository."
          }
          glossary={isLive ? "github" : "demoTimeline"}
          action={
            <div className="flex items-center gap-2">
              <Badge variant={isLive ? "ok" : "warn"}>
                {isLive ? "Connected" : "Sample data"}
              </Badge>
              {onRefresh && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onRefresh}
                  disabled={refreshing}
                  aria-label="Refresh activity"
                >
                  <RefreshCw
                    className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
                  />
                </Button>
              )}
            </div>
          }
        />
        {!isLive && (
          <p className="mt-3 text-xs text-mist rounded-lg bg-[var(--surface-muted)] px-3 py-2 leading-relaxed">
            <strong className="text-foam font-medium">Tip for admins:</strong> add{" "}
            <code className="text-[11px] font-mono text-foam/90">GITHUB_TOKEN</code>{" "}
            in environment settings to replace this sample with live GitHub data.{" "}
            <a
              href="https://github.com/krakenlab-it/company-harness/blob/main/docs/GITHUB_PERMISSIONS.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-bright hover:underline"
            >
              Setup guide ↗
            </a>
          </p>
        )}
      </div>

      <div className="relative px-4 py-2 max-h-[440px] overflow-y-auto sm:px-5">
        <div
          className="absolute left-[1.85rem] top-4 bottom-4 w-px bg-[var(--border-subtle)]"
          aria-hidden
        />
        <ul className="space-y-0">
          {feed.events.map((event, index) => (
            <ActivityRow
              key={event.id}
              event={event}
              isLast={index === feed.events.length - 1}
            />
          ))}
          {feed.events.length === 0 && (
            <li className="py-10 text-center">
              <p className="text-sm text-foam font-medium">No recent activity</p>
              <p className="text-xs text-mist mt-1 max-w-sm mx-auto">
                When the team pushes code or opens change requests, they&apos;ll show up here.
              </p>
            </li>
          )}
        </ul>
      </div>

      <p className="border-t border-[var(--border-subtle)] px-4 py-2.5 text-[11px] text-sand sm:px-5">
        Last refreshed{" "}
        {formatDistanceToNow(new Date(feed.fetchedAt), { addSuffix: true })}
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
  const meta = ACTIVITY_KIND_META[event.kind];
  const friendly = ACTIVITY_FRIENDLY[event.kind];
  const Icon = meta.icon;

  const content = (
    <>
      <div
        className={cn(
          "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-[var(--surface)]",
          meta.tone === "ok" && "border-emerald-500/40 text-emerald-600",
          meta.tone === "danger" && "border-red-500/40 text-red-600",
          meta.tone === "warn" && "border-amber-500/40 text-amber-600",
          meta.tone === "teal" && "border-teal-bright/40 text-teal-bright",
          meta.tone === "default" && "border-[var(--border)] text-mist",
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className={cn("min-w-0 flex-1 pb-4", isLast && "pb-2")}>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Badge variant={meta.tone === "default" ? "default" : meta.tone}>
            {friendly.label}
          </Badge>
          <HelpTip
            label={friendly.label}
            short={friendly.hint}
            size="sm"
          />
          <time
            className="text-[11px] text-sand ml-auto shrink-0"
            dateTime={event.occurredAt}
          >
            {formatDistanceToNow(new Date(event.occurredAt), { addSuffix: true })}
          </time>
        </div>
        <p className="mt-1.5 text-sm text-foam font-medium leading-snug">
          {event.title}
        </p>
        {(event.subtitle || event.actor) && (
          <p className="mt-0.5 text-xs text-mist leading-relaxed">
            {humanizeSubtitle(event)}
          </p>
        )}
        {(event.branch || event.sha) && (
          <p className="mt-1 text-[10px] text-sand flex flex-wrap gap-x-2 gap-y-0.5">
            {event.branch && (
              <span className="inline-flex items-center gap-0.5">
                <GitBranch className="h-3 w-3" aria-hidden />
                {event.branch}
                <HelpTip glossary="branch" size="sm" />
              </span>
            )}
            {event.sha && (
              <span className="font-mono">Revision {event.sha}</span>
            )}
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
          className="flex gap-3 min-w-0 flex-1 rounded-lg hover:bg-[var(--surface-muted)]/60 -mx-2 px-2 transition-colors"
          title="Open on GitHub"
        >
          {content}
        </a>
      ) : (
        <div className="flex gap-3 min-w-0 flex-1">{content}</div>
      )}
    </li>
  );
}

function humanizeSubtitle(event: GitHubActivityEvent): string {
  const parts: string[] = [];
  if (event.subtitle) {
    parts.push(
      event.subtitle
        .replace(/^Merged into /, "Now on ")
        .replace(/^Opened by /, "Opened by ")
        .replace(/^Closed without merge/, "Not merged"),
    );
  }
  if (event.actor && event.actor !== "github-actions") {
    parts.push(`by ${event.actor}`);
  }
  if (event.actor === "github-actions") {
    parts.push("Automated check");
  }
  return parts.join(" · ");
}
