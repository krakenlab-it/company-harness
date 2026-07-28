import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export function Panel({
  className,
  elevated = false,
  padding = "md",
  children,
  ...props
}: PanelProps) {
  return (
    <div
      className={cn(
        elevated ? "panel-elevated" : "panel",
        paddingMap[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
