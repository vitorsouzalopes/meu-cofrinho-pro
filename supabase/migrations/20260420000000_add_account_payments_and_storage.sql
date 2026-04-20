-- Create account_payments table
CREATE TABLE IF NOT EXISTS public.account_payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    month_year VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    amount NUMERIC NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(account_id, month_year)
);

-- Enable RLS for account_payments
ALTER TABLE public.account_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own account payments" ON public.account_payments
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "Users can view their own receipts" 
ON storage.objects FOR SELECT TO authenticated 
USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload their own receipts" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own receipts" 
ON storage.objects FOR DELETE TO authenticated 
USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
