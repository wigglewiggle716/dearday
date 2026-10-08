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

 perform set_config('request.jwt.claim.sub','',true);
 perform set_config('request.jwt.claims','{}',true);
 execute 'set local role anon';
 q:=public.quote_guest_checkout(items,ev);
 if (q->>'grand_total')::numeric<>251 then raise exception 'Guest quote wrong'; end if;
 begin
  perform public.prepare_guest_checkout(customer,items,ev,k,q->>'quote_token');
  raise exception 'Anonymous creation exposed';
 exception when insufficient_privilege then null; end;
 execute 'reset role';
 ev:=ev||'{"name":"Test guest","email":"fixture@example.invalid"}'::jsonb;
 q:=public.quote_guest_checkout(items,ev);
 execute 'set local role service_role';
 r:=public.prepare_guest_checkout(customer,items,ev,k,q->>'quote_token');
 r2:=public.prepare_guest_checkout(customer,items,ev,k,q->>'quote_token');
 if r<>r2 then raise exception 'Retry mismatch'; end if;
 execute 'reset role';
 if not exists(select 1 from public.orders where id=(r->>'order_id')::uuid and customer_id is null and grand_total=251 and delivery_address->>'email'='fixture@example.invalid') then raise exception 'Guest ownership/contact wrong'; end if;
 if exists(select 1 from public.booking_reservations where order_id=(r->>'order_id')::uuid and customer_id is not null) then raise exception 'Guest hold ownership wrong'; end if;
 execute 'set local role anon';
 select count(*) into n from public.orders where id=(r->>'order_id')::uuid;
 if n<>0 then raise exception 'Guest order leaked'; end if;
 begin
  perform public.quote_guest_checkout(items,ev);raise exception 'Guest oversold';
 exception when raise_exception then if sqlerrm<>'INSUFFICIENT_STOCK' then raise; end if; end;
 execute 'reset role';
end $$;
rollback;
