-- Phase 1: protect direct Data API writes. Trusted payment/cancellation RPCs
-- remain separate paths, to be hardened in OPS-03/04. No payment is enabled.
create or replace function private.guard_direct_order_write()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if current_user not in ('anon','authenticated') then return new; end if;
  if tg_op='INSERT' then
    if new.status <> 'draft' or new.subtotal<>0 or new.discount_total<>0
      or new.delivery_total<>0 or new.grand_total<>0 or new.currency<>'EGP' then
      raise exception 'Order pricing and financial state require a trusted server workflow' using errcode='42501';
    end if;
    return new;
  end if;
  if row(new.id,new.order_number,new.customer_id,new.subtotal,new.discount_total,new.delivery_total,new.grand_total,new.currency,new.created_at)
    is distinct from row(old.id,old.order_number,old.customer_id,old.subtotal,old.discount_total,old.delivery_total,old.grand_total,old.currency,old.created_at) then
    raise exception 'Order identity and amounts cannot be changed directly' using errcode='42501';
  end if;
  if new.status is distinct from old.status and not (
    (old.status='paid' and new.status='confirmed') or
    (old.status='confirmed' and new.status='in_progress') or
    (old.status='in_progress' and new.status='completed')
  ) then
    raise exception 'This status transition requires the payment or cancellation workflow' using errcode='42501';
  end if;
  return new;
end $$;
revoke all on function private.guard_direct_order_write() from public,anon,authenticated;
create trigger orders_direct_write_boundary before insert or update on public.orders
for each row execute function private.guard_direct_order_write();

create or replace function private.audit_order_status_transition()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.status is distinct from old.status then
    insert into public.audit_logs(actor_id,action,entity_type,entity_id,before_data,after_data)
    values(auth.uid(),'order_status_changed','order',new.id::text,
      jsonb_build_object('status',old.status),jsonb_build_object('status',new.status));
  end if;
  return new;
end $$;
revoke all on function private.audit_order_status_transition() from public,anon,authenticated;
create trigger orders_audit_status_transition after update on public.orders
for each row execute function private.audit_order_status_transition();
