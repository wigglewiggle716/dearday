-- Dear Day availability, blackout dates, capacity, cutoff, checkout holds, and booking concurrency

do $$ begin create type public.booking_mode as enum ('date','time_slot'); exception when duplicate_object then null; end $$;
do $$ begin create type public.booking_reservation_status as enum ('hold','confirmed','released','cancelled','expired'); exception when duplicate_object then null; end $$;

insert into public.permissions(code,description) values
('availability.view','View listing availability rules and booking reservations'),
('availability.manage','Manage listing schedules, blackout dates, capacities, and booking rules')
on conflict(code) do update set description=excluded.description;
insert into public.role_permissions(role,permission_code) values
('admin','availability.view'),('admin','availability.manage'),('operations','availability.view'),('operations','availability.manage'),('partner_manager','availability.view'),('partner_manager','availability.manage') on conflict do nothing;

create table if not exists public.listing_availability_settings(
 listing_id uuid primary key references public.listings(id) on delete cascade,
 booking_enabled boolean not null default false,
 booking_mode public.booking_mode not null default 'date',
 timezone text not null default 'Africa/Cairo',
 slot_minutes integer not null default 60 check(slot_minutes between 15 and 1440),
 daily_capacity integer check(daily_capacity is null or daily_capacity>0),
 slot_capacity integer check(slot_capacity is null or slot_capacity>0),
 cutoff_hours integer not null default 0 check(cutoff_hours between 0 and 8760),
 hold_minutes integer not null default 15 check(hold_minutes between 5 and 60),
 updated_by uuid references public.profiles(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.listing_availability_windows(
 id uuid primary key default gen_random_uuid(),listing_id uuid not null references public.listings(id) on delete cascade,
 weekday smallint not null check(weekday between 0 and 6),start_time time not null,end_time time not null,is_active boolean not null default true,
 capacity_override integer check(capacity_override is null or capacity_override>0),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 constraint listing_availability_window_time_valid check(end_time>start_time),constraint listing_availability_window_unique unique(listing_id,weekday,start_time,end_time)
);
create table if not exists public.listing_availability_exceptions(
 id uuid primary key default gen_random_uuid(),listing_id uuid not null references public.listings(id) on delete cascade,exception_date date not null,is_closed boolean not null default true,
 start_time time,end_time time,capacity_override integer check(capacity_override is null or capacity_override>0),note text,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 constraint listing_availability_exception_unique unique(listing_id,exception_date),
 constraint listing_availability_exception_time_valid check(is_closed=true or(start_time is not null and end_time is not null and end_time>start_time))
);
create table if not exists public.booking_reservations(
 id uuid primary key default gen_random_uuid(),hold_token uuid not null default gen_random_uuid() unique,listing_id uuid not null references public.listings(id) on delete restrict,
 partner_id uuid not null references public.partners(id) on delete restrict,customer_id uuid references public.profiles(id) on delete set null,order_id uuid references public.orders(id) on delete set null,
 order_item_id uuid references public.order_items(id) on delete set null,reservation_date date not null,start_time time,end_time time,quantity integer not null default 1 check(quantity>0),
 status public.booking_reservation_status not null default 'hold',expires_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 constraint booking_reservation_hold_expiry check(status<>'hold' or expires_at is not null),constraint booking_reservation_time_pair check((start_time is null and end_time is null)or(start_time is not null and end_time is not null and end_time>start_time))
);
create index if not exists availability_windows_listing_day_idx on public.listing_availability_windows(listing_id,weekday) where is_active=true;
create index if not exists availability_exceptions_listing_date_idx on public.listing_availability_exceptions(listing_id,exception_date);
create index if not exists booking_reservations_listing_date_idx on public.booking_reservations(listing_id,reservation_date,status);
create index if not exists booking_reservations_customer_idx on public.booking_reservations(customer_id,created_at desc);
create index if not exists booking_reservations_expiry_idx on public.booking_reservations(expires_at) where status='hold';

alter table public.listing_availability_settings enable row level security;alter table public.listing_availability_windows enable row level security;alter table public.listing_availability_exceptions enable row level security;alter table public.booking_reservations enable row level security;
grant select,insert,update,delete on public.listing_availability_settings,public.listing_availability_windows,public.listing_availability_exceptions to authenticated;
grant select on public.booking_reservations to authenticated;
grant all on public.listing_availability_settings,public.listing_availability_windows,public.listing_availability_exceptions,public.booking_reservations to service_role;
revoke all on public.listing_availability_settings,public.listing_availability_windows,public.listing_availability_exceptions,public.booking_reservations from anon;

create or replace function private.can_manage_listing_availability(p_listing_id uuid) returns boolean language sql stable security definer set search_path=pg_catalog,public,private as $$
select exists(select 1 from public.listings l where l.id=p_listing_id and(private.has_permission('availability.manage') or exists(select 1 from public.partner_users pu where pu.partner_id=l.partner_id and pu.user_id=auth.uid() and pu.is_active=true)))$$;
revoke all on function private.can_manage_listing_availability(uuid) from public;grant execute on function private.can_manage_listing_availability(uuid) to authenticated;

create policy availability_settings_read on public.listing_availability_settings for select to authenticated using(private.has_permission('availability.view') or private.can_manage_listing_availability(listing_id));
create policy availability_settings_manage on public.listing_availability_settings for all to authenticated using(private.can_manage_listing_availability(listing_id)) with check(private.can_manage_listing_availability(listing_id));
create policy availability_windows_read on public.listing_availability_windows for select to authenticated using(private.has_permission('availability.view') or private.can_manage_listing_availability(listing_id));
create policy availability_windows_manage on public.listing_availability_windows for all to authenticated using(private.can_manage_listing_availability(listing_id)) with check(private.can_manage_listing_availability(listing_id));
create policy availability_exceptions_read on public.listing_availability_exceptions for select to authenticated using(private.has_permission('availability.view') or private.can_manage_listing_availability(listing_id));
create policy availability_exceptions_manage on public.listing_availability_exceptions for all to authenticated using(private.can_manage_listing_availability(listing_id)) with check(private.can_manage_listing_availability(listing_id));
create policy booking_reservations_read on public.booking_reservations for select to authenticated using(customer_id=auth.uid() or private.has_permission('availability.view') or exists(select 1 from public.partner_users pu where pu.partner_id=booking_reservations.partner_id and pu.user_id=auth.uid() and pu.is_active=true));

drop trigger if exists listing_availability_settings_set_updated_at on public.listing_availability_settings;create trigger listing_availability_settings_set_updated_at before update on public.listing_availability_settings for each row execute function private.set_updated_at();
drop trigger if exists listing_availability_windows_set_updated_at on public.listing_availability_windows;create trigger listing_availability_windows_set_updated_at before update on public.listing_availability_windows for each row execute function private.set_updated_at();
drop trigger if exists listing_availability_exceptions_set_updated_at on public.listing_availability_exceptions;create trigger listing_availability_exceptions_set_updated_at before update on public.listing_availability_exceptions for each row execute function private.set_updated_at();
drop trigger if exists booking_reservations_set_updated_at on public.booking_reservations;create trigger booking_reservations_set_updated_at before update on public.booking_reservations for each row execute function private.set_updated_at();

create or replace function private.compute_listing_availability(p_listing_id uuid,p_date date,p_start_time time default null,p_quantity integer default 1,p_exclude_reservation uuid default null) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public,private as $$
declare l public.listings%rowtype;s public.listing_availability_settings%rowtype;ex public.listing_availability_exceptions%rowtype;v_has_exception boolean:=false;v_weekday integer;v_event_ts timestamptz;v_end_time time;v_window_ok boolean:=false;v_window_capacity integer;v_anchor_start time;v_daily_capacity integer;v_slot_capacity integer;v_daily_used integer:=0;v_slot_used integer:=0;v_remaining integer;v_offset_minutes integer;
begin
 if p_quantity is null or p_quantity<1 then return jsonb_build_object('available',false,'reason','invalid_quantity');end if;
 select * into l from public.listings where id=p_listing_id;if not found or l.is_available is not true or l.published_version_id is null then return jsonb_build_object('available',false,'reason','listing_unavailable');end if;
 select * into s from public.listing_availability_settings where listing_id=p_listing_id;if not found or s.booking_enabled is not true then return jsonb_build_object('available',false,'reason','booking_disabled');end if;
 if s.booking_mode='time_slot' and p_start_time is null then return jsonb_build_object('available',false,'reason','time_required');end if;
 v_event_ts:=((p_date+coalesce(p_start_time,time '00:00'))::timestamp at time zone s.timezone);if v_event_ts<now()+make_interval(hours=>s.cutoff_hours) then return jsonb_build_object('available',false,'reason','cutoff_passed','cutoff_hours',s.cutoff_hours);end if;
 v_weekday:=extract(dow from p_date)::integer;select * into ex from public.listing_availability_exceptions where listing_id=p_listing_id and exception_date=p_date;v_has_exception:=found;if v_has_exception and ex.is_closed then return jsonb_build_object('available',false,'reason','blackout_date');end if;
 if s.booking_mode='time_slot' then
  v_end_time:=p_start_time+make_interval(mins=>s.slot_minutes);if v_end_time<=p_start_time then return jsonb_build_object('available',false,'reason','slot_crosses_midnight');end if;
  if v_has_exception then v_window_ok:=ex.start_time is not null and p_start_time>=ex.start_time and v_end_time<=ex.end_time;v_window_capacity:=ex.capacity_override;v_anchor_start:=ex.start_time;
  else select w.start_time,w.capacity_override into v_anchor_start,v_window_capacity from public.listing_availability_windows w where w.listing_id=p_listing_id and w.weekday=v_weekday and w.is_active=true and p_start_time>=w.start_time and v_end_time<=w.end_time order by w.start_time desc limit 1;v_window_ok:=found;end if;
  if not coalesce(v_window_ok,false) then return jsonb_build_object('available',false,'reason','outside_schedule');end if;
  v_offset_minutes:=(extract(epoch from(p_start_time-v_anchor_start))/60)::integer;if mod(v_offset_minutes,s.slot_minutes)<>0 then return jsonb_build_object('available',false,'reason','invalid_slot_boundary','slot_minutes',s.slot_minutes);end if;
 else v_end_time:=null;if v_has_exception then v_window_ok:=true;v_window_capacity:=ex.capacity_override;else select count(*)>0,max(w.capacity_override) into v_window_ok,v_window_capacity from public.listing_availability_windows w where w.listing_id=p_listing_id and w.weekday=v_weekday and w.is_active=true;end if;if not coalesce(v_window_ok,false) then return jsonb_build_object('available',false,'reason','outside_schedule');end if;end if;
 v_daily_capacity:=coalesce(ex.capacity_override,v_window_capacity,s.daily_capacity,l.capacity_per_day,1);v_slot_capacity:=coalesce(ex.capacity_override,v_window_capacity,s.slot_capacity,s.daily_capacity,l.capacity_per_day,1);
 select coalesce(sum(r.quantity),0)::integer into v_daily_used from public.booking_reservations r where r.listing_id=p_listing_id and r.reservation_date=p_date and r.id is distinct from p_exclude_reservation and(r.status='confirmed' or(r.status='hold' and r.expires_at>now()));
 if s.booking_mode='time_slot' then select coalesce(sum(r.quantity),0)::integer into v_slot_used from public.booking_reservations r where r.listing_id=p_listing_id and r.reservation_date=p_date and r.id is distinct from p_exclude_reservation and(r.status='confirmed' or(r.status='hold' and r.expires_at>now())) and r.start_time is not null and r.end_time is not null and r.start_time<v_end_time and r.end_time>p_start_time;v_remaining:=least(greatest(v_daily_capacity-v_daily_used,0),greatest(v_slot_capacity-v_slot_used,0));else v_slot_used:=v_daily_used;v_remaining:=greatest(v_daily_capacity-v_daily_used,0);end if;
 return jsonb_build_object('available',p_quantity<=v_remaining,'reason',case when p_quantity<=v_remaining then 'available' else 'capacity_reached' end,'booking_mode',s.booking_mode,'slot_minutes',s.slot_minutes,'daily_capacity',v_daily_capacity,'slot_capacity',case when s.booking_mode='time_slot' then v_slot_capacity else null end,'daily_used',v_daily_used,'slot_used',case when s.booking_mode='time_slot' then v_slot_used else null end,'remaining',v_remaining,'start_time',p_start_time,'end_time',v_end_time,'cutoff_hours',s.cutoff_hours);
end $$;
revoke all on function private.compute_listing_availability(uuid,date,time,integer,uuid) from public;grant execute on function private.compute_listing_availability(uuid,date,time,integer,uuid) to anon,authenticated;

create or replace function public.check_listing_availability(p_listing_id uuid,p_date date,p_start_time time default null,p_quantity integer default 1) returns jsonb language sql stable security invoker set search_path=pg_catalog,public,private as $$select private.compute_listing_availability(p_listing_id,p_date,p_start_time,p_quantity,null::uuid)$$;
revoke all on function public.check_listing_availability(uuid,date,time,integer) from public;grant execute on function public.check_listing_availability(uuid,date,time,integer) to anon,authenticated;

create or replace function private.create_booking_hold_impl(p_listing_id uuid,p_date date,p_start_time time default null,p_quantity integer default 1) returns jsonb language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare l public.listings%rowtype;s public.listing_availability_settings%rowtype;v_check jsonb;v_id uuid;v_token uuid;v_expiry timestamptz;v_end_time time;v_existing public.booking_reservations%rowtype;
begin
 if auth.uid() is null or not exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_active=true) then raise exception 'Authentication required';end if;
 select * into l from public.listings where id=p_listing_id;if not found then raise exception 'Listing not found';end if;select * into s from public.listing_availability_settings where listing_id=p_listing_id;if not found then raise exception 'Booking is not configured';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_listing_id::text||'|'||p_date::text,0));
 select * into v_existing from public.booking_reservations r where r.listing_id=p_listing_id and r.customer_id=auth.uid() and r.reservation_date=p_date and r.start_time is not distinct from p_start_time and r.status='hold' and r.expires_at>now() order by r.created_at desc limit 1;
 v_check:=private.compute_listing_availability(p_listing_id,p_date,p_start_time,p_quantity,case when found then v_existing.id else null end);if coalesce((v_check->>'available')::boolean,false) is not true then return v_check;end if;if s.booking_mode='time_slot' then v_end_time:=p_start_time+make_interval(mins=>s.slot_minutes);end if;
 if v_existing.id is not null then update public.booking_reservations set quantity=p_quantity,end_time=v_end_time,updated_at=now() where id=v_existing.id returning id,hold_token,expires_at into v_id,v_token,v_expiry;
 else v_expiry:=now()+make_interval(mins=>s.hold_minutes);insert into public.booking_reservations(listing_id,partner_id,customer_id,reservation_date,start_time,end_time,quantity,status,expires_at) values(p_listing_id,l.partner_id,auth.uid(),p_date,p_start_time,v_end_time,p_quantity,'hold',v_expiry) returning id,hold_token into v_id,v_token;end if;
 return v_check||jsonb_build_object('hold_id',v_id,'hold_token',v_token,'expires_at',v_expiry,'held_quantity',p_quantity);
