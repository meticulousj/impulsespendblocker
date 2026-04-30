---
name: Personality Quiz
description: Onboarding quiz that profiles users as Impulse Buyer, Deal Hunter, or Saver and tunes verdict thresholds and AI tone
type: feature
---
5-question quiz on first login, stored in `user_profiles.archetype`. Drives both `analyzeSpend(input, archetype)` thresholds and `ai-verdict` edge function tone.

Archetypes (see `src/lib/archetypeConfig.ts`):
- impulse: SKIP > 15%, WAIT > 5%, wait-tier shift +1 (longer holds), firm/protective tone.
- deal_hunter: SKIP > 25%, WAIT > 10%, default holds, value/ROI tone.
- saver: SKIP > 35%, WAIT > 20%, wait-tier shift -1 (shorter holds), warm/validating tone.

Hard-SKIP guards (>50% of income, savings drop below 0.5x income) apply to all archetypes regardless of profile.

Quiz auto-opens via `PersonalityQuiz` dialog when logged-in user has no profile row. Header shows current archetype as a clickable retake button.
