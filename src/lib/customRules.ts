export interface CustomRule {
  id: string;
  name: string;
  verdict: "BUY" | "WAIT" | "SKIP";
  min_price: number | null;
  max_price: number | null;
  start_hour: number | null;
  end_hour: number | null;
  category: string | null;
  days_of_week: number[] | null;
  is_active: boolean;
  priority: number;
}

export interface RuleContext {
  price: number;
  category?: string | null;
  at?: Date;
}

function hourInWindow(hour: number, start: number, end: number) {
  // Inclusive start, exclusive end. Supports overnight windows (22 -> 6).
  if (start === end) return true;
  return start < end ? hour >= start && hour < end : hour >= start || hour < end;
}

export function ruleMatches(rule: CustomRule, ctx: RuleContext): boolean {
  if (!rule.is_active) return false;
  const now = ctx.at ?? new Date();

  if (rule.min_price != null && ctx.price < rule.min_price) return false;
  if (rule.max_price != null && ctx.price > rule.max_price) return false;
  if (rule.category && rule.category !== ctx.category) return false;
  if (rule.days_of_week?.length && !rule.days_of_week.includes(now.getDay())) return false;
  if (rule.start_hour != null && rule.end_hour != null &&
      !hourInWindow(now.getHours(), rule.start_hour, rule.end_hour)) return false;

  // A rule with no conditions at all should never fire.
  const hasCondition =
    rule.min_price != null || rule.max_price != null || !!rule.category ||
    !!rule.days_of_week?.length || (rule.start_hour != null && rule.end_hour != null);
  return hasCondition;
}

export function findMatchingRule(rules: CustomRule[] | undefined, ctx: RuleContext): CustomRule | null {
  if (!rules?.length) return null;
  const matches = rules.filter((r) => ruleMatches(r, ctx));
  if (!matches.length) return null;
  return matches.sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name))[0];
}

const pad = (n: number) => String(n).padStart(2, "0");

export function formatHour(h: number) {
  const suffix = h < 12 ? "am" : "pm";
  const base = h % 12 === 0 ? 12 : h % 12;
  return `${base}${suffix}`;
}

export function describeRule(rule: CustomRule): string {
  const parts: string[] = [];
  if (rule.min_price != null && rule.max_price != null) parts.push(`$${rule.min_price}–$${rule.max_price}`);
  else if (rule.min_price != null) parts.push(`over $${rule.min_price}`);
  else if (rule.max_price != null) parts.push(`under $${rule.max_price}`);
  if (rule.category) parts.push(`in ${rule.category}`);
  if (rule.start_hour != null && rule.end_hour != null)
    parts.push(`between ${formatHour(rule.start_hour)} and ${formatHour(rule.end_hour)}`);
  if (rule.days_of_week?.length)
    parts.push(`on ${rule.days_of_week.map((d) => DAY_LABELS[d]).join(", ")}`);
  return `Always ${rule.verdict} anything ${parts.join(" ") || "(no conditions)"}`;
}

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => ({ value: h, label: `${pad(h)}:00 (${formatHour(h)})` }));
