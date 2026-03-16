-- *****&SUPABASE_SQL_MIGRATION

create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  username text not null,
  username_normalized text not null unique,
  display_name text,
  profile_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.search_history (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  food_name text not null,
  food_key text not null,
  response_json jsonb not null,
  last_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (auth_user_id, food_key)
);

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at_timestamp();

alter table public.user_profiles enable row level security;
alter table public.search_history enable row level security;

drop policy if exists "user_profiles_select_own" on public.user_profiles;
create policy "user_profiles_select_own"
on public.user_profiles
for select
using (auth.uid() = auth_user_id);

drop policy if exists "user_profiles_insert_own" on public.user_profiles;
create policy "user_profiles_insert_own"
on public.user_profiles
for insert
with check (auth.uid() = auth_user_id);

drop policy if exists "user_profiles_update_own" on public.user_profiles;
create policy "user_profiles_update_own"
on public.user_profiles
for update
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);

drop policy if exists "user_profiles_delete_own" on public.user_profiles;
create policy "user_profiles_delete_own"
on public.user_profiles
for delete
using (auth.uid() = auth_user_id);

drop policy if exists "search_history_select_own" on public.search_history;
create policy "search_history_select_own"
on public.search_history
for select
using (auth.uid() = auth_user_id);

drop policy if exists "search_history_insert_own" on public.search_history;
create policy "search_history_insert_own"
on public.search_history
for insert
with check (auth.uid() = auth_user_id);

drop policy if exists "search_history_update_own" on public.search_history;
create policy "search_history_update_own"
on public.search_history
for update
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);

drop policy if exists "search_history_delete_own" on public.search_history;
create policy "search_history_delete_own"
on public.search_history
for delete
using (auth.uid() = auth_user_id);
