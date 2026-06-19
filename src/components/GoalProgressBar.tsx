import { Target } from "lucide-react";
import type { SavingsGoalWithProgress } from "@/hooks/useSavingsGoals";

interface GoalProgressBarProps {
  goal: SavingsGoalWithProgress;
  /** Optional extra contribution to preview as a lighter overlay (e.g. "if you skip this"). */
  pendingContribution?: number;
  compact?: boolean;
}

function formatCurrency(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}

function daysUntil(deadline: string | null): number | null {
  if (!deadline) return null;
  const d = new Date(deadline + "T00:00:00").getTime();
  const diff = d - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function GoalProgressBar({ goal, pendingContribution = 0, compact = false }: GoalProgressBarProps) {
  const saved = goal.progress.saved;
  const target = goal.target_amount;
  const currentPct = goal.percent;
  const projected = Math.min(100, target > 0 ? ((saved + pendingContribution) / target) * 100 : 0);
  const remaining = Math.max(0, target - saved);
  const days = daysUntil(goal.deadline);

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Target className="w-3.5 h-3.5 text-verdict-buy shrink-0" />
          <p className={`font-semibold truncate ${compact ? "text-sm" : "text-base"}`}>{goal.name}</p>
        </div>
        <p className={`font-mono tabular-nums text-muted-foreground shrink-0 ${compact ? "text-[11px]" : "text-xs"}`}>
          {formatCurrency(saved)} <span className="opacity-50">/ {formatCurrency(target)}</span>
        </p>
      </div>

      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        {pendingContribution > 0 && (
          <div
            className="absolute inset-y-0 left-0 bg-verdict-buy/30 transition-all"
            style={{ width: `${projected}%` }}
          />
        )}
        <div
          className="absolute inset-y-0 left-0 bg-verdict-buy transition-all"
          style={{ width: `${currentPct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
        <span>{currentPct.toFixed(currentPct < 10 ? 1 : 0)}% complete</span>
        <span>
          {remaining > 0 ? `${formatCurrency(remaining)} to go` : "Reached!"}
          {days !== null && days >= 0 && remaining > 0 && ` · ${days}d left`}
          {days !== null && days < 0 && remaining > 0 && ` · overdue`}
        </span>
      </div>
    </div>
  );
}