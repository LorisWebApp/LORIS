-- LORIS additive migration: atomic Platform Manager review of organisation requests.
-- REVIEW BEFORE APPLYING. Not executed by the audit. Requires 20261115_security_rls_and_org_ownership.sql first
-- (organisation_requests table and loris_is_platform_manager()).
--
-- Approving a request must (1) create the Organisation row, (2) make the applicant its first ACTIVE admin
-- and (3) mark the request approved, all-or-nothing. Doing this from the browser in three calls could leave
-- half-applied state, so it is one SECURITY DEFINER function that first verifies the caller is a Platform Manager.
--
-- NOTE: the supplied schema shows Organisation columns with spaces/slashes ("organisation name",
-- "province/state", "city/town", "postal code"). They are quoted below. Verify against the live table
-- before applying; a mismatch only fails at call time, never silently.

begin;

create or replace function public.loris_review_organisation_request(
  p_request_id uuid,
  p_decision text,
  p_notes text default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.organisation_requests%rowtype;
  v_org_id bigint := null;
  v_profile_id uuid;
begin
  if not public.loris_is_platform_manager() then
    raise exception 'Only platform managers can review organisation requests.' using errcode = '42501';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected.' using errcode = '22023';
  end if;

  select * into r from public.organisation_requests where id = p_request_id for update;
  if not found then
    raise exception 'Organisation request not found.' using errcode = 'P0002';
  end if;
  if r.status <> 'pending' then
    raise exception 'This request has already been reviewed.' using errcode = '23514';
  end if;

  if p_decision = 'approved' then
    insert into public."Organisation"
      ("organisation name", email, type, country, "province/state", "city/town", "postal code")
    values
      (r.organisation_name, r.email, r.type, r.country, r.province_state, r.city_town, r.postal_code)
    returning id into v_org_id;

    select id into v_profile_id from public."Profiles" where auth_user_id = r.submitted_by;
    if v_profile_id is not null then
      insert into public."Memberships" (user_id, organisation_id, role, status)
      values (v_profile_id, v_org_id, 'admin', 'active');
    end if;
  end if;

  update public.organisation_requests
     set status = p_decision,
         review_notes = nullif(trim(coalesce(p_notes, '')), ''),
         reviewed_by = (select auth.uid()),
         reviewed_at = now(),
         updated_at = now()
   where id = p_request_id;

  return v_org_id;
end;
$$;

revoke all on function public.loris_review_organisation_request(uuid, text, text) from public;
grant execute on function public.loris_review_organisation_request(uuid, text, text) to authenticated;

commit;
