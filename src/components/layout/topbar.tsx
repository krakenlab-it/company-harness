import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TopbarProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  mission?: string;
}

export function Topbar({
  title,
  description,
  actions,
  className,
  mission,
}: TopbarProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-2 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5",
        className,
      )}
    >
      <div className="min-w-0 space-y-0.5">
        {mission && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-teal-bright font-mono">
            {mission}
          </p>
        )}
        <h1 className="font-display text-base font-semibold tracking-tight text-foam sm:text-lg">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-xs text-mist leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </header>
  );
}
