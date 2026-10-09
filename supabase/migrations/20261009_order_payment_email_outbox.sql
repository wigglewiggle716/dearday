-- Dear Day transactional email outbox (staged; do not apply to production without approval).
-- Payment messages are queued ONLY when the authoritative database order
-- transitions to paid. The browser cannot enqueue or dispatch emails.
create table if not exists private.order_email_outbox (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  kind text not null check (kind = 'payment_received'),
  recipient text not null,
  customer_name text not null default 'there',
  status text not null default 'pending' check (status in ('pending','sending','retry','sent','failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  first_attempt_at timestamptz,
  lease_token uuid,
  lease_until timestamptz,
  next_attempt_at timestamptz not null default now(),
  provider_message_id text,
  last_error_code text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (order_id, kind)
);
create index if not exists order_email_outbox_claim_idx
on private.order_email_outbox (next_attempt_at, created_at)
where status in ('pending','sending','retry');
revoke all on private.order_email_outbox from public,anon,authenticated;
alter table private.order_email_outbox enable row level security;

create or replace function private.queue_payment_received_email()
returns trigger language plpgsql security definer set search_path='' as $$
declare recipient_email text; recipient_name text;
begin
  if old.status is distinct from new.status and new.status='paid' then
    recipient_email := nullif(btrim(coalesce(new.delivery_address->>'email','')),'');
    if recipient_email is null and new.customer_id is not null then
      select nullif(btrim(u.email),'') into recipient_email from auth.users u where u.id=new.customer_id;
    end if;
    if recipient_email is not null and length(recipient_email) <= 254
      and recipient_email ~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
      recipient_name := left(coalesce(nullif(btrim(new.delivery_address->>'name'),''),
        (select nullif(btrim(p.full_name),'') from public.profiles p where p.id=new.customer_id), 'there'), 100);
      insert into private.order_email_outbox(order_id,kind,recipient,customer_name)
      values(new.id,'payment_received',lower(recipient_email),recipient_name)
      on conflict(order_id,kind) do nothing;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.queue_payment_received_email() from public,anon,authenticated;
drop trigger if exists queue_payment_received_email on public.orders;
create trigger queue_payment_received_email
after update of status on public.orders for each row
execute function private.queue_payment_received_email();

create or replace function private.claim_order_email_notifications(p_limit integer default 5)
returns jsonb language plpgsql security definer set search_path='' as $$
declare payload jsonb;
begin
  with candidates as (
    select q.id from private.order_email_outbox q
    join public.orders o on o.id=q.order_id
    where o.status in ('paid','confirmed','in_progress','completed')
      and q.attempt_count < 5
      and (
        (q.status in ('pending','retry') and q.next_attempt_at <= clock_timestamp())
        or (q.status='sending' and q.lease_until < clock_timestamp())
      )
      and (q.first_attempt_at is null or q.first_attempt_at > clock_timestamp() - interval '23 hours')
    order by q.created_at, q.id
    limit greatest(1,least(coalesce(p_limit,5),10))
    for update of q skip locked
  ), leased as (
    update private.order_email_outbox q
       set status='sending',
           attempt_count=q.attempt_count+1,
           first_attempt_at=coalesce(q.first_attempt_at,clock_timestamp()),
           lease_token=gen_random_uuid(),
           lease_until=clock_timestamp()+interval '2 minutes',
           updated_at=clock_timestamp()
      from candidates c where q.id=c.id
      returning q.*
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',l.id,'lease_token',l.lease_token,'order_id',l.order_id,
    'recipient',l.recipient,'customer_name',l.customer_name,
    'order_number',o.order_number,'amount',o.grand_total,
    'currency',o.currency,'occasion_date',o.occasion_date
  )), '[]'::jsonb)
  into payload from leased l join public.orders o on o.id=l.order_id;
  return payload;
end;
$$;
revoke all on function private.claim_order_email_notifications(integer) from public,anon,authenticated;
grant execute on function private.claim_order_email_notifications(integer) to service_role;

create or replace function public.claim_order_email_notifications(p_limit integer default 5)
returns jsonb language sql security invoker set search_path='' as $$
  select private.claim_order_email_notifications(p_limit);
$$;
revoke all on function public.claim_order_email_notifications(integer) from public,anon,authenticated;
grant execute on function public.claim_order_email_notifications(integer) to service_role;

create or replace function private.settle_order_email_notification(
  p_id uuid, p_lease_token uuid, p_sent boolean,
  p_provider_message_id text default null, p_error_code text default null
) returns boolean language plpgsql security definer set search_path='' as $$
declare affected integer;
begin
  update private.order_email_outbox q set
    status=case when p_sent then 'sent'
      when q.attempt_count>=5 or q.first_attempt_at<=clock_timestamp()-interval '23 hours' then 'failed'
      else 'retry' end,
    provider_message_id=case when p_sent then left(coalesce(p_provider_message_id,''),150) else q.provider_message_id end,
    last_error_code=case when p_sent then null else left(coalesce(p_error_code,'SEND_FAILED'),40) end,
    next_attempt_at=case when p_sent then q.next_attempt_at
      else clock_timestamp() + interval '1 minute' * least(60,power(2,q.attempt_count)::integer) end,
    sent_at=case when p_sent then clock_timestamp() else q.sent_at end,
    lease_token=null,lease_until=null,updated_at=clock_timestamp()
  where q.id=p_id and q.lease_token=p_lease_token and q.status='sending';
  get diagnostics affected=row_count;
  return affected=1;
end;
$$;
revoke all on function private.settle_order_email_notification(uuid,uuid,boolean,text,text) from public,anon,authenticated;
grant execute on function private.settle_order_email_notification(uuid,uuid,boolean,text,text) to service_role;

create or replace function public.settle_order_email_notification(
  p_id uuid,p_lease_token uuid,p_sent boolean,
  p_provider_message_id text default null,p_error_code text default null
) returns boolean language sql security invoker set search_path='' as $$
  select private.settle_order_email_notification(p_id,p_lease_token,p_sent,p_provider_message_id,p_error_code);
$$;
revoke all on function public.settle_order_email_notification(uuid,uuid,boolean,text,text) from public,anon,authenticated;
grant execute on function public.settle_order_email_notification(uuid,uuid,boolean,text,text) to service_role;

-- Zero exposure to browser roles; service_role only for both RPC wrappers.
