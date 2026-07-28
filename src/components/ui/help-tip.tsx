"use client";

import { HelpCircle } from "lucide-react";
import type { ReactNode } from "react";
import { GLOSSARY, type GlossaryKey } from "@/lib/help/glossary";
import { cn } from "@/lib/utils";

interface HelpTipProps {
  /** Glossary key or custom content */
  glossary?: GlossaryKey;
  label?: string;
  short?: string;
  detail?: string;
  learnMore?: string;
  className?: string;
  size?: "sm" | "md";
}

export function HelpTip({
  glossary,
  label,
  short,
  detail,
  learnMore,
  className,
  size = "sm",
}: HelpTipProps) {
  const entry = glossary ? GLOSSARY[glossary] : null;
  const title = label ?? entry?.term ?? "Help";
  const summary = short ?? entry?.short ?? "";
  const body = detail ?? entry?.detail ?? "";
  const href =
    learnMore ??
    (entry && "learnMore" in entry ? entry.learnMore : undefined);

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <span className={cn("group/help relative inline-flex align-middle", className)}>
      <button
        type="button"
        className={cn(
          "inline-flex items-center justify-center rounded-full text-mist",
          "hover:text-teal-bright hover:bg-teal-bright/10 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-bright/40",
          size === "sm" ? "h-5 w-5" : "h-6 w-6",
        )}
        aria-label={`About ${title}`}
      >
        <HelpCircle className={iconSize} aria-hidden />
      </button>
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 w-[min(18rem,calc(100vw-2rem))]",
          "bottom-full left-1/2 mb-2 -translate-x-1/2",
          "rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-lg",
          "opacity-0 scale-95 transition-all duration-150",
          "group-hover/help:opacity-100 group-hover/help:scale-100 group-focus-within/help:opacity-100 group-focus-within/help:scale-100",
          "group-hover/help:pointer-events-auto group-focus-within/help:pointer-events-auto",
        )}
      >
        <span className="block text-xs font-semibold text-foam">{title}</span>
        {summary && (
          <span className="mt-1 block text-xs text-mist leading-relaxed">
            {summary}
          </span>
        )}
        {body && body !== summary && (
          <span className="mt-2 block text-[11px] text-sand leading-relaxed border-t border-[var(--border-subtle)] pt-2">
            {body}
          </span>
        )}
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-[11px] text-teal-bright hover:underline pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            Learn more ↗
          </a>
        )}
      </span>
    </span>
  );
}

interface SectionHeaderProps {
  title: string;
  description?: string;
  glossary?: GlossaryKey;
  action?: ReactNode;
  className?: string;
}

/** Vercel-style section title row with optional help hover. */
export function SectionHeader({
  title,
  description,
  glossary,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-1.5">
          <h2 className="text-sm font-semibold text-foam tracking-tight">{title}</h2>
          {glossary && <HelpTip glossary={glossary} />}
        </div>
        {description && (
          <p className="text-xs text-mist leading-relaxed max-w-xl">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
