create type public.cancellation_request_status as enum ('pending_review','approved','partially_approved','rejected','refund_pending','refunded');
create type public.cancellation_item_status as enum ('pending_review','approved','rejected','refund_pending','refunded');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title_ar text not null,
  body_ar text not null,
  title_en text,
  body_en text,
  entity_type text,
  entity_id uuid,
  data jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_recipient_created_idx on public.notifications(recipient_user_id,created_at desc);
create index notifications_recipient_unread_idx on public.notifications(recipient_user_id,is_read,created_at desc);
alter table public.notifications enable row level security;
create policy notifications_self_read on public.notifications for select to authenticated using ((select auth.uid())=recipient_user_id);
grant select on public.notifications to authenticated;
revoke insert,update,delete on public.notifications from anon,authenticated;

create table public.cancellation_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete restrict,
  status public.cancellation_request_status not null default 'pending_review',
  reason_code text not null,
  reason_text text,
  requested_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index cancellation_requests_order_idx on public.cancellation_requests(order_id,requested_at desc);
create index cancellation_requests_customer_idx on public.cancellation_requests(customer_id,requested_at desc);
create index cancellation_requests_status_idx on public.cancellation_requests(status,requested_at desc);
alter table public.cancellation_requests enable row level security;
create policy cancellation_requests_customer_read on public.cancellation_requests for select to authenticated using ((select auth.uid())=customer_id);
create policy cancellation_requests_staff_read on public.cancellation_requests for select to authenticated using (private.has_permission('orders.view'));
grant select on public.cancellation_requests to authenticated;
revoke insert,update,delete on public.cancellation_requests from anon,authenticated;

create table public.cancellation_request_items (
  id uuid primary key default gen_random_uuid(),
  cancellation_request_id uuid not null references public.cancellation_requests(id) on delete cascade,
  order_item_id uuid not null references public.order_items(id) on delete restrict,
  partner_id uuid not null references public.partners(id) on delete restrict,
  status public.cancellation_item_status not null default 'pending_review',
  line_total_snapshot numeric not null check (line_total_snapshot>=0),
  currency text not null default 'EGP',
  policy_snapshot jsonb not null default '{}'::jsonb,
  calculation_mode text not null check (calculation_mode in ('automatic','manual_review')),
  estimated_refund_percent numeric check (estimated_refund_percent is null or (estimated_refund_percent>=0 and estimated_refund_percent<=100)),
  estimated_refund_amount numeric check (estimated_refund_amount is null or estimated_refund_amount>=0),
  approved_refund_amount numeric check (approved_refund_amount is null or approved_refund_amount>=0),
  admin_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(cancellation_request_id,order_item_id)
);
create unique index cancellation_request_items_open_item_uidx on public.cancellation_request_items(order_item_id) where status<>'rejected';
create index cancellation_request_items_request_idx on public.cancellation_request_items(cancellation_request_id);
create index cancellation_request_items_partner_idx on public.cancellation_request_items(partner_id,created_at desc);
create index cancellation_request_items_status_idx on public.cancellation_request_items(status,created_at desc);
alter table public.cancellation_request_items enable row level security;
create policy cancellation_items_customer_read on public.cancellation_request_items for select to authenticated using (exists(select 1 from public.cancellation_requests r where r.id=cancellation_request_id and r.customer_id=(select auth.uid())));
create policy cancellation_items_staff_read on public.cancellation_request_items for select to authenticated using (private.has_permission('orders.view'));
create policy cancellation_items_partner_read on public.cancellation_request_items for select to authenticated using (exists(select 1 from public.partner_users pu where pu.partner_id=cancellation_request_items.partner_id and pu.user_id=(select auth.uid()) and pu.is_active=true));
grant select on public.cancellation_request_items to authenticated;
revoke insert,update,delete on public.cancellation_request_items from anon,authenticated;

alter table public.order_items add column is_cancelled boolean not null default false;
alter table public.order_items add column cancelled_at timestamptz;
alter table public.order_items add column approved_refund_amount numeric not null default 0 check (approved_refund_amount>=0);
alter table public.order_items add column refund_status text not null default 'none' check (refund_status in ('none','pending','refunded'));

