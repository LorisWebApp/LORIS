-- LORIS additive migration: statistics RPC used by Group A's Platform Manager dashboard.
-- REVIEW BEFORE APPLYING. Not executed by the integration. Requires 20261115_security_rls_and_org_ownership.sql
-- (organisation_requests table and loris_is_platform_manager()). Creates one new read-only function; drops nothing.
begin;
create or replace function public.get_platform_dashboard_stats()
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.loris_is_platform_manager() then
    raise exception 'Only platform managers can read platform statistics.' using errcode = '42501';
  end if;
  return json_build_object(
    'organisations',    (select count(*) from public."Organisation"),
    'users',            (select count(*) from public."Profiles"),
    'pending_requests', (select count(*) from public.organisation_requests where status = 'pending')
  );
end;
$$;
revoke all on function public.get_platform_dashboard_stats() from public;
grant execute on function public.get_platform_dashboard_stats() to authenticated;
commit;
