import { useMemo } from "react";
import { usePurchaseHistory } from "@/hooks/usePurchaseHistory";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { HourHeatmap } from "@/components/HourHeatmap";
import { InsightCards } from "@/components/InsightCards";
import { PageHeader } from "@/components/PageHeader";
import { useLatestDigest, useRefreshInsights } from "@/hooks/useInsights";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  TrendingDown,
  ShieldCheck,
  Clock,
  XCircle,
  PartyPopper,
  ShoppingBag,
  PiggyBank,
  BarChart3,
  Ban,
  LineChart,
} from "lucide-react";
import { format } from "date-fns";

const verdictConfig = {
  BUY: { icon: ShieldCheck, color: "text-verdict-buy", bg: "bg-verdict-buy/10", label: "Buy" },
  WAIT: { icon: Clock, color: "text-verdict-wait", bg: "bg-verdict-wait/10", label: "Wait" },
  SKIP: { icon: XCircle, color: "text-verdict-skip", bg: "bg-verdict-skip/10", label: "Skip" },
} as const;

export default function History() {
  const { user, isPro } = useAuth();
  const { data: decisions, isLoading } = usePurchaseHistory();
  const { data: digest } = useLatestDigest();
  const refresh = useRefreshInsights();

  const handleUpgrade = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
      if (error || data?.error) throw new Error(data?.error || "Checkout failed");
      if (data?.url) window.open(data.url, "_blank");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    }
  };

  const handleRefresh = () => {
    refresh.mutate(undefined, {
      onSuccess: (res: any) => {
        if (res?.skipped) toast("Not enough recent activity yet.");
        else toast.success("Insights refreshed");
      },
      onError: (err: any) => toast.error(err?.message || "Refresh failed"),
    });
  };

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
    const almostBought = decisions.filter(
      (d) => (d.verdict === "SKIP" || d.verdict === "WAIT") && !d.overridden
    );

    return { total, totalSpentOnBuys, savedBySkipping, buyCount, waitCount, skipCount, overrideCount, almostBought };
  }, [decisions]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="bento-tile w-full max-w-sm p-8 text-center">
          <p className="text-sm text-muted-foreground">Sign in to view your history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <PageHeader
        eyebrow="Dashboard"
        icon={LineChart}
        title="Purchase dashboard"
        description="Your spending decisions and savings over time."
        backTo="/"
        action={
          <Link
            to="/waits"
            className="inline-flex items-center rounded-2xl border border-border/70 bg-card px-3.5 py-2 text-xs font-semibold shadow-[var(--shadow-xs)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
          >
            On hold →
          </Link>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-3xl bg-muted" />
          ))}
        </div>
      ) : !decisions?.length ? (
        <div className="bento-tile space-y-3 p-12 text-center">
          <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No decisions yet</p>
          <Link to="/" className="inline-block text-sm font-semibold text-primary hover:underline">
            Analyze your first purchase →
          </Link>
        </div>
      ) : (
        <>
          {/* Hero savings card */}
          {stats && (
            <div className="bento-tile flex items-center gap-5 overflow-hidden bg-gradient-ink p-6 text-primary-foreground">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-foreground/10 text-primary-foreground">
                <PiggyBank className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <p className="eyebrow text-primary-foreground/60">Money saved by not buying</p>
                <p className="mt-1 font-mono text-4xl font-bold tracking-tight">
                  ${stats.savedBySkipping.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-primary-foreground/60">
                  across {stats.almostBought.length} item{stats.almostBought.length !== 1 ? "s" : ""} you decided against
                </p>
              </div>
            </div>
          )}

          {/* Stat grid */}
          {stats && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                label="Total analyzed"
                value={stats.total.toString()}
                icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
              />
              <StatCard
                label="Approved"
                value={stats.buyCount.toString()}
                icon={<ShieldCheck className="h-4 w-4 text-verdict-buy" />}
              />
              <StatCard
                label="Blocked"
                value={(stats.skipCount + stats.waitCount).toString()}
                icon={<Ban className="h-4 w-4 text-verdict-skip" />}
              />
              <StatCard
                label="Overridden"
                value={stats.overrideCount.toString()}
                icon={<PartyPopper className="h-4 w-4 text-verdict-wait" />}
              />
            </div>
          )}

          {/* Verdict breakdown bar */}
          {stats && stats.total > 0 && (
            <div className="bento-tile space-y-3">
              <p className="eyebrow">Verdict breakdown</p>
              <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-muted">
                {(["BUY", "WAIT", "SKIP"] as const).map((v) => {
                  const count = v === "BUY" ? stats.buyCount : v === "WAIT" ? stats.waitCount : stats.skipCount;
                  const pct = (count / stats.total) * 100;
                  if (pct === 0) return null;
                  const bgMap = { BUY: "bg-verdict-buy", WAIT: "bg-verdict-wait", SKIP: "bg-verdict-skip" };
                  return (
                    <div
                      key={v}
                      className={`${bgMap[v]} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                      title={`${v}: ${count} (${pct.toFixed(0)}%)`}
                    />
                  );
                })}
              </div>
              <div className="flex gap-4">
                {(["BUY", "WAIT", "SKIP"] as const).map((v) => {
                  const count = v === "BUY" ? stats.buyCount : v === "WAIT" ? stats.waitCount : stats.skipCount;
                  const cfg = verdictConfig[v];
                  return (
                    <div key={v} className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${v === "BUY" ? "bg-verdict-buy" : v === "WAIT" ? "bg-verdict-wait" : "bg-verdict-skip"}`} />
                      <span className="text-xs text-muted-foreground">
                        {cfg.label} <span className="font-mono">({count})</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Patterns / Insights section */}
          <div className="space-y-4">
            <InsightCards
              insights={digest?.insights ?? []}
              isPro={isPro}
              onUpgrade={handleUpgrade}
              onRefresh={handleRefresh}
              refreshing={refresh.isPending}
              generatedAt={digest?.generated_at}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <CategoryBreakdown decisions={decisions} />
              <HourHeatmap decisions={decisions} />
            </div>
          </div>

          {/* Almost bought section */}
          {stats && stats.almostBought.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Items you almost bought</p>
                <span className="font-mono text-xs text-muted-foreground">({stats.almostBought.length})</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {stats.almostBought.slice(0, 6).map((d) => {
                  const v = d.verdict as keyof typeof verdictConfig;
                  const cfg = verdictConfig[v] || verdictConfig.SKIP;
                  return (
                    <div
                      key={d.id}
                      className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3 shadow-[var(--shadow-xs)]"
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${cfg.bg} ${cfg.color}`}>
                        <cfg.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{d.item}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          Saved ${d.price.toLocaleString()}
                        </p>
                      </div>
                      <span className={`shrink-0 font-mono text-xs font-bold ${cfg.color}`}>{d.verdict}</span>
                    </div>
                  );
                })}
              </div>
              {stats.almostBought.length > 6 && (
                <p className="text-center text-xs text-muted-foreground">
                  + {stats.almostBought.length - 6} more items below
                </p>
              )}
            </div>
          )}

          {/* Full decision list */}
          <div className="space-y-3">
            <p className="text-sm font-semibold">All decisions</p>
            <div className="space-y-2">
              {decisions.map((d) => {
                const v = d.verdict as keyof typeof verdictConfig;
                const cfg = verdictConfig[v] || verdictConfig.BUY;
                const Icon = d.overridden ? PartyPopper : cfg.icon;
                return (
                  <Link
                    key={d.id}
                    to={`/history/${d.id}`}
                    className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-xs)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-card)] active:scale-[0.99]"
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cfg.bg} ${cfg.color}`}>
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{d.item}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-mono">${d.price.toLocaleString()}</span> · {format(new Date(d.created_at), "MMM d, yyyy")}
                        {d.overridden && <span className="ml-1.5 text-verdict-wait">(overridden)</span>}
                      </p>
                    </div>
                    <span className={`shrink-0 font-mono text-xs font-bold ${cfg.color}`}>{d.verdict}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bento-tile bento-tile-hover p-4 text-center">
      <div className="flex items-center justify-center gap-1.5">
        {icon}
        <p className="font-mono text-xl font-bold text-foreground">{value}</p>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