end $$;
revoke all on function private.create_booking_hold_impl(uuid,date,time,integer) from public;grant execute on function private.create_booking_hold_impl(uuid,date,time,integer) to authenticated;
create or replace function public.create_booking_hold(p_listing_id uuid,p_date date,p_start_time time default null,p_quantity integer default 1) returns jsonb language sql security invoker set search_path=pg_catalog,public,private as $$select private.create_booking_hold_impl(p_listing_id,p_date,p_start_time,p_quantity)$$;
revoke all on function public.create_booking_hold(uuid,date,time,integer) from public,anon;grant execute on function public.create_booking_hold(uuid,date,time,integer) to authenticated;

create or replace function private.release_booking_hold_impl(p_hold_token uuid) returns boolean language plpgsql security definer set search_path=pg_catalog,public,private as $$declare v_count integer;begin update public.booking_reservations set status='released',updated_at=now() where hold_token=p_hold_token and customer_id=auth.uid() and status='hold';get diagnostics v_count=row_count;return v_count>0;end $$;
revoke all on function private.release_booking_hold_impl(uuid) from public;grant execute on function private.release_booking_hold_impl(uuid) to authenticated;
create or replace function public.release_booking_hold(p_hold_token uuid) returns boolean language sql security invoker set search_path=pg_catalog,public,private as $$select private.release_booking_hold_impl(p_hold_token)$$;
revoke all on function public.release_booking_hold(uuid) from public,anon;grant execute on function public.release_booking_hold(uuid) to authenticated;

