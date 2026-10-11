-- STAGING ONLY: do not apply without separate production approval.
-- Non-payment transactional notifications; existing payment outbox is untouched.
-- Neither this migration nor the template registry sends messages.
create table if not exists private.transactional_email_outbox (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in (
    'booking_request_received','booking_confirmed','order_in_progress',
    'order_completed','cancellation_requested','cancellation_update',
    'refund_completed','partner_new_order','partner_cancellation',
    'support_received','partner_application'
  )),
  entity_id uuid not null,
  idempotency_key text not null unique
    check (char_length(idempotency_key) between 12 and 180),
  locale text not null check (locale in ('ar','en')),
  recipient text not null check (
    char_length(recipient) between 5 and 254
    and recipient ~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
  ),
  variables jsonb not null check (
    jsonb_typeof(variables)='object' and octet_length(variables::text)<=12000
  ),
  status text not null default 'pending'
    check (status in ('pending','sending','retry','sent','failed')),
  attempt_count integer not null default 0
    check (attempt_count between 0 and 5),
  first_attempt_at timestamptz,
  lease_token uuid,
  lease_until timestamptz,
  next_attempt_at timestamptz not null default now(),
  provider_message_id text,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz
);
create index if not exists transactional_email_outbox_claim_idx
  on private.transactional_email_outbox(next_attempt_at,created_at)
  where status in ('pending','retry','sending');
create index if not exists transactional_email_outbox_entity_idx
  on private.transactional_email_outbox(event_type,entity_id,created_at desc);
alter table private.transactional_email_outbox enable row level security;
revoke all on private.transactional_email_outbox from PUBLIC,anon,authenticated;
grant usage on schema private to service_role;
grant select,insert,update on private.transactional_email_outbox to service_role;

