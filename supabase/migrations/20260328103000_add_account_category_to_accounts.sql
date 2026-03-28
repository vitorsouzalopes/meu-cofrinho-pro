-- Add account category support for bank accounts and expense accounts
ALTER TABLE public.accounts
ADD COLUMN IF NOT EXISTS account_category VARCHAR(20) NOT NULL DEFAULT 'expense' CHECK (account_category IN ('bank', 'expense'));
