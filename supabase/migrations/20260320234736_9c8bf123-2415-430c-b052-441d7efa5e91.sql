
-- Create purchase_decisions table
CREATE TABLE public.purchase_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  price NUMERIC NOT NULL,
  income NUMERIC NOT NULL,
  savings NUMERIC NOT NULL DEFAULT 0,
  goal TEXT NOT NULL DEFAULT '',
  verdict TEXT NOT NULL CHECK (verdict IN ('BUY', 'WAIT', 'SKIP')),
  overridden BOOLEAN NOT NULL DEFAULT false,
  reason TEXT NOT NULL,
  tip TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.purchase_decisions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own decisions
CREATE POLICY "Users can view own decisions"
  ON public.purchase_decisions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own decisions"
  ON public.purchase_decisions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own decisions"
  ON public.purchase_decisions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own decisions"
  ON public.purchase_decisions FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster user queries
CREATE INDEX idx_purchase_decisions_user_id ON public.purchase_decisions(user_id);
CREATE INDEX idx_purchase_decisions_created_at ON public.purchase_decisions(created_at DESC);
