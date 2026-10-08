-- Service-only payment ledger. Browser roles cannot read or mutate it.
create table private.payment_attempts(
 id uuid primary key default gen_random_uuid(),order_id uuid not null unique references public.orders(id),
 amount_cents bigint not null check(amount_cents>0),currency text not null check(currency='EGP'),
 integration_id bigint not null check(integration_id>0),owner_id bigint not null check(owner_id>0),
 provider_order_id bigint unique,provider_intention_id text unique,client_secret text,
 state text not null default 'creating' check(state in ('creating','ready','unknown','failed','paid','expired','review')),
 paid_transaction_id bigint unique,expires_at timestamptz not null,created_at timestamptz not null default now()
);
create table private.payment_events(
 fingerprint text primary key,attempt_id uuid not null references private.payment_attempts(id),
 transaction_id bigint not null, outcome text not null, details jsonb not null,created_at timestamptz not null default now()
);
alter table private.payment_attempts enable row level security;
alter table private.payment_events enable row level security;
create policy payments_no_browser on private.payment_attempts for all to anon,authenticated using(false) with check(false);
create policy payment_events_no_browser on private.payment_events for all to anon,authenticated using(false) with check(false);
revoke all on private.payment_attempts,private.payment_events from public,anon,authenticated;
grant all on private.payment_attempts,private.payment_events to service_role;

create function private.reserve_guest_payment(p_guest uuid,p_order uuid,p_integration bigint,p_owner bigint)
returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.orders%rowtype; a private.payment_attempts%rowtype; expiry timestamptz; fresh boolean:=false;
begin
 if p_guest is null or p_integration<=0 or p_owner<=0 then raise exception 'INVALID_PAYMENT'; end if;
 -- Ownership is checked before returning any order data; no email-based lookup.
 select expires_at into expiry from private.guest_checkout_requests where guest_id=p_guest and order_id=p_order;
 if not found then raise exception 'ORDER_NOT_FOUND' using errcode='42501'; end if;
 select * into o from public.orders where id=p_order for update;
 if o.status<>'pending_payment' or expiry<=now() then raise exception 'ORDER_NOT_PAYABLE'; end if;
 select * into a from private.payment_attempts where order_id=p_order for update;
 if found then
  if a.integration_id<>p_integration or a.owner_id<>p_owner then raise exception 'PAYMENT_METHOD_LOCKED'; end if;
 else
  insert into private.payment_attempts(order_id,amount_cents,currency,integration_id,owner_id,expires_at)
  values(o.id,(o.grand_total*100)::bigint,o.currency,p_integration,p_owner,expiry) returning * into a;
  fresh:=true;
 end if;
 return jsonb_build_object('id',a.id,'new',fresh,'state',a.state,'amount_cents',a.amount_cents,'currency',a.currency,
 'expires_at',a.expires_at,'client_secret',a.client_secret,'order_id',o.id,'contact',o.delivery_address,
 'area',o.delivery_area,'items',(select jsonb_agg(jsonb_build_object('name',item_name,'amount',(unit_price*100)::bigint,'quantity',quantity)) from public.order_items where order_id=o.id));
end $$;
create function private.bind_payment_intention(p_attempt uuid,p_provider_order bigint,p_intention text,p_client_secret text)
returns boolean language plpgsql security definer set search_path='' as $$
declare a private.payment_attempts%rowtype;
begin
 select * into a from private.payment_attempts where id=p_attempt for update;
 if not found or p_provider_order<=0 or nullif(p_intention,'') is null or nullif(p_client_secret,'') is null then raise exception 'INVALID_INTENTION'; end if;
 if a.provider_order_id is not null then
  if a.provider_order_id<>p_provider_order or a.provider_intention_id<>p_intention then raise exception 'INTENTION_CONFLICT'; end if;
  return true;
 end if;
 update private.payment_attempts set provider_order_id=p_provider_order,provider_intention_id=p_intention,client_secret=p_client_secret,
 state=case when state in ('creating','unknown') then 'ready' else state end where id=a.id;
 return true;
end $$;
create function private.mark_payment_unknown(p_attempt uuid) returns void language sql security definer set search_path='' as $$
 update private.payment_attempts set state='unknown' where id=p_attempt and state='creating';
