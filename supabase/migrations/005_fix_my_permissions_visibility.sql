drop policy if exists permissions_employee_read on public.permissions;
create policy permissions_authenticated_read on public.permissions
for select to authenticated using (true);
