import type { PurchaseDecision } from "@/hooks/usePurchaseHistory";
import { useMemo } from "react";

export function HourHeatmap({ decisions }: { decisions: PurchaseDecision[] }) {
  const buckets = useMemo(() => {
    const arr = Array.from({ length: 24 }, () => 0);
    for (const d of decisions) {
      const h = typeof d.decision_hour === "number"
        ? d.decision_hour
        : new Date(d.created_at).getHours();
      if (h >= 0 && h < 24) arr[h]++;
    }
    return arr;
  }, [decisions]);

  const max = Math.max(...buckets, 1);
  const peakHour = buckets.indexOf(max);

  return (
    <div className="bento-tile space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-display text-sm font-bold">When you shop</p>
        {max > 0 && (
          <p className="text-xs text-muted-foreground">
            Peak: <span className="font-mono text-foreground">{formatHour(peakHour)}</span>
          </p>
        )}
      </div>
      <div className="grid grid-cols-24 gap-0.5" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
        {buckets.map((c, h) => {
          const intensity = c / max;
          return (
            <div
              key={h}
              title={`${formatHour(h)} — ${c} attempt${c !== 1 ? "s" : ""}`}
              className="h-8 rounded-sm"
              style={{
                backgroundColor:
                  c === 0
                    ? "hsl(var(--muted))"
                    : `hsl(var(--primary) / ${0.15 + intensity * 0.85})`,
              }}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
        <span>12a</span>
        <span>6a</span>
        <span>12p</span>
        <span>6p</span>
        <span>11p</span>
      </div>
    </div>
  );
}

function formatHour(h: number) {
  if (h === 0) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}