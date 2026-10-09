# Dear Day — Staff workspace React migration / Phase 1
Date: 2026-10-09

## Completed on branch react-migration only
- New customer-site integrated employee workspace: `/staff` (AR), `/en/staff` (EN).
- Shared `next-app/components/staff-workspace.jsx` displays translated, responsive role-aware dashboard, protected from customers/partners and staff lacking verified MFA.
- Uses existing Supabase auth user/profile validation via `AuthSessionProvider` and direct `get_my_permissions` RPC. All summary tables remain protected by database RLS; no service-role key in browser.
- Dashboard requires `dashboard.view`. Metrics are loaded independently only when their relevant permission is granted: `orders.view` (all/open/recent orders), `customers.view` (customer count), `partners.view` (active partners), `approvals.review` (pending listing versions), `finance.view` (draft settlements count).
- Shows explicit unavailable values on per-query failures rather than fabricating empty data. Recent orders read-only.
- Employees are directed to `/staff` or `/en/staff` after signing in; work access hub links directly to the new dashboard.
- Legacy operational modules are explicitly labelled as links to old website and may need a separate login. Link visibility is permission-scoped and does not bypass backend authorisation.
- Employee access management and TOTP security stay in the existing React pages.
- The public website and production domains were not changed; no DB migration was applied.

## What remains
- This is the **first stage**, not a full migration of the legacy admin/finance/partner portals.
- Port live CRUD flows for orders, approvals, catalog, partners, customers, cancellations, availability, messaging and finance, preserving per-action permissions and server-side integrity.
- Plan a separate protected hostname or finish migrating all legacy portals **before** moving the apex `dear-day.com` from the old Vercel project.
- Confirm Supabase read-only RLS data with Super Admin, Accountant, Operations and a restricted employee. Ensure both locales and mobile behave correctly.
- Owner + IT co-owner each get distinct Super Admin accounts; full staff MFA gate is staged in SQL but NOT deployed until onboarding/recovery is validated.
- Never expose private data in Next SSR HTML, public static assets, or logs.
- Existing React preview intentionally has `noindex` (private pages must remain noindex permanently).
- Do not send emails, change production DNS, create/disable test employees, or apply any staging SQL until explicit approval.

## Deployment note
- GitHub branch accepted all Phase 1 commits.
- Vercel free tier API returned `api-deployments-free-per-day` (402) when attempting deployment at the latest Phase 1 commit. Older commit `7966b40f99f97898b7460d5d15c20f94d781c631` has a READY deployment, including the staff dashboard component and its route files; later changes connecting the staff hub and post-login target are **not yet verified by a new build**.
- Deployment build logs were unavailable via the current Vercel connection (403). After quota resets, build the exact new branch HEAD and run authenticated browser acceptance checks before declaring the stage production-ready.

## Phase 1 acceptance checklist
1. Not signed in: `/staff` sends to `/auth?next=%2Fstaff`; translated English equivalent works.
2. Employee account with TOTP not configured: only authenticator enrollment shown.
3. Employee with verified factor but AAL1: TOTP challenge shown, no operational data fetched.
4. Suspended, customer, or partner-user account: no staff data shown.
5. Verified Super Admin AAL2: dashboard KPIs and recent orders load correctly and match authorised live Supabase data.
6. Accountant AAL2: finance and orders metrics only, subject to account-specific permission overrides.
7. Role/permission override changes and account suspension are reflected after refresh; no disallowed KPIs or module links displayed.
8. AR/EN, mobile/desktop, reload, session expiry, logout, and back-navigation behaviour correct.
9. Legacy modules open separate-domain login; they must be moved or retained on a verified separate hostname before cutover.
