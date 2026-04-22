-- Create user_challenges table
CREATE TABLE IF NOT EXISTS public.user_challenges (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- active, completed, abandoned
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, challenge_id)
);

-- Create challenge_progress table
CREATE TABLE IF NOT EXISTS public.challenge_progress (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_challenge_id UUID NOT NULL REFERENCES public.user_challenges(id) ON DELETE CASCADE,
    status_date DATE NOT NULL,
    amount_saved NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_challenge_id, status_date)
);

-- Add RLS to user_challenges
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own challenges" 
ON public.user_challenges FOR ALL 
USING (auth.uid() = user_id);

-- Add RLS to challenge_progress
ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own challenge progress" 
ON public.challenge_progress FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.user_challenges
        WHERE id = challenge_progress.user_challenge_id
        AND user_id = auth.uid()
    )
);
