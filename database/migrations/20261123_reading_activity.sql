-- LORIS Group C reading activity: additive migration.
-- Creates a per-user, per-local-day activity record for reading streak/history.
-- This does not modify or remove any existing application data.

create table if not exists public.reading_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null,
  created_at timestamptz not null default now()
);


create unique index if not exists reading_activity_user_date_unique
  on public.reading_activity (user_id, activity_date);


alter table public.reading_activity enable row level security;


drop policy if exists reading_activity_owner_all on public.reading_activity;
create policy reading_activity_owner_all on public.reading_activity
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));



grant select, insert, update, delete on public.reading_activity to authenticated;
