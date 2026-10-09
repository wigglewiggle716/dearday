-- Additive support-ticket fields for custom cake design requests.
-- Existing contact submissions and staff review remain unchanged.
alter table public.support_tickets
  add column if not exists request_kind text not null default 'contact',
  add column if not exists reference_image_path text,
  add column if not exists reference_image_name text;
comment on column public.support_tickets.request_kind is 'contact or cake_design; custom cake requests share the protected customer support inbox';
comment on column public.support_tickets.reference_image_path is 'Private object path in cake-design-references; no public URL';

-- Privately stored reference images; no anonymous direct object access.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('cake-design-references','cake-design-references',false,5242880,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
drop policy if exists cake_design_staff_reference_read on storage.objects;
create policy cake_design_staff_reference_read
  on storage.objects for select to authenticated
  using (bucket_id='cake-design-references' and private.has_permission('customers.view'));

-- Keep all inserts server-side under validated, rate-limited Edge Function.
revoke insert,update,delete on public.support_tickets from anon,authenticated;
