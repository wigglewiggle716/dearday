-- Supabase projects may apply explicit default EXECUTE grants to anon on newly created functions.
-- Keep the public resolver readable by guests, but make mutation RPCs authenticated-only.
revoke execute on function public.submit_refund_policy(text,uuid,uuid,text,jsonb,text,text,boolean) from anon;
revoke execute on function public.review_refund_policy(uuid,text,text) from anon;
revoke execute on function private.submit_refund_policy_impl(text,uuid,uuid,text,jsonb,text,text,boolean) from anon;
revoke execute on function private.review_refund_policy_impl(uuid,text,text) from anon;
grant execute on function public.submit_refund_policy(text,uuid,uuid,text,jsonb,text,text,boolean) to authenticated,service_role;
grant execute on function public.review_refund_policy(uuid,text,text) to authenticated,service_role;