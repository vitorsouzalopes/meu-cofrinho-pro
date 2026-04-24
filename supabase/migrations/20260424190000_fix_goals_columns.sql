-- Garante que todas as colunas necessárias existam na tabela goals
-- Sem erros se já existirem (IF NOT EXISTS / DO NOTHING)

ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS monthly_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS is_auto BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS current_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deadline DATE,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Geral',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
