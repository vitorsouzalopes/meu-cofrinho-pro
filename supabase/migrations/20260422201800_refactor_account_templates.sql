-- Add columns to handle Model-Instance pattern
ALTER TABLE public.accounts ADD COLUMN is_template BOOLEAN DEFAULT false;
ALTER TABLE public.accounts ADD COLUMN parent_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;

-- Migrate existing monthly accounts to be templates
UPDATE public.accounts 
SET is_template = true 
WHERE billing_type = 'monthly';

-- Ensure future single/debt entries are marked as non-templates (already default false)
