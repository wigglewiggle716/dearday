-- Remove PostgreSQL's default PUBLIC execute privilege from internal refund-policy functions.
revoke execute on function private.resolve_refund_policy(uuid,uuid) from public;
revoke execute on function private.submit_refund_policy_impl(text,uuid,uuid,text,jsonb,text,text,boolean) from public;
revoke execute on function private.review_refund_policy_impl(uuid,text,text) from public;
revoke execute on function private.validate_refund_policy_rules(jsonb) from public;
revoke execute on function private.capture_order_item_refund_policy() from public;

grant execute on function private.resolve_refund_policy(uuid,uuid) to anon,authenticated;
grant execute on function private.submit_refund_policy_impl(text,uuid,uuid,text,jsonb,text,text,boolean) to authenticated;
grant execute on function private.review_refund_policy_impl(uuid,text,text) to authenticated;