drop policy if exists cancellation_requests_customer_read on public.cancellation_requests;
drop policy if exists cancellation_requests_staff_read on public.cancellation_requests;
create policy cancellation_requests_read_scoped on public.cancellation_requests
for select to authenticated using (
  customer_id=(select auth.uid())
  or private.has_permission('orders.view')
);

drop policy if exists cancellation_items_customer_read on public.cancellation_request_items;
drop policy if exists cancellation_items_staff_read on public.cancellation_request_items;
drop policy if exists cancellation_items_partner_read on public.cancellation_request_items;
create policy cancellation_items_read_scoped on public.cancellation_request_items
for select to authenticated using (
  private.has_permission('orders.view')
  or exists(select 1 from public.cancellation_requests r where r.id=cancellation_request_id and r.customer_id=(select auth.uid()))
  or exists(select 1 from public.partner_users pu where pu.partner_id=cancellation_request_items.partner_id and pu.user_id=(select auth.uid()) and pu.is_active=true)
);

create index if not exists cancellation_request_items_reviewed_by_idx on public.cancellation_request_items(reviewed_by);