-- Run this in the Supabase SQL editor.
-- Recreates app tables and policies for OTP + Google auth flows.
-- This setup does NOT auto-insert from auth.users trigger to avoid signup 500 issues.

begin;

-- -----------------------------------------------------------------------------
-- 1) USERS TABLE
-- -----------------------------------------------------------------------------

create table if not exists public.users (
  id uuid primary key,
  email text not null unique,
  first_name text,
  last_name text,
  created_at timestamptz not null default now(),
  last_login timestamptz,
  password text
);

alter table public.users
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists last_login timestamptz,
  add column if not exists password text;

alter table public.users enable row level security;

-- Clear old policies so this script can be re-run safely.
drop policy if exists "users_select_own" on public.users;
drop policy if exists "users_insert_own" on public.users;
drop policy if exists "users_update_own" on public.users;
drop policy if exists "allow_auth_admin_insert_on_users" on public.users;
drop policy if exists "Allow users to modify their own row" on public.users;

-- Authenticated user can read/update only own row.
create policy "users_select_own"
  on public.users
  for select
  to authenticated
  using (auth.uid() = id);

create policy "users_insert_own"
  on public.users
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "users_update_own"
  on public.users
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Optional narrow policy for auth trigger role only (kept for compatibility).
create policy "allow_auth_admin_insert_on_users"
  on public.users
  for insert
  to supabase_auth_admin
  with check (true);

-- RPC helper for auth screen pre-checks (returns only boolean existence, no row data).
create or replace function public.user_email_exists(target_email text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  return exists (
    select 1
    from public.users
    where lower(email) = lower(target_email)
  );
end;
$$;

revoke all on function public.user_email_exists(text) from public;
grant execute on function public.user_email_exists(text) to anon, authenticated;

-- Remove trigger/function path that previously caused signup 500 / RLS conflicts.
drop trigger if exists auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 2) APP_USAGE TABLE
-- -----------------------------------------------------------------------------

create table if not exists public.app_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  start_location text,
  destination text,
  duration integer,
  created_at timestamptz not null default now()
);

alter table public.app_usage
  add column if not exists user_id uuid references public.users(id) on delete cascade,
  add column if not exists start_location text,
  add column if not exists destination text,
  add column if not exists duration integer,
  add column if not exists created_at timestamptz not null default now();

alter table public.app_usage enable row level security;

drop policy if exists "app_usage_select_own" on public.app_usage;
drop policy if exists "app_usage_insert_own" on public.app_usage;
drop policy if exists "app_usage_update_own" on public.app_usage;
drop policy if exists "app_usage_delete_own" on public.app_usage;
drop policy if exists "Allow user app_usage access" on public.app_usage;

create policy "app_usage_select_own"
  on public.app_usage
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "app_usage_insert_own"
  on public.app_usage
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "app_usage_update_own"
  on public.app_usage
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "app_usage_delete_own"
  on public.app_usage
  for delete
  to authenticated
  using (auth.uid() = user_id);

commit;