create or replace function private.create_notification(
  p_recipient uuid,p_kind text,p_title_ar text,p_body_ar text,p_title_en text default null,p_body_en text default null,p_entity_type text default null,p_entity_id uuid default null,p_data jsonb default '{}'::jsonb
) returns uuid language plpgsql security definer set search_path='pg_catalog','public','private' as $$
declare v_id uuid;
begin
  if p_recipient is null then return null; end if;
  insert into public.notifications(recipient_user_id,kind,title_ar,body_ar,title_en,body_en,entity_type,entity_id,data)
  values(p_recipient,p_kind,p_title_ar,p_body_ar,p_title_en,p_body_en,p_entity_type,p_entity_id,coalesce(p_data,'{}'::jsonb)) returning id into v_id;
  return v_id;
end $$;

create or replace function private.notify_admins(p_kind text,p_title_ar text,p_body_ar text,p_title_en text,p_body_en text,p_entity_type text,p_entity_id uuid,p_data jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path='pg_catalog','public','private' as $$
declare r record;
begin
 for r in select id from public.profiles where is_active=true and role in ('super_admin','admin') loop
  perform private.create_notification(r.id,p_kind,p_title_ar,p_body_ar,p_title_en,p_body_en,p_entity_type,p_entity_id,p_data);
 end loop;
end $$;

create or replace function private.notify_partner(p_partner_id uuid,p_kind text,p_title_ar text,p_body_ar text,p_title_en text,p_body_en text,p_entity_type text,p_entity_id uuid,p_data jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path='pg_catalog','public','private' as $$
declare r record;
begin
 for r in select pu.user_id from public.partner_users pu join public.profiles pr on pr.id=pu.user_id where pu.partner_id=p_partner_id and pu.is_active=true and pr.is_active=true loop
  perform private.create_notification(r.user_id,p_kind,p_title_ar,p_body_ar,p_title_en,p_body_en,p_entity_type,p_entity_id,p_data);
 end loop;
end $$;

create or replace function private.calculate_refund_estimate(p_snapshot jsonb,p_line_total numeric,p_date date,p_time time)
returns jsonb language plpgsql set search_path='pg_catalog','public','private' as $$
declare v_rules jsonb:=coalesce(p_snapshot->'rules','{}'::jsonb);v_mode text;v_event timestamptz;v_hours numeric;v_pct numeric;v_deposit numeric:=0;v_amount numeric;
begin
 v_mode:=coalesce(v_rules->>'mode','manual_review');
 if coalesce((v_rules->>'cancellation_allowed')::boolean,true)=false then
  return jsonb_build_object('mode','automatic','refund_percent',0,'refund_amount',0,'reason','cancellation_not_allowed');
 end if;
 if v_mode<>'tiered' or p_date is null then
  return jsonb_build_object('mode','manual_review','refund_percent',null,'refund_amount',null,'reason','manual_review');
 end if;
 v_event:=((p_date::text||' '||coalesce(p_time::text,'23:59:59'))::timestamp at time zone 'Africa/Cairo');
 v_hours:=extract(epoch from (v_event-now()))/3600.0;
 if v_hours<0 then
  v_pct:=coalesce((v_rules->>'no_show_refund_percent')::numeric,0);
 else
  select (x->>'refund_percent')::numeric into v_pct from jsonb_array_elements(coalesce(v_rules->'tiers','[]'::jsonb)) x
  where (x->>'min_hours_before')::numeric<=v_hours order by (x->>'min_hours_before')::numeric desc limit 1;
  v_pct:=coalesce(v_pct,0);
 end if;
 v_deposit:=coalesce((v_rules->>'deposit_non_refundable_percent')::numeric,0);
 v_pct:=greatest(0,least(100,v_pct-v_deposit));
 v_amount:=round(coalesce(p_line_total,0)*v_pct/100.0,2);
 return jsonb_build_object('mode','automatic','refund_percent',v_pct,'refund_amount',v_amount,'hours_before',round(v_hours,2),'reason','policy_tier');
end $$;

create or replace function private.preview_order_cancellation_impl(p_order_id uuid,p_order_item_ids uuid[] default null)
returns table(order_item_id uuid,item_name text,partner_id uuid,line_total numeric,currency text,policy_title text,calculation_mode text,estimated_refund_percent numeric,estimated_refund_amount numeric,is_cancelled boolean)
language plpgsql security definer set search_path='pg_catalog','public','private' as $$
declare v_uid uuid:=auth.uid();v_order public.orders%rowtype;
begin
 if v_uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
 select * into v_order from public.orders where id=p_order_id and customer_id=v_uid;
 if not found then raise exception 'Order not found' using errcode='42501'; end if;
 if v_order.status not in ('paid','confirmed','in_progress') then raise exception 'This order cannot be cancelled in its current status'; end if;
 return query
 select oi.id,oi.item_name,oi.partner_id,oi.line_total,v_order.currency,coalesce(oi.refund_policy_snapshot->>'title','Dear Day policy'),
        est->>'mode',case when est->>'refund_percent' is null then null else (est->>'refund_percent')::numeric end,
        case when est->>'refund_amount' is null then null else (est->>'refund_amount')::numeric end,oi.is_cancelled
 from public.order_items oi
 cross join lateral private.calculate_refund_estimate(oi.refund_policy_snapshot,oi.line_total,v_order.occasion_date,v_order.occasion_time) est
 where oi.order_id=v_order.id and oi.is_cancelled=false and (p_order_item_ids is null or cardinality(p_order_item_ids)=0 or oi.id=any(p_order_item_ids));
end $$;

create or replace function public.preview_order_cancellation(p_order_id uuid,p_order_item_ids uuid[] default null)
returns table(order_item_id uuid,item_name text,partner_id uuid,line_total numeric,currency text,policy_title text,calculation_mode text,estimated_refund_percent numeric,estimated_refund_amount numeric,is_cancelled boolean)
language sql security invoker set search_path='pg_catalog','public','private' as $$
 select * from private.preview_order_cancellation_impl(p_order_id,p_order_item_ids);
$$;

create or replace function private.customer_create_cancellation_impl(p_order_id uuid,p_order_item_ids uuid[],p_reason_code text,p_reason_text text default null)
returns jsonb language plpgsql security definer set search_path='pg_catalog','public','private' as $$
declare v_uid uuid:=auth.uid();v_order public.orders%rowtype;v_request uuid;v_item record;v_est jsonb;v_count int:=0;v_manual int:=0;v_est_total numeric:=0;v_partner record;
begin
 if v_uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if nullif(trim(coalesce(p_reason_code,'')),'') is null then raise exception 'Cancellation reason is required'; end if;
 select * into v_order from public.orders where id=p_order_id and customer_id=v_uid for update;
 if not found then raise exception 'Order not found' using errcode='42501'; end if;
 if v_order.status not in ('paid','confirmed','in_progress') then raise exception 'This order cannot be cancelled in its current status'; end if;
 if not exists(select 1 from public.order_items oi where oi.order_id=p_order_id and oi.is_cancelled=false and (p_order_item_ids is null or cardinality(p_order_item_ids)=0 or oi.id=any(p_order_item_ids))) then raise exception 'No cancellable items selected'; end if;
 if exists(select 1 from public.cancellation_request_items ci join public.order_items oi on oi.id=ci.order_item_id where oi.order_id=p_order_id and ci.status<>'rejected' and (p_order_item_ids is null or cardinality(p_order_item_ids)=0 or oi.id=any(p_order_item_ids))) then raise exception 'A cancellation request already exists for one or more selected items'; end if;
 insert into public.cancellation_requests(order_id,customer_id,reason_code,reason_text) values(p_order_id,v_uid,trim(p_reason_code),nullif(trim(coalesce(p_reason_text,'')),'')) returning id into v_request;
 for v_item in select oi.* from public.order_items oi where oi.order_id=p_order_id and oi.is_cancelled=false and (p_order_item_ids is null or cardinality(p_order_item_ids)=0 or oi.id=any(p_order_item_ids)) loop
   v_est:=private.calculate_refund_estimate(v_item.refund_policy_snapshot,v_item.line_total,v_order.occasion_date,v_order.occasion_time);
   insert into public.cancellation_request_items(cancellation_request_id,order_item_id,partner_id,line_total_snapshot,currency,policy_snapshot,calculation_mode,estimated_refund_percent,estimated_refund_amount)
   values(v_request,v_item.id,v_item.partner_id,v_item.line_total,v_order.currency,v_item.refund_policy_snapshot,v_est->>'mode',case when v_est->>'refund_percent' is null then null else (v_est->>'refund_percent')::numeric end,case when v_est->>'refund_amount' is null then null else (v_est->>'refund_amount')::numeric end);
   v_count:=v_count+1;
   if v_est->>'mode'='manual_review' then v_manual:=v_manual+1; else v_est_total:=v_est_total+coalesce((v_est->>'refund_amount')::numeric,0); end if;
 end loop;
 perform private.create_notification(v_uid,'cancellation_requested','تم استلام طلب الإلغاء','استلمنا طلب الإلغاء للطلب #DD'||v_order.order_number||' وسيتم مراجعته.','Cancellation request received','We received your cancellation request for order #DD'||v_order.order_number||' and it is under review.','cancellation_request',v_request,jsonb_build_object('order_id',p_order_id,'order_number',v_order.order_number));
 perform private.notify_admins('cancellation_requested','طلب إلغاء جديد','طلب إلغاء جديد للطلب #DD'||v_order.order_number||' ويشمل '||v_count||' عنصر/عناصر.','New cancellation request','A new cancellation request was submitted for order #DD'||v_order.order_number||'.','cancellation_request',v_request,jsonb_build_object('order_id',p_order_id,'order_number',v_order.order_number,'item_count',v_count));
 for v_partner in select ci.partner_id,count(*) c from public.cancellation_request_items ci where ci.cancellation_request_id=v_request group by ci.partner_id loop
   perform private.notify_partner(v_partner.partner_id,'partner_cancellation_pending','طلب إلغاء قيد المراجعة','يوجد طلب إلغاء قيد المراجعة للطلب #DD'||v_order.order_number||' ويشمل '||v_partner.c||' عنصر/عناصر تخصك. لا توقف التنفيذ حتى يصدر قرار Dear Day.','Cancellation under review','A cancellation request is under review for order #DD'||v_order.order_number||'. Continue execution until Dear Day confirms the decision.','cancellation_request',v_request,jsonb_build_object('order_id',p_order_id,'order_number',v_order.order_number));
 end loop;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,after_data) values(v_uid,'cancellation_requested','cancellation_request',v_request::text,jsonb_build_object('order_id',p_order_id,'item_count',v_count,'manual_review_items',v_manual,'automatic_estimated_total',v_est_total));
 return jsonb_build_object('request_id',v_request,'status','pending_review','item_count',v_count,'manual_review_items',v_manual,'automatic_estimated_total',v_est_total,'currency',v_order.currency);
end $$;

create or replace function public.customer_create_cancellation_request(p_order_id uuid,p_order_item_ids uuid[] default null,p_reason_code text default 'other',p_reason_text text default null)
returns jsonb language sql security invoker set search_path='pg_catalog','public','private' as $$
 select private.customer_create_cancellation_impl(p_order_id,p_order_item_ids,p_reason_code,p_reason_text);
$$;

create or replace function private.recompute_cancellation_request_status(p_request_id uuid)
returns public.cancellation_request_status language plpgsql security definer set search_path='pg_catalog','public','private' as $$
declare v_status public.cancellation_request_status;v_total int;v_pending int;v_rejected int;v_refund_pending int;v_refunded int;v_approved int;
begin
 select count(*),count(*) filter(where status='pending_review'),count(*) filter(where status='rejected'),count(*) filter(where status='refund_pending'),count(*) filter(where status='refunded'),count(*) filter(where status='approved')
 into v_total,v_pending,v_rejected,v_refund_pending,v_refunded,v_approved from public.cancellation_request_items where cancellation_request_id=p_request_id;
 if v_pending>0 then v_status:='pending_review';
 elsif v_rejected=v_total then v_status:='rejected';
 elsif v_refund_pending>0 then v_status:='refund_pending';
 elsif v_refunded>0 and v_refunded+v_rejected+v_approved=v_total then v_status:=case when v_rejected>0 then 'partially_approved' else 'refunded' end;
 elsif v_approved>0 and v_approved+v_rejected=v_total then v_status:=case when v_rejected>0 then 'partially_approved' else 'approved' end;
 else v_status:='partially_approved'; end if;
 update public.cancellation_requests set status=v_status,last_reviewed_at=now(),updated_at=now() where id=p_request_id;
 return v_status;
end $$;

create or replace function private.admin_review_cancellation_item_impl(p_request_item_id uuid,p_decision text,p_approved_refund_amount numeric default null,p_note text default null)
returns jsonb language plpgsql security definer set search_path='pg_catalog','public','private' as $$
declare v_uid uuid:=auth.uid();v_ci public.cancellation_request_items%rowtype;v_req public.cancellation_requests%rowtype;v_order public.orders%rowtype;v_oi public.order_items%rowtype;v_amount numeric;v_req_status public.cancellation_request_status;
begin
 if v_uid is null or not private.has_permission('orders.manage') then raise exception 'Permission denied' using errcode='42501'; end if;
 select * into v_ci from public.cancellation_request_items where id=p_request_item_id for update;
 if not found then raise exception 'Cancellation item not found'; end if;
 if v_ci.status<>'pending_review' then raise exception 'Cancellation item already reviewed'; end if;
 select * into v_req from public.cancellation_requests where id=v_ci.cancellation_request_id for update;
 select * into v_order from public.orders where id=v_req.order_id for update;
 select * into v_oi from public.order_items where id=v_ci.order_item_id for update;
 if lower(trim(p_decision))='reject' then
   if nullif(trim(coalesce(p_note,'')),'') is null then raise exception 'Rejection note is required'; end if;
   update public.cancellation_request_items set status='rejected',admin_note=trim(p_note),reviewed_by=v_uid,reviewed_at=now(),updated_at=now() where id=v_ci.id;
   perform private.create_notification(v_req.customer_id,'cancellation_rejected','تم رفض طلب الإلغاء','تم رفض إلغاء "'||v_oi.item_name||'" من الطلب #DD'||v_order.order_number||'. السبب: '||trim(p_note),'Cancellation request rejected','The cancellation request for "'||v_oi.item_name||'" was rejected.','cancellation_request',v_req.id,jsonb_build_object('request_item_id',v_ci.id,'order_id',v_order.id));
   perform private.notify_partner(v_ci.partner_id,'partner_cancellation_rejected','طلب الإلغاء مرفوض','تم رفض طلب إلغاء "'||v_oi.item_name||'" في الطلب #DD'||v_order.order_number||'. استمر في تنفيذ الطلب.','Cancellation rejected','The cancellation request for "'||v_oi.item_name||'" was rejected. Continue fulfilment.','cancellation_request',v_req.id,jsonb_build_object('request_item_id',v_ci.id,'order_id',v_order.id));
 else
   if lower(trim(p_decision))<>'approve' then raise exception 'Decision must be approve or reject'; end if;
   if v_ci.calculation_mode='manual_review' and p_approved_refund_amount is null then raise exception 'Approved refund amount is required for manual review'; end if;
   v_amount:=coalesce(p_approved_refund_amount,v_ci.estimated_refund_amount,0);
   if v_amount<0 or v_amount>v_ci.line_total_snapshot then raise exception 'Approved refund amount must be between 0 and the item total'; end if;
   if v_ci.calculation_mode='automatic' and p_approved_refund_amount is not null and abs(v_amount-coalesce(v_ci.estimated_refund_amount,0))>0.01 and nullif(trim(coalesce(p_note,'')),'') is null then raise exception 'A note is required when overriding the automatic estimate'; end if;
   update public.cancellation_request_items set status=case when v_amount>0 then 'refund_pending'::public.cancellation_item_status else 'approved'::public.cancellation_item_status end,approved_refund_amount=v_amount,admin_note=nullif(trim(coalesce(p_note,'')),''),reviewed_by=v_uid,reviewed_at=now(),updated_at=now() where id=v_ci.id;
   update public.order_items set is_cancelled=true,cancelled_at=now(),approved_refund_amount=v_amount,refund_status=case when v_amount>0 then 'pending' else 'none' end where id=v_oi.id;
   update public.booking_reservations set status='cancelled',updated_at=now() where order_item_id=v_oi.id and status in ('hold','confirmed');
   if not exists(select 1 from public.order_items oi where oi.order_id=v_order.id and oi.partner_id=v_ci.partner_id and oi.is_cancelled=false) then
     update public.partner_orders set status='cancelled',updated_at=now() where order_id=v_order.id and partner_id=v_ci.partner_id and status<>'completed';
   end if;
   if not exists(select 1 from public.order_items oi where oi.order_id=v_order.id and oi.is_cancelled=false) then
     update public.orders set status='cancelled',updated_at=now() where id=v_order.id and status not in ('completed','refunded');
   end if;
   perform private.create_notification(v_req.customer_id,case when v_amount>0 then 'refund_pending' else 'cancellation_approved' end,'تم قبول الإلغاء',case when v_amount>0 then 'تم قبول إلغاء "'||v_oi.item_name||'" من الطلب #DD'||v_order.order_number||'. المبلغ المعتمد للاسترداد: '||to_char(v_amount,'FM999999990.00')||' '||v_ci.currency||'، وحالة الاسترداد الآن: قيد التنفيذ.' else 'تم قبول إلغاء "'||v_oi.item_name||'" من الطلب #DD'||v_order.order_number||' بدون مبلغ مسترد وفق السياسة المطبقة.' end,'Cancellation approved',case when v_amount>0 then 'Cancellation approved. Refund amount: '||v_amount||' '||v_ci.currency||'. Refund is pending.' else 'Cancellation approved with no refund amount under the applicable policy.' end,'cancellation_request',v_req.id,jsonb_build_object('request_item_id',v_ci.id,'order_id',v_order.id,'refund_amount',v_amount));
   perform private.notify_partner(v_ci.partner_id,case when v_amount>0 then 'partner_refund_pending' else 'partner_cancellation_approved' end,'تم تأكيد إلغاء عنصر',case when v_amount>0 then 'تم إلغاء "'||v_oi.item_name||'" من الطلب #DD'||v_order.order_number||'. أوقف التنفيذ. قيمة الاسترداد المعتمدة للعميل: '||to_char(v_amount,'FM999999990.00')||' '||v_ci.currency||'.' else 'تم إلغاء "'||v_oi.item_name||'" من الطلب #DD'||v_order.order_number||'. أوقف التنفيذ.' end,'Item cancellation confirmed','The item "'||v_oi.item_name||'" in order #DD'||v_order.order_number||' has been cancelled. Stop fulfilment.','cancellation_request',v_req.id,jsonb_build_object('request_item_id',v_ci.id,'order_id',v_order.id,'refund_amount',v_amount));
 end if;
 v_req_status:=private.recompute_cancellation_request_status(v_req.id);
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,before_data,after_data) values(v_uid,case when lower(trim(p_decision))='approve' then 'cancellation_item_approved' else 'cancellation_item_rejected' end,'cancellation_request_item',v_ci.id::text,to_jsonb(v_ci),jsonb_build_object('request_status',v_req_status,'approved_refund_amount',v_amount,'note',p_note));
 return jsonb_build_object('request_id',v_req.id,'request_item_id',v_ci.id,'item_status',case when lower(trim(p_decision))='approve' then case when coalesce(v_amount,0)>0 then 'refund_pending' else 'approved' end else 'rejected' end,'request_status',v_req_status,'approved_refund_amount',v_amount,'currency',v_ci.currency);
