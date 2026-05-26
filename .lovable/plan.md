## Add Impact Metrics to Verdict Output

Show two new at-a-glance metrics every time a verdict is rendered, so users feel the real cost of the purchase.

### New metrics

1. **Impact on savings** — what % of current savings this purchase consumes, plus the dollar balance left after.
   - e.g. "Drains 18% of savings → $4,100 left"
   - If savings = 0, show "No savings buffer" instead of a divide-by-zero.

2. **Hours of work required** — how many hours of work this costs, based on monthly income.
   - Assume 160 working hours/month (40h × 4w) → hourly = income / 160.
   - Show hours (1 decimal under 10, whole numbers above). If ≥ 40h, also show "≈ X full work days".
   - e.g. "12.5 hours of work" or "60 hours (~7.5 work days)".

### Where it appears

- `VerdictDisplay.tsx` — add a compact two-tile row between the verdict headline and the reason/tip block. Uses semantic tokens (`bg-card`, `text-muted-foreground`, accent color matched to verdict).
- Same tiles render regardless of verdict (BUY/WAIT/SKIP) — they're informational, not gating.

### Implementation

- Add a small pure helper `src/lib/impactMetrics.ts` exporting `computeImpact({ price, income, savings })` returning `{ savingsPct, savingsAfter, hours, workDays }`.
- `VerdictDisplay` calls it with the same inputs already passed in and renders the two tiles with `PiggyBank` and `Clock` icons from lucide-react.
- No DB, edge function, or AI prompt changes. No new dependencies.

### Out of scope

- Persisting these values (they're derived, recomputed on render).
- Showing them in History list rows (can be a follow-up).
