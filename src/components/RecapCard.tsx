import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, TrendingDown, ShoppingBag, Flame } from "lucide-react";
import type { PurchaseDecision } from "@/hooks/usePurchaseHistory";
import { buildRecap, type RecapPeriod } from "@/lib/recap";

interface Props {
  decisions: PurchaseDecision[];
}

const money = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function RecapCard({ decisions }: Props) {
  const [period, setPeriod] = useState<RecapPeriod>("week");
  const recap = useMemo(() => buildRecap(decisions, period), [decisions, period]);

  return (
    <section className="bento-tile space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="eyebrow inline-flex items-center gap-1.5 text-primary">
            <CalendarCheck className="w-3 h-3" /> Recap
          </p>
          <h2 className="font-display text-base font-bold">What you almost bought</h2>
          <p className="text-xs text-muted-foreground">{recap.label}</p>
        </div>
        <div className="flex rounded-2xl bg-[hsl(var(--surface-sunken))] p-0.5 text-xs">
          {(["week", "month"] as RecapPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "week" ? "Last week" : "Last month"}
            </button>
          ))}
        </div>
      </div>

      {recap.avoided.length === 0 && recap.bought.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No decisions logged in this period. Check an item and your next recap will fill up.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-primary/5 px-3 py-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Didn't buy</p>
              <p className="font-mono text-lg font-semibold text-primary">{money(recap.savedAmount)}</p>
            </div>
            <div className="rounded-xl bg-muted px-3 py-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Resisted</p>
              <p className="font-mono text-lg font-semibold">{recap.avoided.length}</p>
            </div>
            <div className="rounded-xl bg-muted px-3 py-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Went through</p>
              <p className="font-mono text-lg font-semibold">{recap.bought.length}</p>
            </div>
          </div>

          {recap.avoided.length > 0 && (
            <ul className="space-y-1.5">
              {recap.avoided.slice(0, 5).map((d) => (
                <li key={d.id}>
                  <Link
                    to={`/history/${d.id}`}
                    className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <TrendingDown className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{d.item}</span>
                    </span>
                    <span className="font-mono text-sm text-muted-foreground">{money(Number(d.price))}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-1.5 text-xs text-muted-foreground">
            {recap.topCategory && (
              <p className="flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" />
                Most tempting category: <span className="text-foreground">{recap.topCategory.name}</span> (
                {money(recap.topCategory.total)} avoided)
              </p>
            )}
            {recap.overrides.length > 0 && (
              <p className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" />
                You overrode {recap.overrides.length} verdict{recap.overrides.length > 1 ? "s" : ""} —{" "}
                {money(recap.spentAmount)} spent anyway.
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
