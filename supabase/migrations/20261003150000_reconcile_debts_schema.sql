-- Reconcile the debts table with the application contract.
-- This migration is intentionally idempotent so it can repair environments
-- where the table exists but the migration history is incomplete.

CREATE TABLE IF NOT EXISTS public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'credito',
  valor_total NUMERIC NOT NULL DEFAULT 0,
  valor_restante NUMERIC NOT NULL DEFAULT 0,
  parcela_mensal NUMERIC NOT NULL DEFAULT 0,
  total_parcelas INTEGER,
  parcelas_restantes INTEGER,
  juros_mensal NUMERIC NOT NULL DEFAULT 0,
  dia_vencimento INTEGER NOT NULL DEFAULT 1,
  permite_amortizacao BOOLEAN NOT NULL DEFAULT true,
  permite_antecipacao BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.debts
  ADD COLUMN IF NOT EXISTS account_id UUID,
  ADD COLUMN IF NOT EXISTS nome TEXT,
  ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'credito',
  ADD COLUMN IF NOT EXISTS valor_total NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_restante NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parcela_mensal NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_parcelas INTEGER,
  ADD COLUMN IF NOT EXISTS parcelas_restantes INTEGER,
  ADD COLUMN IF NOT EXISTS juros_mensal NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dia_vencimento INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS permite_amortizacao BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS permite_antecipacao BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own debts" ON public.debts;
CREATE POLICY "Users can read own debts"
  ON public.debts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own debts" ON public.debts;
CREATE POLICY "Users can create own debts"
  ON public.debts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own debts" ON public.debts;
CREATE POLICY "Users can update own debts"
  ON public.debts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own debts" ON public.debts;
CREATE POLICY "Users can delete own debts"
  ON public.debts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS debts_user_id_idx
  ON public.debts (user_id);

CREATE INDEX IF NOT EXISTS debts_account_id_idx
  ON public.debts (account_id);
