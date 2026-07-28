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
    <div className="flex flex-wrap items-center gap-3 text-xs text-mist border border-[var(--border)] rounded-lg px-3 py-2.5 bg-[var(--surface)]">
      <span className="font-medium uppercase tracking-wider text-[10px] shrink-0">
        Connectors
      </span>
      {connectors.map((c) => (
        <Link
          key={c.provider}
          href="/integrations"
          className="inline-flex items-center gap-1.5 hover:text-foam transition-colors"
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
