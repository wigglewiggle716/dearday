-- Account deletion request workflow. Applied to Supabase production on 2026-10-03.
create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(), customer_id uuid null references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','rejected','completed')),
  requested_at timestamptz not null default now(), reviewed_by uuid null references auth.users(id) on delete set null,
  reviewed_at timestamptz null, completed_at timestamptz null, admin_note text null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists account_deletion_requests_one_pending_per_customer on public.account_deletion_requests(customer_id) where status='pending' and customer_id is not null;
create index if not exists account_deletion_requests_status_requested_idx on public.account_deletion_requests(status,requested_at desc);
alter table public.account_deletion_requests enable row level security;
drop policy if exists account_deletion_requests_customer_select on public.account_deletion_requests;
create policy account_deletion_requests_customer_select on public.account_deletion_requests for select to authenticated using(customer_id=auth.uid());
drop policy if exists account_deletion_requests_staff_select on public.account_deletion_requests;
create policy account_deletion_requests_staff_select on public.account_deletion_requests for select to authenticated using(private.has_permission('customers.view'));
alter table public.cancellation_requests alter column customer_id drop not null;
alter table public.cancellation_requests drop constraint if exists cancellation_requests_customer_id_fkey;
alter table public.cancellation_requests add constraint cancellation_requests_customer_id_fkey foreign key(customer_id) references auth.users(id) on delete set null;

create or replace function public.request_account_deletion() returns uuid language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare v_uid uuid:=auth.uid();v_id uuid;r record;
begin
 if v_uid is null then raise exception 'Authentication required'; end if;
 if not exists(select 1 from public.profiles where id=v_uid and is_active=true and role='customer'::public.app_role) then raise exception 'Only active customer accounts can request deletion'; end if;
 select id into v_id from public.account_deletion_requests where customer_id=v_uid and status='pending' order by requested_at desc limit 1;
 if v_id is not null then return v_id; end if;
 insert into public.account_deletion_requests(customer_id) values(v_uid) returning id into v_id;
 for r in select id from public.profiles where is_active=true and role='super_admin'::public.app_role loop
  perform private.create_notification(r.id,'account_deletion_requested','طلب حذف حساب جديد','قدّم عميل طلبًا لحذف حسابه وبياناته. راجع الطلب من صفحة العملاء.','New account deletion request','A customer requested permanent account and data deletion. Review it from Customers.','account_deletion_request',v_id,jsonb_build_object('request_id',v_id));
 end loop;
 return v_id;
end$$;

create or replace function public.my_account_deletion_request() returns table(id uuid,status text,requested_at timestamptz,reviewed_at timestamptz,admin_note text) language sql stable security definer set search_path=pg_catalog,public as $$ select r.id,r.status,r.requested_at,r.reviewed_at,r.admin_note from public.account_deletion_requests r where r.customer_id=auth.uid() order by r.requested_at desc limit 1 $$;

create or replace function public.admin_account_deletion_list() returns table(id uuid,customer_id uuid,status text,requested_at timestamptz,reviewed_at timestamptz,admin_note text,full_name text,email text,phone text) language plpgsql stable security definer set search_path=pg_catalog,public,private,auth as $$
begin
 if not exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_active=true and p.role='super_admin'::public.app_role) then raise exception 'Super Admin access required'; end if;
 return query select r.id,r.customer_id,r.status,r.requested_at,r.reviewed_at,r.admin_note,p.full_name,u.email,p.phone from public.account_deletion_requests r left join public.profiles p on p.id=r.customer_id left join auth.users u on u.id=r.customer_id order by case when r.status='pending' then 0 else 1 end,r.requested_at desc;
end$$;

create or replace function public.admin_review_account_deletion(p_request_id uuid,p_decision text,p_note text default null) returns text language plpgsql security definer set search_path=pg_catalog,public,private,auth as $$
declare v_admin uuid:=auth.uid();v_customer uuid;v_status text;
begin
 if not exists(select 1 from public.profiles p where p.id=v_admin and p.is_active=true and p.role='super_admin'::public.app_role) then raise exception 'Super Admin access required'; end if;
 if p_decision not in('approve','reject') then raise exception 'Invalid decision'; end if;
 select customer_id,status into v_customer,v_status from public.account_deletion_requests where id=p_request_id for update;
 if not found then raise exception 'Deletion request not found'; end if;if v_status<>'pending' then raise exception 'Deletion request is no longer pending';end if;if v_customer is null then raise exception 'Customer account is no longer available';end if;
 if p_decision='reject' then
  update public.account_deletion_requests set status='rejected',reviewed_by=v_admin,reviewed_at=now(),admin_note=nullif(trim(p_note),''),updated_at=now() where id=p_request_id;
  perform private.create_notification(v_customer,'account_deletion_rejected','تمت مراجعة طلب حذف الحساب','لم تتم الموافقة على طلب حذف الحساب. يمكنك التواصل مع خدمة العملاء للمزيد من التفاصيل.','Account deletion request reviewed','Your account deletion request was not approved. Contact customer support for more details.','account_deletion_request',p_request_id,jsonb_build_object('request_id',p_request_id,'status','rejected'));
  return 'rejected';
 end if;
 update public.orders set customer_id=null,occasion_type=null,occasion_date=null,occasion_time=null,delivery_area=null,delivery_address=null,customer_note=null,updated_at=now() where customer_id=v_customer;
 update public.booking_reservations set customer_id=null where customer_id=v_customer;
 update public.cancellation_requests set customer_id=null,reason_text=null,updated_at=now() where customer_id=v_customer;
 update public.audit_logs set actor_id=null,before_data=null,after_data=null where actor_id=v_customer;
 update public.account_deletion_requests set status='completed',reviewed_by=v_admin,reviewed_at=now(),completed_at=now(),admin_note=nullif(trim(p_note),''),updated_at=now() where id=p_request_id;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,after_data) values(v_admin,'account.deletion.completed','account_deletion_request',p_request_id::text,jsonb_build_object('status','completed'));
 delete from auth.users where id=v_customer;if not found then raise exception 'Auth user could not be deleted';end if;
 return 'completed';
end$$;
revoke all on function public.request_account_deletion() from public;revoke all on function public.my_account_deletion_request() from public;revoke all on function public.admin_account_deletion_list() from public;revoke all on function public.admin_review_account_deletion(uuid,text,text) from public;
grant execute on function public.request_account_deletion() to authenticated;grant execute on function public.my_account_deletion_request() to authenticated;grant execute on function public.admin_account_deletion_list() to authenticated;grant execute on function public.admin_review_account_deletion(uuid,text,text) to authenticated;grant select on public.account_deletion_requests to authenticated;
