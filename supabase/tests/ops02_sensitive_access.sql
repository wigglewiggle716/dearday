begin;
do $$
declare admin_id uuid; actor_id uuid; old_name text;
begin
 select id into admin_id from public.profiles where role='super_admin' and is_active limit 1;
 select id,full_name into actor_id,old_name from public.profiles where role='customer' and is_active limit 1;
 if admin_id is null or actor_id is null then raise exception 'Missing test subjects'; end if;
 perform set_config('request.jwt.claim.sub',admin_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'aal','aal2')::text,true);
 update public.profiles set role='admin' where id=actor_id;
 insert into public.employee_permission_overrides(user_id,permission_code,is_granted) values(actor_id,'employees.manage',true)
 on conflict(user_id,permission_code) do update set is_granted=true;
 perform set_config('request.jwt.claim.sub',actor_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',actor_id,'aal','aal1')::text,true);
 set local role authenticated;
 begin
   update public.profiles set role='super_admin' where id=actor_id;
   raise exception 'Escalation succeeded';
 exception when insufficient_privilege then null; end;
 begin
   perform public.employee_update_access(actor_id,'super_admin',true);
   raise exception 'RPC escalation succeeded';
 exception when insufficient_privilege then null; end;
 begin
   insert into public.employee_permission_overrides(user_id,permission_code,is_granted) values(actor_id,'finance.manage',true);
   raise exception 'Permission escalation succeeded';
 exception when insufficient_privilege then null; end;
 update public.profiles set full_name='OPS02 temporary name' where id=actor_id;
 reset role;
 perform set_config('request.jwt.claim.sub',admin_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'aal','aal2')::text,true);
 begin
   update public.profiles set role='admin' where id=admin_id;
   raise exception 'Own demotion succeeded';
 exception when insufficient_privilege then null; end;
 begin
   update public.profiles set is_active=false where id=admin_id;
   raise exception 'Own suspension succeeded';
 exception when insufficient_privilege then null; end;
 begin
   delete from public.profiles where id=admin_id;
   raise exception 'Super Admin deletion succeeded';
 exception when insufficient_privilege then null; end;
 update public.profiles set role='accountant' where id=actor_id;
 if not exists(select 1 from public.profiles where id=actor_id and role='accountant') then raise exception 'Authorized update failed'; end if;
-- Synthetic MFA factor exists only in this rolled-back transaction.
 insert into auth.mfa_factors(id,user_id,factor_type,status,created_at,updated_at)
 values(gen_random_uuid(),actor_id,'totp','verified',now(),now());
 perform set_config('request.jwt.claim.sub',actor_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',actor_id,'aal','aal1')::text,true);
 set local role authenticated;
 if private.has_permission('finance.view') or private.is_staff() or private.is_active_actor() then
   raise exception 'Enrolled staff bypassed MFA at AAL1';
 end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',actor_id,'aal','aal2')::text,true);
 if not private.has_permission('finance.view') or not private.is_staff() or not private.is_active_actor() then
   raise exception 'Verified staff denied at AAL2';
 end if;
 reset role;
end;
$$;
rollback;
