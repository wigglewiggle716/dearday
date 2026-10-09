# Dear Day React — Customer Management and Support Inbox (Staff Phase 5)

Date: 2026-10-09. All new code is on **`react-migration` only** under `next-app/`. No changes to `main`, the production Vercel project, `dear-day.com`, live Supabase tables, real customer status/tickets, or DNS.

## New React routes
- Customers AR: `/staff/customers`; EN: `/en/staff/customers`
- Support AR: `/staff/support`; EN: `/en/staff/support`
- Components: `next-app/components/staff-customers.jsx`, `next-app/components/staff-support.jsx`.
- Shared styles: `next-app/app/staff-customer-support.css`.
- Registered in `next-app/lib/locales.js` and linked from `/staff` for accounts with `customers.view`. Old HTML links removed only from the React navigation; the existing HTML pages remain available.
- Both pages explicitly use `robots:{index:false,follow:false}`; bilingual and responsive AR/EN.

## Customer directory
- Calls existing `customer_list` RPC (backed by permission-checked `private.customer_directory`). Restricted to active, AAL2 staff with `customers.view`. List includes name, email, phone, area, active status, order counts, total spend and last order.
- Search/filter client-side and paginate 30/page. RPC can be limited by Supabase PostgREST default max results; verify server pagination before claiming full coverage on larger directories.
- Per-customer details load at most 20 `customer_addresses` and 20 `orders` records; access remains subject to existing RLS.
- Changing customer active status requires `customers.manage`, a confirmation, re-verified active staff MFA and fresh permission check, then uses `customer_set_active` RPC which rejects non-customer target users and logs the change.
- A Super Admin only sees `admin_account_deletion_list` as a **READ-ONLY queue**. Never call `admin_review_account_deletion` here: approving would permanently delete auth credentials and personal data; owner/legal workflow required separately.
- No real account status changes or deletions were performed.

## Support inbox
- Calls existing private-data `support_tickets` table with `customers.view` RLS; status, case/subject, message, contact details, incoming locale, `request_kind` and cake image object reference.
- Search/filter with 30 tickets per page; newest 250 tickets are fetched. Opening ticket separately loads newest 40 `support_ticket_events` for staff activity history.
- Ticket review uses existing `review_support_ticket` RPC **only**, not direct table writes. Actual RPC requires `customers.view` and an active employee with role `super_admin`, `admin` or `customer_support`. UI performs same checks plus a live `readCurrentAccount` and permissions re-fetch.
- Supported statuses: `new`, `in_progress`, `awaiting_customer`, `resolved`, `closed`. Internal notes stored with the RPC; auditing is part of the same DB transaction.
- Custom cake image references from `cake-design-references` are retrieved as 60-second signed URLs only after staff session and permission re-check, from the existing private storage bucket.
- Manual `mailto:` / `tel:` actions do NOT send transactional emails. No Resend integration nor outbound notification is active in this React phase.
- No real tickets were modified or real cake documents downloaded during implementation.

## Exact backend verification (read-only)
- Inspected live function definitions for `customer_list`, `customer_set_active`, `review_support_ticket`, `admin_account_deletion_list` and `admin_review_account_deletion`.
- Confirmed `support_tickets`, `support_ticket_events`, `customer_addresses` and `orders` table columns match React data requests, including `request_kind` and `reference_image_path`.
- Previous SQL migration exists for cake intake and private storage policy. No migrations were applied.

## Release acceptance, all unchecked
See **[the single cumulative owner review checklist](./REACT-OWNER-REVIEW-CHECKLIST.md)** sections **9ب** and **9ج**, plus deployment gates in section 0.
1. Latest `react-migration` HEAD must be READY and compiled in Vercel preview (both routes) before owner browser sign-off. Source commits alone are not a release.
2. AR/EN/mobile layouts, back/forward/dialog behavior and customer session expiry.
3. Only authorized active AAL2 staff see customer/ticket lists and sensitive details.
4. Compare read-only directory, addresses, orders, tickets, cake attachments and activity history to legacy staff administration using staff test credentials.
5. Customers with `customers.view` but not `customers.manage` must be read-only. Support ticket mutation requires both `customers.view` and a supported role.
6. Only on authorized synthetic accounts/tickets: test suspension/reactivation and status/note changes; verify audit/event row, refusal for unauthorized actors and rejection for noncustomer IDs. Never mutate actual customer records as QA.
7. Super Admin deletion requests remain read-only in React; no destructive approve/reject controls.
8. Validate inbox with a test submission from AR/EN public contact forms and a synthetic cake design case; do not send emails from Resend while domain verification is pending.
9. Scale limitations: current customer RPC, 250 support ticket cap, 40 event cap and per-customer 20 order/address cap. Require server-side pagination if needed.

## Deferred
- More detailed customer order history and search across entire customer base with server pagination.
- Full account deletion review (security, compliance and irreversible deletion gates).
- Direct customer reply threads and future authenticated outbound email via Resend (not activated).
- Partner self-service portal, availability, cancellations/refunds and finance administration all remain separate.
- A verified READY deployment and browser acceptance for this exact commit are still required before considering live cutover.

No checklist item was preapproved. No modification was made to existing production domain or Resend.
