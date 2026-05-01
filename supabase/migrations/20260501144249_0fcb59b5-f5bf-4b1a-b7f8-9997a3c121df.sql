-- Tabela principal de dívidas
CREATE TABLE public.debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  tipo text NOT NULL DEFAULT 'credito',
  valor_total numeric NOT NULL DEFAULT 0,
  valor_restante numeric NOT NULL DEFAULT 0,
  parcela_mensal numeric NOT NULL DEFAULT 0,
  total_parcelas int,
  parcelas_restantes int,
  juros_mensal numeric NOT NULL DEFAULT 0,
  dia_vencimento int NOT NULL DEFAULT 1,
  permite_antecipacao boolean NOT NULL DEFAULT true,
  permite_amortizacao boolean NOT NULL DEFAULT true,
  account_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own debts" ON public.debts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own debts" ON public.debts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own debts" ON public.debts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own debts" ON public.debts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Pagamentos
CREATE TABLE public.debt_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  debt_id uuid NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  valor_pago numeric NOT NULL DEFAULT 0,
  data_pagamento date NOT NULL DEFAULT CURRENT_DATE,
  tipo_pagamento text NOT NULL DEFAULT 'parcela',
  parcelas_quitadas int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own debt_payments" ON public.debt_payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own debt_payments" ON public.debt_payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own debt_payments" ON public.debt_payments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own debt_payments" ON public.debt_payments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Simulações
CREATE TABLE public.debt_simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  debt_id uuid NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  estrategia text NOT NULL DEFAULT 'mista',
  valor_mensal numeric NOT NULL DEFAULT 0,
  meses_estimados int NOT NULL DEFAULT 0,
  total_pago numeric NOT NULL DEFAULT 0,
  economia_juros numeric NOT NULL DEFAULT 0,
  sobra_mensal numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.debt_simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own debt_simulations" ON public.debt_simulations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own debt_simulations" ON public.debt_simulations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own debt_simulations" ON public.debt_simulations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own debt_simulations" ON public.debt_simulations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER debts_set_updated_at BEFORE UPDATE ON public.debts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_debts_user ON public.debts(user_id);
CREATE INDEX idx_debt_payments_debt ON public.debt_payments(debt_id);
CREATE INDEX idx_debt_simulations_debt ON public.debt_simulations(debt_id);