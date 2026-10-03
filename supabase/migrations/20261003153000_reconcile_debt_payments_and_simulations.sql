-- Reconcile debt payment history and simulation persistence with the generated Supabase contract.
-- Idempotent so existing environments are preserved.

CREATE TABLE IF NOT EXISTS public.debt_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  valor_pago NUMERIC NOT NULL DEFAULT 0,
  data_pagamento DATE NOT NULL DEFAULT CURRENT_DATE,
  parcelas_quitadas INTEGER NOT NULL DEFAULT 0,
  tipo_pagamento TEXT NOT NULL DEFAULT 'normal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.debt_payments
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS debt_id UUID,
  ADD COLUMN IF NOT EXISTS valor_pago NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS data_pagamento DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS parcelas_quitadas INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tipo_pagamento TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own debt payments" ON public.debt_payments;
CREATE POLICY "Users can read own debt payments"
  ON public.debt_payments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own debt payments" ON public.debt_payments;
CREATE POLICY "Users can create own debt payments"
  ON public.debt_payments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own debt payments" ON public.debt_payments;
CREATE POLICY "Users can update own debt payments"
  ON public.debt_payments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own debt payments" ON public.debt_payments;
CREATE POLICY "Users can delete own debt payments"
  ON public.debt_payments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS debt_payments_user_id_idx
  ON public.debt_payments (user_id);

CREATE INDEX IF NOT EXISTS debt_payments_debt_id_idx
  ON public.debt_payments (debt_id);

CREATE TABLE IF NOT EXISTS public.debt_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  estrategia TEXT NOT NULL DEFAULT 'avalanche',
  valor_mensal NUMERIC NOT NULL DEFAULT 0,
  meses_estimados INTEGER NOT NULL DEFAULT 0,
  total_pago NUMERIC NOT NULL DEFAULT 0,
  economia_juros NUMERIC NOT NULL DEFAULT 0,
  sobra_mensal NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.debt_simulations
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS debt_id UUID,
  ADD COLUMN IF NOT EXISTS estrategia TEXT DEFAULT 'avalanche',
  ADD COLUMN IF NOT EXISTS valor_mensal NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meses_estimados INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_pago NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS economia_juros NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sobra_mensal NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.debt_simulations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own debt simulations" ON public.debt_simulations;
CREATE POLICY "Users can read own debt simulations"
  ON public.debt_simulations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own debt simulations" ON public.debt_simulations;
CREATE POLICY "Users can create own debt simulations"
  ON public.debt_simulations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own debt simulations" ON public.debt_simulations;
CREATE POLICY "Users can update own debt simulations"
  ON public.debt_simulations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own debt simulations" ON public.debt_simulations;
CREATE POLICY "Users can delete own debt simulations"
  ON public.debt_simulations FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS debt_simulations_user_id_idx
  ON public.debt_simulations (user_id);

CREATE INDEX IF NOT EXISTS debt_simulations_debt_id_idx
  ON public.debt_simulations (debt_id);
