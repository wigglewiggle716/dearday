-- Dear Day staff MFA -- release gated until the employee enrollment flow is deployed
-- and every current employee (including accountants) can enroll.
--
-- IMPORTANT: This Supabase instance is shared with live dear-day.com.
-- DO NOT run this migration until the owner has verified onboarding access,
-- staged staff sign-in and backup factors, and approved its live rollout.
-- This migration does not change profile roles, user passwords or MFA factors.
--
-- Customers and partner_user accounts stay on their existing authentication policy.
-- Any OTHER active staff role requires a verified AAL2 session even when no factor
-- was enrolled previously. New staff at AAL1 can still fetch their *own* profile
-- through profiles_self_read and use Supabase Auth TOTP enrollment endpoints.
-- Existing RLS/authorization policies use this function and enforce it server side.
create or replace function private.staff_mfa_satisfied()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and (
      not exists (
        select 1 from public.profiles p
        where p.id = auth.uid()
          and p.role not in ('customer'::public.app_role, 'partner_user'::public.app_role)
      )
      or coalesce(auth.jwt()->>'aal','aal1') = 'aal2'
    );
$$;

revoke all on function private.staff_mfa_satisfied() from public, anon;
grant execute on function private.staff_mfa_satisfied() to authenticated;

comment on function private.staff_mfa_satisfied() is
  'Universal MFA release gate: all staff roles, accountants included, require AAL2. Unauthenticated and AAL1 staff cannot use protected staff RLS or permission predicates. Customer and partner_user unaffected.';

-- Rollback if the independent rollout fails: restore the previously approved
-- *enrolled-only* staff_mfa_satisfied() implementation from
-- 20261006155601_ops02_sensitive_access_mfa.sql with a reviewed migration,
-- not by removing factor enrollment or changing real staff accounts.
