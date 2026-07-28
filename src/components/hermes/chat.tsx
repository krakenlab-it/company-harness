"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Send, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
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

export function HermesChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<HermesStatus>({
    configured: true,
    offline: false,
  });
  const bottomRef = useRef<HTMLDivElement>(null);

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
      })
      .catch(() => {
        setStatus({ configured: false, offline: true });
      });
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-8rem)] flex-col gap-4 md:h-[calc(100dvh-6rem)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="teal">In-app channel</Badge>
          {status.offline ? (
            <Badge variant="warn">
              <WifiOff className="h-3 w-3" aria-hidden />
              Offline
            </Badge>
          ) : status.configured ? (
            <Badge variant="ok">
              <Wifi className="h-3 w-3" aria-hidden />
              Connected
            </Badge>
          ) : (
            <Badge variant="warn">Not configured</Badge>
          )}
        </div>
      </div>

      <Panel padding="none" className="flex flex-1 flex-col overflow-hidden">
        <div
          className="flex-1 overflow-y-auto p-4 space-y-4"
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
        >
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center text-center">
              <div className="space-y-2 animate-fade-up">
                <p className="font-display text-lg font-semibold text-foam">
                  Hermes
                </p>
                <p className="max-w-xs text-sm text-mist">
                  Your operations assistant. Ask about projects, tickets, or
                  team workflows.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex animate-fade-up",
                msg.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed sm:max-w-[70%]",
                  msg.role === "user"
                    ? "bg-teal/30 text-foam border border-teal/20"
                    : "bg-[rgba(122,154,171,0.08)] text-foam border border-[rgba(122,154,171,0.12)]",
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="border-t border-danger/20 bg-danger/5 px-4 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSend}
          className="border-t border-[rgba(122,154,171,0.12)] p-4"
        >
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message Hermes…"
              rows={2}
              className="min-h-[2.75rem] flex-1 resize-none"
              disabled={sending || status.offline}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              aria-label="Message input"
            />
            <Button
              type="submit"
              disabled={!input.trim() || sending || status.offline}
              className="self-end"
              aria-label="Send message"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
