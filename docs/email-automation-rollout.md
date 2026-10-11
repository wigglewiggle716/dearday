# Dear Day transactional email automation — STAGING ONLY

As of 2026-10-11, 25 Resend templates are published, but publication is not a live send.

## Deployment boundary

- This branch is **email-automation-staging**. Do not merge, deploy or enable without review and separate approval.
- Both review scripts, `docs/email-automation/STAGED_nonpayment_outbox.sql` and `docs/email-automation/STAGED_authoritative_event_producers.sql`, stay **outside** supabase/migrations to prevent accidental migration pickup. They must be applied in that order to an isolated disposable database before approval.
- The existing private.order_email_outbox and payment received dispatcher are entirely separate, untouched, and payment emails remain deferred until Paymob approval.
- No database DDL has been executed in production, no event trigger or scheduled job is installed there, and no customer/partner email has been sent by this change. The staged second SQL script defines gated triggers for legitimate paid/confirmed/in-progress/completed orders, cancellation requests, item decisions and confirmed item refunds.

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

The database has an independent private per-category feature gate (orders, cancellations, partners, intake), all OFF by default. Both queuing and claims check these gates. The public RPC wrappers grant execute only to service_role, with SECURITY INVOKER wrappers and private SECURITY DEFINER implementations. This release does not expose queue functions to anonymous/authenticated browser roles. Escaped template text and a strict event registry prevent arbitrary HTML substitution. Never expose service role or dispatch secret to the browser.

Resend Idempotency-Key remains constant across retries within the provider's 24-hour guarantee; the database stops automatic retries after 23 hours. This guarantees one send attempt group per stored outbox job, not exactly-once inbox delivery.

## Open review items

- Persist a trusted locale with checkout orders before activating English order emails. Current checkout does not store locale and the producer otherwise falls back to Arabic.
- Test the trigger SQL on a disposable Supabase/Postgres database, including partial cancellations, refund confirmations, active partner recipient resolution, and a failed provider call.
- Queuing support/partner application acknowledgements also requires BOTH the corresponding application-level flag and DB `intake` gate, and even then dispatch remains separately OFF by default.
