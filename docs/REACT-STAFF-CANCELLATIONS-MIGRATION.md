# Dear Day — React Cancellations / Refunds & Policy Review (Staff Phase 7)
Prepared: 2026-10-10; development branch `react-migration` only.

## New protected bilingual routes
- `/staff/cancellations` and `/en/staff/cancellations`
- `/staff/refund-policies` and `/en/staff/refund-policies`
- Shared components `next-app/components/staff-cancellations.jsx`, `staff-refund-policies.jsx`, shared brand styles `next-app/app/staff-cancellations.css`.
- Registered shared path IDs in `next-app/lib/locales.js`; linked from staff dashboard instead of the legacy HTML cancellation entry.
- All staff routes specify permanent noindex.
- Legacy production site, email/DNS/domain routing and old pages remain unchanged.

## Cancellation queue
- Fetches the latest 150 scoped `cancellation_requests` then their `cancellation_request_items` (batched on at most 50 UUIDs), order/partner metadata and customer name only where `customers.view` is also permitted.
- Staff AAL2 gate and `orders.view` for listing. Only `orders.manage` sees the manual review actions. UI cross-checks fresh account/permission, item status and update timestamp before any write; backend RPC row locks remain the authoritative enforcement.
- Manual exception: `admin_review_cancellation_item` handles approval with a refund amount between zero and item value, or rejection requiring a note. Backend atomically updates affected order/partner/booking records, creates notifications, and audits action.
- Refund Pending: **does not initiate a refund transfer**. `admin_mark_refund_completed` ONLY logs an already completed refund into order/refund state and creates in-app notifications. React requires BOTH `orders.manage` AND `finance.view` or `finance.manage`, plus a real external transaction reference, a separate confirmation, fresh session/permissions, and current `refund_pending` status.
- The deployed Supabase RPC currently enforces only `orders.manage`, NOT finance permission or reference presence. **This is a production security gap**: anyone with `orders.manage` can bypass React and call RPC directly, including operations, even if React hides button. Do not consider financial workflow production-safe until a separately approved DB-side enhancement enforces the intended policy and evidence.
- ACCOUNTANT GAP: `accountant` role receives `finance.manage` but not `orders.manage`; this RPC cannot be called by accountants. The team must choose desired reviewer/finance separation and implement a backend permission model with explicit owner approval. Never silently grant employee privileges.
- This screen does not refund card transactions or transfer any money. Actual external Paymob/processor operations must be confirmed separately. Do not use genuine customer refunds to test.
- Request status may be automatically calculated from item decisions, separate from item statuses. Filters operate by ITEM status.

## Refund policy management
- Permissioned staff with `catalog.manage` can create a draft or submit a new `platform`, `partner` or `listing` policy via `submit_refund_policy`. No direct table insert.
- Staff with `approvals.review` can approve or reject pending policies via `review_refund_policy`. Rejection requires a note.
- The secured Supabase RPC activates an approved policy immediately and archives the previous approved policy in the same scope, while emitting an audit record.
- Policy form supports `manual_review` and `tiered` modes with zero-hour cutoff validation, nonduplicate hour tiers and 0-100 refund percentages, platform/partner/listing scope, deposit/no-show/partner-cancellation percentages and Arabic/English notes.
- **Do not approve a live platform policy as a test**: policy scope changes future customer refund estimates, but historical order items already include the policy snapshot at the time of purchase.
- Owner/legal review of the policy language and consumer rights required before any live activation.

## Release blockers & acceptance
- **No SQL migrations were applied** and no real orders, cancellations, refunds, notices or policies were changed during migration. Read-only SQL catalog/function/policy discovery only.
- Latest commit is not confirmed READY in Vercel Preview. An explicit deployment attempt returned **402 / api-deployments-free-per-day** with a 24-hour retry window, so browser and finance acceptance tests are still required. Older commits may show READY but do not verify these pages.
- Latest 150 requests and 300 policies/400 listing option caps: implement true server pagination before higher volume.
- Reviewer must test role separation, duplicate/forged status changes, stale item, refunds requiring actual reference, private customer names, desktop/mobile and bilingual layout, real Paymob reconciliation, and manual vs automatic cancellation paths using **synthetic test entries and explicit authorisation**.
- Refer to the single [Owner review checklist](./REACT-OWNER-REVIEW-CHECKLIST.md) sections **9هـ** and **9و** (31 new QA items). All remain unchecked.
- Continue partner finance/settlement, notification and staff MFA hardening separately before apex cutover.

## High-priority security decision for owner
Decide whether only trusted finance managers can confirm a completed refund (recommended) and whether an accountant needs a separate specific `refunds.complete` permission. Then stage a reviewed, tested server RPC enforcement and mandatory nonempty external refund reference (plus payment-provider verification if integrated). This must go through controlled SQL migration approval and not be deployed implicitly.
