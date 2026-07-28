"use client";

import { useCallback, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  LayoutTemplate,
  Loader2,
  Megaphone,
  Palette,
  PenLine,
  Mail,
  Share2,
  Sparkles,
} from "lucide-react";
import type {
  MarketingTask,
  MarketingTaskCategory,
  MarketingTaskStatus,
} from "@/lib/types";
import {
  MARKETING_CATEGORY_LABELS,
  MARKETING_TASK_TEMPLATES,
  buildMarketingTaskDraft,
} from "@/lib/marketing/task-templates";
import { Topbar } from "@/components/layout/topbar";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ErrorPanel } from "@/components/ui/error-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { HelpTip, SectionHeader } from "@/components/ui/help-tip";
import { cn } from "@/lib/utils";

const TEMPLATE_ICONS: Record<MarketingTaskCategory, typeof Megaphone> = {
  landing_page: LayoutTemplate,
  ui_redesign: Palette,
  brand_copy: PenLine,
  social_campaign: Share2,
  email_campaign: Mail,
  other: Sparkles,
};

const STATUS_VARIANT: Record<
  MarketingTaskStatus,
  "default" | "teal" | "ok" | "warn" | "danger"
> = {
  requested: "default",
  in_progress: "teal",
  review: "warn",
  done: "ok",
  cancelled: "danger",
};

const STATUS_LABEL: Record<MarketingTaskStatus, string> = {
  requested: "Waiting to start",
  in_progress: "In progress",
  review: "Ready for review",
  done: "Done",
  cancelled: "Cancelled",
};

interface MarketingStudioProps {
  initialTasks: MarketingTask[];
  openCount: number;
  canRequest: boolean;
  canManage: boolean;
  members: Array<{ id: string; name: string; role?: string }>;
  projects: Array<{ id: string; name: string }>;
}

