"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Calendar,
  Cloud,
  GitBranch,
  Loader2,
  Mail,
  Plug,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import type { IntegrationProvider } from "@/lib/types";

interface Connection {
  provider: IntegrationProvider;
  label: string;
  status: string;
  configured: boolean;
  lastSyncAt?: string;
  lastError?: string;
  metadata?: Record<string, unknown>;
}

const providerIcons: Record<IntegrationProvider, typeof Plug> = {
  openrouter: Sparkles,
  trigger: Zap,
  google: Calendar,
  gcp: Cloud,
  github: GitBranch,
  resend: Mail,
};

export function IntegrationsConsole() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [triggerRuns, setTriggerRuns] = useState<unknown[]>([]);
  const [gmailThreads, setGmailThreads] = useState<unknown[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<unknown[]>([]);
  const [gcpHealth, setGcpHealth] = useState<unknown[]>([]);
  const [githubRepos, setGithubRepos] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations");
      if (!res.ok) throw new Error(`Failed to load integrations (${res.status})`);
      const data = await res.json();
      setConnections(data.connections ?? []);
      setTriggerRuns(data.triggerRuns ?? []);
      setGmailThreads(data.googleGmailThreads ?? []);
      setCalendarEvents(data.googleCalendarEvents ?? []);
      setGcpHealth(data.gcpHealthChecks ?? []);
      setGithubRepos(data.githubRepositories ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function syncProvider(provider: IntegrationProvider) {
    setSyncing(provider);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/integrations/${provider}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? data.error ?? "Sync failed");
      setMessage(data.message);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(null);
    }
  }

  async function syncAll() {
    setSyncing("all");
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync_all" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync failed");
      const failed = (data.results ?? []).filter((r: { ok: boolean }) => !r.ok);
      if (failed.length) {
        setError(failed.map((f: { message: string }) => f.message).join("; "));
      } else {
        setMessage(`Synced ${data.results?.length ?? 0} providers`);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(null);
    }
  }

  function connectGoogle() {
    window.location.href = "/api/integrations/google/connect";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-mist">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading integrations…
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={syncAll} disabled={syncing !== null}>
          {syncing === "all" ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Sync all configured
        </Button>
        {message && <p className="text-sm text-teal-bright">{message}</p>}
        {error && <p className="text-sm text-rose-400">{error}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {connections.map((conn) => {
          const Icon = providerIcons[conn.provider];
          return (
            <Panel key={conn.provider} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-teal" />
                  <div>
                    <h3 className="font-medium text-foam">{conn.label}</h3>
                    <p className="text-xs text-mist capitalize">{conn.provider}</p>
                  </div>
                </div>
                <Badge
                  className={cn(
                    conn.status === "connected" && "bg-teal/20 text-teal-bright",
                    conn.status === "error" && "bg-rose-500/20 text-rose-300",
                    conn.status === "disconnected" && "bg-mist/10 text-mist",
                  )}
                >
                  {conn.configured ? conn.status : "needs keys"}
                </Badge>
              </div>

              {conn.lastSyncAt && (
                <p className="text-xs text-mist">
                  Last sync: {new Date(conn.lastSyncAt).toLocaleString()}
                </p>
              )}
              {conn.lastError && (
                <p className="text-xs text-rose-400">{conn.lastError}</p>
              )}

              <div className="flex gap-2">
                {conn.provider === "google" ? (
                  <Button size="sm" variant="outline" onClick={connectGoogle}>
                    Connect Google
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!conn.configured || syncing !== null}
                    onClick={() => syncProvider(conn.provider)}
                  >
                    {syncing === conn.provider ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Sync now"
                    )}
                  </Button>
                )}
              </div>
            </Panel>
          );
        })}
      </div>

      {githubRepos.length > 0 && (
        <Panel className="p-4">
          <h3 className="font-medium text-foam mb-3">GitHub repositories</h3>
          <ul className="space-y-2 text-sm">
            {(githubRepos as { fullName: string; url: string; projectId?: string }[]).map(
              (repo) => (
                <li key={repo.url} className="flex justify-between gap-2">
                  <a href={repo.url} className="text-teal-bright hover:underline">
                    {repo.fullName}
                  </a>
                  {repo.projectId ? (
                    <Badge>Linked to project</Badge>
                  ) : (
                    <span className="text-mist">Unlinked</span>
                  )}
                </li>
              ),
            )}
          </ul>
        </Panel>
      )}

      {triggerRuns.length > 0 && (
        <Panel className="p-4">
          <h3 className="font-medium text-foam mb-3">Recent Trigger.dev runs</h3>
          <ul className="space-y-1 text-sm text-mist">
            {(triggerRuns as { taskId: string; status: string; costUsd?: number }[]).slice(0, 5).map(
              (run, i) => (
                <li key={i}>
                  {run.taskId} — {run.status}
                  {run.costUsd != null ? ` (~$${run.costUsd.toFixed(4)})` : ""}
                </li>
              ),
            )}
          </ul>
        </Panel>
      )}

      {(gmailThreads.length > 0 || calendarEvents.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {gmailThreads.length > 0 && (
            <Panel className="p-4">
              <h3 className="font-medium text-foam mb-3">Gmail (recent)</h3>
              <ul className="space-y-2 text-sm">
                {(gmailThreads as { subject: string; from: string }[]).slice(0, 5).map(
                  (t, i) => (
                    <li key={i}>
                      <p className="text-foam truncate">{t.subject}</p>
                      <p className="text-xs text-mist truncate">{t.from}</p>
                    </li>
                  ),
                )}
              </ul>
            </Panel>
          )}
          {calendarEvents.length > 0 && (
            <Panel className="p-4">
              <h3 className="font-medium text-foam mb-3">Calendar (upcoming)</h3>
              <ul className="space-y-2 text-sm">
                {(calendarEvents as { title: string; startAt: string }[]).slice(0, 5).map(
                  (e, i) => (
                    <li key={i}>
                      <p className="text-foam">{e.title}</p>
                      <p className="text-xs text-mist">
                        {new Date(e.startAt).toLocaleString()}
                      </p>
                    </li>
                  ),
                )}
              </ul>
            </Panel>
          )}
        </div>
      )}

      {gcpHealth.length > 0 && (
        <Panel className="p-4">
          <h3 className="font-medium text-foam mb-3">GCP health</h3>
          <ul className="space-y-1 text-sm">
            {(gcpHealth as { service: string; status: string; message?: string }[]).map(
              (check, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span>{check.service}</span>
                  <Badge>{check.status}</Badge>
                </li>
              ),
            )}
          </ul>
        </Panel>
      )}

      {connections.every((c) => !c.configured) && (
        <EmptyState
          icon={Plug}
          title="Add API keys to connect"
          description="Copy .env.example to .env.local and add keys for OpenRouter, Trigger.dev, GitHub, GCP, Google OAuth, and Resend."
        />
      )}
    </div>
  );
}
