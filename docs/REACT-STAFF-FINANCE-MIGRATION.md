# Dear Day — Finance & Settlements React Migration (Staff Phase 8)

Date: 2026-10-10. Implementation remains confined to `react-migration`, under `next-app/` and `docs/`. No production `main`, `dear-day.com`, Vercel production, live SQL write, real finance action, customer order, DNS or outbound email was changed.

## Routes
- Arabic: `/staff/finance`
- English: `/en/staff/finance`
- Shared component: `next-app/components/staff-finance.jsx`.
- Styles: `next-app/app/staff-finance.css`.
- Pages use `noindex` and the existing employee Auth/MFA provider.
- Staff administration navigation and owner/accountant dashboard links now route to React finance rather than the legacy production HTML page; the old HTML page has **not been deleted**.

## Implemented screens
- Partner settlements list: partner name, period, gross, Dear Day commission, adjustments, partner net, currency, status, payment reference, notes and timestamps.
- Read-only settlement details include up to 100 settlement items with breakdowns.
- Completed partner orders are eligible for settlement only if not linked to existing `settlement_items`; the page shows the currently loaded eligible entries and four summary metrics (unsettled, draft, approved, paid).
- Search by partner/reference, filter by settlement status/partner and 25-row client-side pagination. Results in this phase are fetched in 200-row batches, with a 600-row cap per source.
- When any source is truncated, summary values are explicitly identified as partial. **When `settlement_items` is truncated, the UI hides unsettled eligibility and its total** rather than incorrectly labelling settled partner orders as eligible. Server-side reconciliation/aggregation is required before production volumes exceed these caps.

## Permissions and write safeguards
- `finance.view` is mandatory to view any finance content. AAL2 authenticated employees only; `finance.manage` enables creation/approval/marking paid.
- Before each action, React re-fetches account status/MFA and live permissions, and shows a clear confirmation. RLS and RPC remain the real security boundary.
- Create settlement `draft` using existing `finance_create_settlement` RPC, with partner/date/adjustment validation. The RPC recalculates authoritative eligible completed partner orders, creates `partner_settlements` and `settlement_items`, and records an audit entry within the transaction.
- Approve transition `draft` → `approved` and record a verified external transfer `approved` → `paid` via `finance_update_settlement_status`. The RPC checks transitions and requires a nonempty payment reference for paid. The React flow also checks the freshest settlement status, confirms the action, and asks for a real external transfer reference.
- **No payment is actually sent by this app or RPC.** Mark Paid only records an already completed external transfer. Evidence, payment-provider/bank reconciliation and audit verification remain required before go-live.
- Do not use live partner money or real settlements for QA. No new migration or role grant applied to live Supabase.

## Finance permission decision — owner-confirmed (2026-10-10)
The owner explicitly confirmed **keep existing finance permissions unchanged**. A staff member with `finance.manage` may create, approve and record a partner settlement as paid. No maker/checker split or second approver will be introduced in this migration, and **no Supabase grants, roles, RPCs or policies were changed**. This decision covers *partner settlement authority*; it does not change the separate customer refund-completion permissions or provide proof of external payment.

## Financial controls still requiring validation
1. The same `finance.manage` employee can perform all three settlement actions, as explicitly accepted by the owner. Keep audit logs, payment reference, transaction-state checks and manual reconciliation mandatory. Do not treat accepting this permission model as approval of untested financial transactions.
2. A nonempty external transfer reference proves neither that the transfer occurred nor the settled amount. Bank/Paymob reconciliation needs a verified process and (if possible) server-side evidence checking.
3. The accountant role has `finance.view` and `finance.manage` but **not** `orders.manage`, and therefore cannot call the separate customer-refund completion RPC. This is intentionally left unchanged until an approved change to the refund-permission model.
4. `finance_update_settlement_status` currently permits same-status re-entry, although React only exposes forward transitions. Backend idempotency/repeated audit policies should be reviewed for real financial use.
5. Full-volume accounting dashboards need server-side aggregates and paging; the 600-row display cap is not enough to represent a full ledger at scale.

## Validation
- Live read-only schema/function/RLS queries confirmed fields and existing `finance_create_settlement` / `finance_update_settlement_status` signatures.
- No financial RPC invoked; no row updated, inserted, or marked paid.
- Preview build for current Git HEAD and browser QA **not yet verified**. A newer React branch is not the live domain.
- All tests are **unchecked** in [master owner review checklist](./REACT-OWNER-REVIEW-CHECKLIST.md), section **9ز** (22 new tests). Testing requires synthetic designated partner orders/settlements with owner approval before any DB mutation.

## Further work
- Controlled read-only audit history of individual settlements with identity/time, CSV export if approved, reconciliation with actual payment rails and payout evidence. Do not add maker/checker segregation unless the owner requests a later policy change.
- Finish remaining staff notification and partner self-service modules, then full regression and controlled domain cutover under the main checklist.
