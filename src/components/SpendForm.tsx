import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface SpendFormProps {
  onSubmit: (data: { item: string; price: number; income: number; savings: number; goal: string }) => void;
  isLoading: boolean;
}

export function SpendForm({ onSubmit, isLoading }: SpendFormProps) {
  const [item, setItem] = useState("");
  const [price, setPrice] = useState("");
  const [income, setIncome] = useState("");
  const [savings, setSavings] = useState("");
  const [goal, setGoal] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item.trim() || !price || !income) return;
    onSubmit({
      item: item.trim(),
      price: parseFloat(price),
      income: parseFloat(income),
      savings: savings ? parseFloat(savings) : 0,
      goal: goal.trim(),
    });
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 transition-shadow";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Save for vacation"
              className={inputClass}
              maxLength={80}
            />
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
