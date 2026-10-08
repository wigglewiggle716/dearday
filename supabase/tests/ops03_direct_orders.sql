-- Run after the migration, as postgres. Fixtures and all writes roll back.
begin;
do $$
declare staff uuid; customer uuid; oid uuid:=gen_random_uuid(); n integer;
begin
 select id into staff from public.profiles where role='super_admin' and is_active limit 1;
 select id into customer from public.profiles where role='customer' and is_active limit 1;
 if staff is null or customer is null then raise exception 'Missing test subjects'; end if;
 insert into public.orders(id,customer_id,status,subtotal,grand_total) values(oid,customer,'pending_payment',100,100);
 perform set_config('request.jwt.claim.sub',customer::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',customer,'aal','aal1')::text,true);
 execute 'set local role authenticated';
 begin
   insert into public.orders(customer_id,status) values(customer,'paid');
   raise exception 'Customer forged paid order';
 exception when insufficient_privilege then null; end;
 begin
   insert into public.orders(customer_id,grand_total) values(customer,1);
   raise exception 'Customer supplied order amount';
 exception when insufficient_privilege then null; end;
 execute 'reset role';
 perform set_config('request.jwt.claim.sub',staff::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',staff,'aal','aal2')::text,true);
 execute 'set local role authenticated';
 begin
   update public.orders set status='paid' where id=oid;
   raise exception 'Staff forged payment';
 exception when insufficient_privilege then null; end;
 begin
   update public.orders set status='confirmed' where id=oid;
   raise exception 'Unpaid order confirmed';
 exception when insufficient_privilege then null; end;
 begin
   update public.orders set grand_total=1 where id=oid;
   raise exception 'Staff changed amount';
 exception when insufficient_privilege then null; end;
 begin
   update public.orders set customer_id=staff where id=oid;
   raise exception 'Staff reassigned owner';
 exception when insufficient_privilege then null; end;
 execute 'reset role';
 update public.orders set status='paid' where id=oid;
 execute 'set local role authenticated';
 update public.orders set status='confirmed' where id=oid;
 get diagnostics n=row_count;
 if n<>1 then raise exception 'Allowed operational update failed'; end if;
 begin
   update public.orders set status='refunded' where id=oid;
   raise exception 'Staff forged refund';
 exception when insufficient_privilege then null; end;
 update public.orders set status='in_progress' where id=oid;
 update public.orders set status='completed' where id=oid;
 execute 'reset role';
 select count(*) into n from public.audit_logs where entity_type='order' and entity_id=oid::text and action='order_status_changed';
 if n<>4 then raise exception 'Atomic audit mismatch: %',n; end if;
end $$;
rollback;
