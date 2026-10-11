-- STAGING ONLY: apply after STAGED_nonpayment_outbox.sql, NEVER on production without approval.
-- All triggers have disabled-by-default DB gates; there are no cron jobs or sends.
-- Only committed authoritative status transitions may enqueue transactional email.
-- Existing payment_received outbox/triggers are not changed.

-- Prefer customer-provided checkout email, then authenticated account email.
-- Locale falls back to Arabic if a verified stored preference is unavailable.
create or replace function private.transactional_order_contact(p_order_id uuid)
returns table(recipient text, customer_name text, locale text)
language sql stable security definer set search_path='' as $$
  select lower(btrim(coalesce(nullif(o.delivery_address->>'email',''),nullif(u.email,'')))) as recipient,
    left(coalesce(nullif(btrim(o.delivery_address->>'name'),''),
       nullif(btrim(p.full_name),''),case
         when coalesce(o.delivery_address->>'locale',u.raw_user_meta_data->>'locale')='en'
         then 'there' else 'عميلنا العزيز' end),100) as customer_name,
    case when coalesce(o.delivery_address->>'locale',u.raw_user_meta_data->>'locale')='en'
      then 'en' else 'ar' end as locale
  from public.orders o
  left join auth.users u on u.id=o.customer_id
  left join public.profiles p on p.id=o.customer_id
  where o.id=p_order_id
    and coalesce(nullif(btrim(o.delivery_address->>'email'),''),
                 nullif(u.email,'')) ~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$';
$$;
revoke all on function private.transactional_order_contact(uuid)
from PUBLIC,anon,authenticated;

-- Resolve only active, registered partner users; never send to directory emails.
create or replace function private.transactional_partner_recipients(p_partner_id uuid)
returns table(user_id uuid, recipient text, partner_name text, locale text)
language sql stable security definer set search_path='' as $$
  select pu.user_id,lower(btrim(u.email)),
    left(case when u.raw_user_meta_data->>'locale'='en'
         then coalesce(nullif(p.name_en,''),p.name_ar,'Partner')
         else coalesce(nullif(p.name_ar,''),p.name_en,'شريك Dear Day') end,100),
    case when u.raw_user_meta_data->>'locale'='en' then 'en' else 'ar' end
  from public.partner_users pu
  join public.profiles prof on prof.id=pu.user_id and prof.is_active=true
  join auth.users u on u.id=pu.user_id and u.email_confirmed_at is not null
  join public.partners p on p.id=pu.partner_id and p.status='active'
  where pu.partner_id=p_partner_id and pu.is_active=true
    and u.email ~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$';
$$;
revoke all on function private.transactional_partner_recipients(uuid)
from PUBLIC,anon,authenticated;

create or replace function private.transactional_order_status_producer()
returns trigger language plpgsql security definer set search_path='' as $$
declare
 c record; pr record; po record;
 v_event text; v_number text;
begin
 if old.status is not distinct from new.status then return new; end if;
 if new.status not in ('paid','confirmed','in_progress','completed') then return new; end if;
 if new.status='paid' and old.status<>'pending_payment' then return new; end if;
 if new.status='confirmed' and old.status<>'paid' then return new; end if;
 if new.status='in_progress' and old.status<>'confirmed' then return new; end if;
 if new.status='completed' and old.status<>'in_progress' then return new; end if;
 v_number:='DD-'||case when new.order_number<1000000
                  then lpad(new.order_number::text,6,'0')
                  else new.order_number::text end;
 v_event:=case new.status
   when 'paid' then 'booking_request_received'
   when 'confirmed' then 'booking_confirmed'
   when 'in_progress' then 'order_in_progress'
   when 'completed' then 'order_completed' end;
 if private.transactional_email_group_is_enabled('orders') then
   select * into c from private.transactional_order_contact(new.id);
   if found then
     perform private.queue_transactional_email(
       v_event,new.id,v_event||':'||new.id::text||':customer',
       c.locale,c.recipient,
       jsonb_build_object('CUSTOMER_NAME',c.customer_name,'ORDER_NUMBER',v_number)
     );
   end if;
 end if;
 -- Assigned partner orders begin at pending_payment; do not alert until PAID.
 if new.status='paid' and private.transactional_email_group_is_enabled('partners') then
   for po in select id,partner_id from public.partner_orders
             where order_id=new.id and status='pending' loop
     for pr in select * from private.transactional_partner_recipients(po.partner_id) loop
       perform private.queue_transactional_email(
         'partner_new_order',po.id,
         'partner_new_order:'||po.id::text||':'||pr.user_id::text,
         pr.locale,pr.recipient,
         jsonb_build_object('PARTNER_NAME',pr.partner_name,'ORDER_NUMBER',v_number)
       );
     end loop;
   end loop;
 end if;
 return new;
