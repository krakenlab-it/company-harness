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
    <div className="flex flex-wrap items-center gap-3 text-xs text-mist border border-[rgba(122,154,171,0.12)] rounded-md px-3 py-2">
      <span className="uppercase tracking-wide shrink-0">Connectors</span>
      {connectors.map((c) => (
        <Link
          key={c.provider}
          href="/integrations"
          className="inline-flex items-center gap-1.5 hover:text-foam"
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              c.configured ? "bg-ok" : "bg-mist/40",
            )}
            aria-hidden
          />
          {PROVIDER_LABELS[c.provider] ?? c.provider}
        </Link>
      ))}
    </div>
  );
}
