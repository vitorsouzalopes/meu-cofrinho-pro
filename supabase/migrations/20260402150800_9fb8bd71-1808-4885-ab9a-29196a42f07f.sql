
CREATE TABLE public.salary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  month_year VARCHAR NOT NULL,
  received BOOLEAN NOT NULL DEFAULT false,
  received_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, month_year)
);

ALTER TABLE public.salary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own salary" ON public.salary FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own salary" ON public.salary FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own salary" ON public.salary FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own salary" ON public.salary FOR DELETE USING (auth.uid() = user_id);
