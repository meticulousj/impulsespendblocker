import { CATEGORY_META, CATEGORIES, Category } from "@/lib/categoryClassifier";
import type { PurchaseDecision } from "@/hooks/usePurchaseHistory";
import { useMemo } from "react";

export function CategoryBreakdown({ decisions }: { decisions: PurchaseDecision[] }) {
  const stats = useMemo(() => {
    const map: Record<string, { count: number; total: number; avoided: number }> = {};
    for (const d of decisions) {
      const c = (d.category && (CATEGORIES as readonly string[]).includes(d.category)
        ? d.category
        : "Other") as Category;
      if (!map[c]) map[c] = { count: 0, total: 0, avoided: 0 };
      map[c].count++;
      map[c].total += Number(d.price) || 0;
      if ((d.verdict === "SKIP" || d.verdict === "WAIT") && !d.overridden) {
        map[c].avoided += Number(d.price) || 0;
      }
    }
    return Object.entries(map)
      .map(([k, v]) => ({ category: k as Category, ...v }))
      .sort((a, b) => b.total - a.total);
  }, [decisions]);

  if (stats.length === 0) return null;
  const max = Math.max(...stats.map((s) => s.total), 1);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Spending by category</p>
        <p className="text-xs text-muted-foreground">{stats.length} categories</p>
      </div>
      <div className="space-y-2">
        {stats.map((s) => {
          const pct = (s.total / max) * 100;
          const meta = CATEGORY_META[s.category];
          return (
            <div key={s.category} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span>{meta.emoji}</span>
                  <span className="font-medium">{s.category}</span>
                  <span className="text-muted-foreground">· {s.count}</span>
                </span>
                <span className="font-mono text-muted-foreground">
                  ${s.total.toLocaleString()}
                  {s.avoided > 0 && (
                    <span className="text-primary ml-2">${s.avoided.toLocaleString()} saved</span>
                  )}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full ${meta.color}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}