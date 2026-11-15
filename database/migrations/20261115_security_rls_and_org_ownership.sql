-- LORIS additive security migration (REVIEW BEFORE APPLYING).
-- This migration does not drop, truncate, recreate, or delete existing application data.
-- IMPORTANT: Existing materials keep organisation_id = NULL until they are safely assigned.

begin;

-- 1. Add the missing organisation ownership link without changing existing rows.
alter table public.materials
  add column if not exists organisation_id bigint;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'materials_organisation_id_fkey'
      and conrelid = 'public.materials'::regclass
  ) then
    alter table public.materials
      add constraint materials_organisation_id_fkey
      foreign key (organisation_id)
      references public."Organisation" (id)
      on update cascade
      on delete restrict;
  end if;
end $$;

create index if not exists materials_organisation_id_idx
  on public.materials (organisation_id);

-- 2. Store organisation applications separately from approved organisations.
create table if not exists public.organisation_requests (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references auth.users(id) on delete restrict,
  organisation_name text not null,
  email text not null,
  type text not null,
  country text not null,
  province_state text not null,
  city_town text not null,
  postal_code integer,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  review_notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organisation_requests_submitted_by_idx
  on public.organisation_requests (submitted_by);
create index if not exists organisation_requests_status_created_idx
  on public.organisation_requests (status, created_at desc);

-- 3. Security-definer helpers avoid recursive RLS policy lookups between Profiles
-- and Memberships. The functions expose only boolean permission checks.
create or replace function public.loris_is_platform_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public."Profiles" p
    where p.auth_user_id = (select auth.uid())
      and p.platform_role = 'platform_manager'
  );
$$;

create or replace function public.loris_is_active_org_member(target_org_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public."Memberships" m
    join public."Profiles" p on p.id = m.user_id
    where p.auth_user_id = (select auth.uid())
      and m.organisation_id = target_org_id
      and m.status = 'active'
  );
$$;

create or replace function public.loris_is_org_admin(target_org_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public."Memberships" m
    join public."Profiles" p on p.id = m.user_id
    where p.auth_user_id = (select auth.uid())
      and m.organisation_id = target_org_id
      and m.role = 'admin'
      and m.status = 'active'
  );
$$;

create or replace function public.loris_is_org_admin_any()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public."Memberships" m
    join public."Profiles" p on p.id = m.user_id
    where p.auth_user_id = (select auth.uid())
      and m.role = 'admin'
      and m.status = 'active'
  );
$$;

create or replace function public.loris_can_view_profile(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.loris_is_platform_manager()
    or exists (
      select 1
      from public."Memberships" target_membership
      join public."Memberships" viewer_membership
        on viewer_membership.organisation_id = target_membership.organisation_id
      join public."Profiles" viewer_profile
        on viewer_profile.id = viewer_membership.user_id
      where target_membership.user_id = target_profile_id
        and target_membership.status = 'active'
        and viewer_profile.auth_user_id = (select auth.uid())
        and viewer_membership.role = 'admin'
        and viewer_membership.status = 'active'
    );
$$;

revoke all on function public.loris_is_platform_manager() from public;
revoke all on function public.loris_is_active_org_member(bigint) from public;
revoke all on function public.loris_is_org_admin(bigint) from public;
revoke all on function public.loris_is_org_admin_any() from public;
revoke all on function public.loris_can_view_profile(uuid) from public;
grant execute on function public.loris_is_platform_manager() to authenticated;
grant execute on function public.loris_is_active_org_member(bigint) to authenticated;
grant execute on function public.loris_is_org_admin(bigint) to authenticated;
grant execute on function public.loris_is_org_admin_any() to authenticated;
grant execute on function public.loris_can_view_profile(uuid) to authenticated;

-- 3a. Ensure each new Supabase Auth user receives the application profile row
-- required by the existing Profiles/Memberships role model. Existing users/rows
-- are not modified; ON CONFLICT prevents duplicate profiles.
create or replace function public.loris_handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public."Profiles" (auth_user_id, full_name, email, platform_role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'LORIS User'),
    coalesce(new.email, ''),
    'end_user'
  )
  on conflict (auth_user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.loris_handle_new_auth_user() from public;
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'on_auth_user_created_loris'
      and tgrelid = 'auth.users'::regclass
      and not tgisinternal
  ) then
    create trigger on_auth_user_created_loris
      after insert on auth.users
      for each row execute function public.loris_handle_new_auth_user();
  end if;
end $$;

-- 4. Enable RLS on all application tables that contain protected data.
alter table public."Profiles" enable row level security;
alter table public."Organisation" enable row level security;
alter table public."Memberships" enable row level security;
alter table public.categories enable row level security;
alter table public.materials enable row level security;
alter table public.user_favourites enable row level security;
alter table public.user_bookmarks enable row level security;
alter table public.user_notes enable row level security;
alter table public.user_highlights enable row level security;
alter table public.reading_progress enable row level security;
alter table public.offline_downloads enable row level security;
alter table public.organisation_requests enable row level security;

