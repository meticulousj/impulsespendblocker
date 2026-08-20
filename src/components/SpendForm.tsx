import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Target } from "lucide-react";
import { useSavingsGoals } from "@/hooks/useSavingsGoals";
import { ReceiptScanner } from "./ReceiptScanner";
import { computeImpact, formatHours, formatWorkDays } from "@/lib/impactMetrics";

interface SpendFormProps {
  onSubmit: (data: {
    item: string;
    price: number;
    income: number;
    savings: number;
    goal: string;
    goal_id: string | null;
  }) => void;
  isLoading: boolean;
  initialItem?: string;
  initialPrice?: string;
  hourlyWage?: number | null;
}

export function SpendForm({ onSubmit, isLoading, initialItem, initialPrice, hourlyWage }: SpendFormProps) {
  const [item, setItem] = useState(initialItem ?? "");
  const [price, setPrice] = useState(initialPrice ?? "");
  const [income, setIncome] = useState("");
  const [savings, setSavings] = useState("");
  const [goal, setGoal] = useState("");
  const [goalId, setGoalId] = useState<string>("");
  const { data: goals } = useSavingsGoals();

  useEffect(() => {
    if (initialItem) setItem(initialItem);
    if (initialPrice) setPrice(initialPrice);
  }, [initialItem, initialPrice]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item.trim() || !price || !income) return;
    const selected = goals?.find((g) => g.id === goalId) ?? null;
    const finalGoalText = selected ? selected.name : goal.trim();
    onSubmit({
      item: item.trim(),
      price: parseFloat(price),
      income: parseFloat(income),
      savings: savings ? parseFloat(savings) : 0,
      goal: finalGoalText,
      goal_id: selected ? selected.id : null,
    });
  };

  const inputClass = "field-input";

  const priceNum = parseFloat(price);
  const incomeNum = parseFloat(income);
  const liveImpact =
    priceNum > 0 && (incomeNum > 0 || (hourlyWage ?? 0) > 0)
      ? computeImpact({ price: priceNum, income: incomeNum || 0, savings: 0, hourlyWage })
      : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <ReceiptScanner
        onExtract={(scannedItem, scannedPrice) => {
          setItem(scannedItem);
          setPrice(String(scannedPrice));
        }}
      />
      <div className="space-y-4">
        <div>
          <label className="eyebrow mb-2 block">
            What do you want to buy?
          </label>
          <input
            type="text"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="e.g. Sony WH-1000XM5 headphones"
            className={inputClass}
            required
            maxLength={120}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="eyebrow mb-2 block">
              Price ($)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="349"
              className={`${inputClass} font-mono`}
              required
              min="0.01"
              step="0.01"
            />
          </div>
          <div>
            <label className="eyebrow mb-2 block">
              Monthly income ($)
            </label>
            <input
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="4,500"
              className={`${inputClass} font-mono`}
              required
              min="0"
              step="1"
            />
          </div>
        </div>

        {liveImpact && (
          <div className="rounded-2xl border border-verdict-wait/25 bg-verdict-wait/[0.07] px-4 py-4 text-center animate-verdict-enter">
            <p className="eyebrow text-verdict-wait/80">
              Real price in your time
            </p>
            <p className="mt-1.5 font-mono text-3xl font-extrabold tracking-tight text-verdict-wait">
              {formatHours(liveImpact.hours)} of work
            </p>
            {liveImpact.hours >= 8 && (
              <p className="text-[11px] text-muted-foreground">{formatWorkDays(liveImpact.workDays)}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="eyebrow mb-2 block">
              Savings ($)
            </label>
            <input
              type="number"
              value={savings}
              onChange={(e) => setSavings(e.target.value)}
              placeholder="2,000"
              className={`${inputClass} font-mono`}
              min="0"
              step="1"
            />
          </div>
          <div>
            <label className="eyebrow mb-2 block">
              Financial goal
            </label>
            {goals && goals.length > 0 ? (
              <div className="relative">
                <Target className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-verdict-buy" />
                <select
                  value={goalId}
                  onChange={(e) => setGoalId(e.target.value)}
                  className={`${inputClass} pl-8 appearance-none cursor-pointer`}
                >
                  <option value="">No goal linked</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Save for vacation"
                className={inputClass}
                maxLength={80}
              />
            )}
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading || !item.trim() || !price || !income}
        className="w-full h-14 rounded-2xl bg-gradient-ink text-[15px] font-semibold tracking-tight shadow-lift transition-all duration-200 hover:opacity-95 active:scale-[0.98] disabled:shadow-none"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing…
          </>
        ) : (
          "Should I buy this?"
        )}
      </Button>
    </form>
  );
}