exception when others then
 raise warning 'transactional order email queue skipped (SQLSTATE %)',SQLSTATE;
 return new;
end $$;
revoke all on function private.transactional_order_status_producer()
from PUBLIC,anon,authenticated;
drop trigger if exists orders_transactional_email_producer on public.orders;
create trigger orders_transactional_email_producer
after update of status on public.orders
for each row execute function private.transactional_order_status_producer();

-- Request acknowledgement: always acknowledges request only, never approval/refund.
create or replace function private.transactional_cancellation_request_producer()
returns trigger language plpgsql security definer set search_path='' as $$
declare c record; n bigint; v_number text;
begin
 if not private.transactional_email_group_is_enabled('cancellations') then return new; end if;
 select * into c from private.transactional_order_contact(new.order_id);
 if not found then return new; end if;
 select order_number into n from public.orders where id=new.order_id;
 v_number:='DD-'||case when n<1000000 then lpad(n::text,6,'0') else n::text end;
 perform private.queue_transactional_email(
  'cancellation_requested',new.id,
  'cancellation_requested:'||new.id::text||':customer',
  c.locale,c.recipient,
  jsonb_build_object('CUSTOMER_NAME',c.customer_name,'ORDER_NUMBER',v_number)
 );
 return new;
exception when others then
 raise warning 'transactional cancellation receipt skipped (SQLSTATE %)',SQLSTATE;
 return new;
end $$;
revoke all on function private.transactional_cancellation_request_producer()
from PUBLIC,anon,authenticated;
drop trigger if exists cancellation_request_transactional_email_producer on public.cancellation_requests;
create trigger cancellation_request_transactional_email_producer
after insert on public.cancellation_requests
for each row execute function private.transactional_cancellation_request_producer();

-- Item-level decisions are authoritative. A request can contain both approved
-- and pending items, so never promise whole-order cancellation or refund.
create or replace function private.transactional_cancellation_item_producer()
returns trigger language plpgsql security definer set search_path='' as $$
declare
 c record; pr record; v_order uuid; v_number bigint; v_name text;
 v_status_ar text; v_status_en text; v_detail_ar text; v_detail_en text;
 v_partner_ar text; v_partner_en text; v_key text; v_currency text;
 v_amount numeric;
