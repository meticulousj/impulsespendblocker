import { Sparkles, AlertTriangle, Info, Lock, RefreshCw } from "lucide-react";
import type { InsightItem } from "@/hooks/useInsights";

const sevConfig = {
  alert: { icon: AlertTriangle, color: "text-verdict-skip", bg: "bg-verdict-skip/10", border: "border-verdict-skip/20" },
  warn: { icon: Sparkles, color: "text-verdict-wait", bg: "bg-verdict-wait/10", border: "border-verdict-wait/20" },
  info: { icon: Info, color: "text-primary", bg: "bg-primary/5", border: "border-primary/20" },
} as const;

export function InsightCards({
  insights,
  isPro,
  onUpgrade,
  onRefresh,
  refreshing,
  generatedAt,
}: {
  insights: InsightItem[];
  isPro: boolean;
  onUpgrade: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  generatedAt?: string | null;
}) {
  const placeholders: InsightItem[] = [
    { headline: "You impulse-buy gadgets at 11pm", detail: "4 attempts this week, 2 overrides.", severity: "alert" },
    { headline: "Friday-night food orders are your biggest WAIT category", detail: "Avg ticket $48.", severity: "warn" },
    { headline: "60% of SKIPs on clothing get overridden", detail: "Your weakness this month.", severity: "info" },
  ];

  const items = isPro && insights.length > 0 ? insights : placeholders;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold">AI-detected patterns</p>
        </div>
        {isPro && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Analyzing…" : "Refresh"}
          </button>
        )}
      </div>

      <div className="relative">
        <div className={`grid gap-2 sm:grid-cols-2 ${!isPro ? "blur-[3px] select-none pointer-events-none" : ""}`}>
          {items.map((it, i) => {
            const cfg = sevConfig[it.severity] ?? sevConfig.info;
            const Icon = cfg.icon;
            return (
              <div key={i} className={`rounded-xl border p-3 ${cfg.bg} ${cfg.border}`}>
                <div className="flex items-start gap-2">
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.color}`} />
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-sm font-semibold">{it.headline}</p>
                    <p className="text-xs text-muted-foreground">{it.detail}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!isPro && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={onUpgrade}
              className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-card px-4 py-3 text-xs font-semibold text-primary shadow-lg hover:bg-primary/5 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              Unlock AI insights — Pro $5/mo
            </button>
          </div>
        )}
      </div>

      {isPro && generatedAt && (
        <p className="text-[10px] text-muted-foreground text-right">
          Generated {new Date(generatedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}