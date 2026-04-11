import { useState } from "react";
import { Clock, Timer, CalendarClock, CheckCircle2 } from "lucide-react";

interface WaitPeriodSuggestionProps {
  price: number;
  income: number;
  verdict: "WAIT" | "SKIP";
  onSetReminder?: (hours: number) => void;
}

const periods = [
  { hours: 24, label: "24 hours", icon: Timer, desc: "Quick cooldown" },
  { hours: 48, label: "48 hours", icon: Clock, desc: "Standard hold" },
  { hours: 168, label: "7 days", icon: CalendarClock, desc: "Deep reflection" },
];

function getSuggestedPeriod(price: number, income: number, verdict: "WAIT" | "SKIP"): number {
  const ratio = price / income;
  if (verdict === "SKIP" || ratio > 0.25) return 168;
  if (ratio > 0.1) return 48;
  return 24;
}

export function WaitPeriodSuggestion({ price, income, verdict, onSetReminder }: WaitPeriodSuggestionProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const suggested = getSuggestedPeriod(price, income, verdict);

  const handleSelect = (hours: number) => {
    setSelected(hours);
    onSetReminder?.(hours);
  };

  if (selected !== null) {
    const period = periods.find((p) => p.hours === selected)!;
    const remindDate = new Date(Date.now() + selected * 60 * 60 * 1000);
    return (
      <div className="animate-verdict-enter rounded-xl border border-primary/20 bg-primary/5 p-4 text-center space-y-2">
        <CheckCircle2 className="w-5 h-5 text-primary mx-auto" />
        <p className="text-sm font-medium text-foreground">
          {period.label} hold set
        </p>
        <p className="text-xs text-muted-foreground">
          Revisit on {remindDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at{" "}
          {remindDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Smart Wait Period
        </p>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {verdict === "SKIP"
          ? "This purchase needs serious reflection. We recommend a longer hold."
          : "Give yourself a cooling-off window before deciding."}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {periods.map((period) => {
          const Icon = period.icon;
          const isSuggested = period.hours === suggested;
          return (
            <button
              key={period.hours}
              onClick={() => handleSelect(period.hours)}
              className={`relative flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all hover:border-primary/40 hover:bg-primary/5 active:scale-[0.97] ${
                isSuggested
                  ? "border-primary/30 bg-primary/5 ring-1 ring-primary/10"
                  : "border-border bg-background"
              }`}
            >
              {isSuggested && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground">
                  Best
                </span>
              )}
              <Icon className={`w-4 h-4 ${isSuggested ? "text-primary" : "text-muted-foreground"}`} />
              <span className="text-xs font-semibold text-foreground">{period.label}</span>
              <span className="text-[10px] text-muted-foreground">{period.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
