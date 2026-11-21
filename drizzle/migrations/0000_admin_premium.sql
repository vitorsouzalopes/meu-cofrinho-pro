CREATE OR REPLACE FUNCTION public.protect_is_premium()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_premium IS DISTINCT FROM OLD.is_premium
     AND auth.uid() IS NOT NULL
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.is_premium := OLD.is_premium;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS profiles_protect_premium ON public.profiles;
CREATE TRIGGER profiles_protect_premium BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_is_premium();
REVOKE EXECUTE ON FUNCTION public.protect_is_premium() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_premium(_user_id uuid, _value boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.profiles SET is_premium = _value, updated_at = now() WHERE id = _user_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_set_premium(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_premium(uuid, boolean) TO authenticated;

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));