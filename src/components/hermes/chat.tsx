"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUp, Bot, Loader2, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { CursorJobCard, type TrackedJob } from "@/components/hermes/cursor-job-card";
import { MarkdownMessage } from "@/components/hermes/markdown-message";
import { ComposerInput } from "@/components/hermes/composer-input";
import {
  HermesModelSelector,
  loadStoredModelSelection,
  persistModelSelection,
  type ModelSelectorValue,
} from "@/components/hermes/model-selector";
import { getDefaultCuratedModel } from "@/lib/hermes/providers";
import { MessageTagStrip } from "@/components/hermes/message-tag-strip";
import { COMPOSER_TAG_HELP } from "@/lib/hermes/composer-tags";
import type { HermesComposerTagMeta } from "@/lib/types";
import type { HermesProviderId } from "@/lib/hermes/providers";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  contextType?: string;
  contextId?: string;
  composerTags?: HermesComposerTagMeta[];
  createdAt?: string;
}

interface HermesStatus {
  configured: boolean;
  offline: boolean;
  hint?: string;
  defaultProvider?: HermesProviderId;
  defaultModel?: string;
  groqAvailable?: boolean;
  nvidiaAvailable?: boolean;
  groqModel?: string;
  providers?: Array<{ id: HermesProviderId; label: string }>;
}

interface HermesContext {
  repos: number;
  openTickets: number;
  activeAgents: number;
}

const POLL_MS = 30_000;

