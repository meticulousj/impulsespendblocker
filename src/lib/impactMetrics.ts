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