## Goal Tracker with Progress Bars

Turn every SKIP (and overridden-to-WAIT) into measurable progress against a named savings goal like "Japan trip" or "Emergency fund."

### What the user sees

1. **Goals page (`/goals`)** — list of savings goals with name, target amount, current saved amount, deadline (optional), and a progress bar. Create/edit/delete goals. Empty state nudges to add a first goal.
2. **Active goal selector** on the spend form — a dropdown next to the existing free-text goal field lets the user pick from saved goals (or keep typing freeform). Picking one pre-fills the goal text and links new decisions to that goal.
3. **Verdict screen** — when the verdict is SKIP (or WAIT that the user honors), show under the impact tiles:
   > "Skipping this puts you **23% closer** to **Japan trip** — $1,150 of $5,000."
   With a slim progress bar in the verdict color.
4. **Goals page progress bars** — each goal shows total saved from skipped purchases, % complete, and a small list of the last few contributions ("$120 saved by skipping AirPods, 2 days ago").
5. **Home page widget** — top-of-page card highlighting the active goal's progress, only shown when at least one goal exists.

### How money is attributed

- Every `purchase_decisions` row gets a nullable `goal_id` and `contributed_amount`.
- A SKIP verdict that is **not overridden** contributes its full `price` to the linked goal.
- A WAIT verdict that is later marked "skipped after waiting" (existing override flow inverted) also contributes.
- Overridden SKIP/WAIT contributes $0 (the user bought it anyway).
- Goal `current_amount` is computed live as `SUM(contributed_amount)` for that goal — no manual editing of the running total, so the number is always honest.

### Technical implementation

**Database (one migration)**
- New table `savings_goals`:
  - `id`, `user_id`, `name`, `target_amount numeric`, `deadline date null`, `is_active boolean default true`, `created_at`, `updated_at`.
  - RLS: owner-only for select/insert/update/delete.
  - `updated_at` trigger reusing `public.update_updated_at_column()`.
- Alter `purchase_decisions`:
  - Add `goal_id uuid null` (no FK to avoid cascade surprises; we filter by user_id).
  - Add `contributed_amount numeric not null default 0`.
- View `goal_progress` (or a SQL function) that returns `goal_id`, `saved`, `count` aggregated from `purchase_decisions` for the current user. RLS-friendly because it references `auth.uid()` only in the wrapping query.

**Client code**
- `src/hooks/useSavingsGoals.ts` — CRUD + live progress (joins `savings_goals` with the aggregated sum from `purchase_decisions`).
- `src/lib/goalContribution.ts` — pure helper `computeContribution(verdict, overridden, price)` returns the amount to credit (price on honored SKIP, 0 otherwise).
- `src/pages/Goals.tsx` — list + create/edit dialog using existing shadcn `Dialog`, `Input`, `Button`, `Progress` components.
- `src/components/GoalProgressBar.tsx` — reusable: name, $X of $Y, % bar in verdict-green, optional deadline countdown.
- `src/components/GoalPicker.tsx` — combobox added to `SpendForm.tsx`; selecting a goal sets both the freeform goal string and a hidden `goal_id`.
- `src/components/VerdictDisplay.tsx` — when verdict is SKIP and a goal is linked, render a "X% closer to Y" block + `GoalProgressBar` below the impact tiles.
- `src/pages/Index.tsx` — pass `goalId` along when inserting the decision row; show the active-goal widget above the form when goals exist.
- Add `/goals` route in `App.tsx` and a nav link in `NavLink.tsx`.

**No edge-function changes.** AI verdict prompt stays the same — goal context is already passed as the freeform string.

### Out of scope (deliberate)

- Notifications / email when a goal is hit.
- Multiple simultaneous active goals fighting for the same SKIP (we link one goal per decision; user picks).
- Manual top-up contributions from outside the app (could be a follow-up "Add manual contribution" button).
- Editing historical decisions to retroactively link to a different goal.
