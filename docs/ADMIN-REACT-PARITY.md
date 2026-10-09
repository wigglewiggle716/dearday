# Dear Day React Admin Panel — original-design parity

## Scope and safety
The original `main` website remains unchanged. This work modifies only `react-migration`.
React administration is now a standalone layout: an original-style fixed burgundy #6B3540 sidebar, role-aware navigation, its own sticky 'view site' topbar, desktop 260px sidebar and responsive off-canvas mobile menu. The customer header/footer do not render on staff routes. The sidebar uses the **same Supabase permissions** and verified MFA-gated staff auth as the individual pages. Neither the sidebar nor metrics grant any new privilege.

## Legacy inventory — all sections retained

| Original sidebar section | React target / fallback | Permission |
| --- | --- | --- |
| Overview / Staff Portal | /staff | dashboard.view |
| Orders | /staff/orders | orders.view |
| Partners | /staff/partners | partners.view / partners.manage |
| Products & Services | /staff/catalog | catalog.view / catalog.manage |
| Approvals | /staff/approvals | approvals.review |
| Availability & Schedules | /staff/availability | availability.view / availability.manage |
| Cancellation/Refund Policies | /staff/refund-policies | catalog.manage / approvals.review |
| Cancellations & Refunds | /staff/cancellations | orders.manage |
| General Notifications | original /Dear-Day-Notifications.html (opens new tab) | staff session |
| Payment Received Emails (new) | /staff/order-emails | orders.manage |
| Account Security | /security | authenticated staff |
| Customers | /staff/customers | customers.view |
| Customer Support (new) | /staff/support | customers.view |
| Employees & Permissions | /staff-permissions | employees.view / employees.manage |
| Finance & Settlements | original /Dear-Day-Finance.html (opens new tab) | finance.view |

All migrated sections have identical English paths under /en. The two unfinished modules (finance operations and general notifications) are *not concealed*: their original-site links stay visible in the sidebar for permitted roles, with ↗ to indicate external navigation and a separate authentication session.

## Dashboard restoration
- **Owner/Admin:** original 8 KPI slots: all/open orders, customers, partners, pending approvals, unsettled partner net, paid order value, cancellations/refunds. Recent orders including area, pending approvals table, finance status totals (draft/approved/paid/unsettled).
- **Accountant:** original four finance KPI slots and recent settlements, plus recent orders; no access to order-management write controls.
- **Other employees:** only allowed KPIs, recent orders if permitted and quick work cards.
- Independent query failures show a dash rather than inventing a zero; sections are not fetched without their permission.
- All pages still enforce their existing Supabase RLS and staff/MFA permission checks; no client-side secrets.

## Acceptance / follow-up
- [x] Inventory of every original admin shell section and working React URL.
- [x] Shared Arabic+English admin shell and removal of consumer header/footer for staff routes.
- [x] Sidebar responsive layout, scrollable navigation, fixed account/logout section, active page and external module indicators.
- [x] Owner and accountant dashboard structure restored in React.
- [x] Static regression contract: `node tests/react-admin-parity.cjs`.
- [ ] Verify React build/deployment and test screenshots at desktop/mobile widths in an authenticated browser.
- [ ] Test Super Admin, Accountant and other role permissions, active navigation and Google/MFA sign-in.
- [ ] Migrate **Finance & Settlements** transactional workflow and **General Notifications** into native React (the original versions are currently linked rather than removed).
- [ ] Do not redirect `dear-day.com`, change `main`, or declare visual sign-off without user review.

### Testing
Run `node tests/react-admin-parity.cjs` and `npm --prefix next-app run build` in CI before promoting the branch. Test the RTL sidebar and LTR counterpart in a browser (not just code).
