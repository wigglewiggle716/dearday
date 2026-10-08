create policy checkout_requests_no_browser_access on private.checkout_requests for all to authenticated,anon using(false) with check(false);
create or replace function private.guard_partner_order_before_payment() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if new.status is distinct from old.status and new.status in ('accepted','rejected','in_progress','ready','completed')
   and not exists(select 1 from public.orders where id=new.order_id and status in ('paid','confirmed','in_progress','completed')) then
   raise exception 'ORDER_NOT_PAID' using errcode='42501';
 end if;
 return new;
end $$;
