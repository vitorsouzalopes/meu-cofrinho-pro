-- Add recurring expense fields to expenses table
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'unique' CHECK (type IN ('unique', 'recurring')),
ADD COLUMN IF NOT EXISTS frequency VARCHAR(20) CHECK (frequency IN ('monthly', 'weekly', 'daily', NULL)),
ADD COLUMN IF NOT EXISTS due_date INT CHECK (due_date >= 1 AND due_date <= 31 OR due_date IS NULL),
ADD COLUMN IF NOT EXISTS next_due_date DATE;

-- Create telegram_config table
CREATE TABLE IF NOT EXISTS public.telegram_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_user_id BIGINT NOT NULL,
  telegram_chat_id BIGINT NOT NULL,
  telegram_username VARCHAR(255),
  bot_token VARCHAR(500),
  reminder_days_before INT DEFAULT 2,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, telegram_user_id)
);

-- Create expense_checklist table
CREATE TABLE IF NOT EXISTS public.expense_checklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  month_year VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  paid BOOLEAN DEFAULT false,
  proof_url VARCHAR(500),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(expense_id, month_year)
);

-- Create reminder_logs table
CREATE TABLE IF NOT EXISTS public.reminder_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  month_year VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  reminder_type VARCHAR(20), -- 'two_days', 'one_day', 'due_date'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for telegram_config
ALTER TABLE public.telegram_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own telegram config" ON public.telegram_config
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own telegram config" ON public.telegram_config
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own telegram config" ON public.telegram_config
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own telegram config" ON public.telegram_config
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Enable RLS for expense_checklist
ALTER TABLE public.expense_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own expense checklist" ON public.expense_checklist
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own expense checklist" ON public.expense_checklist
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expense checklist" ON public.expense_checklist
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable RLS for reminder_logs
ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own reminder logs" ON public.reminder_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reminder logs" ON public.reminder_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
