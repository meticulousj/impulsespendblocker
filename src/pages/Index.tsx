import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { SpendForm } from "@/components/SpendForm";
import { VerdictDisplay } from "@/components/VerdictDisplay";
import { AuthForm } from "@/components/AuthForm";
import { analyzeSpend } from "@/lib/spendAnalyzer";
import { useAuth } from "@/hooks/useAuth";
import { useSaveDecision } from "@/hooks/usePurchaseHistory";
import { ShieldAlert, History, LogOut } from "lucide-react";

type Verdict = "BUY" | "WAIT" | "SKIP";

interface Result {
  verdict: Verdict;
  reason: string;
  tip: string;
}

interface FormData {
  item: string;
  price: number;
  income: number;
  savings: number;
  goal: string;
}

export default function Index() {
  const { user, signOut, loading: authLoading } = useAuth();
  const [result, setResult] = useState<Result | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const saveDecision = useSaveDecision();

  const handleSubmit = useCallback(
    (data: FormData) => {
      setIsLoading(true);
      setResult(null);
      setFormData(data);
      setTimeout(() => {
        const analysis = analyzeSpend(data);
        setResult(analysis);
        setIsLoading(false);

        // Auto-save if logged in
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
      }, 600);
    },
    [user, saveDecision]
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

        {/* Form or Result */}
        {!result ? (
          <div className="space-y-4">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <SpendForm onSubmit={handleSubmit} isLoading={isLoading} />
            </div>
            {!user && !authLoading && <AuthForm />}
          </div>
        ) : (
          <div className="space-y-4">
            <VerdictDisplay
              verdict={result.verdict}
              reason={result.reason}
              tip={result.tip}
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
