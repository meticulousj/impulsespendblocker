## Spending Personality Quiz

A short onboarding quiz that profiles new users as **Impulse Buyer**, **Deal Hunter**, or **Saver**, then uses that profile to adjust both the AI verdict tone and the rule-engine thresholds.

### User flow

1. After signup (or first visit while logged in with no profile), a quiz modal appears.
2. User answers 5 quick multiple-choice questions. Each option is weighted toward one of the three archetypes.
3. Highest-scoring archetype becomes their profile, shown with a friendly result card ("You're a Deal Hunter 🏷️").
4. Profile is saved to the database and visible/re-takeable from the header.
5. From then on:
   - **AI verdicts** (`ai-verdict` edge function) receive the profile and adjust tone (tougher for Impulse, validating for Saver, value-focused for Deal Hunter).
   - **Rule engine** (`spendAnalyzer.ts`) shifts BUY/WAIT/SKIP price-to-income thresholds per profile.
   - **Wait period suggestions** shift (Impulse Buyers get longer holds).

### The three profiles

| Profile | Tone | Rule thresholds (price/income) | Wait bias |
|---|---|---|---|
| Impulse Buyer | Firm, protective, blunt | SKIP > 15%, WAIT > 5% | Longer (24h → 48h, 48h → 7d) |
| Deal Hunter | Value-focused, ROI framing | SKIP > 25%, WAIT > 10% (default) | Default |
| Saver | Warm, validating, permissive | SKIP > 35%, WAIT > 20% | Shorter |

### Quiz questions (5)

Each option maps to {impulse, deal_hunter, saver} weights.

1. "You see something cool online. What's your first move?" — Buy now / Compare prices / Close the tab
2. "How often do you regret a purchase?" — Often / Sometimes when it's not on sale / Rarely
3. "Your ideal Saturday spending?" — Treat yourself / Hunt deals / Stay in, save
4. "Sale ending in 1 hour. You…" — Buy fast / Check if you actually need it / Ignore it
5. "Money in your account at month-end feels…" — Like it should be spent / Like a win if I got deals / Like safety

### Technical changes

**Database (migration):**
- New table `user_profiles` with: `user_id` (PK, references auth.users), `archetype` text check in ('impulse','deal_hunter','saver'), `quiz_completed_at` timestamptz, `created_at`, `updated_at`.
- RLS: users can select/insert/update their own row only.

**New files:**
- `src/hooks/useUserProfile.ts` — fetch + upsert archetype via React Query.
- `src/components/PersonalityQuiz.tsx` — modal/dialog with 5 questions, scoring logic, result card with "Start using app" CTA.
- `src/lib/archetypeConfig.ts` — per-archetype thresholds, wait-period multipliers, display labels/emojis, and AI tone instructions.

**Edited files:**
- `src/lib/spendAnalyzer.ts` — accept optional `archetype` arg; use per-archetype thresholds.
- `src/components/WaitPeriodSuggestion.tsx` — accept optional `archetype`; bump period when impulse, drop when saver.
- `src/pages/Index.tsx` — load profile via `useUserProfile`; if logged in & no archetype, show `PersonalityQuiz` dialog. Pass archetype to analyzer, AI invoke body, and WaitPeriodSuggestion. Add small "Profile: Deal Hunter • Retake" link in the header.
- `supabase/functions/ai-verdict/index.ts` — accept `archetype` in body; inject archetype-specific tone block into the system prompt (firm/value/warm). Keep verdict rules but mention archetype context.

**Memory:** save a new feature memory `mem://features/personality-quiz` with the archetypes, thresholds, and tone rules; add an entry to `mem://index.md`.

### Out of scope (can follow up)

- Re-running the quiz from a dedicated settings page (we'll surface a "Retake" link in the header for now).
- Showing archetype on the History dashboard.
- Animated quiz transitions.