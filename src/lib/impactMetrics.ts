export interface ImpactInput {
  price: number;
  income: number;
  savings: number;
}

export interface ImpactResult {
  savingsPct: number | null; // null when savings = 0
  savingsAfter: number;
  hours: number;
  workDays: number; // only meaningful when hours >= 40
}

const WORK_HOURS_PER_MONTH = 160;
const WORK_HOURS_PER_DAY = 8;

export function computeImpact({ price, income, savings }: ImpactInput): ImpactResult {
  const savingsPct = savings > 0 ? (price / savings) * 100 : null;
  const savingsAfter = savings - price;
  const hourly = income > 0 ? income / WORK_HOURS_PER_MONTH : 0;
  const hours = hourly > 0 ? price / hourly : 0;
  const workDays = hours / WORK_HOURS_PER_DAY;
  return { savingsPct, savingsAfter, hours, workDays };
}

export type ImpactDriver = "savings" | "hours" | null;

/**
 * Determine which metric most influenced the verdict.
 * - For SKIP/WAIT: the metric that crossed the most painful threshold.
 * - For BUY: highlight the metric that confirms affordability most strongly
 *   (whichever is lowest relative to its comfort zone).
 * Returns null when neither input is meaningful.
 */
export function getImpactDriver(
  verdict: "BUY" | "WAIT" | "SKIP",
  impact: ImpactResult,
  { income, savings }: { income: number; savings: number }
): ImpactDriver {
  const hasHours = income > 0 && impact.hours > 0;
  const hasSavings = savings > 0 && impact.savingsPct !== null;
  if (!hasHours && !hasSavings) return null;
  if (!hasHours) return "savings";
  if (!hasSavings) return "hours";

  // Normalize each metric to a 0..1+ "pain" score relative to comfort thresholds.
  // Hours pain: price-to-income ratio (hours / 160). 0.25 = SKIP territory.
  const hoursPain = impact.hours / 160 / 0.25;
  // Savings pain: % of savings consumed. 50% = SKIP territory.
  const savingsPain = (impact.savingsPct ?? 0) / 100 / 0.5;

  if (verdict === "BUY") {
    // Highlight the more reassuring metric (lower pain).
    return savingsPain <= hoursPain ? "savings" : "hours";
  }
  // WAIT / SKIP: highlight the more painful metric.
  return savingsPain >= hoursPain ? "savings" : "hours";
}

export function formatHours(hours: number): string {
  if (hours <= 0) return "—";
  if (hours < 10) return `${hours.toFixed(1)}h`;
  return `${Math.round(hours)}h`;
}

export function formatWorkDays(workDays: number): string {
  if (workDays < 1) return "";
  const rounded = workDays < 10 ? workDays.toFixed(1) : Math.round(workDays).toString();
  return `~${rounded} work days`;
}