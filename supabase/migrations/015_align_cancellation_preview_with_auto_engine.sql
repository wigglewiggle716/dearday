create or replace function private.preview_order_cancellation_impl(p_order_id uuid,p_order_item_ids uuid[] default null)
returns table(order_item_id uuid,item_name text,partner_id uuid,line_total numeric,currency text,policy_title text,calculation_mode text,estimated_refund_percent numeric,estimated_refund_amount numeric,is_cancelled boolean)
language plpgsql
security definer
set search_path='pg_catalog','public','private'
as $$
declare
  v_uid uuid:=auth.uid();
  v_order public.orders%rowtype;
begin
  if v_uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select * into v_order from public.orders where id=p_order_id and customer_id=v_uid;
  if not found then raise exception 'Order not found' using errcode='42501'; end if;
  if v_order.status not in ('paid','confirmed','in_progress') then raise exception 'This order cannot be cancelled in its current status'; end if;

  return query
  select oi.id,
         oi.item_name,
         oi.partner_id,
         oi.line_total,
         v_order.currency,
         coalesce(oi.refund_policy_snapshot->>'title','Dear Day policy'),
         case when po.status='completed' then 'manual_review' else est->>'mode' end,
         case when po.status='completed' or est->>'refund_percent' is null then null else (est->>'refund_percent')::numeric end,
         case when po.status='completed' or est->>'refund_amount' is null then null else (est->>'refund_amount')::numeric end,
         oi.is_cancelled
  from public.order_items oi
  left join public.partner_orders po on po.order_id=v_order.id and po.partner_id=oi.partner_id
  cross join lateral private.calculate_refund_estimate(oi.refund_policy_snapshot,oi.line_total,v_order.occasion_date,v_order.occasion_time) est
  where oi.order_id=v_order.id
    and oi.is_cancelled=false
    and (p_order_item_ids is null or cardinality(p_order_item_ids)=0 or oi.id=any(p_order_item_ids));
end $$;

revoke all on function private.preview_order_cancellation_impl(uuid,uuid[]) from public,anon;
grant execute on function private.preview_order_cancellation_impl(uuid,uuid[]) to authenticated;
