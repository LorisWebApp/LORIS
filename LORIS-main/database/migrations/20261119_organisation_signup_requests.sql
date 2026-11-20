-- Create organisation review requests from organisation signup metadata.
-- This trigger runs in the auth.users insert transaction, so the account, profile,
-- and pending request are created together even when email confirmation is enabled.
begin;

create or replace function public.loris_handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_data jsonb := new.raw_user_meta_data -> 'organisation_request';
  postal_code_text text;
begin
  insert into public."Profiles" (auth_user_id, full_name, email, platform_role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'LORIS User'),
    coalesce(new.email, ''),
    'end_user'
  )
  on conflict (auth_user_id) do nothing;

  if new.raw_user_meta_data ->> 'account_type' = 'organisation' then
    postal_code_text := nullif(btrim(request_data ->> 'postal_code'), '');

    if jsonb_typeof(request_data) is distinct from 'object'
      or nullif(btrim(request_data ->> 'organisation_name'), '') is null
      or nullif(btrim(new.email), '') is null
      or nullif(btrim(request_data ->> 'type'), '') is null
      or nullif(btrim(request_data ->> 'country'), '') is null
      or nullif(btrim(request_data ->> 'province_state'), '') is null
      or nullif(btrim(request_data ->> 'city_town'), '') is null
      or postal_code_text is null
      or postal_code_text !~ '^\d{1,9}$' then
      raise exception 'Organisation signup details are incomplete or invalid.' using errcode = '22023';
    end if;

    insert into public.organisation_requests (
      submitted_by, organisation_name, email, type, country,
      province_state, city_town, postal_code
    ) values (
      new.id,
      btrim(request_data ->> 'organisation_name'),
      lower(btrim(new.email)),
      btrim(request_data ->> 'type'),
      btrim(request_data ->> 'country'),
      btrim(request_data ->> 'province_state'),
      btrim(request_data ->> 'city_town'),
      postal_code_text::integer
    );
  end if;

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
commit;