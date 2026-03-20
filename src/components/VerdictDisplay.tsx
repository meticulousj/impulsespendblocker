import { useState } from "react";
import { ShieldCheck, Clock, XCircle, PartyPopper } from "lucide-react";
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
  onOverride?: () => void;
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

export function VerdictDisplay({ verdict, reason, tip, onOverride }: VerdictDisplayProps) {
  const [overridden, setOverridden] = useState(false);
  const c = config[verdict];
  const Icon = c.icon;

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
      </div>

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
