-- Dear Day customer management
insert into public.permissions(code,description)
values ('customers.manage','Manage customer account status')
on conflict(code) do update set description=excluded.description;

insert into public.role_permissions(role,permission_code)
values ('admin','customers.manage')
on conflict do nothing;

drop policy if exists customer_addresses_admin_select on public.customer_addresses;
create policy customer_addresses_admin_select
on public.customer_addresses for select to authenticated
using(private.has_permission('customers.view'));

create or replace function private.customer_directory()
returns table(
  id uuid,
  email text,
  full_name text,
  first_name text,
  last_name text,
  phone text,
  birth_date date,
  area text,
  is_active boolean,
  created_at timestamptz,
  order_count bigint,
  total_spend numeric,
  last_order_at timestamptz
)
language plpgsql
security definer
set search_path=pg_catalog,public,auth,private
as $$
begin
  if not private.has_permission('customers.view') then
    raise exception 'Permission denied';
  end if;

  return query
  select
    p.id,
    u.email::text,
    p.full_name,
    p.first_name,
    p.last_name,
    p.phone,
    p.birth_date,
    p.area,
    p.is_active,
    p.created_at,
    count(o.id)::bigint,
    coalesce(sum(o.grand_total) filter(where o.status not in('cancelled','refunded')),0)::numeric,
    max(o.created_at)
  from public.profiles p
  join auth.users u on u.id=p.id
  left join public.orders o on o.customer_id=p.id
  where p.role='customer'::public.app_role
  group by p.id,u.email,p.full_name,p.first_name,p.last_name,p.phone,p.birth_date,p.area,p.is_active,p.created_at
  order by p.created_at desc;
end $$;

revoke all on function private.customer_directory() from public;
grant execute on function private.customer_directory() to authenticated;

create or replace function public.customer_list()
returns table(
  id uuid,
  email text,
  full_name text,
  first_name text,
  last_name text,
  phone text,
  birth_date date,
  area text,
  is_active boolean,
  created_at timestamptz,
  order_count bigint,
  total_spend numeric,
  last_order_at timestamptz
)
language sql
security invoker
set search_path=pg_catalog,public,private
as $$ select * from private.customer_directory() $$;

revoke all on function public.customer_list() from public;
grant execute on function public.customer_list() to authenticated;

create or replace function private.customer_set_active_impl(p_customer_id uuid,p_is_active boolean)
returns void
language plpgsql
security definer
set search_path=pg_catalog,public,private
as $$
declare
  v_old public.profiles%rowtype;
begin
  if not private.has_permission('customers.manage') then
    raise exception 'Permission denied';
  end if;

  select * into v_old from public.profiles where id=p_customer_id for update;
  if not found then raise exception 'Customer not found'; end if;
  if v_old.role <> 'customer'::public.app_role then raise exception 'Target account is not a customer'; end if;

  update public.profiles set is_active=p_is_active where id=p_customer_id;

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,before_data,after_data)
  values(
    auth.uid(),
    'customer.status_changed',
    'profile',
    p_customer_id::text,
    jsonb_build_object('is_active',v_old.is_active),
    jsonb_build_object('is_active',p_is_active)
  );
end $$;

revoke all on function private.customer_set_active_impl(uuid,boolean) from public;
grant execute on function private.customer_set_active_impl(uuid,boolean) to authenticated;

create or replace function public.customer_set_active(p_customer_id uuid,p_is_active boolean)
returns void
language sql
security invoker
set search_path=pg_catalog,public,private
as $$ select private.customer_set_active_impl(p_customer_id,p_is_active) $$;

revoke all on function public.customer_set_active(uuid,boolean) from public;
grant execute on function public.customer_set_active(uuid,boolean) to authenticated;
