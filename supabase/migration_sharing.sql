-- Migration: Add sharing support
-- Run this in Supabase SQL editor to add team sharing to existing tables

-- 1. Add is_shared column to folders (if not exists)
ALTER TABLE public.folders ADD COLUMN IF NOT EXISTS is_shared boolean DEFAULT false;
ALTER TABLE public.folders ADD COLUMN IF NOT EXISTS type text DEFAULT 'complete';

-- 2. Add assigned_to column to tasks (if not exists)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- 3. Create folder_members table
CREATE TABLE IF NOT EXISTS public.folder_members (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  folder_id uuid REFERENCES public.folders(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role text CHECK (role IN ('owner', 'member')) DEFAULT 'member',
  added_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(folder_id, user_id)
);

ALTER TABLE public.folder_members DISABLE ROW LEVEL SECURITY;
