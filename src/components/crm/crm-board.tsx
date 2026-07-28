"use client";

import { useEffect, useState } from "react";
import {
  Briefcase,
  Loader2,
  Plus,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

interface Contact {
  id: string;
  name: string;
  email?: string;
  company?: string;
  role?: string;
}

interface Deal {
  id: string;
  title: string;
  value?: number;
  stage: string;
  contactId?: string;
  contactName?: string;
}

interface HermesInsight {
  summary?: string;
  recommendations?: string[];
  updatedAt?: string;
}

export function CrmBoard() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [insight, setInsight] = useState<HermesInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showDealForm, setShowDealForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
  });
  const [dealForm, setDealForm] = useState({
    title: "",
    value: "",
    stage: "lead",
    contactId: "",
  });

  async function loadCrm() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/crm");
      if (!res.ok) throw new Error(`Failed to load CRM (${res.status})`);
      const data = await res.json();
      setContacts(data.contacts ?? []);
      setDeals(data.deals ?? []);
      setInsight(data.hermesInsight ?? data.insight ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load CRM");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCrm();
  }, []);

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault();
    if (!contactForm.name.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "contact",
          ...contactForm,
          name: contactForm.name.trim(),
        }),
      });
      if (!res.ok) throw new Error(`Failed to add contact (${res.status})`);
      setContactForm({ name: "", email: "", company: "", role: "" });
      setShowContactForm(false);
      await loadCrm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add contact");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddDeal(e: React.FormEvent) {
    e.preventDefault();
    if (!dealForm.title.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "deal",
          title: dealForm.title.trim(),
          value: dealForm.value ? parseFloat(dealForm.value) : undefined,
          stage: dealForm.stage,
          contactId: dealForm.contactId || undefined,
        }),
      });
      if (!res.ok) throw new Error(`Failed to add deal (${res.status})`);
      setDealForm({ title: "", value: "", stage: "lead", contactId: "" });
      setShowDealForm(false);
      await loadCrm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add deal");
    } finally {
      setSubmitting(false);
    }
  }

  const stageVariant: Record<
    string,
    "default" | "teal" | "ok" | "warn" | "danger"
  > = {
    lead: "default",
    qualified: "teal",
    proposal: "warn",
    negotiation: "warn",
    won: "ok",
    lost: "danger",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-teal-bright" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-up">
      {error && (
        <Panel className="border-danger/30 bg-danger/5 text-sm text-danger">
          {error}
        </Panel>
      )}

      {insight && (insight.summary || insight.recommendations?.length) && (
        <Panel elevated className="animate-fade-up">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal/20">
              <Sparkles className="h-4 w-4 text-teal-bright" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-sm font-semibold text-foam">
                Hermes insight
              </h2>
              {insight.summary && (
                <p className="mt-1 text-sm text-mist leading-relaxed">
                  {insight.summary}
                </p>
              )}
              {insight.recommendations && insight.recommendations.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {insight.recommendations.map((rec) => (
                    <li
                      key={rec}
                      className="flex items-start gap-2 text-sm text-foam/90"
                    >
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-bright" />
                      {rec}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Panel>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Contacts */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-mist flex items-center gap-2">
              <Users className="h-4 w-4" />
              Contacts
              <span className="text-mist/60">({contacts.length})</span>
            </h2>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowContactForm(!showContactForm)}
            >
              <UserPlus className="h-4 w-4" />
              Add
            </Button>
          </div>

          {showContactForm && (
            <Panel className="animate-fade-up">
              <form onSubmit={handleAddContact} className="space-y-3">
                <Input
                  label="Name"
                  value={contactForm.name}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, name: e.target.value })
                  }
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={contactForm.email}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, email: e.target.value })
                  }
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Company"
                    value={contactForm.company}
                    onChange={(e) =>
                      setContactForm({
                        ...contactForm,
                        company: e.target.value,
                      })
                    }
                  />
                  <Input
                    label="Role"
                    value={contactForm.role}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, role: e.target.value })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={submitting}>
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowContactForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Panel>
          )}

          {contacts.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No contacts"
              description="Add contacts to manage relationships."
            />
          ) : (
            <div className="space-y-2">
              {contacts.map((contact) => (
                <Panel key={contact.id} padding="sm">
                  <p className="font-medium text-foam">{contact.name}</p>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-mist">
                    {contact.email && <span>{contact.email}</span>}
                    {contact.company && <span>{contact.company}</span>}
                    {contact.role && <span>{contact.role}</span>}
                  </div>
                </Panel>
              ))}
            </div>
          )}
        </section>

        {/* Deals */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-mist flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Deals
              <span className="text-mist/60">({deals.length})</span>
            </h2>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDealForm(!showDealForm)}
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          {showDealForm && (
            <Panel className="animate-fade-up">
              <form onSubmit={handleAddDeal} className="space-y-3">
                <Input
                  label="Title"
                  value={dealForm.title}
                  onChange={(e) =>
                    setDealForm({ ...dealForm, title: e.target.value })
                  }
                  required
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Value ($)"
                    type="number"
                    min="0"
                    value={dealForm.value}
                    onChange={(e) =>
                      setDealForm({ ...dealForm, value: e.target.value })
                    }
                  />
                  <Select
                    label="Stage"
                    value={dealForm.stage}
                    onChange={(e) =>
                      setDealForm({ ...dealForm, stage: e.target.value })
                    }
                    options={[
                      { value: "lead", label: "Lead" },
                      { value: "qualified", label: "Qualified" },
                      { value: "proposal", label: "Proposal" },
                      { value: "negotiation", label: "Negotiation" },
                      { value: "won", label: "Won" },
                      { value: "lost", label: "Lost" },
                    ]}
                  />
                </div>
                {contacts.length > 0 && (
                  <Select
                    label="Contact"
                    value={dealForm.contactId}
                    onChange={(e) =>
                      setDealForm({ ...dealForm, contactId: e.target.value })
                    }
                    options={[
                      { value: "", label: "None" },
                      ...contacts.map((c) => ({
                        value: c.id,
                        label: c.name,
                      })),
                    ]}
                  />
                )}
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={submitting}>
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowDealForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Panel>
          )}

          {deals.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No deals"
              description="Track pipeline deals and their stages."
            />
          ) : (
            <div className="space-y-2">
              {deals.map((deal) => (
                <Panel
                  key={deal.id}
                  padding="sm"
                  className={cn("transition-colors hover:border-teal/20")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-foam">{deal.title}</p>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-mist">
                        {deal.value != null && (
                          <span className="font-medium text-teal-bright">
                            ${deal.value.toLocaleString()}
                          </span>
                        )}
                        {deal.contactName && <span>{deal.contactName}</span>}
                      </div>
                    </div>
                    <Badge variant={stageVariant[deal.stage] ?? "default"}>
                      {deal.stage}
                    </Badge>
                  </div>
                </Panel>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
