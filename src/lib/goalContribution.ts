export type GoalContributionVerdict = "BUY" | "WAIT" | "SKIP";

/**
 * How much a single decision contributes to its linked savings goal.
 * - Honored SKIP / WAIT (not overridden): full price.
 * - BUY or any overridden verdict: $0 (you bought it, no savings).
 */
export function computeContribution(
  verdict: GoalContributionVerdict,
  overridden: boolean,
  price: number,
): number {
  if (overridden) return 0;
  if (verdict === "SKIP" || verdict === "WAIT") return Math.max(0, price);
  return 0;
}