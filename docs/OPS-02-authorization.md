# OPS-02 authorization boundaries — 2026-10-06

Implemented: live account/membership/partner checks, permission-based panel controls,
and separation of catalog editing from approval. Staff MFA setup/challenge and staged database enforcement are implemented; real-account rollout remains pending.

## Behavior

- Suspended accounts cannot write profiles, use protected customer RPCs or read/write private operational tables.
- Partner access requires an active profile with partner_user role, an active membership and an active partner.
- A second active membership cannot authorize inventory/availability/order access to a suspended partner.
- Public catalog browsing remains public. Suspension does not delete products, orders or history.
- catalog.manage allows drafts/proposals and inventory; approvals.review is needed for publication,
  changing reviewed versions and changing the published-version pointer.
- Approval uses a narrowly scoped private implementation with an explicit permission check and pending-review validation.
  Reviewers do not receive general direct catalog write permission.
- Refund-policy creation uses catalog.manage; review uses approvals.review.
- Partner and product panels now use returned permissions instead of hard-coded role names.
  Sidebar links honor permission overrides for Admin too. The refund queue uses orders.manage.
- Existing financial capabilities have not been redistributed; settlement separation is OPS-05.

## Validation

`supabase/tests/ops02_authorization.sql` passed before and after applying the migration.
It exercises inherited permissions for nine roles, direct publication denial, authorized approval,
published-price protection, an Admin denial override, independent account/member/partner suspension,
and isolation when a member has another active partner. Fixtures and profile changes are rolled back.

JavaScript syntax and referenced HTML element IDs passed. `tests/ops02-panels.cjs` supplies mocked
browser regression checks, which passed on 7 October after a browser runtime was made available.
`tests/ops02-mfa.cjs` also passed enrollment, invalid-code rejection, challenge/return, backup cancellation,
secret cleanup, customer exclusion and mobile overflow checks. These use mocked Auth/data and do not
substitute for real authenticated browser acceptance. No real orders, payments or messages were sent.

Security Advisors introduced no new finding for these helpers/policies. Four anonymous execution
warnings on account-deletion functions were removed. Existing signed-in SECURITY DEFINER warnings
and leaked-password protection remain for separate review. Unrelated parking tables/functions were not modified.

## Migration and release

`20261006055029_ops02_authorization_boundaries.sql` was applied atomically, with its exact SQL recorded
under the same version in schema_migrations. Source definitions were compared with the live database
before applying, preserving unrelated changes. Frontend files must be deployed with this migration.
Do not restore broad public/internal access as a rollback. Fix forward if a client needs adjustment.

## Sensitive access and MFA follow-up — 7 October 2026

Migration `20261006155601_ops02_sensitive_access_mfa.sql` is applied and recorded.
Only an active Super Admin can change security fields and permission configuration,
including direct API writes. Self role/status changes and direct Super Admin deletion
are blocked; privileged changes are serialized and the last active Super Admin protected.
Changes are audited by database triggers. Employee UI reflects those restrictions.

Staff security page: `/Dear-Day-Security.html`. Supports TOTP enrollment, challenge,
backup authenticator and recovery guidance. Verified factors require AAL2 at database
permission/active-actor boundaries and explicit Super Admin deletion RPCs. Staff without
a verified factor retain access during onboarding. No universal requirement was enabled.

Both SQL suites passed again after migration; all test profile/factor/data changes rolled back.
Security Advisors finding counts were unchanged. Existing password-protection and other
previous advisories remain; unrelated parking objects were not changed.

## Remaining to close OPS-02

1. Owner enrolls Super Admin, verifies backup/recovery, then enrolls remaining staff.
2. Actual authenticated Admin/Partner/Accountant workflow acceptance; mocked browser
   regressions are complete, actual account sessions are not.
3. After onboarding and recovery acceptance, enable a universal staff AAL2 requirement.

See `OPS-02-MFA-recovery.md` for enrollment and operator-assisted recovery. No real
orders, payments, external messages, account suspensions or MFA factors were committed
by the tests. Customer OTP email is OPS-10; financial separation is OPS-05.
