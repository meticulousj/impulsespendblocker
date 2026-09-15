import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { VerdictDisplay } from "@/components/VerdictDisplay";
import { analyzeSpend } from "@/lib/spendAnalyzer";
import { Loader2, X, ChevronRight, ChevronLeft, Play } from "lucide-react";

interface GuidedDemoProps {
  onExit: () => void;
  hourlyWage?: number | null;
}

const DEMO = {
  item: "Sony WH-1000XM5 headphones",
  price: 349,
  income: 4500,
  savings: 1200,
  goal: "Japan trip — $2,000",
};

const STEPS = [
  {
    key: "scenario",
    caption:
      "Meet Maya. She earns $4,500/mo, has $1,200 saved, and is eyeing $349 headphones while saving for a Japan trip.",
  },
  {
    key: "analyzing",
    caption: "She hits “Should I buy this?” — the numbers get weighed against her income, savings, and goal.",
  },
  {
    key: "verdict",
    caption:
      "The verdict comes back with the real cost: hours of her life, the hit to her savings, and what she'd have instead.",
  },
  {
    key: "cta",
    caption: "That's it — 30 seconds from temptation to clarity. Now try it with something you're actually considering.",
  },
] as const;

export function GuidedDemo({ onExit, hourlyWage }: GuidedDemoProps) {
  const [step, setStep] = useState(0);

  const result = useMemo(
    () =>
      analyzeSpend({
        item: DEMO.item,
        price: DEMO.price,
        income: DEMO.income,
        savings: DEMO.savings,
        goal: DEMO.goal,
      }),
    []
  );

  // Auto-advance past the short "analyzing" beat
  useEffect(() => {
    if (STEPS[step].key !== "analyzing") return;
    const t = setTimeout(() => setStep(2), 1400);
    return () => clearTimeout(t);
  }, [step]);

  const isLast = step === STEPS.length - 1;

  return (
    <div className="bento-tile overflow-hidden">
      {/* Demo chrome: caption + controls */}
      <div className="border-b border-border/60 bg-accent/50 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="eyebrow text-primary">Guided demo</p>
          <button
            onClick={onExit}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Exit demo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 min-h-[2.5rem] text-sm leading-relaxed text-foreground/85">
          {STEPS[step].caption}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <span
                key={s.key}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? "w-6 bg-primary" : i < step ? "w-1.5 bg-primary/50" : "w-1.5 bg-border"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {step > 0 && STEPS[step].key !== "analyzing" && (
              <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} className="rounded-xl">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
            )}
            {STEPS[step].key !== "analyzing" && (
              <Button
                size="sm"
                onClick={() => (isLast ? onExit() : setStep(step + 1))}
                className="rounded-xl bg-gradient-ink"
              >
                {isLast ? "Try it yourself" : "Next"} <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {/* Step 1: the filled-in form (static, non-interactive) */}
        {step === 0 && (
          <div className="space-y-4 animate-verdict-enter" aria-hidden>
            <div>
              <p className="eyebrow mb-2">What do you want to buy?</p>
              <div className="field-input pointer-events-none">{DEMO.item}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="eyebrow mb-2">Price ($)</p>
                <div className="field-input pointer-events-none font-mono">{DEMO.price}</div>
              </div>
              <div>
                <p className="eyebrow mb-2">Monthly income ($)</p>
                <div className="field-input pointer-events-none font-mono">{DEMO.income.toLocaleString()}</div>
              </div>
              <div>
                <p className="eyebrow mb-2">Savings ($)</p>
                <div className="field-input pointer-events-none font-mono">{DEMO.savings.toLocaleString()}</div>
              </div>
              <div>
                <p className="eyebrow mb-2">Financial goal</p>
                <div className="field-input pointer-events-none">{DEMO.goal}</div>
              </div>
            </div>
            <div className="pointer-events-none flex h-14 items-center justify-center rounded-2xl bg-gradient-ink text-[15px] font-semibold text-primary-foreground shadow-lift">
              Should I buy this?
            </div>
          </div>
        )}

        {/* Step 2: analyzing beat */}
        {STEPS[step].key === "analyzing" && (
          <div className="flex flex-col items-center gap-3 py-14 animate-verdict-enter">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">Analyzing Maya's numbers…</p>
          </div>
        )}

        {/* Step 3: the actual verdict screen */}
        {STEPS[step].key === "verdict" && (
          <div className="animate-verdict-enter">
            <VerdictDisplay
              verdict={result.verdict}
              reason={result.reason}
              tip={result.tip}
              price={DEMO.price}
              income={DEMO.income}
              savings={DEMO.savings}
              hourlyWage={hourlyWage ?? null}
            />
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Demo result — nothing is saved to your account.
            </p>
          </div>
        )}

        {/* Step 4: closing CTA */}
        {STEPS[step].key === "cta" && (
          <div className="space-y-5 py-8 text-center animate-verdict-enter">
            <p className="font-display text-2xl font-bold tracking-tight">
              Your turn.
            </p>
            <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
              Type the thing you're tempted by — you'll get a BUY, WAIT, or SKIP with the reasoning to back it up. Free, no sign-up needed for the first verdict.
            </p>
            <Button onClick={onExit} className="h-12 rounded-2xl bg-gradient-ink px-8 text-[15px] font-semibold shadow-lift">
              <Play className="mr-1 h-4 w-4" /> Analyze my purchase
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
