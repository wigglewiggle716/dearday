-- OPS-01 phase 2: apply ONLY after the directory-based frontend is live.
begin;
drop policy partners_public_read on public.partners;
create policy partners_staff_read on public.partners
  for select to authenticated using (
    private.has_permission('partners.view') or private.has_permission('finance.view')
  );
-- Keep partners_manage_scoped and partners_member_read unchanged.
-- Customer sessions have no matching policy; partner members see only their own rows.
revoke all on public.partners from public, anon;
revoke truncate, references, trigger on public.partners from authenticated;
commit;
