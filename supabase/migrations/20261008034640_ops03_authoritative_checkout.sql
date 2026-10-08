-- Server-owned checkout, quoted from published catalog. Payments remain disabled.
create table private.checkout_requests(
 customer_id uuid not null references public.profiles(id),
 request_key uuid not null,
 payload jsonb not null,
 order_id uuid not null unique references public.orders(id),
 result jsonb not null,
 expires_at timestamptz not null,
 primary key(customer_id,request_key)
);
alter table private.checkout_requests enable row level security;
revoke all on private.checkout_requests from public,anon,authenticated;
grant all on private.checkout_requests to service_role;
revoke insert,update,delete on public.order_items,public.partner_orders from authenticated,anon;
revoke insert on public.orders from authenticated,anon;

create function private.prepare_checkout_impl(p_items jsonb,p_event jsonb,p_key uuid,p_quote_token text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 uid uuid:=auth.uid(); items jsonb; payload jsonb; previous private.checkout_requests%rowtype;
 entry record; l public.listings%rowtype; v public.listing_versions%rowtype; partner public.partners%rowtype;
 setting public.listing_availability_settings%rowtype; availability jsonb; existing_hold uuid;
 event_date date; event_time time; qty integer; used bigint; total numeric(12,2):=0;
 lines jsonb:='[]'; line jsonb; quote jsonb; token text; result jsonb;
 oid uuid; item_id uuid; order_number bigint; expiry timestamptz:=now()+interval '15 minutes';
 start_time time; end_time time;
begin
 if uid is null or not exists(select 1 from public.profiles where id=uid and role='customer' and is_active) then
   raise exception 'CUSTOMER_LOGIN_REQUIRED' using errcode='42501';
 end if;
 if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) not between 1 and 50 then raise exception 'INVALID_CART'; end if;
 if jsonb_typeof(p_event) is distinct from 'object' or length(p_event::text)>8000 then raise exception 'INVALID_EVENT'; end if;
 event_date:=(p_event->>'date')::date; event_time:=(p_event->>'time')::time;
 if event_date is null or event_time is null or event_date<(now() at time zone 'Africa/Cairo')::date or event_date>(now() at time zone 'Africa/Cairo')::date+366 then raise exception 'INVALID_EVENT_DATE'; end if;
 if nullif(trim(p_event->>'address'),'') is null or nullif(trim(p_event->>'phone'),'') is null then raise exception 'MISSING_DELIVERY_DETAILS'; end if;
 -- Reject malformed/fractional quantities; aggregate duplicate IDs before any stock check.
 for entry in select value from jsonb_array_elements(p_items) loop
   if jsonb_typeof(entry.value) is distinct from 'object' or coalesce(entry.value->>'quantity','') !~ '^[1-9][0-9]{0,2}$' then raise exception 'INVALID_QUANTITY'; end if;
   perform (entry.value->>'listing_id')::uuid;
   if nullif(entry.value->>'listing_id','') is null then raise exception 'INVALID_LISTING'; end if;
 end loop;
 select jsonb_agg(jsonb_build_object('listing_id',id,'quantity',q) order by id) into items from
 (select (value->>'listing_id')::uuid id,sum((value->>'quantity')::int) q from jsonb_array_elements(p_items) group by 1) a;
 if exists(select 1 from jsonb_array_elements(items) x where (x->>'quantity')::int>999) then raise exception 'INVALID_QUANTITY'; end if;
 payload:=jsonb_build_object('items',items,'event',p_event);
 -- Serialize requests per customer; the exact payload is retained, not client amounts.
 perform pg_advisory_xact_lock(hashtextextended('checkout-user:'||uid::text,0));
 if p_key is not null then
   select * into previous from private.checkout_requests where customer_id=uid and request_key=p_key;
   if found then
     if previous.payload<>payload then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
     if previous.expires_at<=now() then raise exception 'ORDER_EXPIRED'; end if;
     return previous.result;
   end if;
   if (select count(*) from private.checkout_requests where customer_id=uid and expires_at>now())>=3 then raise exception 'TOO_MANY_PENDING_ORDERS'; end if;
 end if;
 -- Acquire all listing locks in deterministic order for stock and catalog consistency.
 for entry in select value from jsonb_array_elements(items) loop
   select * into l from public.listings where id=(entry.value->>'listing_id')::uuid for update;
   if not found or not l.is_available or l.published_version_id is null then raise exception 'LISTING_UNAVAILABLE'; end if;
   select * into partner from public.partners where id=l.partner_id for share;
   if not found or partner.status<>'active' or partner.commission_rate not between 0 and 100 then raise exception 'PARTNER_UNAVAILABLE'; end if;
   select * into v from public.listing_versions where id=l.published_version_id and listing_id=l.id for share;
   if not found or v.status<>'published' or v.currency<>'EGP' or v.price<=0 then raise exception 'INVALID_PUBLISHED_PRICE'; end if;
   qty:=(entry.value->>'quantity')::int;
   perform pg_advisory_xact_lock(hashtextextended(l.id::text||'|'||event_date::text,0));
   -- An unbound browser hold may be replaced by the atomic order hold.
   select id into existing_hold from public.booking_reservations where listing_id=l.id and customer_id=uid
     and reservation_date=event_date and order_id is null and status='hold' and expires_at>now()
     order by created_at desc limit 1;
   select coalesce(sum(quantity),0) into used from public.booking_reservations
     where listing_id=l.id and id is distinct from existing_hold and (status='confirmed' or (status='hold' and expires_at>now()));
   if l.stock_qty is not null and qty>l.stock_qty-used then raise exception 'INSUFFICIENT_STOCK'; end if;
   select * into setting from public.listing_availability_settings where listing_id=l.id for share;
   start_time:=null;end_time:=null;
   if found and setting.booking_enabled then
     availability:=private.compute_listing_availability(l.id,event_date,event_time,qty,existing_hold);
     if coalesce((availability->>'available')::boolean,false) is not true then raise exception 'UNAVAILABLE_SLOT:%',availability->>'reason'; end if;
     if setting.booking_mode='time_slot' then start_time:=event_time;end_time:=(availability->>'end_time')::time; end if;
     expiry:=least(expiry,now()+make_interval(mins=>setting.hold_minutes));
   elsif l.kind in ('venue','experience','service') or l.capacity_per_day is not null then
     raise exception 'BOOKING_CONFIGURATION_REQUIRED';
   end if;
   total:=total+v.price*qty;
   lines:=lines||jsonb_build_array(jsonb_build_object('listing_id',l.id,'version_id',v.id,'partner_id',partner.id,
     'name',v.name_ar,'name_en',coalesce(v.name_en,v.name_ar),'quantity',qty,'unit_price',v.price,'line_total',v.price*qty,
     'commission_rate',partner.commission_rate,'start_time',start_time,'end_time',end_time,'replace_hold',existing_hold));
 end loop;
 -- Current store model has no delivery surcharge or promotion engine.
 -- Neither is accepted from the browser. Configure shipping before launch if required.
 quote:=jsonb_build_object('items',(select jsonb_agg(x-'commission_rate'-'replace_hold') from jsonb_array_elements(lines) x),
   'subtotal',total,'delivery_total',0,'discount_total',0,'grand_total',total,'currency','EGP');
 token:=md5(jsonb_build_object('quote',quote,'event',p_event)::text);
 if p_key is null then return quote||jsonb_build_object('quote_token',token); end if;
 if p_quote_token is distinct from token then raise exception 'PRICE_CHANGED'; end if;
 insert into public.orders(customer_id,status,occasion_type,occasion_date,occasion_time,delivery_area,delivery_address,customer_note,subtotal,grand_total,currency)
 values(uid,'pending_payment',left(p_event->>'occasion',100),event_date,event_time,left(p_event->>'area',150),
 jsonb_build_object('address',p_event->>'address','phone',p_event->>'phone','recipient',p_event->>'recipient'),left(p_event->>'note',2000),total,total,'EGP')
 returning id,orders.order_number into oid,order_number;
 for line in select value from jsonb_array_elements(lines) loop
   insert into public.order_items(order_id,listing_id,partner_id,listing_version_id,item_name,unit_price,quantity,line_total,item_snapshot)
   values(oid,(line->>'listing_id')::uuid,(line->>'partner_id')::uuid,(line->>'version_id')::uuid,line->>'name',
     (line->>'unit_price')::numeric,(line->>'quantity')::int,(line->>'line_total')::numeric,line-'commission_rate'-'replace_hold') returning id into item_id;
   update public.booking_reservations set status='released' where id=(line->>'replace_hold')::uuid and order_id is null and status='hold';
   insert into public.booking_reservations(listing_id,partner_id,customer_id,order_id,order_item_id,reservation_date,start_time,end_time,quantity,status,expires_at)
   values((line->>'listing_id')::uuid,(line->>'partner_id')::uuid,uid,oid,item_id,event_date,(line->>'start_time')::time,(line->>'end_time')::time,(line->>'quantity')::int,'hold',expiry);
 end loop;
 insert into public.partner_orders(order_id,partner_id,subtotal,commission_rate,commission_amount,partner_net)
 select oid,(x->>'partner_id')::uuid,sum((x->>'line_total')::numeric),max((x->>'commission_rate')::numeric),
 round(sum((x->>'line_total')::numeric)*max((x->>'commission_rate')::numeric)/100,2),
 sum((x->>'line_total')::numeric)-round(sum((x->>'line_total')::numeric)*max((x->>'commission_rate')::numeric)/100,2)
 from jsonb_array_elements(lines) x group by x->>'partner_id';
 result:=quote||jsonb_build_object('order_id',oid,'order_number',order_number,'status','pending_payment','expires_at',expiry);
 insert into private.checkout_requests values(uid,p_key,payload,oid,result,expiry);
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,after_data)
 values(uid,'order.created','order',oid::text,jsonb_build_object('total',total,'currency','EGP','status','pending_payment'));
 return result;