$$;

create function private.process_paymob_event(p_event jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare a private.payment_attempts%rowtype; o public.orders%rowtype; old_event private.payment_events%rowtype;
 outcome text; tx bigint:=(p_event->>'transaction_id')::bigint; fp text:=p_event->>'fingerprint';
 is_success boolean:=(p_event->>'success')::boolean; entry record; n int;
begin
 if fp !~ '^[a-f0-9]{64}$' or tx is null or tx<=0 then raise exception 'INVALID_EVENT'; end if;
 -- The signed Paymob order id must already be bound from the intention API response.
 select * into a from private.payment_attempts where provider_order_id=(p_event->>'provider_order_id')::bigint;
 if not found then raise exception 'PAYMENT_NOT_REGISTERED'; end if;
 select * into o from public.orders where id=a.order_id for update;
 select * into a from private.payment_attempts where id=a.id for update;
 select * into old_event from private.payment_events where fingerprint=fp;
 if found then return jsonb_build_object('outcome',old_event.outcome,'duplicate',true); end if;
 if a.amount_cents is distinct from (o.grand_total*100)::bigint or a.currency is distinct from o.currency
 or (p_event->>'amount_cents')::bigint is distinct from a.amount_cents
 or p_event->>'currency' is distinct from a.currency
 or (p_event->>'integration_id')::bigint is distinct from a.integration_id
 or (p_event->>'owner_id')::bigint is distinct from a.owner_id then outcome:='mismatch';
 elsif coalesce((p_event->>'is_refunded')::boolean,true) or coalesce((p_event->>'is_voided')::boolean,true)
 or coalesce((p_event->>'has_parent_transaction')::boolean,true) or coalesce((p_event->>'is_auth')::boolean,true)
 or coalesce((p_event->>'is_capture')::boolean,true) or not coalesce((p_event->>'is_standalone_payment')::boolean,false) then outcome:='action_review';
 elsif (p_event->>'pending')::boolean is distinct from false then outcome:='pending';
 elsif is_success is distinct from true or (p_event->>'error_occured')::boolean is distinct from false then outcome:='failed';
 elsif a.paid_transaction_id=tx then outcome:='already_paid';
 elsif a.paid_transaction_id is not null or o.status in ('paid','confirmed','in_progress','completed','refunded') then outcome:='additional_payment_review';
 elsif a.state='review' then outcome:='blocked_review';
 elsif a.expires_at<=clock_timestamp() or o.status<>'pending_payment' then outcome:='late_payment_review';
 else
  -- Keep the same listing lock order as checkout. Confirmed reservations count as
  -- consumed stock; do not also decrement listings.stock_qty.
  for entry in select distinct listing_id from public.order_items where order_id=o.id order by listing_id loop
   perform 1 from public.listings where id=entry.listing_id for update;
  end loop;
  if exists(select 1 from public.order_items i where i.order_id=o.id and not exists(
   select 1 from public.booking_reservations r where r.order_id=o.id and r.order_item_id=i.id
   and r.listing_id=i.listing_id and r.quantity=i.quantity and r.status='hold' and r.expires_at>clock_timestamp()))
   or not exists(select 1 from public.order_items where order_id=o.id) then outcome:='reservation_review';
  else
   update public.booking_reservations set status='confirmed',expires_at=null where order_id=o.id and status='hold';
   update public.orders set status='paid' where id=o.id;
   update private.payment_attempts set state='paid',paid_transaction_id=tx,client_secret=null where id=a.id;
   outcome:='paid';
  end if;
 end if;
 if outcome in ('mismatch','action_review','additional_payment_review','blocked_review','late_payment_review','reservation_review') then
  -- Do not reverse an already paid order or auto-refund from unsigned callback fields.
  update private.payment_attempts set state='review' where id=a.id;
 elsif outcome='failed' then update private.payment_attempts set state='failed' where id=a.id and paid_transaction_id is null and state not in ('review','expired');
 end if;
 insert into private.payment_events(fingerprint,attempt_id,transaction_id,outcome,details)
 values(fp,a.id,tx,outcome,p_event);
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,after_data)
 values(null,'payment.'||outcome,'order',o.id::text,jsonb_build_object('transaction_id',tx,'attempt_id',a.id,'outcome',outcome));
 return jsonb_build_object('outcome',outcome,'duplicate',false);
