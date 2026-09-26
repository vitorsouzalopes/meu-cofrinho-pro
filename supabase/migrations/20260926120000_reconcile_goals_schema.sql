-- Reconcile the goals schema with the application model.
-- Safe for environments where these columns already exist.
ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS deadline DATE,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Geral',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.goals
  DROP CONSTRAINT IF EXISTS goals_status_check;

ALTER TABLE public.goals
  ADD CONSTRAINT goals_status_check
  CHECK (status IN ('active', 'paused', 'completed', 'cancelled'));

CREATE INDEX IF NOT EXISTS goals_user_status_idx
  ON public.goals (user_id, status);
