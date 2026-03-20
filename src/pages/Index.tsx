import { useState, useCallback } from "react";
import { SpendForm } from "@/components/SpendForm";
import { VerdictDisplay } from "@/components/VerdictDisplay";
import { analyzeSpend } from "@/lib/spendAnalyzer";
import { ShieldAlert } from "lucide-react";

type Verdict = "BUY" | "WAIT" | "SKIP";

interface Result {
  verdict: Verdict;
  reason: string;
  tip: string;
}

export default function Index() {
  const [result, setResult] = useState<Result | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(
    (data: { item: string; price: number; income: number; savings: number; goal: string }) => {
      setIsLoading(true);
      setResult(null);
      // Simulate brief thinking delay for UX
      setTimeout(() => {
        const analysis = analyzeSpend(data);
        setResult(analysis);
        setIsLoading(false);
      }, 600);
    },
    []
  );

  const handleReset = () => {
    setResult(null);
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

        {/* Form or Result */}
        {!result ? (
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <SpendForm onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
        ) : (
          <div className="space-y-4">
            <VerdictDisplay verdict={result.verdict} reason={result.reason} tip={result.tip} />
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
          Your data stays on your device. Nothing is stored or sent anywhere.
        </p>
      </div>
    </div>
  );
}