-- Extra opt-in barrier at database level, independent of application flags.
-- These flags start disabled and can only be changed by a database administrator.
create table if not exists private.transactional_email_feature_flags (
  category text primary key check (category in ('orders','cancellations','partners','intake')),
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into private.transactional_email_feature_flags(category,enabled)
values ('orders',false),('cancellations',false),('partners',false),('intake',false)
on conflict(category) do nothing;
alter table private.transactional_email_feature_flags enable row level security;
revoke all on private.transactional_email_feature_flags from PUBLIC,anon,authenticated,service_role;

create or replace function private.transactional_email_group_is_enabled(p_category text)
returns boolean language sql stable security definer set search_path='' as $
  select coalesce((
    select g.enabled from private.transactional_email_feature_flags g
    where g.category=p_category
  ),false);
$;
revoke all on function private.transactional_email_group_is_enabled(text)
from PUBLIC,anon,authenticated;

-- Call only from trusted server-side code with a service-role JWT.
-- The idempotency key MUST identify one specific persisted event transition and
-- one recipient (e.g. "support_received:<ticket_uuid>:<recipient_user_uuid>").
-- The browser never supplies this function's parameters directly.
create or replace function private.queue_transactional_email(
 p_event_type text, p_entity_id uuid, p_idempotency_key text,
 p_locale text, p_recipient text, p_variables jsonb
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_row private.transactional_email_outbox%rowtype;
begin
 if p_entity_id is null or p_event_type not in (
    'booking_request_received','booking_confirmed','order_in_progress',
    'order_completed','cancellation_requested','cancellation_update',
    'refund_completed','partner_new_order','partner_cancellation',
    'support_received','partner_application'
 ) or p_locale not in ('ar','en')
 or char_length(coalesce(p_idempotency_key,'')) not between 12 and 180
 or char_length(coalesce(p_recipient,'')) not between 5 and 254
 or p_recipient !~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
 or jsonb_typeof(p_variables) is distinct from 'object'
 or octet_length(coalesce(p_variables::text,''))>12000 then
   raise exception 'INVALID_TRANSACTIONAL_EMAIL' using errcode='22023';
 end if;
 -- No queue is possible until the DBA explicitly enables the event group.
 if not private.transactional_email_group_is_enabled(
   case
     when p_event_type in ('partner_new_order','partner_cancellation') then 'partners'
     when p_event_type in ('cancellation_requested','cancellation_update','refund_completed') then 'cancellations'
     when p_event_type in ('support_received','partner_application') then 'intake'
     else 'orders'
   end
 ) then
   return null;
 end if;
 insert into private.transactional_email_outbox(
   event_type,entity_id,idempotency_key,locale,recipient,variables
 ) values (
   p_event_type,p_entity_id,p_idempotency_key,p_locale,
   lower(btrim(p_recipient)),p_variables
 ) on conflict (idempotency_key) do nothing returning id into v_id;
 if v_id is not null then return v_id; end if;
 select * into v_row from private.transactional_email_outbox
  where idempotency_key=p_idempotency_key;
 if not found or v_row.event_type is distinct from p_event_type
  or v_row.entity_id is distinct from p_entity_id
  or v_row.locale is distinct from p_locale
  or v_row.recipient is distinct from lower(btrim(p_recipient))
  or v_row.variables is distinct from p_variables then
    raise exception 'EMAIL_IDEMPOTENCY_CONFLICT' using errcode='22023';
 end if;
 return v_row.id;
end $$;
revoke all on function private.queue_transactional_email(text,uuid,text,text,text,jsonb) from PUBLIC,anon,authenticated;
grant execute on function private.queue_transactional_email(text,uuid,text,text,text,jsonb) to service_role;

create or replace function private.claim_transactional_email_notifications(p_limit integer default 3)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_data jsonb;
begin
 -- Stop retries after the provider's 24-hour idempotency window.
 update private.transactional_email_outbox q
 set status='failed',lease_token=null,lease_until=null,
     last_error_code='RETRY_WINDOW_EXPIRED',updated_at=clock_timestamp()
 where q.status in ('sending','retry')
 and q.first_attempt_at<=clock_timestamp()-interval '23 hours';
 with candidates as (
   select q.id from private.transactional_email_outbox q
   where q.attempt_count<5
    and ((q.status in ('pending','retry') and q.next_attempt_at<=clock_timestamp())
         or (q.status='sending' and q.lease_until<clock_timestamp()))
    and (q.first_attempt_at is null or
         q.first_attempt_at>clock_timestamp()-interval '23 hours')
   order by q.created_at,q.id
   limit greatest(1,least(coalesce(p_limit,3),5))
   for update skip locked
 ), claimed as (
   update private.transactional_email_outbox q
     set status='sending',attempt_count=q.attempt_count+1,
     first_attempt_at=coalesce(q.first_attempt_at,clock_timestamp()),
     lease_token=gen_random_uuid(),lease_until=clock_timestamp()+interval '2 minutes',
     updated_at=clock_timestamp()
     from candidates c where q.id=c.id
     returning q.*
 )
 select coalesce(jsonb_agg(jsonb_build_object(
    'id',id,'event_type',event_type,'entity_id',entity_id,
    'idempotency_key',idempotency_key,'locale',locale,'recipient',recipient,
    'variables',variables,'lease_token',lease_token)), '[]'::jsonb)
 into v_data from claimed;
 return v_data;
end $$;
revoke all on function private.claim_transactional_email_notifications(integer) from PUBLIC,anon,authenticated;
grant execute on function private.claim_transactional_email_notifications(integer) to service_role;

create or replace function private.settle_transactional_email_notification(
 p_id uuid,p_lease_token uuid,p_sent boolean,
 p_provider_message_id text default null,p_error_code text default null
) returns boolean language plpgsql security definer set search_path='' as $$
declare v_count integer;
begin
 update private.transactional_email_outbox q set
   status=case when p_sent then 'sent'
     when p_error_code in (
       'INVALID_RECIPIENT','INVALID_EVENT_DATA','MISSING_VARIABLE',
       'TEMPLATE_INVALID','PROVIDER_REJECTED','BAD_PROVIDER_RESPONSE'
     ) or q.attempt_count>=5
       or q.first_attempt_at<=clock_timestamp()-interval '23 hours' then 'failed'
     else 'retry' end,
   provider_message_id=case when p_sent then left(coalesce(p_provider_message_id,''),150)
                            else q.provider_message_id end,
   last_error_code=case when p_sent then null
                        else left(coalesce(p_error_code,'SEND_FAILED'),40) end,
   next_attempt_at=case when p_sent then q.next_attempt_at else
     clock_timestamp()+ interval '1 minute' *
       least(60,power(2,least(q.attempt_count,5))::integer) end,
   sent_at=case when p_sent then clock_timestamp() else q.sent_at end,
   lease_token=null,lease_until=null,updated_at=clock_timestamp()
   where q.id=p_id and q.lease_token=p_lease_token and q.status='sending';
 get diagnostics v_count=row_count;
 return v_count=1;
end $$;
revoke all on function private.settle_transactional_email_notification(uuid,uuid,boolean,text,text) from PUBLIC,anon,authenticated;
grant execute on function private.settle_transactional_email_notification(uuid,uuid,boolean,text,text) to service_role;

-- PostgREST exposes the public wrappers only to service_role.
-- SECURITY INVOKER ensures the caller cannot borrow owner privileges.
create or replace function public.queue_transactional_email(
 p_event_type text,p_entity_id uuid,p_idempotency_key text,
 p_locale text,p_recipient text,p_variables jsonb
) returns uuid language sql security invoker set search_path='' as $$
 select private.queue_transactional_email(
   p_event_type,p_entity_id,p_idempotency_key,p_locale,p_recipient,p_variables
 );
$$;
revoke all on function public.queue_transactional_email(text,uuid,text,text,text,jsonb) from PUBLIC,anon,authenticated;
grant execute on function public.queue_transactional_email(text,uuid,text,text,jsonb) to service_role;

create or replace function public.claim_transactional_email_notifications(p_limit integer default 3)
returns jsonb language sql security invoker set search_path='' as $$
 select private.claim_transactional_email_notifications(p_limit);
$$;
revoke all on function public.claim_transactional_email_notifications(integer) from PUBLIC,anon,authenticated;
grant execute on function public.claim_transactional_email_notifications(integer) to service_role;

create or replace function public.settle_transactional_email_notification(
 p_id uuid,p_lease_token uuid,p_sent boolean,
 p_provider_message_id text default null,p_error_code text default null
) returns boolean language sql security invoker set search_path='' as $$
 select private.settle_transactional_email_notification(
   p_id,p_lease_token,p_sent,p_provider_message_id,p_error_code
 );
$$;
revoke all on function public.settle_transactional_email_notification(uuid,uuid,boolean,text,text) from PUBLIC,anon,authenticated;
grant execute on function public.settle_transactional_email_notification(uuid,uuid,boolean,text,text) to service_role;

-- No triggers. No cron. No sending. Wiring is a separately gated release.