export function HermesChat() {
  const searchParams = useSearchParams();
  const scopedRepo = searchParams.get("repo");
  const [messages, setMessages] = useState<Message[]>([]);
  const [trackedJobs, setTrackedJobs] = useState<TrackedJob[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<HermesContext>({
    repos: 0,
    openTickets: 0,
    activeAgents: 0,
  });
  const [status, setStatus] = useState<HermesStatus>({
    configured: true,
    offline: false,
  });
  const [modelSelection, setModelSelection] = useState<ModelSelectorValue>(
    getDefaultCuratedModel(),
  );
  const bottomRef = useRef<HTMLDivElement>(null);
  const modelInitRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const applyPayload = useCallback((data: Record<string, unknown>) => {
    if (data?.status && typeof data.status === "object") {
      const s = data.status as HermesStatus;
      setStatus({
        configured: s.configured ?? true,
        offline: s.offline ?? false,
        hint: s.hint,
        defaultProvider: s.defaultProvider,
        defaultModel: s.defaultModel,
        groqAvailable: s.groqAvailable,
        nvidiaAvailable: s.nvidiaAvailable,
        groqModel: s.groqModel,
        providers: s.providers,
      });
      if (!modelInitRef.current && s.defaultProvider && s.defaultModel) {
        modelInitRef.current = true;
        setModelSelection(
          loadStoredModelSelection({
            provider: s.defaultProvider,
            model: s.defaultModel,
          }),
        );
      }
    }
    if (Array.isArray(data?.messages)) {
      setMessages(data.messages as Message[]);
    }
    if (Array.isArray(data?.trackedJobs)) {
      setTrackedJobs(data.trackedJobs as TrackedJob[]);
    }
    if (data?.context && typeof data.context === "object") {
      setContext(data.context as HermesContext);
    }
  }, []);

  const refreshChat = useCallback(async () => {
    const res = await fetch("/api/hermes/chat");
    if (!res.ok) return;
    applyPayload(await res.json());
  }, [applyPayload]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending, scrollToBottom]);

  useEffect(() => {
    refreshChat().catch(() => {
      setStatus({ configured: false, offline: true });
    });
  }, [refreshChat]);

  useEffect(() => {
    const hasActiveJobs =
      trackedJobs.some(
        (j) => j.status === "running" || j.status === "queued",
      ) || context.activeAgents > 0;

    if (!hasActiveJobs) return;

    const interval = setInterval(() => {
      refreshChat().catch(() => {});
    }, POLL_MS);

    return () => clearInterval(interval);
  }, [trackedJobs, context.activeAgents, refreshChat]);

  useEffect(() => {
    persistModelSelection(modelSelection);
  }, [modelSelection]);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const needsNvidia = modelSelection.provider === "nvidia";
    const needsGroq = modelSelection.provider === "groq";
    if (needsNvidia && !status.nvidiaAvailable) {
      setError("Add NVIDIA_API_KEY to .env.local to use NVIDIA models.");
      return;
    }
    if (needsGroq && !status.groqAvailable) {
      setError("Add GROQ_API_KEY to .env.local to use Groq models.");
      return;
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/hermes/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          channel: "in-app",
          repo: scopedRepo ?? undefined,
          provider: modelSelection.provider,
          model: modelSelection.model,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Request failed (${res.status})`);
      }

      const data = await res.json();
      const replyText =
        data.reply ?? data.message ?? data.content ?? "";
      if (!replyText.trim() && !Array.isArray(data.messages)) {
        throw new Error("Hermes returned an empty response — try again");
      }
      applyPayload(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  const jobsById = new Map(trackedJobs.map((j) => [j.id, j]));
  const selectedLabel =
    modelSelection.provider === "nvidia" ? "NVIDIA" : "Groq";

  return (
    <div className="flex h-[calc(100dvh-7rem)] flex-col gap-3 md:h-[calc(100dvh-5.5rem)]">
      <header className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <div className="flex items-center gap-2 mr-auto min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-bright/10 text-teal-bright shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foam">Hermes</p>
            <p className="text-[11px] text-mist truncate">
              NVIDIA NIM · Groq · composer tags
            </p>
          </div>
        </div>
        <HermesModelSelector
          value={modelSelection}
          onChange={setModelSelection}
          nvidiaAvailable={status.nvidiaAvailable}
          groqAvailable={status.groqAvailable}
        />
        {scopedRepo && (
          <Badge variant="teal">Repo: {scopedRepo}</Badge>
        )}
        <Badge variant="default">{context.repos} repos</Badge>
        <Badge variant="default">{context.openTickets} tickets</Badge>
        <Badge variant="default">{context.activeAgents} agents</Badge>
        {status.offline ? (
          <Badge variant="warn" title={status.hint}>
            Demo mode
          </Badge>
        ) : (
          <Badge variant="ok">{selectedLabel}</Badge>
        )}
      </header>
      {status.offline && status.hint && (
        <p className="text-xs text-mist -mt-1 px-1">{status.hint}</p>
      )}

      <Panel
        padding="none"
        className="flex flex-1 flex-col overflow-hidden border-[var(--border)] bg-[var(--canvas)]"
      >
        <div
          className="flex-1 overflow-y-auto px-3 py-6 sm:px-6"
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
        >
          {messages.length === 0 && (
            <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center px-4">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-bright/10">
                <Bot className="h-7 w-7 text-teal-bright" />
              </div>
              <p className="font-display text-xl font-semibold tracking-tight text-foam mb-2">
                How can I help?
              </p>
              <p className="max-w-lg text-sm text-mist leading-relaxed">
                {scopedRepo
                  ? `Scoped to **${scopedRepo}**. Ask about stack, tickets, spend — or \`@cursor\` to delegate (admin/lead).`
                  : "Ask about projects, spend, tickets — or use `@cursor` with a repo scope to delegate to Cursor (admin/lead)."}
              </p>
              <div className="mt-6 grid w-full max-w-xl gap-2 sm:grid-cols-2">
                {(scopedRepo
                  ? [
                      `Scan context for ${scopedRepo}`,
                      `@cursor Add rate limiting to auth`,
                      "Open tickets on this repo",
                      "Summarize open PRs and CI status",
                    ]
                  : [
                      "Summarize open tickets",
                      "@cursor feature: improve error messages",
                      "What are we spending this month?",
                      "Create test tickets for all repos",
                    ]
                ).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setInput(suggestion)}
                    className="rounded-xl border border-[var(--border)] px-3 py-2.5 text-left text-xs text-mist hover:border-teal-bright/30 hover:bg-[var(--surface-muted)] hover:text-foam transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mx-auto max-w-3xl space-y-6">
            {messages.map((msg) => {
              const linkedJob =
                msg.contextType === "agent_job" && msg.contextId
                  ? jobsById.get(msg.contextId)
                  : undefined;
              const isUser = msg.role === "user";

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    isUser ? "flex-row-reverse" : "flex-row",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      isUser
                        ? "bg-[var(--surface-muted)] text-foam"
                        : "bg-teal-bright/15 text-teal-bright",
                    )}
                    aria-hidden
                  >
                    {isUser ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "min-w-0 max-w-[85%] sm:max-w-[78%]",
                      isUser ? "message-user px-4 py-3" : "message-assistant py-1",
                    )}
                  >
                    {isUser ? (
                      <>
                        <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                        <MessageTagStrip tags={msg.composerTags} />
                      </>
                    ) : (
                      <MarkdownMessage content={msg.content} />
                    )}
                    {linkedJob && <CursorJobCard job={linkedJob} compact />}
                    {msg.createdAt && (
                      <time
                        className="mt-2 block text-[10px] text-sand"
                        dateTime={msg.createdAt}
                      >
                        {new Date(msg.createdAt).toLocaleString()}
                      </time>
                    )}
                  </div>
                </div>
              );
            })}

            {sending && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-bright/15 text-teal-bright">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-4 py-3 text-sm text-mist">
                  Hermes is working — multi-step tasks may take up to a minute…
                </div>
              </div>
            )}
          </div>
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="border-t border-[var(--border-subtle)] bg-red-500/5 px-4 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSend}
          className="border-t border-[var(--border)] p-4 bg-[var(--surface)]"
        >
          <div className="mx-auto max-w-3xl prompt-composer flex items-end gap-2 p-2 pl-4">
            <ComposerInput
              value={input}
              onChange={setInput}
              disabled={sending}
              placeholder="Message Hermes — @cursor · @marketing · @repo org/name · /ticket"
              aria-label="Message input"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || sending}
              className="rounded-full h-9 w-9 shrink-0 mb-0.5"
              aria-label="Send message"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="mx-auto max-w-3xl mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 px-2">
            {COMPOSER_TAG_HELP.map((item) => (
              <button
                key={item.token}
                type="button"
                onClick={() =>
                  setInput((prev) =>
                    prev ? `${prev} ${item.token}` : item.token,
                  )
                }
                className="text-[10px] text-sand hover:text-teal-bright transition-colors"
                title={item.desc}
              >
                <span className="font-mono text-foam/80">{item.token}</span>
              </button>
            ))}
          </div>
          <p className="mx-auto max-w-3xl mt-1 text-[10px] text-sand text-center">
            Enter to send · Shift+Enter newline · tags highlight like Cursor composer
          </p>
        </form>
      </Panel>
    </div>
  );
}