end $$;

create or replace function public.admin_review_cancellation_item(p_request_item_id uuid,p_decision text,p_approved_refund_amount numeric default null,p_note text default null)
returns jsonb language sql security invoker set search_path='pg_catalog','public','private' as $$
 select private.admin_review_cancellation_item_impl(p_request_item_id,p_decision,p_approved_refund_amount,p_note);
$$;

create or replace function private.partner_list_cancellations_impl()
returns table(request_id uuid,request_item_id uuid,order_id uuid,order_number bigint,item_name text,item_status public.cancellation_item_status,estimated_refund_amount numeric,approved_refund_amount numeric,currency text,reason_code text,reason_text text,requested_at timestamptz,reviewed_at timestamptz,admin_note text)
language plpgsql security definer set search_path='pg_catalog','public','private' as $$
declare v_uid uuid:=auth.uid();
begin
 if v_uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if not exists(select 1 from public.profiles where id=v_uid and role='partner_user' and is_active=true) then raise exception 'Partner access required' using errcode='42501'; end if;
 return query select r.id,ci.id,o.id,o.order_number,oi.item_name,ci.status,ci.estimated_refund_amount,ci.approved_refund_amount,ci.currency,r.reason_code,r.reason_text,r.requested_at,ci.reviewed_at,ci.admin_note
 from public.cancellation_request_items ci join public.cancellation_requests r on r.id=ci.cancellation_request_id join public.orders o on o.id=r.order_id join public.order_items oi on oi.id=ci.order_item_id
 where exists(select 1 from public.partner_users pu where pu.user_id=v_uid and pu.partner_id=ci.partner_id and pu.is_active=true)
 order by r.requested_at desc;
