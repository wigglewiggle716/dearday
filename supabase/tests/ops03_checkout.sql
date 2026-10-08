begin;
do $$
declare admin_id uuid; customer uuid; pid uuid:=gen_random_uuid(); lid uuid:=gen_random_uuid(); vid uuid:=gen_random_uuid();
 items jsonb; ev jsonb; q jsonb; r jsonb; r2 jsonb; k uuid:=gen_random_uuid(); n int;
 pid2 uuid:=gen_random_uuid(); lid2 uuid:=gen_random_uuid(); vid2 uuid:=gen_random_uuid();
begin
 select id into admin_id from public.profiles where role='super_admin' and is_active limit 1;
 select id into customer from public.profiles where role='customer' and is_active limit 1;
 if admin_id is null or customer is null then raise exception 'Missing fixtures'; end if;
 perform set_config('request.jwt.claim.sub',admin_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'aal','aal2')::text,true);
 insert into public.partners(id,name_ar,slug,status,commission_rate) values(pid,'Checkout test','checkout-'||pid,'active',10);
 insert into public.listings(id,partner_id,kind,stock_qty,is_available) values(lid,pid,'product',3,true);
 insert into public.listing_versions(id,listing_id,status,name_ar,price) values(vid,lid,'published','Checkout fixture',125.50);
 update public.listings set published_version_id=vid where id=lid;
 items:=jsonb_build_array(jsonb_build_object('listing_id',lid,'quantity',2,'price',1,'partner_id',admin_id));
 ev:=jsonb_build_object('date',current_date+10,'time','12:00','address','Fixture address','phone','000','recipient','Fixture');
 perform set_config('request.jwt.claim.sub',customer::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',customer,'aal','aal1')::text,true);
 execute 'set local role authenticated';
 q:=public.prepare_checkout(items,ev);
 if (q->>'grand_total')::numeric<>251 or q::text like '%commission_rate%' then raise exception 'Untrusted price or private quote'; end if;
 begin
   perform public.prepare_checkout(items,ev,k,'wrong');raise exception 'Accepted stale price';
 exception when raise_exception then if sqlerrm<>'PRICE_CHANGED' then raise; end if; end;
 r:=public.prepare_checkout(items,ev,k,q->>'quote_token');
 r2:=public.prepare_checkout(items,ev,k,q->>'quote_token');
 if r<>r2 then raise exception 'Non-idempotent retry'; end if;
 begin
   perform public.prepare_checkout(items,ev||'{"note":"changed"}',k,q->>'quote_token');raise exception 'Accepted key conflict';
 exception when raise_exception then if sqlerrm<>'IDEMPOTENCY_CONFLICT' then raise; end if; end;
 begin
   perform public.prepare_checkout(items,ev);raise exception 'Oversold held stock';
 exception when raise_exception then if sqlerrm<>'INSUFFICIENT_STOCK' then raise; end if; end;
 begin
   perform public.prepare_checkout(jsonb_build_array(jsonb_build_object('listing_id',lid,'quantity',1.5)),ev);raise exception 'Accepted fractional quantity';
 exception when raise_exception then if sqlerrm<>'INVALID_QUANTITY' then raise; end if; end;
 begin
   update public.order_items set unit_price=1 where order_id=(r->>'order_id')::uuid;
   raise exception 'Direct item mutation allowed';
 exception when insufficient_privilege then null; end;
 begin
   update public.partner_orders set commission_rate=0 where order_id=(r->>'order_id')::uuid;
   raise exception 'Direct commission mutation allowed';
 exception when insufficient_privilege then null; end;
 execute 'reset role';
 select count(*) into n from public.orders where id=(r->>'order_id')::uuid and grand_total=251 and status='pending_payment';
 if n<>1 then raise exception 'Order not persisted'; end if;
 if not exists(select 1 from public.partner_orders where order_id=(r->>'order_id')::uuid and commission_amount=25.10 and partner_net=225.90) then raise exception 'Commission mismatch'; end if;
 begin
   update public.partner_orders set status='accepted' where order_id=(r->>'order_id')::uuid;
   raise exception 'Unpaid order accepted';
 exception when insufficient_privilege then null; end;
 -- Expiry frees capacity without a cron, but the old idempotency key stays expired.
 update public.booking_reservations set expires_at=now()-interval '1 minute' where order_id=(r->>'order_id')::uuid;
 update private.checkout_requests set expires_at=now()-interval '1 minute' where order_id=(r->>'order_id')::uuid;
 execute 'set local role authenticated';
 begin
   perform public.prepare_checkout(items,ev,k,q->>'quote_token');raise exception 'Reused expired order';
 exception when raise_exception then if sqlerrm<>'ORDER_EXPIRED' then raise; end if; end;
 q:=public.prepare_checkout(items,ev);
 execute 'reset role';
 perform set_config('request.jwt.claim.sub',admin_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'aal','aal2')::text,true);
 update public.listing_versions set price=130 where id=vid;
 perform set_config('request.jwt.claim.sub',customer::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',customer,'aal','aal1')::text,true);
 execute 'set local role authenticated';
 begin
   perform public.prepare_checkout(items,ev,gen_random_uuid(),q->>'quote_token');raise exception 'Accepted changed catalog price';
 exception when raise_exception then if sqlerrm<>'PRICE_CHANGED' then raise; end if; end;
 execute 'reset role';
 if (select count(*) from public.orders where id in(select order_id from private.checkout_requests where customer_id=customer and payload->'items' @> jsonb_build_array(jsonb_build_object('listing_id',lid))))<>1 then raise exception 'Partial order leaked'; end if;
 perform set_config('request.jwt.claim.sub',admin_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'aal','aal2')::text,true);
 insert into public.partners(id,name_ar,slug,status,commission_rate) values(pid2,'Checkout test B','checkout-'||pid2,'active',20);
 insert into public.listings(id,partner_id,kind,stock_qty,is_available) values(lid2,pid2,'product',5,true);
 insert into public.listing_versions(id,listing_id,status,name_ar,price) values(vid2,lid2,'published','Checkout B',50);
 update public.listings set published_version_id=vid2 where id=lid2;
 insert into public.listing_availability_settings(listing_id,booking_enabled,booking_mode,daily_capacity) values(lid2,true,'date',1);
 insert into public.listing_availability_windows(listing_id,weekday,start_time,end_time) values(lid2,extract(dow from current_date+10)::int,'00:00','23:59');
 items:=jsonb_build_array(jsonb_build_object('listing_id',lid,'quantity',1),jsonb_build_object('listing_id',lid,'quantity',1),jsonb_build_object('listing_id',lid2,'quantity',1));
 perform set_config('request.jwt.claim.sub',customer::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',customer,'aal','aal1')::text,true);
 execute 'set local role authenticated';
 q:=public.prepare_checkout(items,ev);
 r2:=public.prepare_checkout(items,ev,gen_random_uuid(),q->>'quote_token');
 begin
   perform public.prepare_checkout(jsonb_build_array(jsonb_build_object('listing_id',lid2,'quantity',1)),ev);
   raise exception 'Oversold scheduled capacity';
 exception when raise_exception then if sqlerrm not like 'UNAVAILABLE_SLOT:%' then raise; end if; end;
 execute 'reset role';
 if (r2->>'grand_total')::numeric<>310 or jsonb_array_length(r2->'items')<>2 then raise exception 'Duplicate aggregation failed'; end if;
 if (select count(*) from public.partner_orders where order_id=(r2->>'order_id')::uuid)<>2 then raise exception 'Partner split failed'; end if;
 if (select sum(commission_amount) from public.partner_orders where order_id=(r2->>'order_id')::uuid)<>36 then raise exception 'Multi-partner commission failed'; end if;
end $$;
rollback;
