-- Unified Migration: Team Sharing, Task Allocation, and Reordering
-- Run this in Supabase SQL editor to update your existing database

-- 1. Ensure extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Update Folders Table
ALTER TABLE public.folders ADD COLUMN IF NOT EXISTS is_shared boolean DEFAULT false;
ALTER TABLE public.folders ADD COLUMN IF NOT EXISTS type text DEFAULT 'complete';
ALTER TABLE public.folders ADD COLUMN IF NOT EXISTS position float DEFAULT 0;

-- 3. Update Tasks Table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS position float DEFAULT 0;

-- 4. Create Folder Members Table (for Team Sharing)
CREATE TABLE IF NOT EXISTS public.folder_members (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  folder_id uuid REFERENCES public.folders(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role text CHECK (role IN ('owner', 'member')) DEFAULT 'member',
  added_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(folder_id, user_id)
);

-- 5. Ensure RLS is disabled for the new table and existing ones
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.important_dates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.folder_members DISABLE ROW LEVEL SECURITY;

-- 6. Optional: Initialize positions if they are all 0 (for better reordering starting point)
-- This isn't strictly necessary but helps if you already have many tasks.
-- UPDATE public.tasks SET position = EXTRACT(EPOCH FROM created_at) WHERE position = 0;
-- UPDATE public.folders SET position = EXTRACT(EPOCH FROM created_at) WHERE position = 0;
