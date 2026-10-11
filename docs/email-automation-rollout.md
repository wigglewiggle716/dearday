# Dear Day transactional email automation — STAGING ONLY

As of 2026-10-11, 25 Resend templates are published, but publication is not a live send.

## Deployment boundary

- This branch is **email-automation-staging**. Do not merge, deploy or enable without review and separate approval.
- The SQL is kept in docs/email-automation/STAGED_nonpayment_outbox.sql, deliberately **outside** supabase/migrations to prevent accidental migration pickup.
- The existing private.order_email_outbox and payment received dispatcher are entirely separate, untouched, and payment emails remain deferred until Paymob approval.
- No database DDL has been executed, no event trigger or scheduled job is installed, and no customer/partner email has been sent by this change.

## Staged components

- Next.js lib/notification-email-registry.cjs: language-specific, allowlisted published aliases and required variables.
- Next.js lib/transactional-email-dispatch.cjs: authenticated Resend transport with durable RPC claims/settlements, 8s timeout, idempotency keys, no recipient logging and per-message feedback.
- Next.js app/api/maintenance/transactional-emails/route.js: separate protected POST endpoint, requires TRANSACTIONAL_EMAIL_DISPATCH_SECRET. Returns disabled when flag is OFF.
- Tests: node --test tests/notification-email-registry.test.cjs tests/transactional-email-dispatch.test.cjs.
- SQL staged: private.transactional_email_outbox with dedupe, bounded retries, expiring leases, 23h maximum retry window, service-role-only RPCs.

## Activation checklist (not performed)

1. Review SQL and role privileges, validate against disposable database; apply migration only with explicit production approval.
2. Create server-side trusted event producers. Queue ONLY after real committed database records and state transitions:
   - Orders: request saved, confirmed, in_progress, completed.
   - Cancellations: request saved, individual action/decision, refund actually marked completed.
   - Partner orders: assigned order and cancellation instructions; determine correct active recipient.
   - Support tickets: persisted record; use stored ticket reference (DD-CS-######).
   - Partner applications: persisted intake, no implication of approval.
3. Build stable idempotency keys per event transition and recipient (include state version or transition event id where an event may repeat).
4. Validate event recipients, locale selection, states and variables in trusted server code; never accept an arbitrary client recipient.
5. Exercise synthetic data, rate limit, retries, offline tests, real sandbox delivery; no production sends.
6. Explicitly configure and approve secrets (RESEND_API_KEY, TRANSACTIONAL_EMAIL_DISPATCH_SECRET) and then opt in RESEND_TRANSACTIONAL_EMAILS_ENABLED=true. **Default OFF** and no scheduler currently.
7. Obtain separate approval before production enablement. Ensure in-app notifications still work.

## Security considerations

The public RPC wrappers grant execute only to service_role, with SECURITY INVOKER wrappers and private SECURITY DEFINER implementations. This release does not expose queue functions to anonymous/authenticated browser roles. Escaped template text and a strict event registry prevent arbitrary HTML substitution. Never expose service role or dispatch secret to the browser.

Resend Idempotency-Key remains constant across retries within the provider's 24-hour guarantee; the database stops automatic retries after 23 hours. This guarantees one send attempt group per stored outbox job, not exactly-once inbox delivery.
