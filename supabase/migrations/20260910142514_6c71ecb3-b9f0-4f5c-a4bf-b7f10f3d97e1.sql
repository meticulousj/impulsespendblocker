CREATE TABLE public.ai_trial_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
GRANT SELECT ON public.ai_trial_usage TO authenticated;
GRANT ALL ON public.ai_trial_usage TO service_role;
ALTER TABLE public.ai_trial_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own ai trial usage" ON public.ai_trial_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_ai_trial_usage_user ON public.ai_trial_usage(user_id);