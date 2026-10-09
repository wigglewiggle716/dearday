# Dear Day — Order email integration (staged, email sending OFF)

## Guarantee
- Source of truth: `public.orders.status` in Supabase, not browser checkout arguments.
- Exactly one `payment_received` outbox record per order (unique order/kind).
- Outbox trigger fires only when server-verified Paymob transaction changes order to `paid`.
- A receipt says payment was received; **it does not say the booking is confirmed**.
- Reads customer email from stored checkout contact, falling back to Supabase Auth email for signed-in orders. Guests do not need accounts.
- Resend receives authoritative order number, amount, currency and occasion date from DB.
- Private outbox, service-role RPC only. Admin UI must use server-side authorized API.
- Resend Idempotency-Key stable per order; server leases prevent concurrent send workers.
- Retried pending/failed sends and expired leases are claimable. Uncertain results beyond 23 hours or five attempts require manual review rather than potentially duplicating email. Successful sends are never requeued by duplicate callbacks.

## Added on `react-migration`
- `supabase/migrations/20261009_order_payment_email_outbox.sql` — private ledger, paid-status trigger and service-only claim/settle RPCs.
- `next-app/lib/order-email-dispatch.cjs` — server-only shared Resend worker; `lib/order-email-dispatch.js` is a compatibility wrapper for the legacy Vercel API.
- `next-app/app/api/maintenance/order-emails/route.js` — protected Next.js dispatcher endpoint (no production cron).
- `next-app/app/api/paymob/webhook/route.js` — signed Paymob callback route for Next; shared DB confirmation and outbox delivery logic, with a local verified HMAC implementation.
- `api/paymob/webhook.js` — after verified `paid`, best-effort immediate dispatch; never compromises callback acknowledgement on email failure.
- `api/maintenance/send-order-emails.js` — POST worker protected by `Authorization: Bearer <ORDER_EMAIL_DISPATCH_SECRET>`.
- `tests/order-email-dispatch.cjs` — deterministic mock-based test: `node tests/order-email-dispatch.cjs`.
- Resend draft: `Dear Day – Payment Received (English)`, alias `dear-day-payment-received-en`, ID `29809617-7af9-4831-89d9-bd84c52c2b76`.

## Activation prerequisites — DO NOT skip
1. **COMPLETED 2026-10-10:** `order_payment_email_outbox` applied to the existing Supabase database; migration recorded as `20261009211220`. Verified: outbox table present, RLS enabled, paid-status trigger present, anonymous/authenticated roles cannot read or claim the outbox, service role can claim/settle, and a no-op claim returns `[]`. At the time of verification, there were zero paid orders and zero queued emails. Database changes do not enable sending.
2. Review the order template in Resend, then publish it. Draft templates cannot send.
3. Configure server-only environment variables. **Both Vercel projects currently report zero configured environment variables; no keys were created or copied:**
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (required; *not present among Vercel project variables at the time of this review*).
   - `RESEND_API_KEY` (sending-only, domain restricted; no client access).
   - `RESEND_ORDER_PAID_TEMPLATE_ID=dear-day-payment-received-en`.
   - `RESEND_ORDER_EMAILS_ENABLED=true` (default disabled; enable only after sandbox acceptance).
   - `ORDER_EMAIL_DISPATCH_SECRET` strong independent random token.
4. Verify Paymob sandbox is configured and the trusted payment webhook is in the actual deployed runtime. Currently the public create-intention endpoint responds `PAYMENTS_NOT_READY`. No live card charges or order/payment emails can occur until the checkout gateway is enabled.
5. Arrange protected worker scheduler to POST the maintenance endpoint (for retries). Do not schedule before approval; no cron is included in this branch.
6. End-to-end sandbox acceptance: a real signed successful callback -> DB status paid -> exactly one outbox record -> one Resend delivery with exact trusted totals; duplicate callback -> no extra email; bad callback -> none; refunded/cancelled/review payment -> none; provider failure -> retry record; successful reply reaches Dynadot.
7. After release, implement admin-only notification logs, failure alerts, and manual retry workflow with appropriate role/MFA gates. Outbox data is private and **not** directly available to browser clients.
8. React `next-app` still contains a payment UI preview only. The signed Paymob callback endpoint exists, but no payment initiation or checkout adapter is enabled yet. Complete sandbox intention/checkout acceptance before switching deployment.

## Important operational notes
- **No production publication, no live auto-email activation, no DNS edits, and no customer email was sent as part of this change.**
- Do not accept recipient, amount, order id, or email template variables directly from the browser.
- Never expose the Resend API key, the Supabase service-role key, or worker token in client code.
- The idempotency header reduces duplicates; no email provider can promise perfect exactly-once delivery across arbitrary prolonged outages. Investigate aged uncertain deliveries rather than automatically replaying indefinitely.
