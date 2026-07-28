"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const PROVIDER_LABELS: Record<string, string> = {
  openrouter: "OpenRouter",
  trigger: "Trigger",
  gcp: "GCP",
  github: "GitHub",
  resend: "Resend",
};

export function ConnectorStrip({
  connectors,
}: {
  connectors: Array<{ provider: string; configured: boolean }>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-[11px] text-mist border border-[var(--border)] rounded-sm px-3 py-2 bg-[var(--surface)] font-mono">
      <span className="font-semibold uppercase tracking-[0.08em] text-sand shrink-0">
        Feeds
      </span>
      {connectors.map((c) => (
        <Link
          key={c.provider}
          href="/integrations"
          className="inline-flex items-center gap-1.5 hover:text-teal-bright transition-colors"
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              c.configured ? "bg-ok" : "bg-sand",
            )}
            aria-hidden
          />
          {PROVIDER_LABELS[c.provider] ?? c.provider}
        </Link>
      ))}
    </div>
  );
}
