# OPS-03 — phase 1 (8 October 2026)

Applied migration: `20261008033511_ops03_direct_order_financial_boundary.sql`.

Direct browser/Data API order inserts are restricted to zero-value EGP drafts.
Direct updates cannot change identity, owner, amounts, currency or creation date.
Status changes are limited to paid → confirmed → in_progress → completed.
Payments, refunds and cancellations must use dedicated server workflows.
The staff UI offers only these transitions and uses the old status as a concurrency condition.
Status audits are written in the same transaction by a database trigger.

The trigger deliberately runs as SECURITY INVOKER: existing trusted SECURITY DEFINER
payment/cancellation functions and service-role writes are separate boundaries.
Those functions are NOT certified by this phase. No client-controlled bypass flag is used.

Validation: rollback SQL fixtures passed before and after migration; customer forged
paid/amount inserts and staff paid/refunded/owner/amount writes are rejected; unpaid
confirmation is rejected; valid operational transitions and atomic audit succeed.
No real order or payment was processed. Database sequences can have test-induced gaps.

## Phase 2 — authoritative checkout

Migration `20261008034640_ops03_authoritative_checkout.sql` adds `prepare_checkout`.
Only an active customer can quote or create an order. Inputs contain listing IDs,
integer quantities and event/delivery details. Catalog prices, versions, partner IDs
and commissions come from locked published records. Quotes expose no commissions.
The server rejects a stale quote token before creating anything.

Creation stores order/items/partner totals/holds/audit/idempotency result in one
transaction. Per-customer advisory locks serialize retries; ordered listing row locks
and existing date advisory locks serialize stock/capacity checks. Duplicate listing
IDs are aggregated. Keys are customer-scoped, reject payload changes, and cannot
revive expired orders. Up to three unexpired checkout requests per customer.

Stock reservations use booking_reservations across dates; scheduled capacity uses
existing availability rules. Holds expire after at most 15 minutes and expire out of
availability calculations without cron. Order rows remain pending_payment after
expiry; OPS-04 must implement expiry reconciliation, payment confirmation and failure
cleanup. Confirmed reservations count against stock: do not also decrement stock
without updating this contract. No stock was permanently consumed in this phase.

Direct order inserts and all direct writes to order_items/partner_orders are revoked
from browser roles. Existing audited server RPCs remain separate security boundaries.
Unpaid partner orders cannot move into fulfillment. Bound holds cannot be resized or
released through the old customer hold RPCs.

Both payment languages show a current-price review button; creation is wired into
the payment action after quote review. Network retries retain the same key. Payment
methods remain disabled and the legacy raw-amount intention endpoint returns 503
PAYMENTS_NOT_READY, even if integration environment variables exist. OPS-04 must
replace it with authenticated order lookup, amount verification and signed webhooks.
No checkout client secret or service key is exposed.

Current totals follow the existing model: no delivery surcharge or promotion engine.
Neither amount is accepted from the client. Confirm shipping rules before launch.
Legacy/non-UUID cart items fail closed and must be reselected from the live catalog.
Services requiring capacity fail closed if scheduling is not configured.

Validation: rollback SQL scenarios before/after migration cover price tampering,
stale quotes, duplicates, stock and scheduled capacity, expiry, immutable item/commission
values, two-partner totals and rejection of unpaid fulfillment. Node DOM-boundary mocks
cover AR/EN quote review, retry keys, failures and the payment gate. These are not
real customer browser acceptance or a parallel-load test. No real charge was made.
Full end-to-end payment/cancellation acceptance remains in OPS-04/14.

Rollback: use a reviewed forward migration to revise the two triggers if needed;
do not restore financial status options without restoring an equivalent server guard.

## Guest checkout — 2026-10-08
The owner explicitly requires checkout without accounts or account prompts. Details,
review and payment (AR/EN, desktop/mobile) omit auth links. The checkout client never
reads or creates an auth session. `quote_guest_checkout` accepts only items and event;
its fixed null key makes it incapable of creating orders. The service-only guest
creation RPC preserves catalog pricing, locks, stock checks, policy snapshots and
partner commission. Guest orders and holds have null customer_id; contact name/email
is retained in the delivery snapshot. No auth/profile row is created.

The same-origin guest API uses an HttpOnly Secure signed cookie, request idempotency,
a private 20-attempt/15-minute IP bucket and three active orders per guest. Direct
anonymous/authenticated creation RPC access is denied, and ordinary visitors cannot
read guest orders. The API requires the existing server SUPABASE_URL and
SUPABASE_SERVICE_ROLE_KEY; environment availability has NOT been verified because
Vercel environment metadata access returned 403 and no CLI is installed.

Database rollback tests cover anonymous quote, denied direct creation, service-only
creation, null owner, retained email, retry, hidden order and held-stock rejection.
AR/EN VM tests forbid auth calls and cover quote/create transport and idempotency.
Payment remains disabled. Secure emailed order tracking, email delivery, payment
verification and end-to-end guest creation in production remain OPS-04/10 work.
