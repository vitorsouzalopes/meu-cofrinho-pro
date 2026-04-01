
-- Create accounts table
CREATE TABLE public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  account_category VARCHAR NOT NULL DEFAULT 'expense',
  bank TEXT NOT NULL DEFAULT 'Despesa',
  account_type TEXT NOT NULL DEFAULT 'Outros',
  billing_type VARCHAR NOT NULL DEFAULT 'single',
  amount NUMERIC NOT NULL DEFAULT 0,
  due_day INTEGER NOT NULL DEFAULT 1,
  month_year VARCHAR NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMPTZ,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own accounts" ON public.accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own accounts" ON public.accounts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON public.accounts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON public.accounts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create investments table
CREATE TABLE public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  bank TEXT NOT NULL DEFAULT 'Itaú',
  investment_type TEXT NOT NULL DEFAULT 'CDB',
  amount NUMERIC NOT NULL DEFAULT 0,
  current_amount NUMERIC,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own investments" ON public.investments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own investments" ON public.investments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own investments" ON public.investments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own investments" ON public.investments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create telegram_config table
CREATE TABLE public.telegram_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  telegram_chat_id BIGINT,
  telegram_user_id BIGINT,
  reminder_days_before INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.telegram_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own telegram config" ON public.telegram_config FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own telegram config" ON public.telegram_config FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own telegram config" ON public.telegram_config FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Add missing columns to expenses table
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS type VARCHAR DEFAULT 'unique';
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS frequency VARCHAR;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS due_date INTEGER;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS next_due_date DATE;
