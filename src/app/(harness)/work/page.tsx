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
        title="Work"
        description="Projects, tickets, and delivery timelines."
      />
      <div className="border-b border-[rgba(122,154,171,0.12)] px-4 sm:px-6">
        <nav className="flex gap-1" aria-label="Work sections">
          {TABS.map((t) => (
            <a
              key={t.id}
              href={`/work?tab=${t.id}`}
              className={cn(
                "px-3 py-2 text-xs uppercase tracking-wide border-b-2 -mb-px transition-colors",
                tab === t.id
                  ? "border-teal-bright text-foam"
                  : "border-transparent text-mist hover:text-foam",
              )}
              aria-current={tab === t.id ? "page" : undefined}
            >
              {t.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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
