
-- 1) Restrict challenge_progress + user_challenges policies to authenticated only
DROP POLICY IF EXISTS "Users delete own challenge_progress" ON public.challenge_progress;
DROP POLICY IF EXISTS "Users insert own challenge_progress" ON public.challenge_progress;
DROP POLICY IF EXISTS "Users read own challenge_progress" ON public.challenge_progress;
DROP POLICY IF EXISTS "Users update own challenge_progress" ON public.challenge_progress;

CREATE POLICY "Users read own challenge_progress" ON public.challenge_progress
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_challenges uc WHERE uc.id = challenge_progress.user_challenge_id AND uc.user_id = auth.uid()));
CREATE POLICY "Users insert own challenge_progress" ON public.challenge_progress
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_challenges uc WHERE uc.id = challenge_progress.user_challenge_id AND uc.user_id = auth.uid()));
CREATE POLICY "Users update own challenge_progress" ON public.challenge_progress
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_challenges uc WHERE uc.id = challenge_progress.user_challenge_id AND uc.user_id = auth.uid()));
CREATE POLICY "Users delete own challenge_progress" ON public.challenge_progress
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_challenges uc WHERE uc.id = challenge_progress.user_challenge_id AND uc.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users delete own user_challenges" ON public.user_challenges;
DROP POLICY IF EXISTS "Users insert own user_challenges" ON public.user_challenges;
DROP POLICY IF EXISTS "Users read own user_challenges" ON public.user_challenges;
DROP POLICY IF EXISTS "Users update own user_challenges" ON public.user_challenges;

CREATE POLICY "Users read own user_challenges" ON public.user_challenges
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own user_challenges" ON public.user_challenges
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own user_challenges" ON public.user_challenges
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own user_challenges" ON public.user_challenges
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 2) Lock down user_roles writes — only admins can manage roles
CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3) Revoke public EXECUTE on SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
-- has_role still needs to be callable by authenticated for RLS policy checks
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
