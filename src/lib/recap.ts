import type { PurchaseDecision } from "@/hooks/usePurchaseHistory";

export type RecapPeriod = "week" | "month";

export interface RecapSummary {
  period: RecapPeriod;
  start: Date;
  end: Date;
  label: string;
  avoided: PurchaseDecision[];
  bought: PurchaseDecision[];
  overrides: PurchaseDecision[];
  savedAmount: number;
  spentAmount: number;
  topCategory: { name: string; total: number } | null;
  biggest: PurchaseDecision | null;
}

/** Start of the previous complete week (Mon) or month, plus its end. */
export function getRecapRange(period: RecapPeriod, now = new Date()) {
  if (period === "week") {
    const day = now.getDay();
    const daysSinceMonday = (day + 6) % 7;
    const thisMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday);
    const start = new Date(thisMonday);
    start.setDate(thisMonday.getDate() - 7);
    const end = new Date(thisMonday);
    end.setMilliseconds(-1);
    return { start, end };
  }
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 1);
  end.setMilliseconds(-1);
  return { start, end };
}

export function formatRange(start: Date, end: Date, period: RecapPeriod) {
  if (period === "month") {
    return start.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
}

export function buildRecap(
  decisions: PurchaseDecision[],
  period: RecapPeriod,
  now = new Date(),
): RecapSummary {
  const { start, end } = getRecapRange(period, now);
  const inRange = decisions.filter((d) => {
    const t = new Date(d.created_at).getTime();
    return t >= start.getTime() && t <= end.getTime();
  });

  const avoided = inRange.filter((d) => (d.verdict === "SKIP" || d.verdict === "WAIT") && !d.overridden);
  const overrides = inRange.filter((d) => d.overridden);
  const bought = inRange.filter((d) => d.verdict === "BUY" || d.overridden);

  const savedAmount = avoided.reduce((s, d) => s + Number(d.price || 0), 0);
  const spentAmount = bought.reduce((s, d) => s + Number(d.price || 0), 0);

  const byCategory: Record<string, number> = {};
  for (const d of avoided) {
    const c = d.category || "Other";
    byCategory[c] = (byCategory[c] ?? 0) + Number(d.price || 0);
  }
  const topEntry = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

  const biggest = avoided.slice().sort((a, b) => Number(b.price) - Number(a.price))[0] ?? null;

  return {
    period,
    start,
    end,
    label: formatRange(start, end, period),
    avoided,
    bought,
    overrides,
    savedAmount,
    spentAmount,
    topCategory: topEntry ? { name: topEntry[0], total: topEntry[1] } : null,
    biggest,
  };
}

export function recapKey(period: RecapPeriod, start: Date) {
  return `recap-dismissed:${period}:${start.toISOString().slice(0, 10)}`;
}
