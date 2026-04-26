-- Schema for Clean Planner App (No Collaboration)
-- Run this in Supabase SQL editor

create extension if not exists "uuid-ossp";

-- 1. Simple Users Table (Plain Text Passwords)
create table if not exists public.users (
  id uuid default uuid_generate_v4() primary key,
  username text unique not null,
  password text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Folders (for organized task grouping, up to 5 levels deep via parent_id)
create table if not exists public.folders (
  id uuid default uuid_generate_v4() primary key,
  created_by uuid references public.users(id) on delete cascade not null,
  parent_id uuid references public.folders(id) on delete cascade,
  title text not null,
  description text,
  color text,
  type text default 'complete',
  is_shared boolean default false,          -- true = team shared folder
  position float default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  deleted_at timestamp with time zone
);

-- 3. Tasks (folder_id nullable = simple tasks with no folder)
create table if not exists public.tasks (
  id uuid default uuid_generate_v4() primary key,
  created_by uuid references public.users(id) on delete cascade not null,
  folder_id uuid references public.folders(id) on delete cascade,  -- NULL = simple task (Page 1)
  parent_task_id uuid references public.tasks(id) on delete cascade,
  title text not null,
  description text,
  status text check (status in ('completed', 'not_done')) default 'not_done',
  priority text check (priority in ('low', 'medium', 'high')),  -- NULL = no priority
  color text check (color in ('blue', 'green', 'yellow', 'red', 'purple')),  -- NULL = no color
  deadline timestamp with time zone,
  assigned_to uuid references public.users(id) on delete set null,  -- Team mode: who is assigned
  position float default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  deleted_at timestamp with time zone
);

-- 4. Important Dates (for Calendar page)
create table if not exists public.important_dates (
  id uuid default uuid_generate_v4() primary key,
  created_by uuid references public.users(id) on delete cascade not null,
  title text not null,
  date date not null,
  color text check (color in ('blue', 'green', 'yellow', 'red', 'purple')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  deleted_at timestamp with time zone
);

-- 5. Folder Members (for team shared folders)
create table if not exists public.folder_members (
  id uuid default uuid_generate_v4() primary key,
  folder_id uuid references public.folders(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  role text check (role in ('owner', 'member')) default 'member',
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(folder_id, user_id)
);

-- Disable RLS (simple plain-text auth, no RLS needed)
alter table public.users disable row level security;
alter table public.folders disable row level security;
alter table public.tasks disable row level security;
alter table public.important_dates disable row level security;
alter table public.folder_members disable row level security;
