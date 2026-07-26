CREATE TABLE public.custom_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  verdict TEXT NOT NULL CHECK (verdict IN ('BUY','WAIT','SKIP')),
  min_price NUMERIC,
  max_price NUMERIC,
  start_hour SMALLINT CHECK (start_hour >= 0 AND start_hour <= 23),
  end_hour SMALLINT CHECK (end_hour >= 0 AND end_hour <= 23),
  category TEXT,
  days_of_week SMALLINT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_rules TO authenticated;
GRANT ALL ON public.custom_rules TO service_role;

ALTER TABLE public.custom_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rules" ON public.custom_rules FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own rules" ON public.custom_rules FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own rules" ON public.custom_rules FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own rules" ON public.custom_rules FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_custom_rules_user ON public.custom_rules(user_id, is_active);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_custom_rules_updated_at BEFORE UPDATE ON public.custom_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();