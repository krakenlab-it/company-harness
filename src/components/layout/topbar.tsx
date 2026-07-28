import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TopbarProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function Topbar({ title, description, actions, className }: TopbarProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 border-b border-[var(--border)] bg-[var(--canvas)] px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-5",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="font-display text-lg font-semibold tracking-tight text-foam sm:text-xl">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-sm text-mist leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2 pb-0.5">{actions}</div>
      )}
    </header>
  );
}
