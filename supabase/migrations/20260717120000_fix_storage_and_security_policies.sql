-- Harden storage access for professional files
INSERT INTO storage.buckets (id, name, public)
VALUES ('profissionais', 'profissionais', false)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profissionais files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own profissionais files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profissionais files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profissionais files" ON storage.objects;

CREATE POLICY "Users can view own profissionais files"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'profissionais'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can upload own profissionais files"
  ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profissionais'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own profissionais files"
  ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profissionais'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'profissionais'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own profissionais files"
  ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'profissionais'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Reduce exposure of security definer functions
ALTER FUNCTION public.has_role(uuid, public.app_role) SECURITY INVOKER;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
