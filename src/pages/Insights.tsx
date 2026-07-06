import { Link } from "react-router-dom";
import { Sparkles, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePurchaseHistory } from "@/hooks/usePurchaseHistory";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { HourHeatmap } from "@/components/HourHeatmap";
import { InsightCards } from "@/components/InsightCards";
import { useLatestDigest, useRefreshInsights } from "@/hooks/useInsights";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Insights() {
  const { user, isPro } = useAuth();
  const { data: decisions } = usePurchaseHistory();
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

      <InsightCards
        insights={digest?.insights ?? []}
        isPro={isPro}
        onUpgrade={handleUpgrade}
        onRefresh={() => refresh.mutate()}
        refreshing={refresh.isPending}
        generatedAt={digest?.generated_at}
      />
      <CategoryBreakdown decisions={decisions ?? []} />
      <HourHeatmap decisions={decisions ?? []} />
    </div>
  );
}