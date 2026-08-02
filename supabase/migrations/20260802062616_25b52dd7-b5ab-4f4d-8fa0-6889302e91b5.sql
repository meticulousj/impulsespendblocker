ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS emergency_fund_target numeric;

ALTER TABLE public.user_profiles
  ALTER COLUMN archetype SET DEFAULT 'deal_hunter';

ALTER TABLE public.savings_goals
  ADD COLUMN IF NOT EXISTS goal_type text NOT NULL DEFAULT 'other';