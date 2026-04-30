export type Archetype = "impulse" | "deal_hunter" | "saver";

export interface ArchetypeMeta {
  id: Archetype;
  label: string;
  emoji: string;
  tagline: string;
  description: string;
  // Rule engine thresholds (price / monthly income)
  skipRatio: number;
  waitRatio: number;
  // Wait-period bias: shift suggested hold up (positive) or down (negative) by tiers
  waitTierShift: number;
  // Tone instruction for the AI verdict
  tonePrompt: string;
}

export const ARCHETYPES: Record<Archetype, ArchetypeMeta> = {
  impulse: {
    id: "impulse",
    label: "Impulse Buyer",
    emoji: "⚡",
    tagline: "You buy first, think later.",
    description:
      "You feel the urge and act fast. We'll be a little firmer with you — protective, not preachy.",
    skipRatio: 0.15,
    waitRatio: 0.05,
    waitTierShift: 1,
    tonePrompt:
      "User is an IMPULSE BUYER. Be firm, protective, and direct. Push back harder on borderline purchases. Use phrases like 'pump the brakes' and 'sleep on it'. Don't be cruel — be the friend who stops them from doing something they'll regret.",
  },
  deal_hunter: {
    id: "deal_hunter",
    label: "Deal Hunter",
    emoji: "🏷️",
    tagline: "If it's not a deal, it doesn't count.",
    description:
      "You love the thrill of a markdown. We'll frame advice around value, ROI, and whether the deal is actually a deal.",
    skipRatio: 0.25,
    waitRatio: 0.1,
    waitTierShift: 0,
    tonePrompt:
      "User is a DEAL HUNTER. Frame advice around value, cost-per-use, and whether the price actually represents savings. Acknowledge their bargain instincts but call out 'fake deals' (buying things they don't need just because they're discounted).",
  },
  saver: {
    id: "saver",
    label: "Saver",
    emoji: "🏦",
    tagline: "You'd rather see the number go up.",
    description:
      "You're cautious by nature. We'll loosen up on small wins so you remember it's okay to enjoy money too.",
    skipRatio: 0.35,
    waitRatio: 0.2,
    waitTierShift: -1,
    tonePrompt:
      "User is a SAVER. Be warm and validating. Remind them that money is a tool, not a trophy. For affordable purchases, give them explicit permission to enjoy. Only push back hard when something genuinely threatens their goals.",
  },
};

export function getArchetypeMeta(a: Archetype | null | undefined): ArchetypeMeta | null {
  if (!a) return null;
  return ARCHETYPES[a] ?? null;
}
