-- Dear Day customer support ticket intake (additive; no existing records changed).
-- Public guests submit through a validated Edge Function using service role.
-- Staff access uses existing customers.view RBAC and an active Supabase JWT.
-- Reuse existing customers.view RBAC; the existing permission guard
-- intentionally prohibits automated editing of roles/permissions.
-- Review additionally requires an admin or customer_support role.


create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_no bigint generated always as identity (start with 10001) unique,
  name text not null check (char_length(name) between 2 and 160),
  email text not null check (char_length(email) between 5 and 254),
  phone text check (phone is null or char_length(phone) between 6 and 40),
  subject text not null check (char_length(subject) between 3 and 200),
  message text not null check (char_length(message) between 10 and 5000),
  locale text not null default 'ar' check (locale in ('ar','en')),
  status text not null default 'new' check (status in ('new','in_progress','awaiting_customer','resolved','closed')),
  internal_notes text check (internal_notes is null or char_length(internal_notes) <= 4000),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  submission_fingerprint text check (submission_fingerprint is null or char_length(submission_fingerprint)=64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists support_tickets_status_created_idx on public.support_tickets(status,created_at desc);
create index if not exists support_tickets_created_idx on public.support_tickets(created_at desc);
create index if not exists support_tickets_fingerprint_idx on public.support_tickets(submission_fingerprint,created_at desc);
alter table public.support_tickets enable row level security;
revoke all on public.support_tickets from public,anon,authenticated;
grant select on public.support_tickets to authenticated;
drop policy if exists support_tickets_staff_read on public.support_tickets;
create policy support_tickets_staff_read on public.support_tickets
 for select to authenticated
 using (private.has_permission('customers.view'));

-- Append-only audit trail written by a privileged review function.
create table if not exists public.support_ticket_events(
 id bigint generated always as identity primary key,
 ticket_id uuid not null references public.support_tickets(id) on delete cascade,
 actor_user_id uuid references auth.users(id) on delete set null,
 previous_status text,
 next_status text not null,
 note text check (note is null or char_length(note)<=4000),
 created_at timestamptz not null default now()
);
create index if not exists support_ticket_events_ticket_created_idx
 on public.support_ticket_events(ticket_id,created_at desc);
alter table public.support_ticket_events enable row level security;
revoke all on public.support_ticket_events from public,anon,authenticated;
grant select on public.support_ticket_events to authenticated;
drop policy if exists support_ticket_events_staff_read on public.support_ticket_events;
create policy support_ticket_events_staff_read on public.support_ticket_events
 for select to authenticated
 using (private.has_permission('customers.view'));

create or replace function public.review_support_ticket(
  p_ticket_id uuid, p_status text, p_internal_notes text default null
) returns uuid
language plpgsql security definer
set search_path='pg_catalog','public','private'
as $fn$
declare v_id uuid;
declare v_previous text;
declare v_previous_notes text;
declare v_note text;
begin
  if not private.has_permission('customers.view')
     or not exists(select 1 from public.profiles
                   where id=auth.uid() and is_active
                     and role in ('super_admin','admin','customer_support')) then
    raise exception 'Insufficient support management permission' using errcode='42501';
  end if;
  if p_ticket_id is null or p_status is null or
      p_status not in ('new','in_progress','awaiting_customer','resolved','closed') or
      char_length(coalesce(p_internal_notes,''))>4000 then
    raise exception 'Invalid ticket status or notes' using errcode='22023';
  end if;
  select status,internal_notes into v_previous,v_previous_notes
    from public.support_tickets where id=p_ticket_id for update;
  if not found then
    raise exception 'Support ticket not found' using errcode='P0002';
  end if;
  v_note=nullif(btrim(coalesce(p_internal_notes,'')),'');
  update public.support_tickets
    set status=p_status,
        internal_notes=v_note,
        reviewed_by=auth.uid(),
        reviewed_at=now(),
        updated_at=now()
    where id=p_ticket_id returning id into v_id;
  if v_previous is distinct from p_status or v_previous_notes is distinct from v_note then
    insert into public.support_ticket_events(ticket_id,actor_user_id,previous_status,next_status,note)
      values(v_id,auth.uid(),v_previous,p_status,v_note);
  end if;
  return v_id;
end $fn$;
revoke all on function public.review_support_ticket(uuid,text,text) from public,anon;
grant execute on function public.review_support_ticket(uuid,text,text) to authenticated;

-- New tickets create an in-app alert for admins. No email or customer push.
create or replace function private.on_support_ticket_created()
returns trigger language plpgsql security definer
set search_path='pg_catalog','public','private'
as $fn$
begin
  perform private.notify_admins(
    'support_ticket',
    'رسالة جديدة من عميل',
    'طلب تواصل جديد من ' || left(new.name,90) || ' — ' || left(new.subject,100),
    'New customer support ticket',
    'New contact message from ' || left(new.name,90) || ' — ' || left(new.subject,100),
    'support_ticket',
    new.id,
    jsonb_build_object('ticket_id',new.id,'ticket_no',new.ticket_no)
  );
  return new;
end $fn$;
revoke all on function private.on_support_ticket_created() from public,anon,authenticated;
drop trigger if exists support_ticket_notify_admins on public.support_tickets;
create trigger support_ticket_notify_admins after insert on public.support_tickets
 for each row execute function private.on_support_ticket_created();