-- 5. Profiles: users can read/update only their own basic profile. They cannot
-- promote themselves to platform_manager. Platform managers can administer profiles.
drop policy if exists profiles_select_self_or_pm on public."Profiles";
create policy profiles_select_self_or_pm on public."Profiles"
for select to authenticated
using (
  auth_user_id = (select auth.uid())
  or public.loris_is_platform_manager()
  or public.loris_can_view_profile(id)
);

drop policy if exists profiles_insert_self_end_user on public."Profiles";
create policy profiles_insert_self_end_user on public."Profiles"
for insert to authenticated
with check (auth_user_id = (select auth.uid()) and platform_role = 'end_user');

drop policy if exists profiles_update_self_end_user on public."Profiles";
create policy profiles_update_self_end_user on public."Profiles"
for update to authenticated
using (auth_user_id = (select auth.uid()) and platform_role = 'end_user')
with check (auth_user_id = (select auth.uid()) and platform_role = 'end_user');

drop policy if exists profiles_pm_all on public."Profiles";
create policy profiles_pm_all on public."Profiles"
for all to authenticated
using (public.loris_is_platform_manager())
with check (public.loris_is_platform_manager());

-- 6. Organisation records: active members can read their own organisation;
-- only Platform Managers can create/update/delete approved organisation rows.
drop policy if exists organisation_select_member_or_pm on public."Organisation";
create policy organisation_select_member_or_pm on public."Organisation"
for select to authenticated
using (public.loris_is_active_org_member(id) or public.loris_is_platform_manager());

drop policy if exists organisation_pm_manage on public."Organisation";
create policy organisation_pm_manage on public."Organisation"
for all to authenticated
using (public.loris_is_platform_manager())
with check (public.loris_is_platform_manager());

-- 7. Memberships: users see their own membership; org admins manage memberships
-- only inside their own organisation; Platform Managers can administer all.
drop policy if exists memberships_select_scoped on public."Memberships";
create policy memberships_select_scoped on public."Memberships"
for select to authenticated
using (
  exists (
    select 1 from public."Profiles" p
    where p.id = "Memberships".user_id
      and p.auth_user_id = (select auth.uid())
  )
  or public.loris_is_org_admin(organisation_id)
  or public.loris_is_platform_manager()
);

drop policy if exists memberships_admin_insert on public."Memberships";
create policy memberships_admin_insert on public."Memberships"
for insert to authenticated
with check (
  public.loris_is_platform_manager()
  or public.loris_is_org_admin(organisation_id)
);

drop policy if exists memberships_admin_update on public."Memberships";
create policy memberships_admin_update on public."Memberships"
for update to authenticated
using (public.loris_is_platform_manager() or public.loris_is_org_admin(organisation_id))
with check (public.loris_is_platform_manager() or public.loris_is_org_admin(organisation_id));

drop policy if exists memberships_admin_delete on public."Memberships";
create policy memberships_admin_delete on public."Memberships"
for delete to authenticated
using (public.loris_is_platform_manager() or public.loris_is_org_admin(organisation_id));

-- 8. Organisation registration requests: applicants can submit and read their own
-- requests; only Platform Managers can review/change status.
drop policy if exists organisation_requests_insert_own on public.organisation_requests;
create policy organisation_requests_insert_own on public.organisation_requests
for insert to authenticated
with check (submitted_by = (select auth.uid()) and status = 'pending' and reviewed_by is null);

drop policy if exists organisation_requests_select_own_or_pm on public.organisation_requests;
create policy organisation_requests_select_own_or_pm on public.organisation_requests
for select to authenticated
using (submitted_by = (select auth.uid()) or public.loris_is_platform_manager());

drop policy if exists organisation_requests_pm_update on public.organisation_requests;
create policy organisation_requests_pm_update on public.organisation_requests
for update to authenticated
using (public.loris_is_platform_manager())
with check (public.loris_is_platform_manager());

