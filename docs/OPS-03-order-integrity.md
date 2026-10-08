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

Remaining OPS-03: authoritative order creation and catalog pricing, idempotency,
order-item and partner-order financial write boundaries, and integration into checkout.
Existing cancellation/refund RPCs and payment verification require OPS-04 review.
Do not enable payments or declare OPS-03 complete based on this phase.

Rollback: use a reviewed forward migration to revise the two triggers if needed;
do not restore financial status options without restoring an equivalent server guard.
