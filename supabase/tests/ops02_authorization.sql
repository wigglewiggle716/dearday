-- Run as postgres. All account/fixture changes are rolled back, including on failure.
begin;
do $$
declare
  admin_id uuid;
  actor_id uuid;
  partner_a uuid := gen_random_uuid();
  partner_b uuid := gen_random_uuid();
  listing_id uuid := gen_random_uuid();
  version_id uuid := gen_random_uuid();
  tested_role public.app_role;
  tested_permission text;
  permission_codes text[];
  expected_codes text[];
  expected boolean;
  affected integer;
  scenario text;
begin
  select id into admin_id from public.profiles where role='super_admin' and is_active limit 1;
  select id into actor_id from public.profiles where role='customer' and is_active limit 1;
  if admin_id is null or actor_id is null then raise exception 'Active admin/customer fixture subjects required'; end if;
  select array_agg(code) into permission_codes from public.permissions;
  perform set_config('request.jwt.claim.sub',admin_id::text,true);
  insert into public.partners(id,name_ar,slug,status) values
    (partner_a,'OPS02 test A','ops02-'||partner_a,'active'),
    (partner_b,'OPS02 test B','ops02-'||partner_b,'active');
  insert into public.listings(id,partner_id,kind,is_available) values(listing_id,partner_a,'product',false);

  -- Evaluate all inherited staff roles and both non-staff roles with real RLS enabled.
  foreach tested_role in array array['admin','operations','accountant','partner_manager',
    'customer_support','marketing','content_admin','customer','partner_user']::public.app_role[] loop
    perform set_config('request.jwt.claim.sub',admin_id::text,true);
    update public.profiles set role=tested_role,is_active=true where id=actor_id;
    select coalesce(array_agg(permission_code),'{}'::text[]) into expected_codes from public.role_permissions where role=tested_role;
    perform set_config('request.jwt.claim.sub',actor_id::text,true);
    execute 'set local role authenticated';
    foreach tested_permission in array permission_codes loop
      expected := tested_permission=any(expected_codes);
      if private.has_permission(tested_permission) is distinct from expected then
        raise exception 'Permission mismatch for % / %',tested_role,tested_permission;
      end if;
    end loop;
    execute 'reset role';
  end loop;

  -- Editor can create a proposal, but cannot publish it by either direct writes or RPC.
  perform set_config('request.jwt.claim.sub',admin_id::text,true);
  update public.profiles set role='content_admin' where id=actor_id;
  perform set_config('request.jwt.claim.sub',actor_id::text,true);
  execute 'set local role authenticated';
  insert into public.listing_versions(id,listing_id,status,name_ar,price,submitted_by)
    values(version_id,listing_id,'pending_review','OPS02 draft',10,actor_id);
  begin
    update public.listing_versions set status='published' where id=version_id;
    raise exception 'Editor published by direct API';
  exception when insufficient_privilege then null; end;
  begin
    perform public.review_listing_version(version_id,'approve',null);
    raise exception 'Editor approved through RPC';
  exception when insufficient_privilege then null; end;
  begin
    update public.listings set published_version_id=version_id where id=listing_id;
    raise exception 'Editor bypassed publication pointer';
  exception when insufficient_privilege then null; end;
  execute 'reset role';

  -- Reviewer needs approvals.review, not catalog.manage or a hard-coded admin role.
  perform set_config('request.jwt.claim.sub',admin_id::text,true);
  update public.profiles set role='partner_manager' where id=actor_id;
  perform set_config('request.jwt.claim.sub',actor_id::text,true);
  execute 'set local role authenticated';
  if private.has_permission('catalog.manage') then raise exception 'Reviewer unexpectedly has editor permission'; end if;
  perform public.review_listing_version(version_id,'approve',null);
  if not exists(select 1 from public.listings where id=listing_id and published_version_id=version_id) then
    raise exception 'Reviewer approval did not publish';
  end if;
  execute 'reset role';
  perform set_config('request.jwt.claim.sub',admin_id::text,true);
  update public.profiles set role='content_admin' where id=actor_id;
  perform set_config('request.jwt.claim.sub',actor_id::text,true);
  execute 'set local role authenticated';
  begin
    update public.listing_versions set price=20 where id=version_id;
    raise exception 'Editor changed published price';
  exception when insufficient_privilege then null; end;
  execute 'reset role';

  -- Revoking a permission overrides the role, including Admin.
  perform set_config('request.jwt.claim.sub',admin_id::text,true);
  update public.profiles set role='admin' where id=actor_id;
  insert into public.employee_permission_overrides(user_id,permission_code,is_granted)
    values(actor_id,'approvals.review',false);
  perform set_config('request.jwt.claim.sub',actor_id::text,true);
  execute 'set local role authenticated';
  begin
    perform public.review_listing_version(version_id,'approve',null);
    raise exception 'Admin bypassed denied permission';
  exception when insufficient_privilege then null; end;
  execute 'reset role';
  perform set_config('request.jwt.claim.sub',admin_id::text,true);
  delete from public.employee_permission_overrides where user_id=actor_id;

  -- Active membership permits inventory. Each independent suspension blocks it.
  update public.profiles set role='partner_user' where id=actor_id;
  insert into public.partner_users(partner_id,user_id) values(partner_a,actor_id);
  perform set_config('request.jwt.claim.sub',actor_id::text,true);
  execute 'set local role authenticated';
  perform public.partner_set_inventory(listing_id,true,5,null);
  execute 'reset role';
  foreach scenario in array array['account','membership','partner'] loop
    perform set_config('request.jwt.claim.sub',admin_id::text,true);
    update public.profiles set is_active=(scenario<>'account') where id=actor_id;
    update public.partner_users set is_active=(scenario<>'membership') where user_id=actor_id and partner_id=partner_a;
    update public.partners set status=case when scenario='partner' then 'suspended'::public.partner_status else 'active'::public.partner_status end where id=partner_a;
    perform set_config('request.jwt.claim.sub',actor_id::text,true);
    execute 'set local role authenticated';
    if private.is_active_actor() or private.is_active_partner_member(partner_a) then
      raise exception 'Suspended % still authorized',scenario;
    end if;
    if exists(select 1 from public.partners where id=partner_a) then raise exception 'Suspended member sees internal record'; end if;
    begin
      perform public.partner_set_inventory(listing_id,false,2,null);
      raise exception 'Suspended % changed inventory',scenario;
    exception when insufficient_privilege then null; end;
    begin
      perform public.partner_list_orders();
      raise exception 'Suspended % accessed order RPC',scenario;
    exception when insufficient_privilege then null; end;
    execute 'reset role';
  end loop;
  -- A second active membership must not restore access to the suspended partner.
  perform set_config('request.jwt.claim.sub',admin_id::text,true);
  insert into public.partner_users(partner_id,user_id) values(partner_b,actor_id);
  perform set_config('request.jwt.claim.sub',actor_id::text,true);
  execute 'set local role authenticated';
  if not private.is_active_actor() or private.is_active_partner_member(partner_a) then
    raise exception 'Incorrect multi-partner boundary';
  end if;
  begin
    perform public.partner_set_inventory(listing_id,false,2,null);
    raise exception 'Another membership bypassed suspended partner';
  exception when insufficient_privilege then null; end;
  execute 'reset role';

  -- Inactive customers and employees cannot use protected RPCs or direct self updates.
  foreach tested_role in array array['customer','accountant','admin']::public.app_role[] loop
    perform set_config('request.jwt.claim.sub',admin_id::text,true);
    update public.profiles set role=tested_role,is_active=false where id=actor_id;
    perform set_config('request.jwt.claim.sub',actor_id::text,true);
    execute 'set local role authenticated';
    if private.is_active_actor() or exists(select 1 from public.get_my_permissions()) then
      raise exception 'Inactive role still authorized: %',tested_role;
    end if;
    update public.profiles set full_name=full_name where id=actor_id;
    get diagnostics affected=row_count;
    if affected<>0 then raise exception 'Inactive profile updated'; end if;
    begin
      perform public.mark_all_notifications_read();
      raise exception 'Inactive actor executed RPC';
    exception when insufficient_privilege then null; end;
    execute 'reset role';
  end loop;
  perform set_config('request.jwt.claim.sub','',true);
end $$;
select 'PASS: role permissions, editor/reviewer separation, override denial, account/member/partner suspension, multi-partner isolation' as result;
rollback;
