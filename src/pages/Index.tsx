import { useState, useCallback, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SpendForm } from "@/components/SpendForm";
import { VerdictDisplay } from "@/components/VerdictDisplay";
import { AuthForm } from "@/components/AuthForm";
import { ProBadge } from "@/components/ProBadge";
import { analyzeSpend } from "@/lib/spendAnalyzer";
import { useAuth } from "@/hooks/useAuth";
import { useSaveDecision } from "@/hooks/usePurchaseHistory";
import { supabase } from "@/integrations/supabase/client";
import { ShieldAlert, History, LogOut, Sparkles, Settings } from "lucide-react";
import { toast } from "sonner";

type Verdict = "BUY" | "WAIT" | "SKIP";

interface Result {
  verdict: Verdict;
  reason: string;
  tip: string;
  isAI?: boolean;
}

interface FormData {
  item: string;
  price: number;
  income: number;
  savings: number;
  goal: string;
}

export default function Index() {
  const { user, signOut, loading: authLoading, isPro, refreshSubscription } = useAuth();
  const [result, setResult] = useState<Result | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const saveDecision = useSaveDecision();
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle checkout success
  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      toast.success("Welcome to Pro! AI verdicts are now unlocked. 🎉");
      refreshSubscription();
      setSearchParams({}, { replace: true });
    } else if (checkout === "cancel") {
      toast("Checkout cancelled.");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, refreshSubscription]);

  // Auto-enable AI mode for pro users
  useEffect(() => {
    if (isPro) setUseAI(true);
  }, [isPro]);

  const handleSubmit = useCallback(
    async (data: FormData) => {
      setIsLoading(true);
      setResult(null);
      setFormData(data);

      try {
        let analysis: Result;

        if (useAI && isPro) {
          // Call AI verdict edge function
          const { data: aiResult, error } = await supabase.functions.invoke("ai-verdict", {
            body: data,
          });
          if (error || aiResult?.error) {
            toast.error(aiResult?.error || "AI analysis failed. Falling back to rule engine.");
            // Fallback to rule engine
            analysis = { ...analyzeSpend(data), isAI: false };
          } else {
            analysis = { ...aiResult, isAI: true };
          }
        } else {
          // Simulate brief delay for rule engine
          await new Promise((r) => setTimeout(r, 600));
          analysis = { ...analyzeSpend(data), isAI: false };
        }

        setResult(analysis);

        // Save if logged in
        if (user) {
          saveDecision.mutate({
            item: data.item,
            price: data.price,
            income: data.income,
            savings: data.savings,
            goal: data.goal,
            verdict: analysis.verdict,
            overridden: false,
            reason: analysis.reason,
            tip: analysis.tip,
          });
        }
      } catch (err) {
        console.error(err);
        toast.error("Something went wrong.");
      } finally {
        setIsLoading(false);
      }
    },
    [useAI, isPro, user, saveDecision]
  );

  const handleOverride = useCallback(() => {
    if (user && formData && result) {
      saveDecision.mutate({
        item: formData.item,
        price: formData.price,
        income: formData.income,
        savings: formData.savings,
        goal: formData.goal,
        verdict: result.verdict,
        overridden: true,
        reason: result.reason,
        tip: result.tip,
      });
    }
  }, [user, formData, result, saveDecision]);

  const handleReset = () => {
    setResult(null);
    setFormData(null);
  };

  const handleUpgrade = async () => {
    if (!user) {
      toast.error("Sign in first to upgrade.");
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
      if (error || data?.error) throw new Error(data?.error || "Checkout failed");
      if (data?.url) window.open(data.url, "_blank");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary">
            <ShieldAlert className="w-6 h-6" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Impulse Spend Blocker
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Before you swipe, let the numbers decide. Enter what you want to buy and your financial snapshot.
          </p>
        </div>

        {/* Auth bar */}
        {!authLoading && (
          <div className="flex items-center justify-center gap-3">
            {user ? (
              <>
                <Link
                  to="/history"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <History className="w-3.5 h-3.5" />
                  History
                </Link>
                <span className="text-border">·</span>
                <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                  {user.email}
                </span>
                {isPro && <ProBadge />}
                <button
                  onClick={signOut}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Sign in below to save your history
              </p>
            )}
          </div>
        )}

        {/* AI toggle for Pro users */}
        {user && isPro && !result && (
          <div
            className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
              useAI
                ? "border-primary/30 bg-primary/5"
                : "border-border bg-card"
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className={`w-4 h-4 ${useAI ? "text-primary" : "text-muted-foreground"}`} />
              <span className="text-xs font-medium">
                {useAI ? "AI-powered analysis" : "Rule-based analysis"}
              </span>
            </div>
            <button
              onClick={() => setUseAI(!useAI)}
              className={`relative w-9 h-5 rounded-full transition-colors ${
                useAI ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  useAI ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        )}

        {/* Form or Result */}
        {!result ? (
          <div className="space-y-4">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <SpendForm onSubmit={handleSubmit} isLoading={isLoading} />
            </div>

            {/* Upgrade CTA for non-pro users */}
            {user && !isPro && (
              <button
                onClick={handleUpgrade}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs font-medium text-primary hover:bg-primary/10 transition-colors active:scale-[0.98]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Upgrade to Pro — AI-powered verdicts for $5/mo
              </button>
            )}

            {!user && !authLoading && (
              <>
                <AuthForm />
                <button
                  onClick={handleUpgrade}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs font-medium text-primary hover:bg-primary/10 transition-colors active:scale-[0.98]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Upgrade to Pro — AI-powered verdicts for $5/mo
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <VerdictDisplay
              verdict={result.verdict}
              reason={result.reason}
              tip={result.tip}
              isAI={result.isAI}
              onOverride={handleOverride}
            />
            <button
              onClick={handleReset}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2 active:scale-[0.98]"
            >
              ← Analyze another purchase
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/60">
          {user
            ? "Your decisions are saved securely to your account."
            : "Your data stays on your device. Nothing is stored or sent anywhere."}
        </p>
      </div>
    </div>
  );
}
