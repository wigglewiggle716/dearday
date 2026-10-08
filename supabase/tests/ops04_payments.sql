begin;
do $$
declare admin_id uuid; customer uuid; pid uuid:=gen_random_uuid(); lid uuid:=gen_random_uuid(); vid uuid:=gen_random_uuid();
 items jsonb; ev jsonb; q jsonb; r jsonb; r2 jsonb; k uuid:=gen_random_uuid(); n int;
 a jsonb; e jsonb; outcome jsonb; oid uuid; original_order uuid;
 pid2 uuid:=gen_random_uuid(); lid2 uuid:=gen_random_uuid(); vid2 uuid:=gen_random_uuid();
begin
 select id into admin_id from public.profiles where role='super_admin' and is_active limit 1;
 select id into customer from public.profiles where role='customer' and is_active limit 1;
 if admin_id is null or customer is null then raise exception 'Missing fixtures'; end if;
 perform set_config('request.jwt.claim.sub',admin_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'aal','aal2')::text,true);
 insert into public.partners(id,name_ar,slug,status,commission_rate) values(pid,'Checkout test','checkout-'||pid,'active',10);
 insert into public.listings(id,partner_id,kind,stock_qty,is_available) values(lid,pid,'product',20,true);
 insert into public.listing_versions(id,listing_id,status,name_ar,price) values(vid,lid,'published','Checkout fixture',125.50);
 update public.listings set published_version_id=vid where id=lid;
 items:=jsonb_build_array(jsonb_build_object('listing_id',lid,'quantity',2,'price',1,'partner_id',admin_id));
 ev:=jsonb_build_object('date',current_date+10,'time','12:00','address','Fixture address','phone','000','recipient','Fixture');

 perform set_config('request.jwt.claim.sub','',true);
 perform set_config('request.jwt.claims','{}',true);

 ev:=ev||'{"name":"Test guest","email":"fixture@example.invalid"}'::jsonb;
 q:=public.prepare_guest_checkout(customer,items,ev,null,null);
 execute 'set local role service_role';
 r:=public.prepare_guest_checkout(customer,items,ev,k,q->>'quote_token');
 oid:=(r->>'order_id')::uuid;original_order:=oid;
 begin
  perform public.reserve_guest_payment(gen_random_uuid(),oid,100,200);raise exception 'Wrong guest read order';
 exception when insufficient_privilege then null; end;
 a:=public.reserve_guest_payment(customer,oid,100,200);
 if (a->>'amount_cents')::bigint<>25100 or not (a->>'new')::boolean then raise exception 'Bad trusted amount'; end if;
 if (public.reserve_guest_payment(customer,oid,100,200)->>'new')::boolean then raise exception 'Duplicate intention'; end if;
 perform public.bind_payment_intention((a->>'id')::uuid,900001,'fixture1','fake-secret');
 e:=jsonb_build_object('fingerprint',repeat('a',64),'transaction_id',700001,'provider_order_id',900001,
 'amount_cents',25100,'currency','EGP','integration_id',100,'owner_id',200,'success',true,'pending',false,
 'error_occured',false,'is_refunded',false,'is_voided',false,'has_parent_transaction',false,'is_auth',false,
 'is_capture',false,'is_standalone_payment',true);
 outcome:=public.process_paymob_event(e||jsonb_build_object('fingerprint',repeat('1',64),'pending',true));
 if outcome->>'outcome'<>'pending' then raise exception 'Pending prematurely paid'; end if;
 outcome:=public.process_paymob_event(e||jsonb_build_object('fingerprint',repeat('2',64),'success',false));
 if outcome->>'outcome'<>'failed' then raise exception 'Failed prematurely paid'; end if;
 outcome:=public.process_paymob_event(e);
 if outcome->>'outcome'<>'paid' then raise exception 'Payment not applied: %',outcome; end if;
 if not (public.process_paymob_event(e)->>'duplicate')::boolean then raise exception 'Replay not idempotent'; end if;
 execute 'reset role';
 if not exists(select 1 from public.orders where id=oid and status='paid') then raise exception 'Order not paid'; end if;
 if not exists(select 1 from public.booking_reservations where order_id=oid and status='confirmed' and expires_at is null) then raise exception 'Hold not confirmed'; end if;
 if (select stock_qty from public.listings where id=lid)<>20 then raise exception 'Double stock deduction'; end if;
 execute 'set local role service_role';
 perform public.process_paymob_event(e||jsonb_build_object('fingerprint',repeat('b',64),'success',false));
 execute 'reset role';
 if not exists(select 1 from public.orders where id=oid and status='paid') then raise exception 'Late failure reversed paid'; end if;
 -- A second successful transaction is recorded for review, never a second fulfillment.
 execute 'set local role service_role';
 outcome:=public.process_paymob_event(e||jsonb_build_object('fingerprint',repeat('c',64),'transaction_id',700002));
 if outcome->>'outcome'<>'additional_payment_review' then raise exception 'Duplicate charge unflagged'; end if;
 -- New order with mismatched callback amount must not be paid.
 q:=public.prepare_guest_checkout(customer,items,ev,null,null);
 r:=public.prepare_guest_checkout(customer,items,ev,gen_random_uuid(),q->>'quote_token');oid:=(r->>'order_id')::uuid;
 a:=public.reserve_guest_payment(customer,oid,100,200);
 perform public.bind_payment_intention((a->>'id')::uuid,900002,'fixture2','fake-secret');
 outcome:=public.process_paymob_event(e||jsonb_build_object('fingerprint',repeat('d',64),'transaction_id',700003,'provider_order_id',900002,'amount_cents',1));
 if outcome->>'outcome'<>'mismatch' then raise exception 'Wrong amount accepted'; end if;
 outcome:=public.process_paymob_event(e||jsonb_build_object('fingerprint',repeat('3',64),'transaction_id',700003,'provider_order_id',900002,'currency','USD'));
 if outcome->>'outcome'<>'mismatch' then raise exception 'Wrong currency accepted'; end if;
 outcome:=public.process_paymob_event(e||jsonb_build_object('fingerprint',repeat('4',64),'transaction_id',700003,'provider_order_id',900002,'integration_id',999));
 if outcome->>'outcome'<>'mismatch' then raise exception 'Wrong integration accepted'; end if;
 outcome:=public.process_paymob_event(e||jsonb_build_object('fingerprint',repeat('5',64),'transaction_id',700003,'provider_order_id',900002,'owner_id',999));
 if outcome->>'outcome'<>'mismatch' then raise exception 'Wrong owner accepted'; end if;
 execute 'reset role';
 if exists(select 1 from public.orders where id=oid and status='paid') then raise exception 'Mismatch marked paid'; end if;
 -- Expiration cancels pending orders and releases only their holds. Paid orders survive.
 update private.guest_checkout_requests set expires_at=now()-interval '1 minute' where order_id=oid;
 update private.payment_attempts set expires_at=now()-interval '1 minute' where order_id=oid;
 execute 'set local role service_role';
 perform public.expire_checkout_orders(100);
 execute 'reset role';
 if not exists(select 1 from public.orders where id=oid and status='cancelled') then raise exception 'Expired order still pending'; end if;
 if exists(select 1 from public.booking_reservations where order_id=oid and status='hold') then raise exception 'Expired hold active'; end if;
 if not exists(select 1 from public.orders where id=original_order and status='paid') then raise exception 'Paid order expired'; end if;
 -- Separate late success (no preceding mismatch) must remain unpaid / flagged.
 execute 'set local role service_role';
 q:=public.prepare_guest_checkout(customer,items,ev,null,null);
 r:=public.prepare_guest_checkout(customer,items,ev,gen_random_uuid(),q->>'quote_token');oid:=(r->>'order_id')::uuid;
 a:=public.reserve_guest_payment(customer,oid,100,200);
 perform public.bind_payment_intention((a->>'id')::uuid,900003,'fixture3','fake-secret');
 execute 'reset role';
 update private.payment_attempts set expires_at=now()-interval '1 minute' where order_id=oid;
 execute 'set local role service_role';
 outcome:=public.process_paymob_event(e||jsonb_build_object('fingerprint',repeat('e',64),'transaction_id',700004,'provider_order_id',900003));
 if outcome->>'outcome'<>'late_payment_review' then raise exception 'Late payment confirmed'; end if;
 execute 'reset role';
 execute 'set local role anon';
 begin
  perform public.process_paymob_event(e);raise exception 'Anon forged payment';
 exception when insufficient_privilege then null; end;
 execute 'reset role';
 execute 'set local role authenticated';
 begin
  perform public.process_paymob_event(e);raise exception 'Customer forged payment';
 exception when insufficient_privilege then null; end;
 execute 'reset role';
end $$;
rollback;
