-- Flowers custom design references: separate private images, same protected support inbox.
-- Public access remains restricted to the validation-only Edge Function.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('flower-design-references','flower-design-references',false,5242880,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
drop policy if exists flower_design_staff_reference_read on storage.objects;
create policy flower_design_staff_reference_read
  on storage.objects for select to authenticated
  using (bucket_id='flower-design-references' and private.has_permission('customers.view'));
comment on column public.support_tickets.request_kind is
 'contact, cake_design or flower_design: staff review via existing protected customer support tickets';
