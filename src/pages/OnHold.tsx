import { Link } from "react-router-dom";
import { Clock, CheckCircle2, XCircle, Hourglass } from "lucide-react";
import { usePurchaseHistory, useUpdateDecision } from "@/hooks/usePurchaseHistory";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/hooks/useAuth";
import { AuthForm } from "@/components/AuthForm";
import { getSuggestedPeriod, formatPeriod, formatCountdown } from "@/lib/waitPeriod";
import { toast } from "sonner";

export default function OnHold() {
  const { user } = useAuth();
  const { data: history, isLoading } = usePurchaseHistory();
  const { data: profile } = useUserProfile();
  const update = useUpdateDecision();

  const now = Date.now();
  const holds = (history ?? [])
    .filter((d) => d.verdict === "WAIT" && !d.overridden)
    .map((d) => {
      const hours = getSuggestedPeriod(d.price, d.income, "WAIT", profile?.archetype ?? null);
      const readyAt = new Date(d.created_at).getTime() + hours * 3600_000;
      return { ...d, holdHours: hours, readyAt, ready: readyAt <= now };
    })
    .sort((a, b) => a.readyAt - b.readyAt);

  const ready = holds.filter((h) => h.ready);
  const cooling = holds.filter((h) => !h.ready);

  const resolve = (id: string, choice: "bought" | "skipped") => {
    update.mutate(
      {
        id,
        updates: choice === "bought" ? { overridden: true } : { verdict: "SKIP" },
      },
      {
        onSuccess: () =>
          toast.success(choice === "bought" ? "Marked as bought" : "Skipped — nice save"),
        onError: (err) => toast.error(err instanceof Error ? err.message : "Could not update"),
      }
    );
  };

  return (
    <div className="mx-auto max-w-md px-4 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-display font-semibold">On hold</h1>
        <p className="text-sm text-muted-foreground">
          Purchases in a cooling-off window. Decide when the timer runs out.
        </p>
      </header>

      {!user ? (
        <AuthForm />
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : holds.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center space-y-3">
          <Hourglass className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nothing on hold right now.</p>
          <Link to="/" className="inline-block text-sm font-medium text-primary">
            Analyze a purchase →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {ready.length > 0 && (
            <section className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Ready to revisit ({ready.length})
              </p>
              {ready.map((h) => (
                <HoldCard key={h.id} hold={h} onResolve={resolve} pending={update.isPending} />
              ))}
            </section>
          )}
          {cooling.length > 0 && (
            <section className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Still cooling off ({cooling.length})
              </p>
              {cooling.map((h) => (
                <HoldCard key={h.id} hold={h} onResolve={resolve} pending={update.isPending} />
              ))}
            </section>
          )}
        </div>
      )}

      <p className="text-center">
        <Link to="/history" className="text-xs text-muted-foreground hover:text-foreground">
          ← Back to history
        </Link>
      </p>
    </div>
  );
}

interface HoldCardProps {
  hold: {
    id: string;
    item: string;
    price: number;
    holdHours: number;
    readyAt: number;
    ready: boolean;
  };
  onResolve: (id: string, choice: "bought" | "skipped") => void;
  pending: boolean;
}

function HoldCard({ hold, onResolve, pending }: HoldCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <Link to={`/history/${hold.id}`} className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{hold.item}</p>
          <p className="font-mono text-xs text-muted-foreground">
            ${hold.price.toLocaleString()} · {formatPeriod(hold.holdHours)} hold
          </p>
        </Link>
        <span
          className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
            hold.ready
              ? "bg-verdict-buy/10 text-verdict-buy"
              : "bg-verdict-wait/10 text-verdict-wait"
          }`}
        >
          <Clock className="h-3 w-3" />
          {formatCountdown(hold.readyAt - Date.now())}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          disabled={pending}
          onClick={() => onResolve(hold.id, "skipped")}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-accent transition-colors disabled:opacity-50"
        >
          <XCircle className="h-3.5 w-3.5" />
          Skip it
        </button>
        <button
          disabled={pending}
          onClick={() => onResolve(hold.id, "bought")}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-accent transition-colors disabled:opacity-50"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          I bought it
        </button>
      </div>
    </div>
  );
}