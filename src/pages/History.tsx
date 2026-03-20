import { useMemo } from "react";
import { usePurchaseHistory } from "@/hooks/usePurchaseHistory";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { ArrowLeft, TrendingDown, ShieldCheck, Clock, XCircle, PartyPopper } from "lucide-react";
import { format } from "date-fns";

const verdictConfig = {
  BUY: { icon: ShieldCheck, color: "text-verdict-buy", bg: "bg-verdict-buy/10" },
  WAIT: { icon: Clock, color: "text-verdict-wait", bg: "bg-verdict-wait/10" },
  SKIP: { icon: XCircle, color: "text-verdict-skip", bg: "bg-verdict-skip/10" },
} as const;

export default function History() {
  const { user } = useAuth();
  const { data: decisions, isLoading } = usePurchaseHistory();

  const stats = useMemo(() => {
    if (!decisions?.length) return null;
    const total = decisions.length;
    const totalSpentOnBuys = decisions
      .filter((d) => d.verdict === "BUY" || d.overridden)
      .reduce((sum, d) => sum + d.price, 0);
    const savedBySkipping = decisions
      .filter((d) => (d.verdict === "SKIP" || d.verdict === "WAIT") && !d.overridden)
      .reduce((sum, d) => sum + d.price, 0);
    const buyCount = decisions.filter((d) => d.verdict === "BUY").length;
    const waitCount = decisions.filter((d) => d.verdict === "WAIT").length;
    const skipCount = decisions.filter((d) => d.verdict === "SKIP").length;
    const overrideCount = decisions.filter((d) => d.overridden).length;

    return { total, totalSpentOnBuys, savedBySkipping, buyCount, waitCount, skipCount, overrideCount };
  }, [decisions]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-muted-foreground text-sm">Sign in to view your history.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-card border border-border hover:bg-accent transition-colors active:scale-[0.97]"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Purchase History</h1>
            <p className="text-xs text-muted-foreground">Your spending decisions over time</p>
          </div>
        </div>

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total analyzed" value={stats.total.toString()} />
            <StatCard
              label="Money saved"
              value={`$${stats.savedBySkipping.toLocaleString()}`}
              highlight
              icon={<TrendingDown className="w-3.5 h-3.5 text-verdict-buy" />}
            />
            <StatCard label="Bought" value={stats.buyCount.toString()} />
            <StatCard label="Overridden" value={stats.overrideCount.toString()} />
          </div>
        )}

        {/* Verdict breakdown */}
        {stats && (
          <div className="flex gap-2">
            {(["BUY", "WAIT", "SKIP"] as const).map((v) => {
              const count = v === "BUY" ? stats.buyCount : v === "WAIT" ? stats.waitCount : stats.skipCount;
              const pct = stats.total > 0 ? ((count / stats.total) * 100).toFixed(0) : 0;
              const cfg = verdictConfig[v];
              return (
                <div
                  key={v}
                  className={`flex-1 rounded-xl ${cfg.bg} p-3 text-center`}
                >
                  <p className={`text-lg font-bold font-mono ${cfg.color}`}>{pct}%</p>
                  <p className="text-xs text-muted-foreground">{v}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Decision list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : !decisions?.length ? (
          <div className="text-center py-16 space-y-2">
            <p className="text-muted-foreground text-sm">No decisions yet</p>
            <Link to="/" className="text-sm text-primary hover:underline">
              Analyze your first purchase →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {decisions.map((d) => {
              const v = d.verdict as keyof typeof verdictConfig;
              const cfg = verdictConfig[v] || verdictConfig.BUY;
              const Icon = d.overridden ? PartyPopper : cfg.icon;
              return (
                <div
                  key={d.id}
                  className="flex items-center gap-4 rounded-xl bg-card border border-border p-4 hover:shadow-sm transition-shadow"
                >
                  <div
                    className={`shrink-0 w-10 h-10 rounded-lg ${cfg.bg} ${cfg.color} flex items-center justify-center`}
                  >
                    <Icon className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{d.item}</p>
                    <p className="text-xs text-muted-foreground">
                      ${d.price.toLocaleString()} · {format(new Date(d.created_at), "MMM d, yyyy")}
                      {d.overridden && (
                        <span className="ml-1.5 text-verdict-wait">(overridden)</span>
                      )}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-bold font-mono ${cfg.color}`}
                  >
                    {d.verdict}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
  icon,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl p-4 text-center border ${
        highlight ? "bg-verdict-buy/5 border-verdict-buy/20" : "bg-card border-border"
      }`}
    >
      <div className="flex items-center justify-center gap-1.5">
        {icon}
        <p className={`text-lg font-bold font-mono ${highlight ? "text-verdict-buy" : "text-foreground"}`}>
          {value}
        </p>
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
