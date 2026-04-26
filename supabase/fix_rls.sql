-- FORCE DISABLE RLS ON ALL TABLES
-- Run this if you see "violates row-level security policy" errors

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.important_dates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.folder_members DISABLE ROW LEVEL SECURITY;

-- If the above doesn't work, create a permissive policy for everyone
-- (This is a fallback if DISABLE doesn't stick in some environments)
DROP POLICY IF EXISTS "Permissive" ON public.folder_members;
CREATE POLICY "Permissive" ON public.folder_members FOR ALL USING (true) WITH CHECK (true);
