-- Adiciona FK opcional pra rastrear espelhamento entre debts e accounts (se necessário)
-- account_id já existe em debts conforme schema, garante constraint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='debts' AND column_name='account_id'
  ) THEN
    ALTER TABLE public.debts ADD COLUMN account_id uuid;
  END IF;
END $$;

-- Migra dívidas existentes de accounts (apenas templates) para debts
INSERT INTO public.debts (
  user_id, nome, tipo, valor_total, valor_restante,
  parcela_mensal, total_parcelas, parcelas_restantes,
  juros_mensal, dia_vencimento, account_id
)
SELECT
  a.user_id,
  a.name,
  'credito',
  COALESCE(a.amount, 0) * COALESCE(a.remaining_months, 1),
  COALESCE(a.amount, 0) * COALESCE(a.remaining_months, 1),
  COALESCE(a.amount, 0),
  a.remaining_months,
  a.remaining_months,
  0,
  COALESCE(a.due_day, 1),
  a.id
FROM public.accounts a
WHERE a.billing_type = 'debt' 
  AND a.is_template = true
  AND NOT EXISTS (
    SELECT 1 FROM public.debts d WHERE d.account_id = a.id
  );

-- Remove dívidas (templates + instâncias filhas) da tabela accounts agora migradas
DELETE FROM public.accounts WHERE billing_type = 'debt';

-- Índice
CREATE INDEX IF NOT EXISTS debts_user_id_idx ON public.debts(user_id);