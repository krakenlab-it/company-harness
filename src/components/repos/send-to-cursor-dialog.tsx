"use client";

import { useEffect, useState } from "react";
import { Bot, Loader2, X } from "lucide-react";
import type { CursorAgentJobType } from "@/lib/types";
import type { CursorDelegationDraft } from "@/lib/github/cursor-prompt";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ErrorPanel } from "@/components/ui/error-panel";

interface SendToCursorDialogProps {
  open: boolean;
  draft: CursorDelegationDraft | null;
  repoId: string;
  onClose: () => void;
  onSuccess?: (jobId: string) => void;
}

export function SendToCursorDialog({
  open,
  draft,
  repoId,
  onClose,
  onSuccess,
}: SendToCursorDialogProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !draft) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="send-cursor-title"
    >
      <Panel className="w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2 min-w-0">
            <Bot className="h-5 w-5 text-teal-bright shrink-0" />
            <div className="min-w-0">
              <h2 id="send-cursor-title" className="text-sm font-semibold text-foam">
                Send to Cursor
              </h2>
              <p className="text-xs text-mist mt-0.5">
                Auto-filled from this GitHub item — add optional instructions below.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <SendToCursorForm
          key={`${draft.title}:${draft.prompt.slice(0, 40)}`}
          draft={draft}
          repoId={repoId}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      </Panel>
    </div>
  );
}

function SendToCursorForm({
  draft,
  repoId,
  onClose,
  onSuccess,
}: {
  draft: CursorDelegationDraft;
  repoId: string;
  onClose: () => void;
  onSuccess?: (jobId: string) => void;
}) {
  const [type, setType] = useState<CursorAgentJobType>(draft.type);
  const [title, setTitle] = useState(draft.title);
  const [prompt, setPrompt] = useState(draft.prompt);
  const [extraComment, setExtraComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      let finalPrompt = prompt.trim();
      if (extraComment.trim()) {
        finalPrompt = `${finalPrompt}\n\nAdditional instructions:\n${extraComment.trim()}`;
      }

      const res = await fetch(`/api/repos/${repoId}/cursor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim(),
          prompt: finalPrompt,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error ?? `Delegation failed (${res.status})`);
      }
      onSuccess?.(body.job?.id ?? body.agent?.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send to Cursor");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {draft.contextLines.map((line) => (
          <Badge key={line} variant="default" className="text-[10px] font-normal">
            {line}
          </Badge>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
        <label className="text-xs text-mist sm:pt-2">Job type</label>
        <Select
          value={type}
          onChange={(e) => setType(e.target.value as CursorAgentJobType)}
          options={[
            { value: "bugfix", label: "Bug fix" },
            { value: "issue", label: "Issue" },
            { value: "pr", label: "Pull request" },
            { value: "feature", label: "Feature" },
            { value: "refactor", label: "Refactor" },
            { value: "merge_conflict", label: "Merge conflict" },
          ]}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
        <label className="text-xs text-mist sm:pt-2">Title</label>
        <Textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          rows={2}
          required
          className="text-sm"
        />
      </div>

      <div>
        <label className="text-xs text-mist block mb-1.5">Prompt (editable)</label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={8}
          required
          className="text-xs font-mono leading-relaxed"
        />
      </div>

      <div>
        <label className="text-xs text-mist block mb-1.5">
          Extra comment for Cursor (optional)
        </label>
        <Textarea
          value={extraComment}
          onChange={(e) => setExtraComment(e.target.value)}
          rows={3}
          placeholder="e.g. Focus on Safari only; don't change the login API."
          className="text-sm"
        />
      </div>

      {error && <ErrorPanel message={error} />}

      <div className="flex flex-wrap gap-2 justify-end pt-1">
        <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting || !title.trim() || !prompt.trim()}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              Sending…
            </>
          ) : (
            <>
              <Bot className="h-4 w-4 mr-1.5" />
              Delegate to Cursor
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
