import { ARCHETYPES, type Archetype } from "@/lib/archetypeConfig";

type Verdict = "BUY" | "WAIT" | "SKIP";

interface AnalysisInput {
  item: string;
  price: number;
  income: number;
  savings: number;
  goal: string;
}

interface AnalysisResult {
  verdict: Verdict;
  reason: string;
  tip: string;
}

export function analyzeSpend(input: AnalysisInput, archetype?: Archetype | null): AnalysisResult {
  const { item, price, income, savings, goal } = input;
  const priceToIncomeRatio = price / income;
  const savingsAfter = savings - price;
  const hasSavingsGoal = goal.length > 0;

  // Per-archetype thresholds (fall back to balanced defaults)
  const skipRatio = archetype ? ARCHETYPES[archetype].skipRatio : 0.25;
  const waitRatio = archetype ? ARCHETYPES[archetype].waitRatio : 0.1;

  // Hard SKIP: more than half of monthly income (universal)
  if (priceToIncomeRatio > 0.5) {
    return {
      verdict: "SKIP",
      reason: `At $${price.toLocaleString()}, this "${item}" costs more than half your monthly income ($${income.toLocaleString()}). That's a serious financial strain.`,
      tip: "A good rule: never spend more than 10-15% of monthly income on a single discretionary item without planning for it.",
    };
  }

  if (savings > 0 && savingsAfter < income * 0.5) {
    return {
      verdict: "SKIP",
      reason: `Buying "${item}" would drop your savings to $${savingsAfter.toLocaleString()}, leaving you with less than half a month's expenses as a safety net.`,
      tip: "Maintain at least 3 months of expenses in savings before discretionary purchases.",
    };
  }

  if (priceToIncomeRatio > skipRatio) {
    return {
      verdict: "SKIP",
      reason: `"${item}" at $${price.toLocaleString()} is ${(priceToIncomeRatio * 100).toFixed(0)}% of your monthly income. That's a big chunk for an impulse buy.`,
      tip: hasSavingsGoal
        ? `Put this money toward "${goal}" instead — future you will thank you.`
        : "Create a 'want fund' — save a fixed amount each month for discretionary items.",
    };
  }

  if (priceToIncomeRatio > waitRatio) {
    return {
      verdict: "WAIT",
      reason: `"${item}" at $${price.toLocaleString()} is ${(priceToIncomeRatio * 100).toFixed(0)}% of your income. Not unreasonable, but worth sleeping on.`,
      tip: "Apply the 48-hour rule: if you still want it after two days, it's less likely an impulse.",
    };
  }

  if (hasSavingsGoal && price > income * 0.05) {
    return {
      verdict: "WAIT",
      reason: `You have a goal to "${goal}." This $${price.toLocaleString()} purchase on "${item}" could slow your progress.`,
      tip: "Wait until you've hit your next savings milestone, then reward yourself guilt-free.",
    };
  }

  if (price > 50 && savings < income) {
    return {
      verdict: "WAIT",
      reason: `Your savings ($${savings.toLocaleString()}) are below one month's income. "${item}" isn't urgent — build your cushion first.`,
      tip: "Try the 30-day list: write it down. If you still want it in 30 days, budget for it.",
    };
  }

  if (priceToIncomeRatio <= 0.03) {
    return {
      verdict: "BUY",
      reason: `"${item}" at $${price.toLocaleString()} is only ${(priceToIncomeRatio * 100).toFixed(1)}% of your income. This won't move the needle on your finances.`,
      tip: "Small treats keep you motivated. Enjoy it without guilt.",
    };
  }

  return {
    verdict: "BUY",
    reason: `"${item}" at $${price.toLocaleString()} fits within a reasonable budget. Your savings can handle it.`,
    tip: hasSavingsGoal
      ? `Just make sure your "${goal}" contributions stay on track this month.`
      : "Consider setting up auto-transfers to savings so discretionary spending doesn't creep up.",
  };
}
