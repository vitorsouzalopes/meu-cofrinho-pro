
CREATE TABLE public.fcm_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  platform text NOT NULL DEFAULT 'web',
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_fcm_tokens_user_id ON public.fcm_tokens(user_id);

ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own fcm tokens" ON public.fcm_tokens FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own fcm tokens" ON public.fcm_tokens FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own fcm tokens" ON public.fcm_tokens FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own fcm tokens" ON public.fcm_tokens FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER set_fcm_tokens_updated_at
  BEFORE UPDATE ON public.fcm_tokens
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.telegram_config
  ADD COLUMN IF NOT EXISTS fcm_notifications_enabled boolean NOT NULL DEFAULT true;
