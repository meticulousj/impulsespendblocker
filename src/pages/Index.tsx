import { useState, useCallback, useEffect } from "react";
import logoAsset from "@/assets/logo.png.asset.json";
import { Link, useSearchParams } from "react-router-dom";
import { SpendForm } from "@/components/SpendForm";
import { VerdictDisplay } from "@/components/VerdictDisplay";
import { AuthForm } from "@/components/AuthForm";
import { ProBadge } from "@/components/ProBadge";
import { analyzeSpend } from "@/lib/spendAnalyzer";
import { useAuth } from "@/hooks/useAuth";
import { useSaveDecision } from "@/hooks/usePurchaseHistory";
import { useUserProfile } from "@/hooks/useUserProfile";
import { PersonalityQuiz } from "@/components/PersonalityQuiz";
import { TextSizeToggle } from "@/components/TextSizeToggle";
import { ARCHETYPES } from "@/lib/archetypeConfig";
import { classifyCategory, isValidCategory } from "@/lib/categoryClassifier";
import { supabase } from "@/integrations/supabase/client";
import { History, LogOut, Sparkles, Settings, Target } from "lucide-react";
import { WaitPeriodSuggestion } from "@/components/WaitPeriodSuggestion";
import { GoalProgressBar } from "@/components/GoalProgressBar";
import { useSavingsGoals } from "@/hooks/useSavingsGoals";
import { computeContribution } from "@/lib/goalContribution";
import { useCustomRules } from "@/hooks/useCustomRules";
import { findMatchingRule, describeRule } from "@/lib/customRules";
import { toast } from "sonner";

type Verdict = "BUY" | "WAIT" | "SKIP";

interface Result {
  verdict: Verdict;
  reason: string;
  tip: string;
  isAI?: boolean;
  category?: string;
  ruleName?: string;
}

interface FormData {
  item: string;
  price: number;
  income: number;
  savings: number;
  goal: string;
  goal_id: string | null;
}

