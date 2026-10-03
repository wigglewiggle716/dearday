create or replace function public.admin_account_deletion_list()
returns table(
  id uuid,
  customer_id uuid,
  status text,
  requested_at timestamptz,
  reviewed_at timestamptz,
  admin_note text,
  full_name text,
  email text,
  phone text
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, private, auth
as $$
begin
  if not exists (
    select 1 from public.profiles p
    where p.id=auth.uid() and p.is_active=true and p.role='super_admin'::public.app_role
  ) then
    raise exception 'Super Admin access required';
  end if;

  return query
  select r.id,r.customer_id,r.status,r.requested_at,r.reviewed_at,r.admin_note,
         p.full_name,u.email::text,p.phone
  from public.account_deletion_requests r
  left join public.profiles p on p.id=r.customer_id
  left join auth.users u on u.id=r.customer_id
  order by case when r.status='pending' then 0 else 1 end, r.requested_at desc;
end;
$$;
