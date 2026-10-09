# Dear Day React — Auth, MFA & Staff RBAC release gate

Scope: `react-migration` preview only. Do not merge into `main`, replace `dear-day.com`, or require accounts at guest checkout without owner approval.

## Implementation completed in migration branch
- Shared Supabase Auth session provider, signup/login, localized routes, logout, TOTP challenge including backup-factor selection.
- Authenticated account profile, saved addresses, orders, bookings and deletion-request screens. All customer queries are scoped by Auth user ID, with existing database RLS as authority.
- `/security` and `/en/security`: staff TOTP QR/secret shown only during self-service enrollment, one-time verification, backup authenticator enrollment and lost-factor recovery guidance.
- `/staff-permissions` and `/en/staff-permissions`: read the user's effective rights from `get_my_permissions()`. Employee lists and grants are retrieved only when the backend allows `employees.view`/manage. Access/status edits are restricted in the UI to a verified Super Admin session and call `employee_update_access`. Individual overrides call `employee_set_permission_override`; both require an explicit confirmation. The backend independently checks authorization. Avoid mutating actual employee accounts during QA.
- `/access`: separate links for React MFA and permissions; link to the legacy portal opens another origin with independent sign-in.

## Current staff MFA rollout policy
- Verified authenticators: 2 TOTP factors attached to 1 Super Admin account; 2 accountant accounts have no verified MFA factor at last database check.
- `private.staff_mfa_satisfied()` currently enforces AAL2 for staff accounts *that already have a verified factor*. Universal mandatory enrollment is NOT active.
- Do NOT turn on universal MFA enforcement until every active staff account has enrolled AND verified a primary and independent backup authenticator, and recovery has been exercised under owner supervision.
- Never request, copy or retain factor QR secrets, recovery codes or user passwords in tickets, screenshots, logs or documentation. Staff manually enroll their own factors.
- Lost all factors: authorized operator identity verification via independent channel; suspend session during recovery and record approvals. Never bypass MFA via password reset.

## End-to-end tests still required before approving
1. Fresh Arabic customer signup, email verification and login; English locale switch.
2. Existing customer login and logout with Remember Me on/off, cross-tab signout, session expiry.
3. Password reset redirect from email, failed/expired token, email-change confirmation.
4. Social OAuth callbacks on the preview for every *enabled* provider only, including cancel/error.
5. Customer role access only to customer account; access denial from employee/partner routes.
6. Customer profile, phone reauthentication, address add/edit/default/delete; confirm other customer's data remains invisible.
7. Paid/pending orders and booking reservations are displayed only after a database row exists; cart samples are never labelled booked.
8. Account deletion sends a request for Super Admin review; no immediate deletion.
9. Staff accountant enrolls primary authenticator, challenges after fresh sign-in, then adds a backup on a second secure device. Verify both sign-in methods before testing device-loss simulation. Use controlled test accounts where possible.
10. Non-Super-Admin staff sees read-only appropriate effective privileges; no edit controls.
11. Super Admin can view employees and, with authorized test records only, update role/account state and individual override; verify audit events and database denials for unauthorized callers.
12. Suspended staff, inactive partners and suspended customers cannot access protected pages even after token refresh/tab return.
13. Force AAL1 for a staff account with verified MFA and confirm it cannot read or edit protected staff records prior to AAL2 challenge.
14. Attempt cross-user API reads and writes; confirm RLS rejects all.
15. Try URL return-path injection (`//evil.example`), locale switches during MFA, browser refresh during setup, and failed/aborted enrollment. Ensure verified factors are NEVER unenrolled automatically.
16. Mobile and desktop RTL/LTR layout, keyboard focus, code input and accessibility checks.
17. Vercel deployment must be READY at exact latest branch SHA; inspect build logs. Do not claim a static source check is a runtime login test.

## Outside React source / requires separate owner-supervised configuration
- Verify Supabase Auth redirect allowlist for the migration preview and eventual custom domain, including password recovery and OAuth callback URLs.
- Confirm Google, Facebook and Apple provider credentials individually. Display of a button does not prove provider configuration.
- Supabase Security Advisor: enable Leaked Password Protection through authorized Auth settings and review SECURITY DEFINER / mutable search_path notices.
- Invite remaining staff accounts only through the existing approved process. No placeholder passwords, no shared logins.
- Do not silently enable universal staff AAL2 or change real roles. Complete per-employee enrollment, backup and recovery sign-off first.
- Legacy portal on `dear-day.com` has separate local-storage domain scope. Signing into React does not create a legacy-domain session.

## Rollback
- React changes only on `react-migration`. If regression found, revert React commits in this branch; no Supabase role grants or data migrations were applied by this stage.
