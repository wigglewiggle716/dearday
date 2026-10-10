# Dear Day transactional emails — staging rollout

Status: 25 Resend templates PUBLISHED. Publication does NOT send customer emails.

This branch adds a read-only alias and variable registry with offline tests. There is no sender, queue activation, database migration, scheduled job, or change to production.

## Authoritative event mapping
| Event | Required source of truth |
|---|---|
| booking_request_received | Saved customer order/request only; not a completed booking |
| booking_confirmed | Order transition to confirmed only |
| order_in_progress, order_completed | Confirmed order state transition only |
| cancellation_requested | Persisted cancellation request |
| cancellation_update | Reviewed cancellation item/request state; no premature refund claim |
| refund_completed | Verified refund marked completed by authorized staff |
| partner_new_order | Assigned partner order; recipient resolved from active partner users |
| partner_cancellation | Approved/cancelled/under-review partner item instruction |
| support_received | Persisted support ticket, saved locale and ticket number |
| partner_application | Persisted partner application, applicant email from saved record |

## Controls required before any email integration goes live

- Server-side only, from authoritative stored events; never enqueue from browser state.
- Private durable outbox with exact transition idempotency keys, duplicate suppression, retries, and limits.
- Resolve recipient from trusted rows, reject invalid addresses, and do not expose service credentials.
- Arabic and English chosen from stored contact preference or validated input.
- Default OFF feature flags and test/sandbox recipients. Do not send to actual customers or partners until approved.
- Payment Received remains deferred until Paymob payment validation is activated; published template alone is insufficient.
- Keep current in-app notifications working. Email is additive.

## Planned sequence
1. Create a private, idempotent nonpayment outbox migration on this branch, not in production.
2. Implement guarded dispatch with per-event feature flags OFF by default.
3. Wire real source transitions in orders, cancellations, partner intakes, and support intakes.
4. Test with synthetic records, inspect Resend delivery results, request explicit production approval.
