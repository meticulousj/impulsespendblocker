import { Link } from "react-router-dom";
import { Sparkles, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePurchaseHistory } from "@/hooks/usePurchaseHistory";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { HourHeatmap } from "@/components/HourHeatmap";
import { InsightCards } from "@/components/InsightCards";
import { useLatestDigest } from "@/hooks/useInsights";

export default function Insights() {
  const { user, isPro } = useAuth();
  const { data: decisions } = usePurchaseHistory();
  const { data: digest } = useLatestDigest();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-3">
          <Lock className="w-8 h-8 mx-auto text-muted-foreground" />
          <h1 className="text-lg font-semibold">Sign in to view insights</h1>
          <p className="text-sm text-muted-foreground">
            Insights unlock after you save a few purchase decisions.
          </p>
          <Link to="/" className="inline-block text-sm text-primary hover:underline">
            Go home →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8 space-y-6">
      <header className="space-y-1">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
          <Sparkles className="w-3 h-3" /> Insights
        </div>
        <h1 className="text-2xl font-display font-semibold">Your spending patterns</h1>
        <p className="text-sm text-muted-foreground">
          Trends across categories, times, and impulse triggers.
        </p>
      </header>

      {digest && isPro && <InsightCards digest={digest} />}

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold mb-3">By category</h2>
        <CategoryBreakdown decisions={decisions ?? []} />
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold mb-3">When impulses hit</h2>
        <HourHeatmap decisions={decisions ?? []} />
      </section>
    </div>
  );
}