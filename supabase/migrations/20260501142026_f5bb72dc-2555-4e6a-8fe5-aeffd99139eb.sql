
-- Recriar extra_income com colunas corretas
DROP TABLE IF EXISTS public.extra_income CASCADE;

CREATE TABLE public.extra_income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  month_year varchar NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.extra_income ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own extra income" ON public.extra_income FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own extra income" ON public.extra_income FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own extra income" ON public.extra_income FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own extra income" ON public.extra_income FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Criar tabela goals (não existia no banco, apenas nos types)
CREATE TABLE IF NOT EXISTS public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  target_amount numeric NOT NULL,
  monthly_amount numeric NOT NULL DEFAULT 0,
  priority integer NOT NULL DEFAULT 0,
  is_auto boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own goals" ON public.goals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.goals FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.goals FOR DELETE TO authenticated USING (auth.uid() = user_id);
