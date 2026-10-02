-- Store start/end times only for time-slot reservations while still allowing event time to participate in cutoff evaluation.
create or replace function private.create_booking_hold_impl(p_listing_id uuid,p_date date,p_start_time time default null,p_quantity integer default 1) returns jsonb language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare l public.listings%rowtype;s public.listing_availability_settings%rowtype;v_check jsonb;v_id uuid;v_token uuid;v_expiry timestamptz;v_end_time time;v_store_start time;v_existing public.booking_reservations%rowtype;
begin
 if auth.uid() is null or not exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_active=true) then raise exception 'Authentication required';end if;
 select * into l from public.listings where id=p_listing_id;if not found then raise exception 'Listing not found';end if;
 select * into s from public.listing_availability_settings where listing_id=p_listing_id;if not found then raise exception 'Booking is not configured';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_listing_id::text||'|'||p_date::text,0));
 if s.booking_mode='time_slot' then v_store_start:=p_start_time;v_end_time:=p_start_time+make_interval(mins=>s.slot_minutes);else v_store_start:=null;v_end_time:=null;end if;
 select * into v_existing from public.booking_reservations r where r.listing_id=p_listing_id and r.customer_id=auth.uid() and r.reservation_date=p_date and r.start_time is not distinct from v_store_start and r.status='hold' and r.expires_at>now() order by r.created_at desc limit 1;
 v_check:=private.compute_listing_availability(p_listing_id,p_date,p_start_time,p_quantity,case when found then v_existing.id else null end);if coalesce((v_check->>'available')::boolean,false) is not true then return v_check;end if;
 if v_existing.id is not null then update public.booking_reservations set quantity=p_quantity,start_time=v_store_start,end_time=v_end_time,updated_at=now() where id=v_existing.id returning id,hold_token,expires_at into v_id,v_token,v_expiry;
 else v_expiry:=now()+make_interval(mins=>s.hold_minutes);insert into public.booking_reservations(listing_id,partner_id,customer_id,reservation_date,start_time,end_time,quantity,status,expires_at) values(p_listing_id,l.partner_id,auth.uid(),p_date,v_store_start,v_end_time,p_quantity,'hold',v_expiry) returning id,hold_token into v_id,v_token;end if;
 return v_check||jsonb_build_object('hold_id',v_id,'hold_token',v_token,'expires_at',v_expiry,'held_quantity',p_quantity);
end $$;
revoke all on function private.create_booking_hold_impl(uuid,date,time,integer) from public;
grant execute on function private.create_booking_hold_impl(uuid,date,time,integer) to authenticated;
