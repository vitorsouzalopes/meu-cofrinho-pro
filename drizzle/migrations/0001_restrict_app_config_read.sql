DROP POLICY IF EXISTS "Anyone can read app_config" ON public.app_config;
CREATE POLICY "Admins can read app_config" ON public.app_config FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
REVOKE SELECT ON public.app_config FROM anon;