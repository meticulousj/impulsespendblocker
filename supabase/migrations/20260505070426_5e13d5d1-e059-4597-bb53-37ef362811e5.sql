
-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Add columns to purchase_decisions
ALTER TABLE public.purchase_decisions
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS decision_hour SMALLINT,
  ADD COLUMN IF NOT EXISTS decision_dow SMALLINT;

-- Trigger to populate hour/dow from created_at
CREATE OR REPLACE FUNCTION public.set_decision_time_parts()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.decision_hour IS NULL THEN
    NEW.decision_hour := EXTRACT(HOUR FROM COALESCE(NEW.created_at, now()))::SMALLINT;
  END IF;
  IF NEW.decision_dow IS NULL THEN
    NEW.decision_dow := EXTRACT(DOW FROM COALESCE(NEW.created_at, now()))::SMALLINT;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_set_decision_time_parts ON public.purchase_decisions;
CREATE TRIGGER trg_set_decision_time_parts
BEFORE INSERT ON public.purchase_decisions
FOR EACH ROW EXECUTE FUNCTION public.set_decision_time_parts();

-- Backfill existing rows
UPDATE public.purchase_decisions
SET decision_hour = EXTRACT(HOUR FROM created_at)::SMALLINT,
    decision_dow = EXTRACT(DOW FROM created_at)::SMALLINT
WHERE decision_hour IS NULL OR decision_dow IS NULL;

-- Weekly digests table
CREATE TABLE IF NOT EXISTS public.weekly_digests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  insights JSONB NOT NULL DEFAULT '[]'::jsonb,
  category_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);

ALTER TABLE public.weekly_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own digests" ON public.weekly_digests
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own digests" ON public.weekly_digests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own digests" ON public.weekly_digests
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own digests" ON public.weekly_digests
  FOR DELETE USING (auth.uid() = user_id);

-- Digest dismissals table
CREATE TABLE IF NOT EXISTS public.digest_dismissals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  digest_id UUID NOT NULL REFERENCES public.weekly_digests(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, digest_id)
);

ALTER TABLE public.digest_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dismissals" ON public.digest_dismissals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own dismissals" ON public.digest_dismissals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own dismissals" ON public.digest_dismissals
  FOR DELETE USING (auth.uid() = user_id);