begin
 if tg_op='UPDATE' and new.status is not distinct from old.status then return new; end if;
 if new.status not in ('pending_review','approved','rejected','refund_pending','refunded') then return new; end if;
 if not private.transactional_email_group_is_enabled('cancellations')
    and not private.transactional_email_group_is_enabled('partners') then return new; end if;
 select r.order_id,o.order_number,left(oi.item_name,150),new.currency,new.approved_refund_amount
 into v_order,v_number,v_name,v_currency,v_amount
 from public.cancellation_requests r
 join public.orders o on o.id=r.order_id
 join public.order_items oi on oi.id=new.order_item_id
 where r.id=new.cancellation_request_id and oi.order_id=r.order_id;
 if v_order is null then return new; end if;
 v_key:='DD-'||case when v_number<1000000
                     then lpad(v_number::text,6,'0') else v_number::text end;
 v_status_ar:=case new.status
   when 'pending_review' then 'قيد المراجعة'
   when 'approved' then 'تم إلغاء العنصر'
   when 'refund_pending' then 'تم إلغاء العنصر والاسترداد قيد التنفيذ'
   when 'rejected' then 'تم رفض الإلغاء'
   when 'refunded' then 'تم تنفيذ الاسترداد' end;
 v_status_en:=case new.status
   when 'pending_review' then 'Under review'
   when 'approved' then 'Item cancelled'
   when 'refund_pending' then 'Item cancelled; refund pending'
   when 'rejected' then 'Cancellation declined'
   when 'refunded' then 'Refund processed' end;
 v_detail_ar:=case new.status
   when 'refund_pending' then 'بخصوص العنصر "'||v_name||'". الاسترداد لم يكتمل بعد.'
   when 'approved' then 'تم إلغاء العنصر "'||v_name||'".'
   when 'rejected' then 'لم يتم إلغاء العنصر "'||v_name||'". راجع حجوزاتك للتفاصيل.'
   else 'بخصوص العنصر "'||v_name||'".' end;
 v_detail_en:=case new.status
   when 'refund_pending' then 'For item "'||v_name||'". Your refund has not been completed yet.'
   when 'approved' then 'Item "'||v_name||'" was cancelled.'
   when 'rejected' then 'Item "'||v_name||'" was not cancelled. See bookings for details.'
   else 'Regarding item "'||v_name||'".' end;
 v_partner_ar:=case
   when new.status='pending_review' then 'استمر في التنفيذ حتى صدور قرار من Dear Day.'
   when new.status='rejected' then 'لم يتم إلغاء العنصر؛ استمر في التنفيذ.'
   else 'تم إلغاء العنصر؛ أوقف تنفيذه وفق تعليمات Dear Day.' end;
 v_partner_en:=case
   when new.status='pending_review' then 'Continue fulfilment until Dear Day confirms a decision.'
   when new.status='rejected' then 'Cancellation declined; continue fulfilment.'
   else 'Item cancelled; stop fulfilment as instructed by Dear Day.' end;
 if private.transactional_email_group_is_enabled('cancellations') then
   select * into c from private.transactional_order_contact(v_order);
   if found then
     if new.status='refunded' and new.refunded_at is not null and
        coalesce(v_amount,0)>0 then
       perform private.queue_transactional_email(
         'refund_completed',new.id,
         'refund_completed:'||new.id::text||':customer',
         c.locale,c.recipient,
         jsonb_build_object('CUSTOMER_NAME',c.customer_name,'ORDER_NUMBER',v_key,
           'REFUND_AMOUNT',to_char(v_amount,'FM999999990.00')||' '||v_currency)
       );
     elsif new.status in ('approved','rejected','refund_pending') then
       perform private.queue_transactional_email(
         'cancellation_update',new.id,
         'cancellation_update:'||new.id::text||':'||new.status::text||':customer',
         c.locale,c.recipient,
         jsonb_build_object('CUSTOMER_NAME',c.customer_name,'ORDER_NUMBER',v_key,
           'CANCELLATION_STATUS',case when c.locale='en' then v_status_en else v_status_ar end,
           'STATUS_DETAILS',case when c.locale='en' then v_detail_en else v_detail_ar end)
       );
     end if;
   end if;
 end if;
 if private.transactional_email_group_is_enabled('partners') and
    new.status in ('pending_review','approved','rejected','refund_pending') then
   for pr in select * from private.transactional_partner_recipients(new.partner_id) loop
     perform private.queue_transactional_email(
       'partner_cancellation',new.id,
       'partner_cancellation:'||new.id::text||':'||new.status::text||':'||pr.user_id::text,
       pr.locale,pr.recipient,
       jsonb_build_object('PARTNER_NAME',pr.partner_name,'ORDER_NUMBER',v_key,
         'CANCELLATION_STATUS',case when pr.locale='en' then v_status_en else v_status_ar end,
         'PARTNER_INSTRUCTIONS',case when pr.locale='en' then v_partner_en else v_partner_ar end)
     );
   end loop;
 end if;
 return new;
exception when others then
 raise warning 'transactional cancellation item email skipped (SQLSTATE %)',SQLSTATE;
 return new;
end $$;
revoke all on function private.transactional_cancellation_item_producer()
from PUBLIC,anon,authenticated;
drop trigger if exists cancellation_item_transactional_email_producer on public.cancellation_request_items;
create trigger cancellation_item_transactional_email_producer
after insert or update of status on public.cancellation_request_items
for each row execute function private.transactional_cancellation_item_producer();

-- No actual messages will be sent until DB gates, deployment gates, dispatch
-- secrets, event tests, and production rollout are separately approved.
