import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ARCHETYPES, type Archetype } from "@/lib/archetypeConfig";
import { useSaveArchetype } from "@/hooks/useUserProfile";
import { Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface QuizOption {
  label: string;
  weights: Record<Archetype, number>;
}

interface QuizQuestion {
  q: string;
  options: QuizOption[];
}

const QUESTIONS: QuizQuestion[] = [
  {
    q: "You see something cool online. What's your first move?",
    options: [
      { label: "Buy it now before it sells out", weights: { impulse: 2, deal_hunter: 0, saver: 0 } },
      { label: "Compare prices and check reviews", weights: { impulse: 0, deal_hunter: 2, saver: 1 } },
      { label: "Close the tab — I don't need it", weights: { impulse: 0, deal_hunter: 0, saver: 2 } },
    ],
  },
  {
    q: "How often do you regret a purchase?",
    options: [
      { label: "Often — I get carried away", weights: { impulse: 2, deal_hunter: 0, saver: 0 } },
      { label: "Sometimes, when it wasn't on sale", weights: { impulse: 0, deal_hunter: 2, saver: 0 } },
      { label: "Rarely — I think before I buy", weights: { impulse: 0, deal_hunter: 0, saver: 2 } },
    ],
  },
  {
    q: "Your ideal Saturday spending?",
    options: [
      { label: "Treat myself, I earned it", weights: { impulse: 2, deal_hunter: 1, saver: 0 } },
      { label: "Hunt for deals worth grabbing", weights: { impulse: 0, deal_hunter: 2, saver: 0 } },
      { label: "Stay in and save", weights: { impulse: 0, deal_hunter: 0, saver: 2 } },
    ],
  },
  {
    q: "Sale ending in 1 hour. You…",
    options: [
      { label: "Buy fast — can't miss it", weights: { impulse: 2, deal_hunter: 1, saver: 0 } },
      { label: "Check if I actually need it", weights: { impulse: 0, deal_hunter: 2, saver: 1 } },
      { label: "Ignore it completely", weights: { impulse: 0, deal_hunter: 0, saver: 2 } },
    ],
  },
  {
    q: "Money in your account at month-end feels…",
    options: [
      { label: "Like it should be spent", weights: { impulse: 2, deal_hunter: 0, saver: 0 } },
      { label: "Like a win if I got good deals", weights: { impulse: 0, deal_hunter: 2, saver: 0 } },
      { label: "Like safety and freedom", weights: { impulse: 0, deal_hunter: 0, saver: 2 } },
    ],
  },
];

interface PersonalityQuizProps {
  open: boolean;
  onClose: () => void;
}

export function PersonalityQuiz({ open, onClose }: PersonalityQuizProps) {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<Record<Archetype, number>>({ impulse: 0, deal_hunter: 0, saver: 0 });
  const [result, setResult] = useState<Archetype | null>(null);
  const saveArchetype = useSaveArchetype();

  const handleAnswer = (opt: QuizOption) => {
    const next: Record<Archetype, number> = {
      impulse: scores.impulse + opt.weights.impulse,
      deal_hunter: scores.deal_hunter + opt.weights.deal_hunter,
      saver: scores.saver + opt.weights.saver,
    };
    setScores(next);

    if (step + 1 < QUESTIONS.length) {
      setStep(step + 1);
    } else {
      // Determine winner
      const winner = (Object.entries(next) as [Archetype, number][]).sort((a, b) => b[1] - a[1])[0][0];
      setResult(winner);
    }
  };

  const handleFinish = async () => {
    if (!result) return;
    try {
      await saveArchetype.mutateAsync(result);
      toast.success(`Profile saved: ${ARCHETYPES[result].label}`);
      handleClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save profile");
    }
  };

  const handleClose = () => {
    setStep(0);
    setScores({ impulse: 0, deal_hunter: 0, saver: 0 });
    setResult(null);
    onClose();
  };

  const current = QUESTIONS[step];
  const progress = result ? 100 : ((step) / QUESTIONS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4 text-primary" />
            Spending Personality Quiz
          </DialogTitle>
          <DialogDescription className="text-xs">
            5 quick questions. We'll tune your verdicts to match how you spend.
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {!result ? (
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">
              Question {step + 1} of {QUESTIONS.length}
            </p>
            <h3 className="text-base font-semibold leading-snug">{current.q}</h3>
            <div className="space-y-2">
              {current.options.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => handleAnswer(opt)}
                  className="w-full text-left rounded-xl border border-border bg-background p-3 text-sm hover:border-primary/40 hover:bg-primary/5 transition-colors active:scale-[0.99]"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2 text-center">
            <div className="text-5xl">{ARCHETYPES[result].emoji}</div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">You're a</p>
              <h3 className="text-xl font-bold">{ARCHETYPES[result].label}</h3>
              <p className="text-sm text-muted-foreground mt-1">{ARCHETYPES[result].tagline}</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed px-2">
              {ARCHETYPES[result].description}
            </p>
            <button
              onClick={handleFinish}
              disabled={saveArchetype.isPending}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors active:scale-[0.98] disabled:opacity-60"
            >
              {saveArchetype.isPending ? "Saving…" : "Start using app"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
