# Staff MFA rollout and recovery

## Delivered

Staff can open `/Dear-Day-Security.html` from the portal sidebar, enroll a TOTP
app, verify the first code and add a second independent authenticator as backup.
Subsequent password login challenges enrolled staff before returning to a portal.
The database also requires `aal2` for enrolled staff through its authorization
predicates, including the explicit Super Admin account-deletion procedures.
QR codes, seeds and one-time codes are not written to logs or application storage.
Customer email OTP and partner MFA are outside this rollout.

## Activation order / release gate

1. Owner signs into the Super Admin account and personally enrolls an authenticator.
   Never send the QR seed or generated code through chat/support.
2. Owner adds and verifies a second authenticator kept on a separate secure device.
3. Sign out; sign in; test the primary code and then the backup factor in a second login.
4. Repeat enrollment for remaining staff. Verify each role's real operational workflow.
5. Only after recovery and all staff enrollment are verified, replace staged enforcement
   with a universal staff AAL2 requirement. This final switch is NOT enabled yet.

Current staged enforcement applies only while a staff account has a verified factor.
Supabase requires AAL2 to remove a verified factor. There is intentionally no
self-service "disable all MFA" button. A universal requirement remains a rollout gate.
No native recovery codes are claimed or issued by this implementation.

## Lost primary authenticator

Choose the backup authenticator on the challenge page and verify its code. After
regaining AAL2 access, enroll a replacement. A trusted administrator may remove the
lost factor using Supabase Auth management after checking factor IDs; never remove
all verified factors as routine maintenance.

## Lost all authenticators

This is an operator-assisted recovery, not a password-reset bypass:

1. Verify the employee in person or using a previously established independent
   company channel. Do not accept an email alone as proof of identity.
2. Record the request, affected account ID and approving owner. Super Admin recovery
   requires the project owner with separately secured Supabase dashboard access.
3. Suspend the affected staff profile from a separate authorized account during
   recovery; revoke the account's active Auth sessions through supported Auth admin
   controls. Do not run delete-user or change existing orders/financial records.
4. Through Supabase Authentication user management, remove only that account's lost
   MFA factors. A privileged recovery session is required, never a browser service key.
5. Supervise re-enrollment and backup verification. A suspended account cannot use the
   staff setup page: restore it only for the verified owner to complete supervised
   re-enrollment immediately. Validate sign-in before closing the recovery record.
6. For the sole Super Admin, do NOT bypass the self/last-admin protections from the
   website. Use the separately secured project-owner recovery process with an audit
   record and explicit owner approval; this emergency drill is still pending.

Password reset does not remove MFA. No recovery operation was performed on any real
account while developing this change.
