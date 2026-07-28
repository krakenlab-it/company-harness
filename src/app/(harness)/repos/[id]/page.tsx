"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { ErrorPanel } from "@/components/ui/error-panel";
import { GitActivityGraph } from "@/components/repos/git-activity-graph";
import { RepoOverviewCard } from "@/components/repos/repo-overview-card";
import { RepoStackPanel } from "@/components/repos/repo-stack-panel";
import type { GitHubActivityFeed } from "@/lib/github/activity-types";

export default function RepoDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<{
    repo: { id: string; name: string; url: string };
    stack: Array<{ name: string; version?: string; status: string; critical: boolean }>;
    project?: { id: string; name: string };
  } | null>(null);
  const [activity, setActivity] = useState<GitHubActivityFeed | null>(null);
  const [githubConnected, setGithubConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [refreshingActivity, setRefreshingActivity] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activityError, setActivityError] = useState<string | null>(null);

  async function loadActivity(refresh = false) {
    if (refresh) setRefreshingActivity(true);
    else setActivityLoading(true);
    try {
      const res = await fetch(`/api/repos/${params.id}/github`);
      if (!res.ok) throw new Error("Could not load GitHub activity");
      const body = await res.json();
      setActivity(body.activity);
      setGithubConnected(Boolean(body.githubConnected));
      setActivityError(null);
    } catch (err) {
      setActivityError(
        err instanceof Error ? err.message : "Failed to load activity",
      );
    } finally {
      setActivityLoading(false);
      setRefreshingActivity(false);
    }
  }

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
    if (!params.id) return;
    void load();
    void loadActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load on id change only
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
        <Topbar title="Repository" />
        <div className="p-6">
          <ErrorPanel message={error ?? "Not found"} />
        </div>
      </>
    );
  }

  const displayName = data.repo.name.includes("/")
    ? data.repo.name.split("/").pop()!
    : data.repo.name;

  return (
    <>
      <Topbar
        mission="Observe"
        title={displayName}
        description="See what shipped recently, what’s waiting for review, and whether automated checks passed."
      />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 max-w-4xl">
        <RepoOverviewCard
          name={data.repo.name}
          url={data.repo.url}
          githubConnected={githubConnected}
          project={data.project}
        />

        <GitActivityGraph
          feed={activity}
          loading={activityLoading}
          error={activityError}
          onRefresh={() => loadActivity(true)}
          refreshing={refreshingActivity}
        />

        <RepoStackPanel
          stack={data.stack}
          scanning={scanning}
          onScan={scanStack}
        />
      </div>
    </>
  );
}
