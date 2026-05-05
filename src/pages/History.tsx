import { useMemo } from "react";
import { usePurchaseHistory } from "@/hooks/usePurchaseHistory";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { HourHeatmap } from "@/components/HourHeatmap";
import { InsightCards } from "@/components/InsightCards";
import { useLatestDigest, useRefreshInsights } from "@/hooks/useInsights";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft,
  TrendingDown,
  ShieldCheck,
  Clock,
  XCircle,
  PartyPopper,
  ShoppingBag,
  PiggyBank,
  BarChart3,
  Ban,
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
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-muted-foreground text-sm">Sign in to view your history.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-card border border-border hover:bg-accent transition-colors active:scale-[0.97]"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Purchase Dashboard</h1>
            <p className="text-xs text-muted-foreground">Your spending decisions & savings over time</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : !decisions?.length ? (
          <div className="text-center py-16 space-y-2">
            <ShoppingBag className="w-10 h-10 text-muted-foreground/40 mx-auto" />
            <p className="text-muted-foreground text-sm">No decisions yet</p>
            <Link to="/" className="text-sm text-primary hover:underline">
              Analyze your first purchase →
            </Link>
          </div>
        ) : (
          <>
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

            {/* Hero savings card */}
            {stats && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 flex items-center gap-5">
                <div className="shrink-0 w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <PiggyBank className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Money saved by not buying</p>
                  <p className="text-3xl font-bold font-mono text-primary">
                    ${stats.savedBySkipping.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    across {stats.almostBought.length} item{stats.almostBought.length !== 1 ? "s" : ""} you decided against
                  </p>
                </div>
              </div>
            )}

            {/* Stat grid */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  label="Total analyzed"
                  value={stats.total.toString()}
                  icon={<BarChart3 className="w-4 h-4 text-muted-foreground" />}
                />
                <StatCard
                  label="Approved"
                  value={stats.buyCount.toString()}
                  icon={<ShieldCheck className="w-4 h-4 text-verdict-buy" />}
                />
                <StatCard
                  label="Blocked"
                  value={(stats.skipCount + stats.waitCount).toString()}
                  icon={<Ban className="w-4 h-4 text-verdict-skip" />}
                />
                <StatCard
                  label="Overridden"
                  value={stats.overrideCount.toString()}
                  icon={<PartyPopper className="w-4 h-4 text-verdict-wait" />}
                />
              </div>
            )}

            {/* Verdict breakdown bar */}
            {stats && stats.total > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Verdict breakdown</p>
                <div className="flex h-3 rounded-full overflow-hidden">
                  {(["BUY", "WAIT", "SKIP"] as const).map((v) => {
                    const count = v === "BUY" ? stats.buyCount : v === "WAIT" ? stats.waitCount : stats.skipCount;
                    const pct = (count / stats.total) * 100;
                    if (pct === 0) return null;
                    const bgMap = { BUY: "bg-verdict-buy", WAIT: "bg-verdict-wait", SKIP: "bg-verdict-skip" };
                    return (
                      <div
                        key={v}
                        className={`${bgMap[v]} transition-all`}
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
                        <span className={`w-2 h-2 rounded-full ${v === "BUY" ? "bg-verdict-buy" : v === "WAIT" ? "bg-verdict-wait" : "bg-verdict-skip"}`} />
                        <span className="text-xs text-muted-foreground">
                          {cfg.label} ({count})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Almost bought section */}
            {stats && stats.almostBought.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold">Items you almost bought</p>
                  <span className="text-xs text-muted-foreground">({stats.almostBought.length})</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {stats.almostBought.slice(0, 6).map((d) => {
                    const v = d.verdict as keyof typeof verdictConfig;
                    const cfg = verdictConfig[v] || verdictConfig.SKIP;
                    return (
                      <div
                        key={d.id}
                        className="flex items-center gap-3 rounded-xl bg-card border border-border p-3"
                      >
                        <div className={`shrink-0 w-8 h-8 rounded-lg ${cfg.bg} ${cfg.color} flex items-center justify-center`}>
                          <cfg.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{d.item}</p>
                          <p className="text-xs text-muted-foreground">
                            Saved ${d.price.toLocaleString()}
                          </p>
                        </div>
                        <span className={`shrink-0 text-xs font-bold font-mono ${cfg.color}`}>{d.verdict}</span>
                      </div>
                    );
                  })}
                </div>
                {stats.almostBought.length > 6 && (
                  <p className="text-xs text-muted-foreground text-center">
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
                    <div
                      key={d.id}
                      className="flex items-center gap-4 rounded-xl bg-card border border-border p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className={`shrink-0 w-10 h-10 rounded-lg ${cfg.bg} ${cfg.color} flex items-center justify-center`}>
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
                      <span className={`shrink-0 text-xs font-bold font-mono ${cfg.color}`}>{d.verdict}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
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
    <div className="rounded-xl p-4 text-center border bg-card border-border">
      <div className="flex items-center justify-center gap-1.5">
        {icon}
        <p className="text-lg font-bold font-mono text-foreground">{value}</p>
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
