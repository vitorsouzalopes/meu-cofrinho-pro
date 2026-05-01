
-- app_config (public read, admin write)
CREATE TABLE IF NOT EXISTS public.app_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  min_version text NOT NULL DEFAULT '1.0.0',
  download_url text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read app_config" ON public.app_config FOR SELECT USING (true);
CREATE POLICY "Admins can insert app_config" ON public.app_config FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update app_config" ON public.app_config FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete app_config" ON public.app_config FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- user_challenges
CREATE TABLE IF NOT EXISTS public.user_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  challenge_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own user_challenges" ON public.user_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own user_challenges" ON public.user_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own user_challenges" ON public.user_challenges FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own user_challenges" ON public.user_challenges FOR DELETE USING (auth.uid() = user_id);

-- challenge_progress
CREATE TABLE IF NOT EXISTS public.challenge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_challenge_id uuid NOT NULL REFERENCES public.user_challenges(id) ON DELETE CASCADE,
  status_date date NOT NULL,
  amount_saved numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own challenge_progress" ON public.challenge_progress FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_challenges uc WHERE uc.id = user_challenge_id AND uc.user_id = auth.uid()));
CREATE POLICY "Users insert own challenge_progress" ON public.challenge_progress FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_challenges uc WHERE uc.id = user_challenge_id AND uc.user_id = auth.uid()));
CREATE POLICY "Users update own challenge_progress" ON public.challenge_progress FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.user_challenges uc WHERE uc.id = user_challenge_id AND uc.user_id = auth.uid()));
CREATE POLICY "Users delete own challenge_progress" ON public.challenge_progress FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.user_challenges uc WHERE uc.id = user_challenge_id AND uc.user_id = auth.uid()));

-- receipt_url columns
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS receipt_url text;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS receipt_url text;

-- receipts storage bucket (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users read own receipts" ON storage.objects FOR SELECT
  USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[2]);
CREATE POLICY "Users upload own receipts" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[2]);
CREATE POLICY "Users update own receipts" ON storage.objects FOR UPDATE
  USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[2]);
CREATE POLICY "Users delete own receipts" ON storage.objects FOR DELETE
  USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[2]);
