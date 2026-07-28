import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 px-4 text-center animate-fade-up",
        className,
      )}
    >
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(45,184,168,0.08)] border border-[rgba(45,184,168,0.15)]">
          <Icon className="h-5 w-5 text-teal-bright" aria-hidden />
        </div>
      )}
      <div className="space-y-1">
        <h3 className="font-display text-base font-semibold text-foam">
          {title}
        </h3>
        {description && (
          <p className="max-w-sm text-sm text-mist">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
