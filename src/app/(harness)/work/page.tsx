"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { ProjectBoard } from "@/components/projects/project-board";
import { TicketBoard } from "@/components/tickets/ticket-board";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "projects", label: "Projects" },
  { id: "tickets", label: "Tickets" },
] as const;

function WorkTabs() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "projects";

  return (
    <>
      <Topbar
        mission="04 · Audit"
        title="Work"
        description="Delivery objects, ticket state, and timeline audit."
      />
      <div className="border-b border-[var(--border)] px-4 sm:px-5 bg-[var(--surface)]">
        <nav className="flex gap-0" aria-label="Work sections">
          {TABS.map((t) => (
            <a
              key={t.id}
              href={`/work?tab=${t.id}`}
              className={cn(
                "px-3 py-2 text-[10px] uppercase tracking-[0.08em] font-semibold border-b-2 -mb-px transition-colors",
                tab === t.id
                  ? "border-foam text-foam"
                  : "border-transparent text-sand hover:text-mist",
              )}
              aria-current={tab === t.id ? "page" : undefined}
            >
              {t.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-[var(--canvas)]">
        {tab === "tickets" ? <TicketBoard /> : <ProjectBoard />}
      </div>
    </>
  );
}

export default function WorkPage() {
  return (
    <Suspense fallback={<div className="p-6 text-mist text-sm">Loading…</div>}>
      <WorkTabs />
    </Suspense>
  );
}
