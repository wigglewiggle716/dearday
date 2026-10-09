# Dear Day — Staff orders React migration (Phase 2)

Implemented 2026-10-09 on GitHub **react-migration** ONLY. No change to public Vercel project or domain, no production account/order mutation, no SQL migration applied.

## Routes
- Arabic: `/staff/orders` — `next-app/app/(ar)/staff/orders/page.js`
- English: `/en/staff/orders` — `next-app/app/(en)/en/staff/orders/page.js`
- Shared implementation: `next-app/components/staff-orders.jsx`; scoped responsive styles: `next-app/app/staff-orders.css`.
- Navigation integrated into React staff workspace; the old Orders link is removed from the list of links back to HTML admin.

## Supported operations
- Signed-in staff with `orders.view`: see server-paginated 30-order listing, order-number/occasion/area search, status filter, status/area/amount/occasion/date.
- Open a single order to read delivery details, totals, items and partner suborders. Customer profile contact read requires the **separate** `customers.view` permission. No commissions or partner net fields are requested.
- Staff with `orders.manage` may request only operational transitions: `paid → confirmed → in_progress → completed`. Confirmation is required.
- Before a status update, React refreshes the actual Supabase account state and effective permissions. The update checks order ID, previous status and `updated_at` to avoid stale writes. Production database also enforces direct-write transitions and records status changes in `audit_logs`.
- Payment marking, cancellations and refunds are intentionally NOT performed by this page; existing verified payment/cancellation paths remain separate.
- Customers, partner users, suspended employees, unverified MFA staff and employees without `orders.view` are not granted access by the React UI. Actual data queries are additionally enforced by Supabase RLS.
- Both locales: noindex/no-follow, responsive table and modal, no mock/demo order data.

## Read-only verification against deployed Supabase
- Confirmed `authenticated` has SELECT and UPDATE privileges on `public.orders`.
- Confirmed `orders_read_scoped`, `orders_manage_scoped`, `active_actor_boundary` policies; active `orders_direct_write_boundary` and `orders_audit_status_transition` triggers.
- No real order status changes were made. No privilege, Auth or database migrations were changed.

## Required acceptance tests before release
1. Build exact approved `react-migration` commit on Vercel preview. Check AR/EN routes, links from `/staff`, Next production build logs and mobile layout.
2. No user login: prompt for sign-in, no orders in page HTML; customer/partner account: access denied.
3. Staff without MFA / not AAL2: prompt to set up/verify TOTP, no orders.
4. Staff with `orders.view` and no `orders.manage`: list/detail accessible but update control absent. Customer names and phones absent unless `customers.view` separately granted.
5. Super Admin with verified MFA: inspect several test orders and compare listing/detail data with the established legacy portal. Verify search, pagination, filtering, date and totals.
6. For a **specifically authorised synthetic/test order only**, change `paid → confirmed`, and verify a single audit entry, database status and React refresh. DO NOT run this on genuine orders.
7. Attempt disallowed status changes (pending_payment → paid, any → refunded/cancelled) and verify they cannot be selected or written by authenticated browser session; authoritative DB guard must reject crafted direct calls.
8. Simulate outdated order `updated_at`, revoked permissions, user suspension, and concurrent status update; verify no unsafe write or misleading success.
9. Confirm external admin and finance pages still function independently before considering switching live `dear-day.com`.

## Release blocker
Vercel API returned 402 `api-deployments-free-per-day` on the previous phase, and list_deployments remains on an older READY SHA; **this Phase 2 has not yet had a verified READY deployment or interactive browser acceptance**. Wait for quota reset and build the latest commit before asking the owner to approve the page. Production remains on the old Vercel project.
