-- Dear Day OPS-EMAIL-02: privileged, audited monitoring of verified-order emails.
-- Browser roles never receive SELECT on the private outbox. Every public RPC
-- checks active staff permissions AND AAL2 within the database itself.

alter table private.order_email_outbox
  add column if not exists manual_retry_count integer not null default 0
  check (manual_retry_count between 0 and 2);

create or replace function private.staff_order_email_overview_impl(
  p_status text default null, p_page integer default 0
) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_total bigint; v_rows jsonb; v_counts jsonb;
begin
  if auth.uid() is null or coalesce(auth.jwt()->>'aal','aal1') <> 'aal2'
    or not private.has_permission('orders.manage') then
    raise exception 'ORDER_EMAIL_ACCESS_DENIED' using errcode='42501';
  end if;
  if p_status is not null and p_status not in ('pending','sending','retry','sent','failed') then
    raise exception 'INVALID_EMAIL_FILTER' using errcode='22023';
  end if;
  if p_page is null or p_page<0 or p_page>10000 then
    raise exception 'INVALID_PAGE' using errcode='22023';
  end if;
  select coalesce(jsonb_build_object(
    'pending', count(*) filter(where q.status='pending'),
    'sending', count(*) filter(where q.status='sending'),
    'retry',   count(*) filter(where q.status='retry'),
    'sent',    count(*) filter(where q.status='sent'),
    'failed',  count(*) filter(where q.status='failed')
  ), '{}'::jsonb)
  into v_counts from private.order_email_outbox q;

  select count(*) into v_total from private.order_email_outbox q
    where p_status is null or q.status=p_status;

  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc, x.id desc),'[]'::jsonb)
  into v_rows
  from (
    select q.id, q.order_id, o.order_number,
      q.kind, q.status, q.attempt_count, q.manual_retry_count,
      q.last_error_code, q.created_at, q.updated_at, q.sent_at,
      case when position('@' in q.recipient)>1 then
        left(split_part(q.recipient,'@',1),1)||'***@'||split_part(q.recipient,'@',2)
      else '***' end as recipient_masked,
      (q.status='failed'
        and q.last_error_code in ('RATE_LIMIT','PROVIDER_REJECTED')
        and q.manual_retry_count<2
        and q.provider_message_id is null
        and o.status in ('paid','confirmed','in_progress','completed')
      ) as can_retry
    from private.order_email_outbox q
    join public.orders o on o.id=q.order_id
    where p_status is null or q.status=p_status
    order by q.created_at desc, q.id desc
    limit 25 offset p_page*25
  ) x;

  return jsonb_build_object(
    'counts',v_counts,'total',v_total,'page',p_page,'page_size',25,'items',v_rows
  );
end;
$$;
revoke all on function private.staff_order_email_overview_impl(text,integer)
  from public,anon,authenticated;
-- The public wrapper is SECURITY INVOKER; authenticated requires EXECUTE here.
-- Sensitive rows remain protected by the AAL2 + orders.manage check inside.
grant execute on function private.staff_order_email_overview_impl(text,integer) to authenticated;

create or replace function public.staff_order_email_overview(
  p_status text default null, p_page integer default 0
) returns jsonb
language sql security invoker set search_path='' as $$
  select private.staff_order_email_overview_impl(p_status,p_page);
$$;
revoke all on function public.staff_order_email_overview(text,integer)
  from public,anon,authenticated;
grant execute on function public.staff_order_email_overview(text,integer)
  to authenticated;

create or replace function private.staff_requeue_order_email_impl(p_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare q private.order_email_outbox%rowtype; v_status public.order_status;
begin
  if auth.uid() is null or coalesce(auth.jwt()->>'aal','aal1') <> 'aal2'
    or not private.has_permission('orders.manage') then
    raise exception 'ORDER_EMAIL_ACCESS_DENIED' using errcode='42501';
  end if;
  if p_id is null then raise exception 'INVALID_EMAIL_ID' using errcode='22023'; end if;
  select * into q from private.order_email_outbox where id=p_id for update;
  if not found then raise exception 'EMAIL_NOT_FOUND' using errcode='22023'; end if;
  select o.status into v_status from public.orders o where o.id=q.order_id;
  -- Unknown provider responses are NOT safe to resend automatically, since
  -- Resend might already have accepted the original email.
  if q.status<>'failed' or q.last_error_code not in ('RATE_LIMIT','PROVIDER_REJECTED')
     or q.manual_retry_count>=2 or q.provider_message_id is not null
     or v_status not in ('paid','confirmed','in_progress','completed') then
    raise exception 'EMAIL_RETRY_NOT_SAFE' using errcode='22023';
  end if;
  update private.order_email_outbox
     set status='pending',attempt_count=0,manual_retry_count=q.manual_retry_count+1,
         first_attempt_at=null,next_attempt_at=clock_timestamp(),
         last_error_code=null,lease_token=null,lease_until=null,
         updated_at=clock_timestamp()
   where id=p_id;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,after_data)
  values(auth.uid(),'order_email.manual_retry_queued','order',q.order_id::text,
    jsonb_build_object('kind',q.kind,'retry_count',q.manual_retry_count+1));
  return true;
end;
$$;
revoke all on function private.staff_requeue_order_email_impl(uuid)
  from public,anon,authenticated;
grant execute on function private.staff_requeue_order_email_impl(uuid) to authenticated;

create or replace function public.staff_requeue_order_email(p_id uuid)
returns boolean
language sql security invoker set search_path='' as $$
  select private.staff_requeue_order_email_impl(p_id);
$$;
revoke all on function public.staff_requeue_order_email(uuid)
  from public,anon,authenticated;
grant execute on function public.staff_requeue_order_email(uuid) to authenticated;

comment on function public.staff_order_email_overview(text,integer)
is 'AAL2 + orders.manage only; private delivery queue monitoring, masked customer contact.';
comment on function public.staff_requeue_order_email(uuid)
is 'AAL2 + orders.manage only; queues definitely-unsent failures only, does NOT immediately dispatch.';
