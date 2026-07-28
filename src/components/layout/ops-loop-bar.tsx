"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    id: "observe",
    num: "01",
    label: "Observe",
    baseHref: "/",
    match: (p: string) => p === "/" || p.startsWith("/repos"),
  },
  {
    id: "analyze",
    num: "02",
    label: "Analyze",
    baseHref: "/hermes",
    match: (p: string) => p.startsWith("/hermes"),
  },
  {
    id: "act",
    num: "03",
    label: "Act",
    baseHref: "/agents",
    match: (p: string) => p.startsWith("/agents"),
  },
  {
    id: "audit",
    num: "04",
    label: "Audit",
    baseHref: "/work?tab=tickets",
    match: (p: string) => p.startsWith("/work") || p.startsWith("/projects"),
  },
] as const;

function buildHref(baseHref: string, repo: string | null): string {
  if (!repo) return baseHref;
  const sep = baseHref.includes("?") ? "&" : "?";
  return `${baseHref}${sep}repo=${encodeURIComponent(repo)}`;
}

function OpsLoopBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const repo = searchParams.get("repo");

  return (
    <div className="ops-loop" role="navigation" aria-label="Operations loop">
      {STEPS.map((step) => {
        const active = step.match(pathname);
        const href = buildHref(step.baseHref, repo);

        return (
          <Link
            key={step.id}
            href={href}
            className={cn(
              "ops-step",
              active && "ops-step-active",
              step.id === "act" && active && "ops-step-live",
            )}
            aria-current={active ? "step" : undefined}
          >
            <span className="ops-step-num">{step.num}</span>
            <span>{step.label}</span>
            {step.id === "act" && active && (
              <span className="ops-live-dot" aria-label="Active missions" />
            )}
          </Link>
        );
      })}
    </div>
  );
}

export function OpsLoopBar() {
  return (
    <Suspense fallback={<div className="ops-loop h-9 bg-[var(--surface)]" />}>
      <OpsLoopBarInner />
    </Suspense>
  );
}
