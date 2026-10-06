-- OPS-01 phase 1: deploy this before switching frontend reads to partner_directory.
begin;

create table public.partner_directory (
  id uuid primary key references public.partners(id) on update cascade on delete cascade,
  name_ar text not null,
  name_en text,
  status public.partner_status not null
);
comment on table public.partner_directory is
  'Safe partner labels only. Internal/contact/financial fields must never be added here.';
alter table public.partner_directory enable row level security;
revoke all on public.partner_directory from public, anon, authenticated;
grant select on public.partner_directory to anon, authenticated;
grant all on public.partner_directory to service_role;

create policy partner_directory_public_read on public.partner_directory
  for select to anon, authenticated using (status = 'active'::public.partner_status);
create policy partner_directory_staff_read on public.partner_directory
  for select to authenticated using (
    private.has_permission('partners.view') or private.has_permission('partners.manage')
    or private.has_permission('finance.view') or private.has_permission('catalog.view')
    or private.has_permission('catalog.manage') or private.has_permission('approvals.review')
    or private.has_permission('orders.view')
  );
create policy partner_directory_member_read on public.partner_directory
  for select to authenticated using (exists (
    select 1 from public.partner_users pu where pu.partner_id = partner_directory.id
      and pu.user_id = (select auth.uid()) and pu.is_active = true
  ));

-- A private trigger, NOT an RPC. Writes are authorized on partners first.
-- Definer rights are needed because clients cannot write to the projection.
create function private.sync_partner_directory() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_schema <> 'public' or tg_table_name <> 'partners' or tg_when <> 'AFTER'
     or tg_op not in ('INSERT', 'UPDATE') then
    raise exception 'Invalid partner directory trigger';
  end if;
  if auth.uid() is not null and not private.has_permission('partners.manage') then
    raise exception 'Partner management permission required' using errcode = '42501';
  end if;
  insert into public.partner_directory (id, name_ar, name_en, status)
  values (new.id, new.name_ar, new.name_en, new.status)
  on conflict (id) do update set name_ar = excluded.name_ar,
    name_en = excluded.name_en, status = excluded.status;
  return new;
end;
$$;
revoke all on function private.sync_partner_directory() from public, anon, authenticated;

-- The trigger and backfill commit atomically; subsequent edits stay in sync.
create trigger partners_sync_directory
  after insert or update of id, name_ar, name_en, status on public.partners
  for each row execute function private.sync_partner_directory();
insert into public.partner_directory (id, name_ar, name_en, status)
  select id, name_ar, name_en, status from public.partners;
commit;
