import type { MarketingTaskCategory } from "@/lib/types";
import { buildMarketingTaskDraft } from "@/lib/marketing/task-templates";

const MARKETING_PREFIX = /^@marketing\b/i;

const CATEGORY_PREFIX =
  /^(landing_page|ui_redesign|brand_copy|social_campaign|email_campaign|other)\s*:\s*/i;

const VALID_CATEGORIES: MarketingTaskCategory[] = [
  "landing_page",
  "ui_redesign",
  "brand_copy",
  "social_campaign",
  "email_campaign",
  "other",
];

export interface ParsedMarketingCommand {
  category: MarketingTaskCategory;
  prompt: string;
  title: string;
  brief: string;
}

export function isMarketingCommand(text: string): boolean {
  return MARKETING_PREFIX.test(text.trim());
}

export function parseMarketingCommand(text: string): ParsedMarketingCommand | null {
  const trimmed = text.trim();
  if (!MARKETING_PREFIX.test(trimmed)) return null;

  let rest = trimmed.replace(MARKETING_PREFIX, "").trim();
  if (!rest) return null;

  let category: MarketingTaskCategory = "other";
  const categoryMatch = rest.match(CATEGORY_PREFIX);
  if (categoryMatch) {
    const candidate = categoryMatch[1]!.toLowerCase() as MarketingTaskCategory;
    if (VALID_CATEGORIES.includes(candidate)) {
      category = candidate;
    }
    rest = rest.replace(CATEGORY_PREFIX, "").trim();
  } else if (/landing\s*page/i.test(rest)) {
    category = "landing_page";
  } else if (/ui\s*redesign|redesign\s*ui/i.test(rest)) {
    category = "ui_redesign";
  } else if (/copy|brand/i.test(rest)) {
    category = "brand_copy";
  } else if (/social/i.test(rest)) {
    category = "social_campaign";
  } else if (/email/i.test(rest)) {
    category = "email_campaign";
  }

  if (!rest) return null;

  const draft = buildMarketingTaskDraft({
    category,
    title: rest.length > 80 ? `${rest.slice(0, 77).trim()}…` : rest,
    brief: rest,
  });

  return {
    category,
    prompt: rest,
    title: draft.title,
    brief: draft.brief,
  };
}