-- 8a. End-user support requests (the supplied schema did not include this table).
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reference text not null unique,
  subject text not null,
  category text not null check (category in ('technical','account','reading','content','feedback','other')),
  description text not null,
  status text not null default 'open' check (status in ('open','in_progress','resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists support_tickets_user_created_idx on public.support_tickets(user_id, created_at desc);
alter table public.support_tickets enable row level security;
drop policy if exists support_tickets_owner_select on public.support_tickets;
create policy support_tickets_owner_select on public.support_tickets for select to authenticated
using (user_id = (select auth.uid()) or public.loris_is_platform_manager());
drop policy if exists support_tickets_owner_insert on public.support_tickets;
create policy support_tickets_owner_insert on public.support_tickets for insert to authenticated
with check (user_id = (select auth.uid()) and status = 'open');
drop policy if exists support_tickets_pm_update on public.support_tickets;
create policy support_tickets_pm_update on public.support_tickets for update to authenticated
using (public.loris_is_platform_manager()) with check (public.loris_is_platform_manager());

-- 9. Categories: readable to authenticated users; only Platform Managers or
-- active organisation admins can change the shared category list.
drop policy if exists categories_authenticated_read on public.categories;
create policy categories_authenticated_read on public.categories
for select to authenticated using (true);

drop policy if exists categories_admin_manage on public.categories;
create policy categories_admin_manage on public.categories
for all to authenticated
using (public.loris_is_platform_manager() or public.loris_is_org_admin_any())
with check (public.loris_is_platform_manager() or public.loris_is_org_admin_any());

-- 10. Materials: published global materials are readable to signed-in users;
-- organisation materials require active membership. Only an org admin can mutate
-- materials for that organisation. Platform Managers can administer all materials.
drop policy if exists materials_select_scoped on public.materials;
create policy materials_select_scoped on public.materials
for select to authenticated
using (
  public.loris_is_platform_manager()
  or (
    status = 'published'
    and (organisation_id is null or public.loris_is_active_org_member(organisation_id))
  )
  or (organisation_id is not null and public.loris_is_org_admin(organisation_id))
);

drop policy if exists materials_admin_insert on public.materials;
create policy materials_admin_insert on public.materials
for insert to authenticated
with check (
  uploaded_by = (select auth.uid())
  and organisation_id is not null
  and (public.loris_is_platform_manager() or public.loris_is_org_admin(organisation_id))
);

drop policy if exists materials_admin_update on public.materials;
create policy materials_admin_update on public.materials
for update to authenticated
using (public.loris_is_platform_manager() or (organisation_id is not null and public.loris_is_org_admin(organisation_id)))
with check (public.loris_is_platform_manager() or (organisation_id is not null and public.loris_is_org_admin(organisation_id)));

drop policy if exists materials_admin_delete on public.materials;
create policy materials_admin_delete on public.materials
for delete to authenticated
using (public.loris_is_platform_manager() or (organisation_id is not null and public.loris_is_org_admin(organisation_id)));

-- 11. User-owned tables: each user can access only rows whose user_id equals
-- their Supabase auth.users.id. This intentionally does not use Profiles.id.

drop policy if exists user_favourites_owner_all on public.user_favourites;
create policy user_favourites_owner_all on public.user_favourites
for all to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.materials material where material.id = user_favourites.material_id)
);

drop policy if exists user_bookmarks_owner_all on public.user_bookmarks;
create policy user_bookmarks_owner_all on public.user_bookmarks
for all to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.materials material where material.id = user_bookmarks.material_id)
);

drop policy if exists user_notes_owner_all on public.user_notes;
create policy user_notes_owner_all on public.user_notes
for all to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.materials material where material.id = user_notes.material_id)
);

drop policy if exists user_highlights_owner_all on public.user_highlights;
create policy user_highlights_owner_all on public.user_highlights
for all to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.materials material where material.id = user_highlights.material_id)
);

drop policy if exists reading_progress_owner_all on public.reading_progress;
create policy reading_progress_owner_all on public.reading_progress
for all to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.materials material where material.id = reading_progress.material_id)
);

-- Offline permission status/expiry is authoritative server data. Clients may
-- request a download (pending), read their own rows, and remove their own rows;
-- they cannot self-approve an offline permission or extend its expiry.
drop policy if exists offline_downloads_owner_all on public.offline_downloads;
drop policy if exists offline_downloads_select_own on public.offline_downloads;
create policy offline_downloads_select_own on public.offline_downloads
for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists offline_downloads_request_pending on public.offline_downloads;
create policy offline_downloads_request_pending on public.offline_downloads
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and download_status = 'pending'
  and exists (select 1 from public.materials material where material.id = offline_downloads.material_id)
);

drop policy if exists offline_downloads_delete_own on public.offline_downloads;
create policy offline_downloads_delete_own on public.offline_downloads
for delete to authenticated
using (user_id = (select auth.uid()));

commit;

-- Operational notes:
-- * Review and grant table privileges to authenticated as required by the current
--   Supabase grants; RLS does not itself grant SQL privileges.
-- * Backfill materials.organisation_id manually after validating ownership. Do not
--   guess an organisation for existing rows.
-- * Review Storage/CDN bucket access separately. RLS on `materials` does not protect
--   publicly accessible R2 URLs; use private buckets or short-lived signed URLs.
-- * The service-role key bypasses RLS and must remain server-side.
