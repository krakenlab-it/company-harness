"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Bot,
  ExternalLink,
  GitBranch,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type {
  GitHubActivityEvent,
  GitHubActivityFeed,
  GitHubActivityTab,
} from "@/lib/github/activity-types";
import {
  ACTIVITY_TABS,
  countEventsByTab,
  filterEventsByTab,
} from "@/lib/github/activity-filters";
import { ACTIVITY_FRIENDLY } from "@/lib/github/activity-labels";
import { ACTIVITY_KIND_META } from "@/lib/github/activity-kind-meta";
import { buildCursorDelegationDraft } from "@/lib/github/cursor-prompt";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HelpTip, SectionHeader } from "@/components/ui/help-tip";
import { SendToCursorDialog } from "@/components/repos/send-to-cursor-dialog";
import { cn } from "@/lib/utils";

interface RepoActivityFeedProps {
  repoId: string;
  repoUrl: string;
  feed: GitHubActivityFeed | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  refreshing?: boolean;
  canDelegate?: boolean;
  highlightedEventId?: string | null;
}

export function RepoActivityFeed({
  repoId,
  repoUrl,
  feed,
  loading,
  error,
  onRefresh,
  refreshing,
  canDelegate = false,
  highlightedEventId,
}: RepoActivityFeedProps) {
  const [tab, setTab] = useState<GitHubActivityTab>("all");
  const [cursorEvent, setCursorEvent] = useState<GitHubActivityEvent | null>(
    null,
  );

  const counts = useMemo(
    () => (feed ? countEventsByTab(feed.events) : null),
    [feed],
  );

  const filtered = useMemo(
    () => (feed ? filterEventsByTab(feed.events, tab) : []),
    [feed, tab],
  );

  if (loading) {
    return (
      <Panel className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-teal-bright" />
        <span className="ml-2 text-sm text-mist">Loading activity feed…</span>
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
    <>
      <Panel padding="none" className="overflow-hidden">
        <div className="border-b border-[var(--border-subtle)] px-4 py-4 sm:px-5">
          <SectionHeader
            title="Activity feed"
            description={
              isLive
                ? `Filter by type — change requests, issues, comments, checks, and code updates for ${feed.repoFullName}.`
                : "Sample feed — connect GitHub for live data."
            }
            glossary={isLive ? "github" : "demoTimeline"}
            action={
              onRefresh ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onRefresh}
                  disabled={refreshing}
                  aria-label="Refresh feed"
                >
                  <RefreshCw
                    className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
                  />
                </Button>
              ) : undefined
            }
          />

          <div
            className="mt-4 flex gap-1 overflow-x-auto pb-1 -mx-1 px-1"
            role="tablist"
            aria-label="Activity filters"
          >
            {ACTIVITY_TABS.map((t) => {
              const count = counts?.[t.id] ?? 0;
              const selected = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  title={t.hint}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors inline-flex items-center gap-1.5",
                    selected
                      ? "bg-teal-bright/15 text-teal-bright"
                      : "text-mist hover:bg-[var(--surface-muted)] hover:text-foam",
                  )}
                >
                  {t.label}
                  <span
                    className={cn(
                      "tabular-nums text-[10px] rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center",
                      selected
                        ? "bg-teal-bright/20"
                        : "bg-[var(--surface-muted)]",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <ul className="divide-y divide-[var(--border-subtle)] max-h-[520px] overflow-y-auto">
          {filtered.map((event) => (
            <FeedRow
              key={event.id}
              event={event}
              highlighted={highlightedEventId === event.id}
              canDelegate={canDelegate}
              onSendToCursor={() => setCursorEvent(event)}
            />
          ))}
          {filtered.length === 0 && (
            <li className="py-12 text-center px-4">
              <p className="text-sm text-foam font-medium">Nothing in this filter</p>
              <p className="text-xs text-mist mt-1">
                Try another tab or refresh when new GitHub activity arrives.
              </p>
            </li>
          )}
        </ul>

        <p className="border-t border-[var(--border-subtle)] px-4 py-2.5 text-[11px] text-sand sm:px-5">
          Showing {filtered.length} of {feed.events.length} items · last refreshed{" "}
          {formatDistanceToNow(new Date(feed.fetchedAt), { addSuffix: true })}
        </p>
      </Panel>

      <SendToCursorDialog
        open={Boolean(cursorEvent)}
        draft={
          cursorEvent
            ? buildCursorDelegationDraft(cursorEvent, feed.repoFullName, repoUrl)
            : null
        }
        repoId={repoId}
        onClose={() => setCursorEvent(null)}
      />
    </>
  );
}

function FeedRow({
  event,
  highlighted,
  canDelegate,
  onSendToCursor,
}: {
  event: GitHubActivityEvent;
  highlighted?: boolean;
  canDelegate?: boolean;
  onSendToCursor: () => void;
}) {
  const meta = ACTIVITY_KIND_META[event.kind];
  const friendly = ACTIVITY_FRIENDLY[event.kind];
  const Icon = meta.icon;

  return (
    <li
      id={`activity-${event.id}`}
      className={cn(
        "px-4 py-3 sm:px-5 transition-colors",
        highlighted && "bg-teal-bright/5",
      )}
    >
      <div className="flex gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
            meta.tone === "ok" && "border-emerald-500/30 text-emerald-600 bg-emerald-500/5",
            meta.tone === "danger" && "border-red-500/30 text-red-600 bg-red-500/5",
            meta.tone === "warn" && "border-amber-500/30 text-amber-600 bg-amber-500/5",
            meta.tone === "teal" && "border-teal-bright/30 text-teal-bright bg-teal-bright/5",
            meta.tone === "default" && "border-[var(--border)] text-mist bg-[var(--surface-muted)]/40",
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Badge variant={meta.tone === "default" ? "default" : meta.tone}>
              {friendly.label}
            </Badge>
            <HelpTip label={friendly.label} short={friendly.hint} size="sm" />
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
            <p className="mt-0.5 text-xs text-mist">{humanizeSubtitle(event)}</p>
          )}

          {(event.prNumber || event.issueNumber || event.commentPreview) && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {event.prNumber != null && (
                <Badge variant="default" className="text-[10px]">
                  PR #{event.prNumber}
                </Badge>
              )}
              {event.issueNumber != null && (
                <Badge variant="default" className="text-[10px]">
                  Issue #{event.issueNumber}
                </Badge>
              )}
              {event.owner && event.repo && (
                <Badge variant="default" className="text-[10px]">
                  {event.owner}/{event.repo}
                </Badge>
              )}
            </div>
          )}

          {event.commentPreview && (
            <p className="mt-2 text-xs text-mist italic line-clamp-2 border-l-2 border-[var(--border)] pl-2">
              {event.commentPreview}
            </p>
          )}

          {(event.branch || event.sha) && (
            <p className="mt-1.5 text-[10px] text-sand flex flex-wrap gap-x-2">
              {event.branch && (
                <span className="inline-flex items-center gap-0.5">
                  <GitBranch className="h-3 w-3" />
                  {event.branch}
                </span>
              )}
              {event.sha && <span className="font-mono">rev {event.sha}</span>}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {event.url && (
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-xs btn-outline inline-flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                GitHub
              </a>
            )}
            {canDelegate && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                onClick={onSendToCursor}
              >
                <Bot className="h-3.5 w-3.5" />
                Send to Cursor
              </Button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function humanizeSubtitle(event: GitHubActivityEvent): string {
  const parts: string[] = [];
  if (event.subtitle) {
    parts.push(
      event.subtitle
        .replace(/^Merged into /, "Now on ")
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