export function MarketingStudio({
  initialTasks,
  openCount,
  canRequest,
  canManage,
  members,
  projects,
}: MarketingStudioProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedCategory, setSelectedCategory] =
    useState<MarketingTaskCategory>("landing_page");
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [projectId, setProjectId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const marketingMembers = members.filter((m) => m.role === "marketing");

  function applyTemplate(category: MarketingTaskCategory) {
    setSelectedCategory(category);
    const template = MARKETING_TASK_TEMPLATES.find((t) => t.id === category)!;
    setTitle(template.title);
    setBrief(template.brief);
  }

  const reload = useCallback(async () => {
    const res = await fetch("/api/marketing/tasks");
    if (!res.ok) return;
    const data = await res.json();
    setTasks(data.tasks ?? []);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/marketing/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedCategory,
          title: title.trim(),
          brief: brief.trim() || title.trim(),
          targetUrl: targetUrl.trim() || undefined,
          projectId: projectId || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not submit request");
      setTitle("");
      setBrief("");
      setTargetUrl("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateTask(
    id: string,
    patch: { status?: MarketingTaskStatus; assigneeId?: string },
  ) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/marketing/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Update failed");
      await reload();
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <>
      <Topbar
        mission="Create"
        title="Marketing Studio"
        description="Request landing pages, UI polish, copy, and campaigns — no dev jargon required. The marketing team tracks everything here."
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-5xl space-y-5">
          <Panel className="p-4 sm:p-5">
            <SectionHeader
              title="What do you need?"
              description="Pick a template to auto-fill the brief, then edit anything before sending."
              glossary="marketingStudio"
            />
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {MARKETING_TASK_TEMPLATES.map((template) => {
                const Icon = TEMPLATE_ICONS[template.id];
                const selected = selectedCategory === template.id;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => applyTemplate(template.id)}
                    className={cn(
                      "text-left rounded-lg border p-3 transition-colors",
                      selected
                        ? "border-teal-bright/50 bg-teal-bright/10"
                        : "border-[var(--border-subtle)] hover:bg-[var(--surface-muted)]/60",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-teal-bright shrink-0" />
                      <span className="text-sm font-medium text-foam">
                        {template.title}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-mist leading-relaxed">
                      {template.hint}
                    </p>
                  </button>
                );
              })}
            </div>
          </Panel>

          {canRequest ? (
            <Panel className="p-4 sm:p-5">
              <SectionHeader
                title="Submit a request"
                description="Developers and leaders can delegate creative work without opening a GitHub issue."
              />
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <Input
                  label="Short title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Refresh Pulse landing page hero"
                  required
                />
                <Textarea
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  rows={5}
                  placeholder="Describe the goal, audience, and any must-haves…"
                  className="text-sm"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Page or URL (optional)"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="https://… or /repos screen"
                  />
                  <Select
                    label="Related product (optional)"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    options={[
                      { value: "", label: "None" },
                      ...projects.map((p) => ({
                        value: p.id,
                        label: p.name,
                      })),
                    ]}
                  />
                </div>
                <p className="text-xs text-mist">
                  Tip: in Hermes, type{" "}
                  <code className="text-teal-bright">@marketing ui_redesign: …</code>{" "}
                  for the same workflow.
                  <HelpTip glossary="hermes" size="sm" />
                </p>
                {error && <ErrorPanel message={error} />}
                <Button type="submit" disabled={submitting || !title.trim()}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Megaphone className="h-4 w-4 mr-1.5" />
                      Send to marketing team
                    </>
                  )}
                </Button>
              </form>
            </Panel>
          ) : (
            <Panel className="p-4">
              <p className="text-sm text-mist">
                Your account can view marketing requests but cannot create new ones.
                Ask an admin, developer, or marketing teammate to submit work.
              </p>
            </Panel>
          )}

          <Panel padding="none" className="overflow-hidden">
            <div className="border-b border-[var(--border-subtle)] px-4 py-4 sm:px-5 flex flex-wrap items-center justify-between gap-2">
              <SectionHeader
                title="Open requests"
                description={`${openCount} active — landing pages, UI, copy, and campaigns.`}
              />
              <Badge variant={openCount > 0 ? "teal" : "ok"}>
                {openCount} open
              </Badge>
            </div>

            {tasks.length === 0 ? (
              <EmptyState
                icon={Megaphone}
                title="No marketing requests yet"
                description="Submit a template above or ask Hermes with @marketing."
              />
            ) : (
              <ul className="divide-y divide-[var(--border-subtle)]">
                {tasks.map((task) => (
                  <li key={task.id} className="px-4 py-4 sm:px-5">
                    <div className="flex flex-wrap items-start gap-2 justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={STATUS_VARIANT[task.status]}>
                            {STATUS_LABEL[task.status]}
                          </Badge>
                          <Badge variant="default">
                            {MARKETING_CATEGORY_LABELS[task.category]}
                          </Badge>
                          <span className="text-[11px] text-sand">
                            {formatDistanceToNow(new Date(task.updatedAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm font-medium text-foam">
                          {task.title}
                        </p>
                        <p className="mt-1 text-xs text-mist line-clamp-3 leading-relaxed">
                          {task.brief}
                        </p>
                        {task.targetUrl && (
                          <p className="mt-1 text-[11px] text-sand">
                            Target: {task.targetUrl}
                          </p>
                        )}
                      </div>

                      {canManage && (
                        <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
                          <Select
                            value={task.status}
                            onChange={(e) =>
                              updateTask(task.id, {
                                status: e.target.value as MarketingTaskStatus,
                              })
                            }
                            disabled={updatingId === task.id}
                            options={Object.entries(STATUS_LABEL).map(
                              ([value, label]) => ({ value, label }),
                            )}
                          />
                          <Select
                            value={task.assigneeId ?? ""}
                            onChange={(e) =>
                              updateTask(task.id, {
                                assigneeId: e.target.value,
                              })
                            }
                            disabled={updatingId === task.id}
                            options={[
                              { value: "", label: "Unassigned" },
                              ...marketingMembers.map((m) => ({
                                value: m.id,
                                label: m.name,
                              })),
                            ]}
                          />
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}

/** Server-friendly wrapper data loader used by page */
export function prefetchMarketingFormDefaults(category: MarketingTaskCategory) {
  return buildMarketingTaskDraft({ category });
}
