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
        "flex flex-col gap-4 border-b border-[rgba(122,154,171,0.12)] bg-ocean-subtle/50 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 animate-fade-up",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="font-display text-xl font-bold tracking-tight text-foam sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-sm text-mist">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </header>
  );
}