end $$;
revoke all on function private.prepare_checkout_impl(jsonb,jsonb,uuid,text) from public,anon;
grant execute on function private.prepare_checkout_impl(jsonb,jsonb,uuid,text) to authenticated;
create function public.prepare_checkout(p_items jsonb,p_event jsonb,p_key uuid default null,p_quote_token text default null)
returns jsonb language sql security invoker set search_path='' as $$
 select private.prepare_checkout_impl(p_items,p_event,p_key,p_quote_token);
$$;
revoke all on function public.prepare_checkout(jsonb,jsonb,uuid,text) from public,anon;
grant execute on function public.prepare_checkout(jsonb,jsonb,uuid,text) to authenticated;

-- A browser may not release/resize a reservation already bound to an order.
do $$ declare f text; begin
 select pg_get_functiondef('private.create_booking_hold_impl(uuid,date,time without time zone,integer)'::regprocedure) into f;
 f:=replace(f,'r.status=''hold'' and r.expires_at>now()','r.status=''hold'' and r.order_id is null and r.expires_at>now()');
 execute f;
 select pg_get_functiondef('private.release_booking_hold_impl(uuid)'::regprocedure) into f;
 f:=replace(f,'and status=''hold''','and status=''hold'' and order_id is null');
 execute f;
end $$;

create function private.guard_partner_order_before_payment() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if new.status is distinct from old.status and new.status in ('accepted','in_progress','ready','completed')
   and not exists(select 1 from public.orders where id=new.order_id and status in ('paid','confirmed','in_progress','completed')) then
   raise exception 'ORDER_NOT_PAID' using errcode='42501';
 end if;
 return new;
end $$;
revoke all on function private.guard_partner_order_before_payment() from public,anon,authenticated;
create trigger partner_orders_require_payment before update on public.partner_orders
for each row execute function private.guard_partner_order_before_payment();