create or replace function private.confirm_booking_hold(p_hold_token uuid,p_order_id uuid,p_order_item_id uuid) returns uuid language plpgsql security definer set search_path=pg_catalog,public,private as $$declare v_id uuid;begin update public.booking_reservations set status='confirmed',expires_at=null,order_id=p_order_id,order_item_id=p_order_item_id,updated_at=now() where hold_token=p_hold_token and status='hold' and expires_at>now() returning id into v_id;if v_id is null then raise exception 'Hold is missing or expired';end if;return v_id;end $$;
revoke all on function private.confirm_booking_hold(uuid,uuid,uuid) from public,anon,authenticated;grant execute on function private.confirm_booking_hold(uuid,uuid,uuid) to service_role;

create or replace function private.save_listing_availability_config_impl(p_listing_id uuid,p_settings jsonb,p_windows jsonb) returns boolean language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare v_before jsonb;v_window jsonb;v_mode public.booking_mode;
begin
 if auth.uid() is null or not private.can_manage_listing_availability(p_listing_id) then raise exception 'Permission denied';end if;if not exists(select 1 from public.listings where id=p_listing_id) then raise exception 'Listing not found';end if;
 begin v_mode:=coalesce(nullif(p_settings->>'booking_mode',''),'date')::public.booking_mode;exception when others then raise exception 'Invalid booking mode';end;
 select jsonb_build_object('settings',to_jsonb(s),'windows',coalesce((select jsonb_agg(to_jsonb(w) order by w.weekday,w.start_time) from public.listing_availability_windows w where w.listing_id=p_listing_id),'[]'::jsonb)) into v_before from public.listing_availability_settings s where s.listing_id=p_listing_id;
 insert into public.listing_availability_settings(listing_id,booking_enabled,booking_mode,timezone,slot_minutes,daily_capacity,slot_capacity,cutoff_hours,hold_minutes,updated_by) values(p_listing_id,coalesce((p_settings->>'booking_enabled')::boolean,false),v_mode,coalesce(nullif(p_settings->>'timezone',''),'Africa/Cairo'),greatest(15,least(1440,coalesce((p_settings->>'slot_minutes')::integer,60))),nullif(p_settings->>'daily_capacity','')::integer,nullif(p_settings->>'slot_capacity','')::integer,greatest(0,least(8760,coalesce((p_settings->>'cutoff_hours')::integer,0))),greatest(5,least(60,coalesce((p_settings->>'hold_minutes')::integer,15))),auth.uid()) on conflict(listing_id) do update set booking_enabled=excluded.booking_enabled,booking_mode=excluded.booking_mode,timezone=excluded.timezone,slot_minutes=excluded.slot_minutes,daily_capacity=excluded.daily_capacity,slot_capacity=excluded.slot_capacity,cutoff_hours=excluded.cutoff_hours,hold_minutes=excluded.hold_minutes,updated_by=auth.uid(),updated_at=now();
 delete from public.listing_availability_windows where listing_id=p_listing_id;
 for v_window in select value from jsonb_array_elements(coalesce(p_windows,'[]'::jsonb)) loop if coalesce((v_window->>'is_active')::boolean,true) then insert into public.listing_availability_windows(listing_id,weekday,start_time,end_time,is_active,capacity_override) values(p_listing_id,(v_window->>'weekday')::smallint,(v_window->>'start_time')::time,(v_window->>'end_time')::time,true,nullif(v_window->>'capacity_override','')::integer);end if;end loop;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,before_data,after_data) values(auth.uid(),'availability.config_changed','listing',p_listing_id::text,v_before,jsonb_build_object('settings',(select to_jsonb(s) from public.listing_availability_settings s where s.listing_id=p_listing_id),'windows',coalesce((select jsonb_agg(to_jsonb(w) order by w.weekday,w.start_time) from public.listing_availability_windows w where w.listing_id=p_listing_id),'[]'::jsonb)));return true;