export default function Index() {
  const { user, signOut, loading: authLoading, isPro, refreshSubscription } = useAuth();
  const [result, setResult] = useState<Result | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const saveDecision = useSaveDecision();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const archetype = profile?.archetype ?? null;
  const [quizOpen, setQuizOpen] = useState(false);
  const { data: goals } = useSavingsGoals();
  const { data: customRules } = useCustomRules();
  const linkedGoal = formData?.goal_id ? goals?.find((g) => g.id === formData.goal_id) ?? null : null;
  const activeGoal = goals?.find((g) => g.is_active) ?? null;

  // Prefill from browser extension (?item=&price=) or PWA share target (?title=&text=&url=)
  const [prefill, setPrefill] = useState<{ item: string; price: string } | null>(null);
  useEffect(() => {
    const item = searchParams.get("item");
    const price = searchParams.get("price");
    const title = searchParams.get("title");
    const text = searchParams.get("text");
    const url = searchParams.get("url");

    if (item || price) {
      setPrefill({ item: item ?? "", price: price ?? "" });
      const next = new URLSearchParams(searchParams);
      ["item", "price", "src"].forEach((k) => next.delete(k));
      setSearchParams(next, { replace: true });
      toast.success("Purchase details loaded — add income to get a verdict.");
    } else if (title || text || url) {
      const blob = [title, text, url].filter(Boolean).join(" ");
      const match = blob.match(/(?:USD|US\$|\$|€|£|¥)\s?([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)/i);
      let priceGuess = "";
      if (match) {
        const raw = match[1];
        const lastComma = raw.lastIndexOf(",");
        const lastDot = raw.lastIndexOf(".");
        const normalized = lastComma > lastDot
          ? raw.replace(/\./g, "").replace(",", ".")
          : raw.replace(/,/g, "");
        priceGuess = String(parseFloat(normalized) || "");
      }
      const itemGuess = (title || text || url || "").slice(0, 120);
      setPrefill({ item: itemGuess, price: priceGuess });
      const next = new URLSearchParams(searchParams);
      ["title", "text", "url"].forEach((k) => next.delete(k));
      setSearchParams(next, { replace: true });
      toast.success("Shared item loaded — confirm the price and analyze.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-open quiz for logged-in users who haven't taken it
  useEffect(() => {
    if (user && !profileLoading && !profile) {
      setQuizOpen(true);
    }
  }, [user, profileLoading, profile]);

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
            body: { ...data, archetype },
          });
          if (error || aiResult?.error) {
            toast.error(aiResult?.error || "AI analysis failed. Falling back to rule engine.");
            // Fallback to rule engine
            analysis = { ...analyzeSpend(data, archetype), isAI: false };
          } else {
            analysis = { ...aiResult, isAI: true };
          }
        } else {
          // Simulate brief delay for rule engine
          await new Promise((r) => setTimeout(r, 600));
          analysis = { ...analyzeSpend(data, archetype), isAI: false };
        }

        const category = isValidCategory(analysis.category)
          ? analysis.category
          : classifyCategory(data.item);
        analysis.category = category;

        // Custom rules override everything they match
        const rule = findMatchingRule(customRules, { price: data.price, category });
        if (rule && rule.verdict !== analysis.verdict) {
          analysis = {
            ...analysis,
            verdict: rule.verdict,
            reason: `Your rule "${rule.name}" applies: ${describeRule(rule)}. That overrides the ${analysis.verdict} we would have given.`,
            tip: analysis.reason,
            ruleName: rule.name,
          };
          toast(`Custom rule applied: ${rule.name}`);
        } else if (rule) {
          analysis = { ...analysis, ruleName: rule.name };
        }

        setResult(analysis);

        // Save if logged in
        if (user) {
          const contributed = computeContribution(analysis.verdict, false, data.price);
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
            category,
            goal_id: data.goal_id,
            contributed_amount: contributed,
          });
        }
      } catch (err) {
        console.error(err);
        toast.error("Something went wrong.");
      } finally {
        setIsLoading(false);
      }
    },
    [useAI, isPro, user, saveDecision, archetype, customRules]
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
        category: result.category ?? classifyCategory(formData.item),
        goal_id: formData.goal_id,
        contributed_amount: 0,
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

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error || data?.error) throw new Error(data?.error || "Portal failed");
      if (data?.url) window.open(data.url, "_blank");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open subscription portal");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <img
            src={logoAsset.url}
            alt="Impulse Spend Blocker logo"
            className="mx-auto h-20 w-auto"
          />
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Before you swipe, let the numbers decide. Enter what you want to buy and your financial snapshot.
          </p>
        </div>

        {/* Auth bar */}
        {!authLoading && (
          <div className="flex items-center justify-center gap-3">
            <TextSizeToggle />
            <span className="text-border">·</span>
            {user ? (
              <>
                <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                  {user.email}
                </span>
                {archetype && (
                  <button
                    onClick={() => setQuizOpen(true)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    title="Retake spending personality quiz"
                  >
                    {ARCHETYPES[archetype].emoji} {ARCHETYPES[archetype].label}
                  </button>
                )}
                {isPro && <ProBadge />}
                {isPro && (
                  <button
                    onClick={handleManageSubscription}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    title="Manage subscription"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                )}
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
            {activeGoal && (
              <Link
                to="/goals"
                className="block rounded-2xl border border-verdict-buy/30 bg-verdict-buy/5 p-4 hover:bg-verdict-buy/10 transition-colors"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-verdict-buy mb-2">
                  Active goal
                </p>
                <GoalProgressBar goal={activeGoal} compact />
              </Link>
            )}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <SpendForm
                onSubmit={handleSubmit}
                isLoading={isLoading}
                initialItem={prefill?.item}
                initialPrice={prefill?.price}
                hourlyWage={profile?.hourly_wage ?? null}
              />
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
              price={formData?.price}
              income={formData?.income}
              savings={formData?.savings}
              linkedGoal={linkedGoal ?? null}
              emergencyFundTarget={profile?.emergency_fund_target ?? null}
              hourlyWage={profile?.hourly_wage ?? null}
            />
            {(result.verdict === "WAIT" || result.verdict === "SKIP") && formData && (
              <WaitPeriodSuggestion
                price={formData.price}
                income={formData.income}
                verdict={result.verdict}
                archetype={archetype}
              />
            )}
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
      <PersonalityQuiz open={quizOpen} onClose={() => setQuizOpen(false)} />
    </div>
  );
}
