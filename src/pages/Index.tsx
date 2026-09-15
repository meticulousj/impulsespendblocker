import { useState, useCallback, useEffect } from "react";
import logoAsset from "@/assets/logo.png.asset.json";
import { Link, useSearchParams } from "react-router-dom";
import { SpendForm } from "@/components/SpendForm";
import { VerdictDisplay } from "@/components/VerdictDisplay";
import { AuthForm } from "@/components/AuthForm";
import { ProBadge } from "@/components/ProBadge";
import { analyzeSpend } from "@/lib/spendAnalyzer";
import { useAuth } from "@/hooks/useAuth";
import { useSaveDecision, usePurchaseHistory } from "@/hooks/usePurchaseHistory";
import { RecapBanner } from "@/components/RecapBanner";
import { useUserProfile } from "@/hooks/useUserProfile";
import { PersonalityQuiz } from "@/components/PersonalityQuiz";
import { TextSizeToggle } from "@/components/TextSizeToggle";
import { ARCHETYPES } from "@/lib/archetypeConfig";
import { classifyCategory, isValidCategory } from "@/lib/categoryClassifier";
import { supabase } from "@/integrations/supabase/client";
import { History, LogOut, Sparkles, Settings, Target, Play } from "lucide-react";
import { GuidedDemo } from "@/components/GuidedDemo";
import { WaitPeriodSuggestion } from "@/components/WaitPeriodSuggestion";
import { GoalProgressBar } from "@/components/GoalProgressBar";
import { useSavingsGoals } from "@/hooks/useSavingsGoals";
import { computeContribution } from "@/lib/goalContribution";
import { useCustomRules } from "@/hooks/useCustomRules";
import { findMatchingRule, describeRule } from "@/lib/customRules";
import { toast } from "sonner";
import {
  savePendingDecision,
  readPendingDecision,
  clearPendingDecision,
} from "@/lib/pendingDecision";

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
  const [demoOpen, setDemoOpen] = useState(false);
  const saveDecision = useSaveDecision();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const archetype = profile?.archetype ?? null;
  const [quizOpen, setQuizOpen] = useState(false);
  const { data: goals } = useSavingsGoals();
  const { data: history } = usePurchaseHistory();
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

        const contributed = computeContribution(analysis.verdict, false, data.price);
        const record = {
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
        };

        if (user) {
          saveDecision.mutate(record);
        } else {
          // Guests get the verdict first; the decision is saved once they sign up.
          savePendingDecision(record);
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
    if (!formData || !result) return;
    const record = {
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
    };
    if (user) {
      saveDecision.mutate(record);
    } else {
      savePendingDecision(record);
    }
  }, [user, formData, result, saveDecision]);

  // Once a guest signs up/in, save the verdict they already saw.
  const [savedPending, setSavedPending] = useState(false);
  useEffect(() => {
    if (!user || savedPending) return;
    const pending = readPendingDecision();
    if (!pending) return;
    setSavedPending(true);
    saveDecision.mutate(pending as never, {
      onSuccess: () => {
        clearPendingDecision();
        toast.success("Saved to your history.");
      },
      onError: () => setSavedPending(false),
    });
  }, [user, savedPending, saveDecision]);

  const handleReset = () => {
    setResult(null);
    setFormData(null);
    clearPendingDecision();
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
    <div className="min-h-screen px-4 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-md space-y-5 animate-fade-up lg:max-w-5xl">
        {/* Header */}
        <header className="text-center space-y-3 lg:text-left">
          <img
            src={logoAsset.url}
            alt="Impulse Spend Blocker logo"
            className="mx-auto h-16 w-auto lg:mx-0"
          />
          <h1 className="sr-only">Impulse Spend Blocker</h1>
          <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground lg:mx-0 lg:max-w-sm">
            Before you swipe, let the numbers decide.
          </p>
        </header>

        {/* Auth bar */}
        {!authLoading && (
          <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-border/70 bg-card/70 px-4 py-2.5 shadow-xs backdrop-blur lg:justify-start">
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

        <div className="grid gap-5 lg:grid-cols-5 lg:items-start">
        <div className="space-y-5 lg:col-span-3">
        {/* AI toggle for Pro users */}
        {user && isPro && !result && (
          <div
            className={`flex items-center justify-between rounded-2xl border p-3.5 transition-colors ${
              useAI
                ? "border-primary/30 bg-accent"
                : "border-border bg-card shadow-xs"
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
              aria-label="Toggle AI analysis"
              className={`relative w-9 h-5 rounded-full transition-colors ${
                useAI ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-card shadow transition-transform ${
                  useAI ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        )}

        {/* Form or Result */}
        {!result ? (
          <div className="space-y-5">
            {user && <RecapBanner decisions={history ?? []} />}
            {activeGoal && (
              <Link
                to="/goals"
                className="bento-tile bento-tile-hover block border-verdict-buy/25 bg-accent"
              >
                <p className="eyebrow mb-2 text-verdict-buy">Active goal</p>
                <GoalProgressBar goal={activeGoal} compact />
              </Link>
            )}
            {demoOpen ? (
              <GuidedDemo
                onExit={() => setDemoOpen(false)}
                hourlyWage={profile?.hourly_wage ?? null}
              />
            ) : (
              <>
                {!user && (
                  <button
                    onClick={() => setDemoOpen(true)}
                    className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-border/70 bg-card/70 px-4 py-3 text-sm font-medium text-muted-foreground shadow-xs backdrop-blur transition-colors hover:text-foreground active:scale-[0.98]"
                  >
                    <Play className="h-4 w-4 text-primary transition-transform group-hover:scale-110" />
                    New here? Watch the 30-second guided demo
                  </button>
                )}
                <div className="bento-tile p-6 sm:p-7">
                  <SpendForm
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                    initialItem={prefill?.item}
                    initialPrice={prefill?.price}
                    hourlyWage={profile?.hourly_wage ?? null}
                  />
                </div>
              </>
            )}

            {/* Upgrade CTA for non-pro users */}
            {user && !isPro && (
              <button
                onClick={handleUpgrade}
                className="group flex w-full items-center justify-between gap-3 rounded-2xl bg-gradient-primary px-5 py-4 text-left text-primary-foreground shadow-glow transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <span>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.16em] opacity-80">
                    Pro
                  </span>
                  <span className="block text-sm font-semibold">
                    AI-powered verdicts — $5/mo
                  </span>
                </span>
                <Sparkles className="h-5 w-5 shrink-0 transition-transform group-hover:rotate-12" />
              </button>
            )}

            {!user && !authLoading && (
              <>
                <AuthForm />
                <button
                  onClick={handleUpgrade}
                  className="group flex w-full items-center justify-between gap-3 rounded-2xl bg-gradient-primary px-5 py-4 text-left text-primary-foreground shadow-glow transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <span>
                    <span className="block text-[10px] font-bold uppercase tracking-[0.16em] opacity-80">
                      Pro
                    </span>
                    <span className="block text-sm font-semibold">
                      AI-powered verdicts — $5/mo
                    </span>
                  </span>
                  <Sparkles className="h-5 w-5 shrink-0 transition-transform group-hover:rotate-12" />
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
            {!user && !authLoading && (
              <div className="space-y-3 rounded-3xl border border-primary/25 bg-accent p-4">
                <div>
                  <p className="eyebrow text-primary">Keep this decision</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Create a free account and this verdict for{" "}
                    <span className="font-semibold text-foreground">{formData?.item}</span> is saved
                    to your history — along with everything you don't buy from here on.
                  </p>
                </div>
                <AuthForm />
              </div>
            )}
            <button
              onClick={handleReset}
              className="w-full rounded-xl py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-[0.98]"
            >
              ← Analyze another purchase
            </button>
          </div>
        )}
        </div>

        {/* Side bento column */}
        <aside className="hidden space-y-5 lg:col-span-2 lg:block">
          <div className="bento-tile bg-gradient-ink p-6 text-primary-foreground">
            <p className="eyebrow text-primary-foreground/60">The idea</p>
            <p className="mt-3 font-display text-2xl font-bold leading-snug tracking-tight">
              Every purchase is priced in hours of your life.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-primary-foreground/70">
              We turn the price tag into time, savings impact, and what you'd have instead — then call it: BUY, WAIT or SKIP.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Buy", tone: "text-verdict-buy", bg: "bg-verdict-buy/10" },
              { label: "Wait", tone: "text-verdict-wait", bg: "bg-verdict-wait/10" },
              { label: "Skip", tone: "text-verdict-skip", bg: "bg-verdict-skip/10" },
            ].map((v) => (
              <div
                key={v.label}
                className={`rounded-2xl border border-border/60 ${v.bg} px-3 py-4 text-center`}
              >
                <span className={`font-display text-sm font-bold uppercase tracking-wide ${v.tone}`}>
                  {v.label}
                </span>
              </div>
            ))}
          </div>
          <Link
            to="/insights"
            className="bento-tile bento-tile-hover flex items-center justify-between"
          >
            <span className="text-sm font-semibold">See your spending patterns</span>
            <Target className="h-4 w-4 text-primary" />
          </Link>
        </aside>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/70">
          {user
            ? "Your decisions are saved securely to your account."
            : "Your data stays on your device. Nothing is stored or sent anywhere."}
        </p>
      </div>
      <PersonalityQuiz open={quizOpen} onClose={() => setQuizOpen(false)} />
    </div>
  );
}
