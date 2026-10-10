-- Dear Day: exact and staff-authorized accounting dashboard totals.
-- This function is read-only and doesn't change the original static website.
-- It runs as the database owner only after an AAL2 and active finance.view grant.
-- Client-side limited row fetches must never be used as financial totals.

create or replace function private.staff_finance_exact_totals_impl()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_unsettled numeric := 0;
  v_draft numeric := 0;
  v_approved numeric := 0;
  v_paid numeric := 0;
begin
  if auth.uid() is null
     or coalesce(auth.jwt()->>'aal', 'aal1') <> 'aal2'
     or not private.has_permission('finance.view') then
    raise exception 'FINANCE_OVERVIEW_ACCESS_DENIED' using errcode='42501';
  end if;

  select coalesce(sum(po.partner_net), 0)
    into v_unsettled
    from public.partner_orders po
   where po.status = 'completed'
     and not exists (
       select 1 from public.settlement_items si
        where si.partner_order_id = po.id
     );

  select
    coalesce(sum(ps.partner_net) filter (where ps.status = 'draft'), 0),
    coalesce(sum(ps.partner_net) filter (where ps.status = 'approved'), 0),
    coalesce(sum(ps.partner_net) filter (where ps.status = 'paid'), 0)
    into v_draft, v_approved, v_paid
    from public.partner_settlements ps;

  return jsonb_build_object(
    'unsettled', v_unsettled,
    'draft', v_draft,
    'approved', v_approved,
    'paid', v_paid
  );
end;
$$;

revoke all on function private.staff_finance_exact_totals_impl()
  from public, anon, authenticated;
grant execute on function private.staff_finance_exact_totals_impl()
  to authenticated;

create or replace function public.staff_finance_exact_totals()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select private.staff_finance_exact_totals_impl();
$$;

revoke all on function public.staff_finance_exact_totals()
  from public, anon, authenticated;
grant execute on function public.staff_finance_exact_totals()
  to authenticated;

comment on function public.staff_finance_exact_totals()
is 'Exact aggregated partner finance totals; active finance.view and authenticated AAL2 required. No table data or credentials exposed.';
