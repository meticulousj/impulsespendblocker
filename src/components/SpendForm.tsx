import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Target } from "lucide-react";
import { useSavingsGoals } from "@/hooks/useSavingsGoals";
import { ReceiptScanner } from "./ReceiptScanner";

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
}

export function SpendForm({ onSubmit, isLoading, initialItem, initialPrice }: SpendFormProps) {
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

  const inputClass =
    "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 transition-shadow";

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
          <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
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
            <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
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
            <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
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
            <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
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
        className="w-full h-12 rounded-xl text-sm font-semibold tracking-wide active:scale-[0.98] transition-transform"
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
