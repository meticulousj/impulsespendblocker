import { Link, useParams, useNavigate } from "react-router-dom";
import { Trash2, ArrowLeft } from "lucide-react";
import { useDecision, useDeleteDecision } from "@/hooks/usePurchaseHistory";
import { useUserProfile } from "@/hooks/useUserProfile";
import { computeImpact, formatHours, formatWorkDays } from "@/lib/impactMetrics";
import { toast } from "sonner";

const verdictClass: Record<string, string> = {
  BUY: "text-verdict-buy bg-verdict-buy/10",
  WAIT: "text-verdict-wait bg-verdict-wait/10",
  SKIP: "text-verdict-skip bg-verdict-skip/10",
};

export default function DecisionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: decision, isLoading } = useDecision(id);
  const { data: profile } = useUserProfile();
  const del = useDeleteDecision();

  if (isLoading) {
    return <p className="mx-auto max-w-md px-4 py-8 text-sm text-muted-foreground">Loading…</p>;
  }

  if (!decision) {
    return (
      <div className="mx-auto max-w-md px-4 py-8 space-y-4 text-center">
        <p className="text-sm text-muted-foreground">That decision no longer exists.</p>
        <Link to="/history" className="text-sm font-medium text-primary">
          ← Back to history
        </Link>
      </div>
    );
  }

  const impact = computeImpact({
    price: decision.price,
    income: decision.income,
    savings: decision.savings,
    hourlyWage: profile?.hourly_wage ?? null,
  });

  const handleDelete = () => {
    del.mutate(decision.id, {
      onSuccess: () => {
        toast.success("Decision deleted");
        navigate("/history");
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : "Could not delete"),
    });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-8 space-y-5">
      <Link
        to="/history"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        History
      </Link>

      <header className="space-y-2">
        <span
          className={`inline-block rounded-full px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider ${
            verdictClass[decision.verdict] ?? "bg-muted text-muted-foreground"
          }`}
        >
          {decision.verdict}
          {decision.overridden && " · OVERRIDDEN"}
        </span>
        <h1 className="text-2xl font-display font-semibold">{decision.item}</h1>
        <p className="font-mono text-sm text-muted-foreground">
          ${decision.price.toLocaleString()} ·{" "}
          {new Date(decision.created_at).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Time cost
          </p>
          <p className="mt-1 font-mono text-lg font-bold">{formatHours(impact.hours)}</p>
          <p className="text-[11px] text-muted-foreground">
            {impact.hours >= 8 ? formatWorkDays(impact.workDays) : "of work"}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Savings impact
          </p>
          <p className="mt-1 font-mono text-lg font-bold">
            {impact.savingsPct === null
              ? "—"
              : `${impact.savingsPct >= 100 ? ">100" : impact.savingsPct.toFixed(impact.savingsPct < 10 ? 1 : 0)}%`}
          </p>
          <p className="font-mono text-[11px] text-muted-foreground">
            ${Math.max(0, impact.savingsAfter).toLocaleString()} left
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Why</p>
          <p className="text-sm leading-relaxed text-foreground/80">{decision.reason}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Tip</p>
          <p className="text-sm leading-relaxed text-foreground/80">{decision.tip}</p>
        </div>
        {decision.category && (
          <p className="text-xs text-muted-foreground">Category: {decision.category}</p>
        )}
      </section>

      <Link
        to={`/?item=${encodeURIComponent(decision.item)}&price=${decision.price}`}
        className="block w-full rounded-xl bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
      >
        Re-analyze this purchase
      </Link>

      <button
        onClick={handleDelete}
        disabled={del.isPending}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
        Delete decision
      </button>
    </div>
  );
}