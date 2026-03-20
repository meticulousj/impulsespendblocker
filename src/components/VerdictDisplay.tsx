import { ShieldCheck, Clock, XCircle } from "lucide-react";

type Verdict = "BUY" | "WAIT" | "SKIP";

interface VerdictDisplayProps {
  verdict: Verdict;
  reason: string;
  tip: string;
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

export function VerdictDisplay({ verdict, reason, tip }: VerdictDisplayProps) {
  const c = config[verdict];
  const Icon = c.icon;

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
    </div>
  );
}