end $$;

create function private.expire_checkout_orders(p_limit integer default 100) returns integer
language plpgsql security definer set search_path='' as $$
declare o record; n integer:=0;
begin
 for o in select ord.id from public.orders ord where ord.status='pending_payment' and (
 exists(select 1 from private.guest_checkout_requests c where c.order_id=ord.id and c.expires_at<=now()) or
 exists(select 1 from private.checkout_requests c where c.order_id=ord.id and c.expires_at<=now()))
 order by ord.id limit greatest(1,least(coalesce(p_limit,100),500)) for update of ord skip locked loop
  update public.booking_reservations set status='expired' where order_id=o.id and status='hold';
  update public.partner_orders set status='cancelled' where order_id=o.id and status='pending';
  update public.orders set status='cancelled' where id=o.id;
  update private.payment_attempts set state='expired',client_secret=null where order_id=o.id and state not in ('paid','review');
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,after_data)
  values(null,'order.payment_expired','order',o.id::text,'{"reason":"payment_window_expired"}');
  n:=n+1;
 end loop;
 return n;
end $$;
-- Public-schema wrappers are invoker and service-only. No browser grants.

revoke all on function private.reserve_guest_payment(uuid,uuid,bigint,bigint) from public,anon,authenticated;
grant execute on function private.reserve_guest_payment(uuid,uuid,bigint,bigint) to service_role;
create function public.reserve_guest_payment(p_guest uuid,p_order uuid,p_integration bigint,p_owner bigint) returns jsonb language sql security invoker set search_path='' as $$ select private.reserve_guest_payment(p_guest,p_order,p_integration,p_owner); $$;
revoke all on function public.reserve_guest_payment(uuid,uuid,bigint,bigint) from public,anon,authenticated;
grant execute on function public.reserve_guest_payment(uuid,uuid,bigint,bigint) to service_role;

revoke all on function private.bind_payment_intention(uuid,bigint,text,text) from public,anon,authenticated;
grant execute on function private.bind_payment_intention(uuid,bigint,text,text) to service_role;
create function public.bind_payment_intention(p_attempt uuid,p_provider_order bigint,p_intention text,p_client_secret text) returns boolean language sql security invoker set search_path='' as $$ select private.bind_payment_intention(p_attempt,p_provider_order,p_intention,p_client_secret); $$;
revoke all on function public.bind_payment_intention(uuid,bigint,text,text) from public,anon,authenticated;
grant execute on function public.bind_payment_intention(uuid,bigint,text,text) to service_role;

revoke all on function private.mark_payment_unknown(uuid) from public,anon,authenticated;
grant execute on function private.mark_payment_unknown(uuid) to service_role;
create function public.mark_payment_unknown(p_attempt uuid) returns void language sql security invoker set search_path='' as $$ select private.mark_payment_unknown(p_attempt); $$;
revoke all on function public.mark_payment_unknown(uuid) from public,anon,authenticated;
grant execute on function public.mark_payment_unknown(uuid) to service_role;

revoke all on function private.process_paymob_event(jsonb) from public,anon,authenticated;
grant execute on function private.process_paymob_event(jsonb) to service_role;
create function public.process_paymob_event(p_event jsonb) returns jsonb language sql security invoker set search_path='' as $$ select private.process_paymob_event(p_event); $$;
revoke all on function public.process_paymob_event(jsonb) from public,anon,authenticated;
grant execute on function public.process_paymob_event(jsonb) to service_role;

revoke all on function private.expire_checkout_orders(integer) from public,anon,authenticated;
grant execute on function private.expire_checkout_orders(integer) to service_role;
create function public.expire_checkout_orders(p_limit integer) returns integer language sql security invoker set search_path='' as $$ select private.expire_checkout_orders(p_limit); $$;
revoke all on function public.expire_checkout_orders(integer) from public,anon,authenticated;
grant execute on function public.expire_checkout_orders(integer) to service_role;
