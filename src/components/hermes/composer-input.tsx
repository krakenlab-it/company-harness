"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  highlightComposerText,
  type ComposerTagKind,
} from "@/lib/hermes/composer-tags";

const TAG_CLASS: Record<ComposerTagKind, string> = {
  cursor: "text-teal-bright font-semibold bg-teal-bright/10 rounded px-0.5",
  marketing: "text-rose-500 font-semibold bg-rose-500/10 rounded px-0.5",
  repo: "text-sky-600 font-medium bg-sky-500/10 rounded px-0.5",
  ticket: "text-amber-600 font-medium bg-amber-500/10 rounded px-0.5",
  pr: "text-violet-600 font-medium bg-violet-500/10 rounded px-0.5",
  project: "text-emerald-600 font-medium bg-emerald-500/10 rounded px-0.5",
};

export interface ComposerInputHandle {
  focus: () => void;
}

interface ComposerInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  placeholder?: string;
  "aria-label"?: string;
}

export const ComposerInput = forwardRef<ComposerInputHandle, ComposerInputProps>(
  function ComposerInput(
    {
      value,
      onChange,
      onKeyDown,
      disabled,
      placeholder,
      "aria-label": ariaLabel,
    },
    ref,
  ) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const segments = highlightComposerText(value);

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
    }));

    return (
      <div className="relative flex-1 min-w-0">
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words py-2 text-sm leading-relaxed text-foam"
          aria-hidden
        >
          {value ? (
            segments.map((seg, i) =>
              seg.kind && seg.kind in TAG_CLASS ? (
                <span key={i} className={TAG_CLASS[seg.kind as ComposerTagKind]}>
                  {seg.text}
                </span>
              ) : (
                <span key={i}>{seg.text}</span>
              ),
            )
          ) : (
            <span className="text-sand">{placeholder}</span>
          )}
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder=""
          disabled={disabled}
          rows={1}
          aria-label={ariaLabel}
          className={cn(
            "relative z-10 w-full resize-none bg-transparent py-2 text-sm leading-relaxed",
            "text-transparent caret-foam outline-none min-h-[28px] max-h-[160px]",
          )}
          spellCheck={false}
        />
      </div>
    );
  },
);