end $$;

create or replace function public.partner_list_cancellations()
returns table(request_id uuid,request_item_id uuid,order_id uuid,order_number bigint,item_name text,item_status public.cancellation_item_status,estimated_refund_amount numeric,approved_refund_amount numeric,currency text,reason_code text,reason_text text,requested_at timestamptz,reviewed_at timestamptz,admin_note text)
language sql security invoker set search_path='pg_catalog','public','private' as $$ select * from private.partner_list_cancellations_impl(); $$;

create or replace function private.mark_notification_read_impl(p_notification_id uuid)
returns boolean language plpgsql security definer set search_path='pg_catalog','public','private' as $$
declare v_uid uuid:=auth.uid();v_changed int;
begin
 if v_uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
 update public.notifications set is_read=true,read_at=coalesce(read_at,now()) where id=p_notification_id and recipient_user_id=v_uid;
 get diagnostics v_changed=row_count;return v_changed>0;
end $$;
create or replace function public.mark_notification_read(p_notification_id uuid)
returns boolean language sql security invoker set search_path='pg_catalog','public','private' as $$ select private.mark_notification_read_impl(p_notification_id); $$;

create or replace function private.mark_all_notifications_read_impl()
returns integer language plpgsql security definer set search_path='pg_catalog','public','private' as $$
declare v_uid uuid:=auth.uid();v_changed int;
begin
 if v_uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
 update public.notifications set is_read=true,read_at=coalesce(read_at,now()) where recipient_user_id=v_uid and is_read=false;
 get diagnostics v_changed=row_count;return v_changed;
