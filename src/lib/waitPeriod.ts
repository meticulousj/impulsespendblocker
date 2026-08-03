import type { Archetype } from "@/lib/archetypeConfig";
import { ARCHETYPES } from "@/lib/archetypeConfig";

export const WAIT_PERIODS = [24, 48, 168] as const;

export function getSuggestedPeriod(
  price: number,
  income: number,
  verdict: "WAIT" | "SKIP",
  archetype?: Archetype | null
): number {
  const ratio = income > 0 ? price / income : 0;
  let tier = 0; // 0=24h, 1=48h, 2=7d
  if (verdict === "SKIP" || ratio > 0.25) tier = 2;
  else if (ratio > 0.1) tier = 1;
  const shift = archetype ? ARCHETYPES[archetype].waitTierShift : 0;
  tier = Math.max(0, Math.min(2, tier + shift));
  return WAIT_PERIODS[tier];
}

export function formatPeriod(hours: number): string {
  if (hours >= 168) return "7 days";
  return `${hours} hours`;
}

export function formatCountdown(msLeft: number): string {
  if (msLeft <= 0) return "Ready to revisit";
  const totalMinutes = Math.floor(msLeft / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}