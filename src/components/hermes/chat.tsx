"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

interface HermesStatus {
  configured: boolean;
  offline: boolean;
}

interface HermesContext {
  repos: number;
  openTickets: number;
  activeAgents: number;
}

export function HermesChat() {
  const searchParams = useSearchParams();
  const scopedRepo = searchParams.get("repo");
  const [messages, setMessages] = useState<Message[]>([]);
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    fetch("/api/hermes/chat")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.status) {
          setStatus({
            configured: data.status.configured ?? true,
            offline: data.status.offline ?? false,
          });
        }
        if (data?.messages?.length) {
          setMessages(data.messages);
        }
        if (data?.context) {
          setContext(data.context);
        }
      })
      .catch(() => {
        setStatus({ configured: false, offline: true });
      });
  }, []);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

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
        body: JSON.stringify({ message: text, channel: "in-app" }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Request failed (${res.status})`);
      }

      const data = await res.json();
      const reply: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply ?? data.message ?? data.content ?? "No response.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, reply]);

      if (data.status) {
        setStatus({
          configured: data.status.configured ?? status.configured,
          offline: data.status.offline ?? false,
        });
      }
      if (data.context) {
        setContext(data.context);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-8rem)] flex-col gap-3 md:h-[calc(100dvh-6rem)]">
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-mist">
        {scopedRepo && (
          <Badge variant="teal">Target: {scopedRepo}</Badge>
        )}
        <Badge variant="default">{context.repos} entities</Badge>
        <Badge variant="default">{context.openTickets} tickets</Badge>
        <Badge variant="default">{context.activeAgents} missions</Badge>
        {status.offline && <Badge variant="warn">Offline</Badge>}
      </div>

      <Panel
        padding="none"
        className="flex flex-1 flex-col overflow-hidden border-[var(--border)]"
      >
        <div
          className="flex-1 overflow-y-auto px-4 py-6 sm:px-6"
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
        >
          {messages.length === 0 && (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center px-4">
              <p className="font-display text-lg font-semibold tracking-tight text-foam mb-2">
                Intelligence query
              </p>
              <p className="max-w-md text-xs text-mist leading-relaxed">
                {scopedRepo
                  ? `Scoped to ${scopedRepo}. Ask about stack, tickets, spend, or sprint status.`
                  : "Ask about project status, repo stack, open tickets, or spend across all entities."}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {(scopedRepo
                  ? [
                      `Scan context for ${scopedRepo}`,
                      "Open tickets on this repo",
                      "Stack health summary",
                    ]
                  : [
                      "Summarize open tickets",
                      "Stack health by repo",
                      "What are we spending this month?",
                    ]
                ).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setInput(suggestion)}
                    className="rounded-sm border border-[var(--border)] px-2.5 py-1 text-[10px] font-mono uppercase tracking-wide text-mist hover:bg-[var(--surface-muted)] hover:text-teal-bright transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mx-auto max-w-3xl space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[90%] text-sm leading-relaxed sm:max-w-[85%]",
                    msg.role === "user"
                      ? "message-user px-4 py-3"
                      : "message-assistant px-1 py-1",
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="border-t border-[var(--border-subtle)] bg-[var(--surface)] px-4 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSend}
          className="border-t border-[var(--border)] p-4 bg-[var(--canvas)]"
        >
          <div className="mx-auto max-w-3xl prompt-composer flex items-end gap-2 p-2 pl-4">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message Hermes"
              rows={1}
              className="flex-1 resize-none bg-transparent py-2 text-sm text-foam placeholder:text-sand outline-none min-h-[24px] max-h-[120px]"
              disabled={sending}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              aria-label="Message input"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || sending}
              className="rounded-sm h-8 w-8 shrink-0 mb-0.5"
              aria-label="Send message"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
