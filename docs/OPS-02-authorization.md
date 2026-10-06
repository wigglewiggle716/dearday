# OPS-02 authorization boundaries — 2026-10-06

Implemented: live account/membership/partner checks, permission-based panel controls,
and separation of catalog editing from approval. MFA enrollment/enforcement remains pending.

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
browser regression checks, but was NOT executed successfully in this environment because the browser
binary was unavailable and its download failed. These checks do not substitute for real authenticated
browser acceptance. No real orders, payments or messages were sent.

Security Advisors introduced no new finding for these helpers/policies. Four anonymous execution
warnings on account-deletion functions were removed. Existing signed-in SECURITY DEFINER warnings
and leaked-password protection remain for separate review. Unrelated parking tables/functions were not modified.

## Migration and release

`20261006055029_ops02_authorization_boundaries.sql` was applied atomically, with its exact SQL recorded
under the same version in schema_migrations. Source definitions were compared with the live database
before applying, preserving unrelated changes. Frontend files must be deployed with this migration.
Do not restore broad public/internal access as a rollback. Fix forward if a client needs adjustment.

## Remaining to close OPS-02

1. Staff MFA enrollment and challenge UI, recovery procedure, then enforcement of aal2.
   No verified factor existed at inspection; do not enable a blanket requirement before enrollment.
2. Authenticated browser acceptance of the full Admin/Partner/Accountant workflows.
3. Review the remaining role exceptions and sensitive profile/employee operations before declaring a full security audit complete.

Recommended MFA rollout: enroll Super Admin first and test recovery; enroll the remaining staff;
verify login challenges; enforce at the database/RPC boundary. Customer OTP email is separate (OPS-10).
