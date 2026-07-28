"use client";

import { formatDistanceToNow } from "date-fns";
import { GitBranch, Loader2, RefreshCw } from "lucide-react";
import type {
  GitHubActivityEvent,
  GitHubActivityFeed,
} from "@/lib/github/activity-types";
import { ACTIVITY_FRIENDLY } from "@/lib/github/activity-labels";
import { ACTIVITY_KIND_META } from "@/lib/github/activity-kind-meta";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/help-tip";
import { cn } from "@/lib/utils";

interface RepoVisibilityGraphProps {
  feed: GitHubActivityFeed | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  refreshing?: boolean;
  activeEventId?: string | null;
  onSelectEvent?: (event: GitHubActivityEvent) => void;
}

export function RepoVisibilityGraph({
  feed,
  loading,
  error,
  onRefresh,
  refreshing,
  activeEventId,
  onSelectEvent,
}: RepoVisibilityGraphProps) {
  if (loading) {
    return (
      <Panel className="flex items-center justify-center py-10 sticky top-4">
        <Loader2 className="h-4 w-4 animate-spin text-teal-bright" />
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel className="p-4 sticky top-4">
        <p className="text-xs text-danger">{error}</p>
      </Panel>
    );
  }

  if (!feed) return null;

  const isLive = feed.source === "github";
  const preview = feed.events.slice(0, 12);

  return (
    <Panel padding="none" className="overflow-hidden sticky top-4">
      <div className="border-b border-[var(--border-subtle)] px-3 py-3">
        <SectionHeader
          title="Visibility"
          description="Timeline at a glance — click an item to highlight it in the feed."
          glossary="github"
          action={
            onRefresh ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={onRefresh}
                disabled={refreshing}
                aria-label="Refresh timeline"
              >
                <RefreshCw
                  className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
                />
              </Button>
            ) : undefined
          }
        />
        <Badge variant={isLive ? "ok" : "warn"} className="mt-2">
          {isLive ? "Live" : "Sample"}
        </Badge>
      </div>

      <div className="relative px-3 py-2 max-h-[min(70vh,520px)] overflow-y-auto">
        <div
          className="absolute left-[1.35rem] top-3 bottom-3 w-px bg-[var(--border-subtle)]"
          aria-hidden
        />
        <ul className="space-y-0">
          {preview.map((event, index) => (
            <GraphNode
              key={event.id}
              event={event}
              isLast={index === preview.length - 1}
              active={activeEventId === event.id}
              onSelect={onSelectEvent}
            />
          ))}
          {preview.length === 0 && (
            <li className="py-6 text-center text-xs text-mist">No activity yet</li>
          )}
        </ul>
      </div>

      <p className="border-t border-[var(--border-subtle)] px-3 py-2 text-[10px] text-sand">
        Updated {formatDistanceToNow(new Date(feed.fetchedAt), { addSuffix: true })}
      </p>
    </Panel>
  );
}

function GraphNode({
  event,
  isLast,
  active,
  onSelect,
}: {
  event: GitHubActivityEvent;
  isLast: boolean;
  active?: boolean;
  onSelect?: (event: GitHubActivityEvent) => void;
}) {
  const meta = ACTIVITY_KIND_META[event.kind];
  const friendly = ACTIVITY_FRIENDLY[event.kind];
  const Icon = meta.icon;

  const inner = (
    <>
      <div
        className={cn(
          "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-[var(--surface)]",
          meta.tone === "ok" && "border-emerald-500/40 text-emerald-600",
          meta.tone === "danger" && "border-red-500/40 text-red-600",
          meta.tone === "warn" && "border-amber-500/40 text-amber-600",
          meta.tone === "teal" && "border-teal-bright/40 text-teal-bright",
          meta.tone === "default" && "border-[var(--border)] text-mist",
          active && "ring-2 ring-teal-bright/50",
        )}
      >
        <Icon className="h-3 w-3" aria-hidden />
      </div>
      <div className={cn("min-w-0 flex-1 pb-3", isLast && "pb-1")}>
        <p className="text-[10px] text-sand truncate">{friendly.label}</p>
        <p className="text-xs text-foam font-medium leading-snug line-clamp-2">
          {event.title}
        </p>
        <time
          className="text-[10px] text-sand"
          dateTime={event.occurredAt}
        >
          {formatDistanceToNow(new Date(event.occurredAt), { addSuffix: true })}
        </time>
        {event.branch && (
          <p className="mt-0.5 text-[9px] text-sand flex items-center gap-0.5 truncate">
            <GitBranch className="h-2.5 w-2.5 shrink-0" />
            {event.branch}
          </p>
        )}
      </div>
    </>
  );

  return (
    <li className="flex gap-2 pt-2">
      {onSelect ? (
        <button
          type="button"
          onClick={() => onSelect(event)}
          className={cn(
            "flex gap-2 min-w-0 flex-1 text-left rounded-md -mx-1 px-1 transition-colors",
            active
              ? "bg-teal-bright/10"
              : "hover:bg-[var(--surface-muted)]/60",
          )}
        >
          {inner}
        </button>
      ) : (
        <div className="flex gap-2 min-w-0 flex-1">{inner}</div>
      )}
    </li>
  );
}
