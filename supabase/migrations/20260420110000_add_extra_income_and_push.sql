-- Create extra_income table
CREATE TABLE IF NOT EXISTS public.extra_income (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    description TEXT NOT NULL,
    month_year VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create push_tokens table
CREATE TABLE IF NOT EXISTS public.push_tokens (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, token)
);

-- Add phone column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- RLS Policies for extra_income
ALTER TABLE public.extra_income ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own extra income" 
ON public.extra_income FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own extra income" 
ON public.extra_income FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own extra income" 
ON public.extra_income FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own extra income" 
ON public.extra_income FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for push_tokens
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own push tokens" 
ON public.push_tokens FOR ALL 
USING (auth.uid() = user_id);
