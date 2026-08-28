import { Link } from "react-router-dom";
import { Sparkles, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePurchaseHistory } from "@/hooks/usePurchaseHistory";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { HourHeatmap } from "@/components/HourHeatmap";
import { InsightCards } from "@/components/InsightCards";
import { RecapCard } from "@/components/RecapCard";
import { PageHeader } from "@/components/PageHeader";
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
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="bento-tile w-full max-w-sm space-y-3 p-8 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="font-display text-lg font-bold">Sign in to view insights</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Insights unlock after you save a few purchase decisions.
          </p>
          <Link to="/" className="inline-block text-sm font-semibold text-primary hover:underline">
            Go home →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <PageHeader
        eyebrow="Insights"
        icon={Sparkles}
        title="Your spending patterns"
        description="Trends across categories, times, and impulse triggers."
      />

      <InsightCards
        insights={digest?.insights ?? []}
        isPro={isPro}
        onUpgrade={handleUpgrade}
        onRefresh={() => refresh.mutate()}
        refreshing={refresh.isPending}
        generatedAt={digest?.generated_at}
      />
      <RecapCard decisions={decisions ?? []} />
      <div className="grid gap-4 sm:grid-cols-2">
        <CategoryBreakdown decisions={decisions ?? []} />
        <HourHeatmap decisions={decisions ?? []} />
      </div>
    </div>
  );
}