end $$;
revoke all on function private.save_listing_availability_config_impl(uuid,jsonb,jsonb) from public;grant execute on function private.save_listing_availability_config_impl(uuid,jsonb,jsonb) to authenticated;
create or replace function public.save_listing_availability_config(p_listing_id uuid,p_settings jsonb,p_windows jsonb) returns boolean language sql security invoker set search_path=pg_catalog,public,private as $$select private.save_listing_availability_config_impl(p_listing_id,p_settings,p_windows)$$;
revoke all on function public.save_listing_availability_config(uuid,jsonb,jsonb) from public,anon;grant execute on function public.save_listing_availability_config(uuid,jsonb,jsonb) to authenticated;

create or replace function private.upsert_listing_availability_exception_impl(p_listing_id uuid,p_exception_id uuid,p_date date,p_is_closed boolean,p_start_time time,p_end_time time,p_capacity_override integer,p_note text) returns uuid language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare v_id uuid;v_before jsonb;begin if auth.uid() is null or not private.can_manage_listing_availability(p_listing_id) then raise exception 'Permission denied';end if;if p_date is null then raise exception 'Date is required';end if;if not p_is_closed and(p_start_time is null or p_end_time is null or p_end_time<=p_start_time) then raise exception 'A valid custom opening window is required';end if;if p_capacity_override is not null and p_capacity_override<1 then raise exception 'Capacity must be positive';end if;
 if p_exception_id is not null then select to_jsonb(e) into v_before from public.listing_availability_exceptions e where e.id=p_exception_id and e.listing_id=p_listing_id;if v_before is null then raise exception 'Exception not found';end if;update public.listing_availability_exceptions set exception_date=p_date,is_closed=p_is_closed,start_time=case when p_is_closed then null else p_start_time end,end_time=case when p_is_closed then null else p_end_time end,capacity_override=p_capacity_override,note=nullif(trim(p_note),'') where id=p_exception_id returning id into v_id;
 else insert into public.listing_availability_exceptions(listing_id,exception_date,is_closed,start_time,end_time,capacity_override,note) values(p_listing_id,p_date,p_is_closed,case when p_is_closed then null else p_start_time end,case when p_is_closed then null else p_end_time end,p_capacity_override,nullif(trim(p_note),'')) on conflict(listing_id,exception_date) do update set is_closed=excluded.is_closed,start_time=excluded.start_time,end_time=excluded.end_time,capacity_override=excluded.capacity_override,note=excluded.note,updated_at=now() returning id into v_id;end if;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,before_data,after_data) values(auth.uid(),'availability.exception_saved','listing',p_listing_id::text,v_before,(select to_jsonb(e) from public.listing_availability_exceptions e where e.id=v_id));return v_id;end $$;
