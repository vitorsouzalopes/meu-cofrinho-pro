
-- Fix salary policies: change from public to authenticated
DROP POLICY IF EXISTS "Users can read own salary" ON public.salary;
CREATE POLICY "Users can read own salary" ON public.salary FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own salary" ON public.salary;
CREATE POLICY "Users can insert own salary" ON public.salary FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own salary" ON public.salary;
CREATE POLICY "Users can update own salary" ON public.salary FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own salary" ON public.salary;
CREATE POLICY "Users can delete own salary" ON public.salary FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fix expenses UPDATE policy: change from public to authenticated
DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;
CREATE POLICY "Users can update own expenses" ON public.expenses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add missing DELETE policy for telegram_config
CREATE POLICY "Users can delete own telegram config" ON public.telegram_config FOR DELETE TO authenticated USING (auth.uid() = user_id);
