"use client";

import Link from "next/link";
import { ExternalLink, MessageSquare, Sparkles } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { HelpTip } from "@/components/ui/help-tip";

interface RepoOverviewCardProps {
  name: string;
  url: string;
  githubConnected: boolean;
  project?: { id: string; name: string };
}

export function RepoOverviewCard({
  name,
  url,
  githubConnected,
  project,
}: RepoOverviewCardProps) {
  const displayName = name.includes("/") ? name.split("/").pop()! : name;

  return (
    <Panel className="bg-[var(--surface)] border-[var(--border)] p-0 overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[11px] font-medium uppercase tracking-wider text-sand">
                GitHub repository
              </p>
              <HelpTip glossary="repository" />
            </div>
            <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-foam">
              {displayName}
            </h2>
            <p className="mt-1 text-sm text-mist truncate max-w-md" title={url}>
              {name}
            </p>
          </div>
          <Badge variant={githubConnected ? "ok" : "warn"}>
            {githubConnected ? "GitHub connected" : "Sample activity"}
          </Badge>
        </div>

        <p className="mt-4 text-sm text-mist leading-relaxed max-w-2xl">
          This page shows what your team is shipping on GitHub — recent updates,
          change requests waiting for review, and whether automated checks passed.
          You don&apos;t need to open GitHub unless you want the full detail.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-outline inline-flex items-center gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open on GitHub
          </a>
          <Link
            href={`/hermes?repo=${encodeURIComponent(name)}`}
            className="btn btn-sm btn-primary inline-flex items-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Ask Hermes
          </Link>
          <HelpTip glossary="hermes" size="sm" />
        </div>
      </div>

      {(project || !githubConnected) && (
        <div className="border-t border-[var(--border-subtle)] bg-[var(--surface-muted)]/50 px-5 py-3 sm:px-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-mist">
          {project && (
            <span>
              Harness project:{" "}
              <Link
                href={`/projects/${project.id}`}
                className="text-teal-bright font-medium hover:underline"
              >
                {project.name}
              </Link>
            </span>
          )}
          {!githubConnected && (
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5 shrink-0" />
              Timeline below is illustrative until an admin connects GitHub.
            </span>
          )}
        </div>
      )}
    </Panel>
  );
}