end $$;
create or replace function public.mark_all_notifications_read()
returns integer language sql security invoker set search_path='pg_catalog','public','private' as $$ select private.mark_all_notifications_read_impl(); $$;

revoke all on function public.preview_order_cancellation(uuid,uuid[]) from public,anon;
grant execute on function public.preview_order_cancellation(uuid,uuid[]) to authenticated;
revoke all on function public.customer_create_cancellation_request(uuid,uuid[],text,text) from public,anon;
grant execute on function public.customer_create_cancellation_request(uuid,uuid[],text,text) to authenticated;
revoke all on function public.admin_review_cancellation_item(uuid,text,numeric,text) from public,anon;
grant execute on function public.admin_review_cancellation_item(uuid,text,numeric,text) to authenticated;
revoke all on function public.partner_list_cancellations() from public,anon;
grant execute on function public.partner_list_cancellations() to authenticated;
revoke all on function public.mark_notification_read(uuid) from public,anon;
grant execute on function public.mark_notification_read(uuid) to authenticated;
revoke all on function public.mark_all_notifications_read() from public,anon;
grant execute on function public.mark_all_notifications_read() to authenticated;

revoke all on function private.create_notification(uuid,text,text,text,text,text,text,uuid,jsonb) from public,anon,authenticated;
revoke all on function private.notify_admins(text,text,text,text,text,text,uuid,jsonb) from public,anon,authenticated;
revoke all on function private.notify_partner(uuid,text,text,text,text,text,text,uuid,jsonb) from public,anon,authenticated;
revoke all on function private.calculate_refund_estimate(jsonb,numeric,date,time) from public,anon,authenticated;
revoke all on function private.preview_order_cancellation_impl(uuid,uuid[]) from public,anon;
grant execute on function private.preview_order_cancellation_impl(uuid,uuid[]) to authenticated;
revoke all on function private.customer_create_cancellation_impl(uuid,uuid[],text,text) from public,anon;
grant execute on function private.customer_create_cancellation_impl(uuid,uuid[],text,text) to authenticated;
revoke all on function private.recompute_cancellation_request_status(uuid) from public,anon,authenticated;
revoke all on function private.admin_review_cancellation_item_impl(uuid,text,numeric,text) from public,anon;
grant execute on function private.admin_review_cancellation_item_impl(uuid,text,numeric,text) to authenticated;
revoke all on function private.partner_list_cancellations_impl() from public,anon;
grant execute on function private.partner_list_cancellations_impl() to authenticated;
revoke all on function private.mark_notification_read_impl(uuid) from public,anon;
grant execute on function private.mark_notification_read_impl(uuid) to authenticated;
revoke all on function private.mark_all_notifications_read_impl() from public,anon;
grant execute on function private.mark_all_notifications_read_impl() to authenticated;