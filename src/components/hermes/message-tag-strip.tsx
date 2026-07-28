"use client";

import type { HermesComposerTagMeta } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TAG_VARIANT: Record<
  HermesComposerTagMeta["kind"],
  "teal" | "default" | "warn" | "ok"
> = {
  cursor: "teal",
  repo: "default",
  ticket: "warn",
  pr: "ok",
  project: "ok",
};

interface MessageTagStripProps {
  tags?: HermesComposerTagMeta[];
  className?: string;
}

export function MessageTagStrip({ tags, className }: MessageTagStripProps) {
  if (!tags?.length) return null;

  return (
    <div className={cn("flex flex-wrap gap-1 mt-2", className)}>
      {tags.map((tag, i) => (
        <Badge key={`${tag.kind}-${tag.value}-${i}`} variant={TAG_VARIANT[tag.kind]}>
          {tag.label}
        </Badge>
      ))}
    </div>
  );
}
