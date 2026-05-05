## Category Insights + Weekly Digest

AI surfaces spending patterns from purchase history ("You impulse-buy gadgets at 11pm") and shows a weekly digest. Pro-only feature (matches existing AI gating).

### What gets built

**1. AI categorization on save**
When a user submits a purchase decision, the existing `ai-verdict` flow already runs for Pro users. We extend the response to also return a `category` (e.g. Gadgets, Food, Clothing, Subscription, Travel, Home, Beauty, Entertainment, Other). Saved alongside the decision. For free / rule-engine users, a tiny client-side keyword classifier handles categorization so insights still work.

**2. Insights edge function**
New `generate-insights` edge function. Takes the user's last 30 days of decisions, sends a structured summary (category, price, verdict, overridden, hour-of-day, day-of-week) to Gemini, returns 3–5 short pattern observations like:
- "You impulse-buy gadgets at 11pm — 4 attempts this week, 2 overrides"
- "Friday-night food orders are your biggest WAIT category"
- "You overrode 60% of SKIP verdicts on clothing"

Returns: `{ insights: [{ headline, detail, severity }], category_breakdown: {...}, week_summary: {...} }`.

**3. Insights UI on History page**
New "Patterns" section at the top of `/history`:
- Category breakdown card (horizontal bar list: Gadgets $420, Food $180, etc., counts + total avoided)
- Hour-of-day heatmap strip (24 buckets, intensity by attempt count) — pure CSS
- AI insight cards (3–5 colored callouts with icon, headline, supporting detail). "Refresh insights" button caches results in DB so we don't burn AI tokens on every page load.
- Free users see the breakdown + heatmap; AI insight cards are blurred behind an Upgrade CTA.

**4. Weekly digest**
- New table `weekly_digests` storing the most recent generated digest per user (insights JSON + week range + generated_at).
- Cron job runs every Monday 9am UTC, calls a `weekly-digest` edge function that loops through Pro users with activity in the last 7 days and stores a fresh digest row. Users see the latest digest at the top of `/history` with a "New weekly digest" badge until dismissed.
- The same edge function can be invoked manually by clicking "Refresh insights".

### Technical changes

**Database (migration)**
- Add `category` text column to `purchase_decisions` (nullable, default null).
- Add `decision_hour` smallint column (0–23) and `decision_dow` smallint column (0–6), both populated by a BEFORE INSERT trigger from `created_at` so we can index/query without timezone math each time.
- New table `weekly_digests`: `id`, `user_id`, `week_start` date, `week_end` date, `insights` jsonb, `category_breakdown` jsonb, `generated_at` timestamptz, unique(user_id, week_start). RLS: users select their own.
- New table `digest_dismissals`: track which digest the user has dismissed (`user_id`, `digest_id`, `dismissed_at`).
- Enable `pg_cron` and `pg_net` extensions.

**New files**
- `src/lib/categoryClassifier.ts` — keyword-based fallback classifier + canonical category list + emoji/color map.
- `src/hooks/useInsights.ts` — fetches latest digest, mutation to refresh.
- `src/components/CategoryBreakdown.tsx` — horizontal bar list with totals.
- `src/components/HourHeatmap.tsx` — 24-bucket strip showing attempt density.
- `src/components/InsightCards.tsx` — renders AI insight cards; shows blurred Upgrade CTA when not Pro.
- `src/components/WeeklyDigestBanner.tsx` — top-of-page banner for newly generated digest.
- `supabase/functions/generate-insights/index.ts` — invoked manually (and by the cron). Loads decisions, calls Gemini with structured tool-call output, upserts a row into `weekly_digests`.
- `supabase/functions/weekly-digest/index.ts` — cron entrypoint; iterates Pro users with recent activity, calls the same logic per user.

**Edited files**
- `supabase/functions/ai-verdict/index.ts` — extend the tool-call schema to also return `category` (one of the canonical list). Return it in the response payload.
- `src/pages/Index.tsx` — when saving a decision, also save the category (from AI response or the keyword classifier fallback).
- `src/hooks/usePurchaseHistory.ts` — add `category` to the type.
- `src/pages/History.tsx` — add new "Patterns" section above the existing dashboard with WeeklyDigestBanner, InsightCards, CategoryBreakdown, HourHeatmap, and a "Refresh insights" button.

**Cron job (insert tool, not migration — contains project URL/key)**
Schedule `weekly-digest` for `0 9 * * 1` (Monday 9am UTC).

### Out of scope (follow-ups)

- Email delivery of the digest (would need email infra setup).
- Category override / manual edit on a saved decision.
- Drill-down per-category history view.

### Pro gating recap

- Insight cards (AI text) — Pro only; free users see blurred preview + Upgrade CTA.
- Category breakdown + hour heatmap — available to everyone (computed locally from history).
- Weekly digest auto-generation — Pro only.