-- Partner applications are separate from approved/active partners.
-- Public visitors never receive table or storage privileges; the public
-- application intake Edge Function validates and writes with service role.
create table if not exists public.partner_applications (
  id uuid primary key default gen_random_uuid(),
  company_name text not null check (char_length(company_name) between 2 and 200),
  contact_name text not null check (char_length(contact_name) between 2 and 200),
  email text not null check (char_length(email) between 5 and 254),
  phone text not null check (char_length(phone) between 6 and 40),
  country text not null default 'Egypt' check (country = 'Egypt'),
  city text not null check (char_length(city) between 2 and 100),
  years_in_business integer check (years_in_business is null or years_in_business between 0 and 150),
  categories text[] not null check (cardinality(categories) between 0 and 15),
  other_category text check (other_category is null or char_length(other_category) <= 150),
  company_description text not null check (char_length(company_description) between 10 and 5000),
  website text check (website is null or char_length(website) <= 400),
  social_media text check (social_media is null or char_length(social_media) <= 400),
  partnership_model text not null check (char_length(partnership_model) between 3 and 200),
  current_partnerships text check (current_partnerships is null or char_length(current_partnerships) <= 3000),
  company_profile_path text not null check (char_length(company_profile_path) between 8 and 300),
  company_profile_name text not null check (char_length(company_profile_name) between 1 and 240),
  product_list_path text check (product_list_path is null or char_length(product_list_path) <= 300),
  product_list_name text check (product_list_name is null or char_length(product_list_name) <= 240),
  status text not null default 'new'
    check (status in ('new','under_review','contacted','accepted','rejected')),
  internal_notes text check (internal_notes is null or char_length(internal_notes) <= 4000),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  submission_fingerprint text check (submission_fingerprint is null or char_length(submission_fingerprint)=64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cardinality(categories)>0 or length(btrim(coalesce(other_category,'')))>0)
);
create index if not exists partner_applications_status_date_idx
  on public.partner_applications(status,created_at desc);
create index if not exists partner_applications_created_at_idx
  on public.partner_applications(created_at desc);
create index if not exists partner_applications_fingerprint_idx
  on public.partner_applications(submission_fingerprint, created_at desc);
alter table public.partner_applications enable row level security;
revoke all on public.partner_applications from public,anon,authenticated;
grant select on public.partner_applications to authenticated;
drop policy if exists partner_applications_staff_read on public.partner_applications;
create policy partner_applications_staff_read on public.partner_applications
  for select to authenticated
  using (private.has_permission('partners.view') or private.has_permission('partners.manage'));

-- A private storage bucket: documents are readable only by authenticated
-- staff with partner permissions, never via public URLs or anonymous uploads.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('partner-applications','partner-applications',false,6291456,
  array['application/pdf','text/csv','application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do nothing;
drop policy if exists partner_applications_staff_documents on storage.objects;
create policy partner_applications_staff_documents
  on storage.objects for select to authenticated
  using (bucket_id='partner-applications'
    and (private.has_permission('partners.view') or private.has_permission('partners.manage')));

-- Staff can change status/internal notes only through this narrow RPC.
-- This operation does NOT create or activate a partner record.
create or replace function public.review_partner_application(
  p_application_id uuid,p_status text,p_internal_notes text default null
) returns uuid
language plpgsql security definer
set search_path='pg_catalog','public','private'
as $fn$
declare v_id uuid;
begin
  if not private.has_permission('partners.manage') then
    raise exception 'Insufficient partner management permission' using errcode='42501';
  end if;
  if p_status not in ('new','under_review','contacted','accepted','rejected')
    or char_length(coalesce(p_internal_notes,''))>4000 then
    raise exception 'Invalid review status or notes' using errcode='22023';
  end if;
  update public.partner_applications
    set status=p_status,
        internal_notes=nullif(btrim(coalesce(p_internal_notes,'')),''),
        reviewed_by=auth.uid(),
        reviewed_at=now(),
        updated_at=now()
    where id=p_application_id returning id into v_id;
  if v_id is null then
    raise exception 'Application not found' using errcode='P0002';
  end if;
  return v_id;
end $fn$;
revoke all on function public.review_partner_application(uuid,text,text) from public,anon;
grant execute on function public.review_partner_application(uuid,text,text) to authenticated;

-- Reuse Dear Day's existing in-app notification table. No email is sent.
create or replace function private.on_partner_application_created()
returns trigger language plpgsql security definer
set search_path='pg_catalog','public','private'
as $fn$
begin
  perform private.notify_admins(
    'partner_application',
    'طلب انضمام شريك جديد',
    'وصل طلب انضمام من '||left(new.company_name,100),
    'New partner application',
    'New application from '||left(new.company_name,100),
    'partner_application',
    new.id,
    jsonb_build_object('application_id',new.id)
  );
  return new;
end $fn$;
revoke all on function private.on_partner_application_created() from public,anon,authenticated;
drop trigger if exists partner_application_notify_admins on public.partner_applications;
create trigger partner_application_notify_admins
after insert on public.partner_applications
for each row execute function private.on_partner_application_created();
