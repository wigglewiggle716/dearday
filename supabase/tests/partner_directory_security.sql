-- Run as postgres after both OPS-01 migrations. Everything is rolled back.
begin;
do $$
declare
  fixture_id uuid := gen_random_uuid();
  account record;
  expected_count bigint;
  actual_count bigint;
  customer_tests int := 0;
  partner_tests int := 0;
  staff_tests int := 0;
begin
  if has_any_column_privilege('anon', 'public.partners', 'SELECT') then
    raise exception 'Anonymous access to internal partner columns';
  end if;
  if has_table_privilege('authenticated', 'public.partners', 'TRUNCATE')
     or has_table_privilege('authenticated', 'public.partners', 'TRIGGER')
     or has_table_privilege('authenticated', 'public.partner_directory', 'INSERT')
     or has_table_privilege('anon', 'public.partner_directory', 'UPDATE') then
    raise exception 'Unsafe client grants';
  end if;
  if has_function_privilege('anon', 'private.sync_partner_directory()', 'EXECUTE')
     or has_function_privilege('authenticated', 'private.sync_partner_directory()', 'EXECUTE') then
    raise exception 'Projection trigger exposed to clients';
  end if;
  if (select array_agg(column_name::text order by ordinal_position)
      from information_schema.columns where table_schema='public' and table_name='partner_directory')
      <> array['id','name_ar','name_en','status'] then
    raise exception 'Unexpected public directory columns';
  end if;
  if exists (
    (select id,name_ar,name_en,status from public.partners except select * from public.partner_directory)
    union all
    (select * from public.partner_directory except select id,name_ar,name_en,status from public.partners)
  ) then raise exception 'Directory backfill differs from source'; end if;

  -- Temporary fixture exercises INSERT/UPDATE/status visibility/DELETE sync.
  insert into public.partners (id,name_ar,name_en,slug,status)
    values (fixture_id,'OPS-01 test','OPS-01 test','ops01-'||fixture_id,'pending');
  if not exists(select 1 from public.partner_directory where id=fixture_id) then
    raise exception 'Insert not synchronized';
  end if;
  execute 'set local role anon';
  if exists(select 1 from public.partner_directory where id=fixture_id) then
    raise exception 'Inactive directory row is public';
  end if;
  execute 'reset role';
  update public.partners set name_en='OPS-01 renamed',status='active' where id=fixture_id;
  execute 'set local role anon';
  if not exists(select 1 from public.partner_directory where id=fixture_id and name_en='OPS-01 renamed' and status='active') then
    raise exception 'Active directory row not visible or update not synchronized';
  end if;
  execute 'reset role';
  update public.partners set status='suspended' where id=fixture_id;
  execute 'set local role anon';
  if exists(select 1 from public.partner_directory where id=fixture_id) then
    raise exception 'Suspended directory row remains public';
  end if;
  execute 'reset role';

  -- JWT subjects are selected internally; no identifiers or contact data are returned.
  for account in select id,role from public.profiles
    where is_active and role in ('customer','partner_user','accountant','super_admin')
  loop
    perform set_config('request.jwt.claim.sub',account.id::text,true);
    perform set_config('request.jwt.claims',jsonb_build_object('sub',account.id,'role','authenticated')::text,true);
    if account.role='customer' then
      expected_count := 0; customer_tests := customer_tests+1;
    elsif account.role='partner_user' then
      select count(*) into expected_count from public.partners p where exists (
        select 1 from public.partner_users pu where pu.partner_id=p.id and pu.user_id=account.id and pu.is_active
      );
      partner_tests := partner_tests+1;
    else
      select count(*) into expected_count from public.partners;
      staff_tests := staff_tests+1;
    end if;
    execute 'set local role authenticated';
    select count(*) into actual_count from public.partners;
    if actual_count <> expected_count then
      raise exception 'Partner row visibility mismatch for role %',account.role;
    end if;
    -- Selecting the existing partner panel's fields remains permitted for authorized rows.
    perform id,commission_rate,contact_name,phone,email,coverage_areas from public.partners;
    if account.role='customer' and exists(select 1 from public.partner_directory where id=fixture_id) then
      raise exception 'Customer sees suspended directory row';
    end if;
    if account.role in ('accountant','super_admin') and not exists(select 1 from public.partner_directory where id=fixture_id) then
      raise exception 'Staff cannot resolve inactive partner labels';
    end if;
    execute 'reset role';
  end loop;
  if customer_tests=0 or partner_tests=0 or staff_tests=0 then
    raise exception 'Missing accounts for required role coverage';
  end if;
  perform set_config('request.jwt.claim.sub','',true);
  perform set_config('request.jwt.claims','{}',true);
  delete from public.partners where id=fixture_id;
  if exists(select 1 from public.partner_directory where id=fixture_id) then
    raise exception 'Delete not synchronized';
  end if;
end;
$$;
select 'PASS: grants, safe columns, backfill, synchronization, anon/customer/partner/staff RLS' as result;
rollback;
