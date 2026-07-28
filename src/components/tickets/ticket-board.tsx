"use client";

import { useEffect, useState } from "react";
import { GripVertical, Loader2, Plus, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

type TicketStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "review"
  | "done";

interface TicketItem {
  id: string;
  title: string;
  description?: string;
  status: TicketStatus;
  priority?: string;
  projectId?: string;
}

const COLUMNS: { id: TicketStatus; label: string }[] = [
  { id: "backlog", label: "Backlog" },
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
];

const priorityVariant: Record<
  string,
  "default" | "teal" | "ok" | "warn" | "danger"
> = {
  low: "default",
  medium: "teal",
  high: "warn",
  urgent: "danger",
};

export function TicketBoard() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "backlog" as TicketStatus,
    priority: "medium",
  });

  async function loadTickets() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tickets");
      if (!res.ok) throw new Error(`Failed to load tickets (${res.status})`);
      const data = await res.json();
      setTickets(data.tickets ?? data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          status: form.status,
          priority: form.priority,
        }),
      });
      if (!res.ok) throw new Error(`Failed to create ticket (${res.status})`);
      setForm({ title: "", description: "", status: "backlog", priority: "medium" });
      setShowForm(false);
      await loadTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  }

  async function changeStatus(ticketId: string, status: TicketStatus) {
    setUpdating(ticketId);
    try {
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ticketId, status }),
      });
      if (!res.ok) throw new Error(`Failed to update ticket (${res.status})`);
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status } : t)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update ticket");
    } finally {
      setUpdating(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-teal-bright" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-mist">
          {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          New ticket
        </Button>
      </div>

      {error && (
        <Panel className="border-danger/30 bg-danger/5 text-sm text-danger">
          {error}
        </Panel>
      )}

      {showForm && (
        <Panel className="animate-fade-up">
          <form onSubmit={handleCreate} className="space-y-4">
            <h3 className="font-display text-sm font-semibold text-foam">
              Create ticket
            </h3>
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ticket title"
              required
            />
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Status"
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as TicketStatus,
                  })
                }
                options={COLUMNS.map((c) => ({
                  value: c.id,
                  label: c.label,
                }))}
              />
              <Select
                label="Priority"
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: e.target.value })
                }
                options={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                  { value: "urgent", label: "Urgent" },
                ]}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Create"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Panel>
      )}

      {tickets.length === 0 && !showForm ? (
        <EmptyState
          icon={Ticket}
          title="No tickets yet"
          description="Create a ticket to start tracking work across your team."
          action={
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />
              Create ticket
            </Button>
          }
        />
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colTickets = tickets.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className="flex w-64 shrink-0 flex-col gap-2"
              >
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-mist">
                    {col.label}
                  </h3>
                  <span className="text-xs text-mist/60 tabular-nums">
                    {colTickets.length}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2 min-h-[12rem]">
                  {colTickets.map((ticket) => (
                    <Panel
                      key={ticket.id}
                      padding="sm"
                      className={cn(
                        "group transition-colors hover:border-teal/25",
                        updating === ticket.id && "opacity-60",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mist/40"
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foam leading-snug">
                            {ticket.title}
                          </p>
                          {ticket.description && (
                            <p className="mt-1 line-clamp-2 text-xs text-mist">
                              {ticket.description}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            {ticket.priority && (
                              <Badge
                                variant={
                                  priorityVariant[ticket.priority] ?? "default"
                                }
                              >
                                {ticket.priority}
                              </Badge>
                            )}
                          </div>
                          <Select
                            value={ticket.status}
                            onChange={(e) =>
                              changeStatus(
                                ticket.id,
                                e.target.value as TicketStatus,
                              )
                            }
                            options={COLUMNS.map((c) => ({
                              value: c.id,
                              label: c.label,
                            }))}
                            className="mt-2 text-xs"
                            aria-label={`Change status for ${ticket.title}`}
                          />
                        </div>
                      </div>
                    </Panel>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
