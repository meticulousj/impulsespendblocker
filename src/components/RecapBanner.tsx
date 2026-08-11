import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, X } from "lucide-react";
import type { PurchaseDecision } from "@/hooks/usePurchaseHistory";
import { buildRecap, recapKey } from "@/lib/recap";

interface Props {
  decisions: PurchaseDecision[];
}

export function RecapBanner({ decisions }: Props) {
  const recap = buildRecap(decisions, "week");
  const key = recapKey("week", recap.start);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(key) === "1");
  }, [key]);

  if (dismissed || recap.avoided.length === 0) return null;

  const saved = recap.savedAmount.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
      <CalendarCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0 text-sm">
        <p className="font-medium">Last week's recap is ready</p>
        <p className="text-xs text-muted-foreground">
          You almost bought {recap.avoided.length} thing{recap.avoided.length > 1 ? "s" : ""} — and kept {saved}.{" "}
          <Link to="/insights" className="text-primary hover:underline">
            See the recap →
          </Link>
        </p>
      </div>
      <button
        aria-label="Dismiss recap"
        onClick={() => {
          localStorage.setItem(key, "1");
          setDismissed(true);
        }}
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
