-- Availability/booking performance hardening
create index if not exists booking_reservations_partner_idx on public.booking_reservations(partner_id);
create index if not exists booking_reservations_order_idx on public.booking_reservations(order_id) where order_id is not null;
create index if not exists booking_reservations_order_item_idx on public.booking_reservations(order_item_id) where order_item_id is not null;
create index if not exists listing_availability_settings_updated_by_idx on public.listing_availability_settings(updated_by) where updated_by is not null;

drop policy if exists booking_reservations_read on public.booking_reservations;
create policy booking_reservations_read on public.booking_reservations for select to authenticated using(
  customer_id=(select auth.uid()) or private.has_permission('availability.view') or
  exists(select 1 from public.partner_users pu where pu.partner_id=booking_reservations.partner_id and pu.user_id=(select auth.uid()) and pu.is_active=true)
);

drop policy if exists availability_settings_manage on public.listing_availability_settings;
create policy availability_settings_insert on public.listing_availability_settings for insert to authenticated with check(private.can_manage_listing_availability(listing_id));
create policy availability_settings_update on public.listing_availability_settings for update to authenticated using(private.can_manage_listing_availability(listing_id)) with check(private.can_manage_listing_availability(listing_id));
create policy availability_settings_delete on public.listing_availability_settings for delete to authenticated using(private.can_manage_listing_availability(listing_id));

drop policy if exists availability_windows_manage on public.listing_availability_windows;
create policy availability_windows_insert on public.listing_availability_windows for insert to authenticated with check(private.can_manage_listing_availability(listing_id));
create policy availability_windows_update on public.listing_availability_windows for update to authenticated using(private.can_manage_listing_availability(listing_id)) with check(private.can_manage_listing_availability(listing_id));
create policy availability_windows_delete on public.listing_availability_windows for delete to authenticated using(private.can_manage_listing_availability(listing_id));

drop policy if exists availability_exceptions_manage on public.listing_availability_exceptions;
create policy availability_exceptions_insert on public.listing_availability_exceptions for insert to authenticated with check(private.can_manage_listing_availability(listing_id));
create policy availability_exceptions_update on public.listing_availability_exceptions for update to authenticated using(private.can_manage_listing_availability(listing_id)) with check(private.can_manage_listing_availability(listing_id));
create policy availability_exceptions_delete on public.listing_availability_exceptions for delete to authenticated using(private.can_manage_listing_availability(listing_id));
