-- OPS-02: security-field invariants apply to RPC and direct API writes alike.
create or replace function private.is_security_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id=auth.uid() and is_active and role='super_admin');
$$;
revoke all on function private.is_security_admin() from public, anon;
grant execute on function private.is_security_admin() to authenticated;

create or replace function private.protect_profile_security_fields() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op='DELETE' then
    if old.role='super_admin' then
      raise exception 'Change the Super Admin role before deleting this profile' using errcode='42501';
    end if;
    return old;
  end if;
  if tg_op='UPDATE' and new.id is distinct from old.id then
    raise exception 'Profile identity cannot be changed' using errcode='42501';
  end if;
  if tg_op='INSERT' then
    if (new.role <> 'customer' or new.is_active is distinct from true) and not private.is_security_admin() then
      raise exception 'Super Admin required for privileged profiles' using errcode='42501';
    end if;
    return new;
  end if;
  if old.role is distinct from new.role or old.is_active is distinct from new.is_active then
    if not private.is_security_admin() then
      raise exception 'Only an active Super Admin can change account access' using errcode='42501';
    end if;
    if old.id=auth.uid() then
      raise exception 'You cannot change your own role or active status' using errcode='42501';
    end if;
    -- Serialize privileged changes; trigger queries use a fresh snapshot after the lock.
    perform pg_catalog.pg_advisory_xact_lock(62002,1);
    if old.role='super_admin' and old.is_active and (new.role<>'super_admin' or not new.is_active)
       and not exists(select 1 from public.profiles where role='super_admin' and is_active and id<>old.id) then
      raise exception 'At least one active Super Admin is required' using errcode='42501';
    end if;
  end if;
  return new;
end;
$$;
drop trigger protect_profile_security_fields on public.profiles;
create trigger protect_profile_security_fields before insert or update or delete on public.profiles
for each row execute function private.protect_profile_security_fields();
revoke all on function private.protect_profile_security_fields() from public,anon,authenticated;

create function private.protect_permission_configuration() returns trigger
language plpgsql security definer set search_path='' as $$
declare target_id uuid;
begin
  if not private.is_security_admin() then
    raise exception 'Only an active Super Admin can configure permissions' using errcode='42501';
  end if;
  if tg_table_name='employee_permission_overrides' then
    if tg_op='DELETE' then target_id:=old.user_id; else target_id:=new.user_id; end if;
    if tg_op<>'DELETE' and not exists(select 1 from public.profiles where id=target_id and role not in ('super_admin','customer','partner_user')) then
      raise exception 'Overrides require a non-Super-Admin employee' using errcode='42501';
    end if;
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function private.protect_permission_configuration() from public,anon,authenticated;
create trigger protect_permission_configuration before insert or update or delete on public.employee_permission_overrides
for each row execute function private.protect_permission_configuration();
create trigger protect_permission_configuration before insert or update or delete on public.permissions
for each row execute function private.protect_permission_configuration();
create trigger protect_permission_configuration before insert or update or delete on public.role_permissions
for each row execute function private.protect_permission_configuration();

-- Staged rollout: staff without a verified factor retain access until onboarding.
-- Enrolled staff must use an AAL2 session for protected operations.
create function private.staff_mfa_satisfied() returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (
   coalesce(auth.jwt()->>'aal','aal1')='aal2'
   or not exists(select 1 from public.profiles p join auth.mfa_factors f on f.user_id=p.id
     where p.id=auth.uid() and p.role not in ('customer','partner_user') and f.status='verified')
 );
$$;
revoke all on function private.staff_mfa_satisfied() from public,anon;
grant execute on function private.staff_mfa_satisfied() to authenticated;
create or replace function private.is_security_admin() returns boolean
language sql stable security definer set search_path='' as $$
 select private.staff_mfa_satisfied() and exists(select 1 from public.profiles where id=auth.uid() and is_active and role='super_admin');
$$;
-- Add MFA to the central authorization predicates without changing their existing rules.
do $$
declare fn text; definition text;
begin
 foreach fn in array array['private.has_permission(text)','private.is_staff()','private.is_active_actor()'] loop
   select pg_get_functiondef(fn::regprocedure) into definition;
   if position('staff_mfa_satisfied' in definition)>0 then raise exception 'MFA already installed for %',fn; end if;
   definition:=regexp_replace(definition,'select ', 'select private.staff_mfa_satisfied() and ', 'i');
   execute definition;
 end loop;
 -- These two privileged procedures use explicit role checks rather than has_permission.
 foreach fn in array array['public.admin_account_deletion_list()','public.admin_review_account_deletion(uuid,text,text)'] loop
   select pg_get_functiondef(fn::regprocedure) into definition;
   definition:=regexp_replace(definition, E'begin\\n', E'begin\n  if not private.is_security_admin() then raise exception ''Super Admin with verified session required'' using errcode=''42501''; end if;\n', 'i');
   execute definition;
 end loop;
end;
$$;

-- Record security changes even when they do not originate from the employee RPC.
create function private.audit_access_configuration() returns trigger
language plpgsql security definer set search_path='' as $$
declare before_value jsonb; after_value jsonb; entity text;
begin
 if tg_table_name='profiles' then
   if old.role is not distinct from new.role and old.is_active is not distinct from new.is_active then return new; end if;
   before_value:=jsonb_build_object('role',old.role,'is_active',old.is_active);
   after_value:=jsonb_build_object('role',new.role,'is_active',new.is_active);
   entity:=new.id::text;
 else
   if tg_op<>'INSERT' then before_value:=to_jsonb(old); end if;
   if tg_op<>'DELETE' then after_value:=to_jsonb(new); end if;
   entity:=coalesce(after_value->>'user_id',before_value->>'user_id',after_value->>'code',before_value->>'code',after_value->>'role',before_value->>'role');
 end if;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,before_data,after_data)
 values(auth.uid(),'security.'||lower(tg_op),tg_table_name,entity,before_value,after_value);
 return null;
end;
$$;
revoke all on function private.audit_access_configuration() from public,anon,authenticated;
create trigger audit_access_configuration after update on public.profiles
for each row execute function private.audit_access_configuration();
create trigger audit_access_configuration after insert or update or delete on public.employee_permission_overrides
for each row execute function private.audit_access_configuration();
create trigger audit_access_configuration after insert or update or delete on public.permissions
for each row execute function private.audit_access_configuration();
create trigger audit_access_configuration after insert or update or delete on public.role_permissions
for each row execute function private.audit_access_configuration();