revoke all on function private.upsert_listing_availability_exception_impl(uuid,uuid,date,boolean,time,time,integer,text) from public;grant execute on function private.upsert_listing_availability_exception_impl(uuid,uuid,date,boolean,time,time,integer,text) to authenticated;
create or replace function public.upsert_listing_availability_exception(p_listing_id uuid,p_exception_id uuid default null,p_date date default null,p_is_closed boolean default true,p_start_time time default null,p_end_time time default null,p_capacity_override integer default null,p_note text default null) returns uuid language sql security invoker set search_path=pg_catalog,public,private as $$select private.upsert_listing_availability_exception_impl(p_listing_id,p_exception_id,p_date,p_is_closed,p_start_time,p_end_time,p_capacity_override,p_note)$$;
revoke all on function public.upsert_listing_availability_exception(uuid,uuid,date,boolean,time,time,integer,text) from public,anon;grant execute on function public.upsert_listing_availability_exception(uuid,uuid,date,boolean,time,time,integer,text) to authenticated;

create or replace function private.delete_listing_availability_exception_impl(p_exception_id uuid) returns boolean language plpgsql security definer set search_path=pg_catalog,public,private as $$declare v_row public.listing_availability_exceptions%rowtype;v_count integer;begin select * into v_row from public.listing_availability_exceptions where id=p_exception_id;if not found then return false;end if;if auth.uid() is null or not private.can_manage_listing_availability(v_row.listing_id) then raise exception 'Permission denied';end if;delete from public.listing_availability_exceptions where id=p_exception_id;get diagnostics v_count=row_count;if v_count>0 then insert into public.audit_logs(actor_id,action,entity_type,entity_id,before_data) values(auth.uid(),'availability.exception_deleted','listing',v_row.listing_id::text,to_jsonb(v_row));end if;return v_count>0;end $$;
revoke all on function private.delete_listing_availability_exception_impl(uuid) from public;grant execute on function private.delete_listing_availability_exception_impl(uuid) to authenticated;
create or replace function public.delete_listing_availability_exception(p_exception_id uuid) returns boolean language sql security invoker set search_path=pg_catalog,public,private as $$select private.delete_listing_availability_exception_impl(p_exception_id)$$;
revoke all on function public.delete_listing_availability_exception(uuid) from public,anon;grant execute on function public.delete_listing_availability_exception(uuid) to authenticated;
