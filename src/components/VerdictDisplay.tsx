import { useState } from "react";
import { ShieldCheck, Clock, XCircle, PartyPopper, Sparkles, PiggyBank, Timer } from "lucide-react";
import { computeImpact, formatHours, formatWorkDays } from "@/lib/impactMetrics";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Verdict = "BUY" | "WAIT" | "SKIP";

interface VerdictDisplayProps {
  verdict: Verdict;
  reason: string;
  tip: string;
  isAI?: boolean;
  onOverride?: () => void;
  price?: number;
  income?: number;
  savings?: number;
}

const config: Record<Verdict, { icon: typeof ShieldCheck; label: string; color: string; bg: string; ring: string }> = {
  BUY: {
    icon: ShieldCheck,
    label: "Go ahead — this one's justified",
    color: "text-verdict-buy",
    bg: "bg-verdict-buy/10",
    ring: "ring-verdict-buy/20",
  },
  WAIT: {
    icon: Clock,
    label: "Sleep on it — revisit in 48 hours",
    color: "text-verdict-wait",
    bg: "bg-verdict-wait/10",
    ring: "ring-verdict-wait/20",
  },
  SKIP: {
    icon: XCircle,
    label: "Hard pass — protect your future self",
    color: "text-verdict-skip",
    bg: "bg-verdict-skip/10",
    ring: "ring-verdict-skip/20",
  },
};

const guiltyPleasures = [
  "You rebel. Enjoy it! 🎉",
  "YOLO activated. No regrets (maybe). 💸",
  "Future you might side-eye this… but present you is thrilled.",
  "The heart wants what the heart wants. 💛",
];

export function VerdictDisplay({ verdict, reason, tip, isAI, onOverride, price, income, savings }: VerdictDisplayProps) {
  const [overridden, setOverridden] = useState(false);
  const c = config[verdict];
  const Icon = c.icon;

  const showImpact = typeof price === "number" && price > 0;
  const impact = showImpact
    ? computeImpact({ price: price!, income: income ?? 0, savings: savings ?? 0 })
    : null;

  const handleOverride = () => {
    setOverridden(true);
    onOverride?.();
  };

  if (overridden) {
    return (
      <div className="animate-verdict-enter rounded-2xl bg-verdict-buy/10 ring-1 ring-verdict-buy/20 p-8 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-verdict-buy/10 text-verdict-buy">
          <PartyPopper className="w-8 h-8" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-4xl font-bold tracking-tight font-mono text-verdict-buy">BUY</h2>
          <p className="text-muted-foreground mt-1 text-sm">You overrode the verdict</p>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed max-w-md mx-auto">
          {guiltyPleasures[Math.floor(Math.random() * guiltyPleasures.length)]}
        </p>
      </div>
    );
  }

  return (
    <div className={`animate-verdict-enter rounded-2xl ${c.bg} ring-1 ${c.ring} p-8 text-center space-y-4`}>
      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${c.bg} ${c.color} animate-pulse-ring`}>
        <Icon className="w-8 h-8" strokeWidth={2} />
      </div>

      <div>
        <h2 className={`text-4xl font-bold tracking-tight font-mono ${c.color}`}>
          {verdict}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">{c.label}</p>
        {isAI && (
          <span className="inline-flex items-center gap-1 mt-2 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
            <Sparkles className="w-2.5 h-2.5" />
            AI Analysis
          </span>
        )}
      </div>

      {impact && (
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto text-left">
          <div className="rounded-xl bg-background/60 border border-border/60 p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <PiggyBank className="w-3.5 h-3.5" />
              <p className="text-[10px] font-medium uppercase tracking-wider">Savings impact</p>
            </div>
            {impact.savingsPct === null ? (
              <>
                <p className={`text-base font-bold font-mono mt-1 ${c.color}`}>No buffer</p>
                <p className="text-[11px] text-muted-foreground">No savings on file</p>
              </>
            ) : (
              <>
                <p className={`text-base font-bold font-mono mt-1 ${c.color}`}>
                  {impact.savingsPct >= 100 ? ">100%" : `${impact.savingsPct.toFixed(impact.savingsPct < 10 ? 1 : 0)}%`}
                </p>
                <p className="text-[11px] text-muted-foreground font-mono">
                  ${Math.max(0, impact.savingsAfter).toLocaleString()} left
                  {impact.savingsAfter < 0 && " (overdraw)"}
                </p>
              </>
            )}
          </div>
          <div className="rounded-xl bg-background/60 border border-border/60 p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Timer className="w-3.5 h-3.5" />
              <p className="text-[10px] font-medium uppercase tracking-wider">Hours of work</p>
            </div>
            <p className={`text-base font-bold font-mono mt-1 ${c.color}`}>
              {formatHours(impact.hours)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {impact.hours >= 40 ? formatWorkDays(impact.workDays) : "at 40h/week"}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3 text-left max-w-md mx-auto">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Why</p>
          <p className="text-sm text-foreground/80 leading-relaxed">{reason}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Tip</p>
          <p className="text-sm text-foreground/80 leading-relaxed">{tip}</p>
        </div>
      </div>

      {verdict !== "BUY" && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              className="mt-2 text-xs text-muted-foreground hover:text-foreground active:scale-[0.97] transition-transform"
            >
              Get it anyway →
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                {verdict === "SKIP"
                  ? "The numbers say this is a bad idea. Override at your own risk!"
                  : "We suggested waiting — but it's your money."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Nah, I'll pass</AlertDialogCancel>
              <AlertDialogAction className="rounded-xl" onClick={handleOverride}>
                Buy it anyway
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
