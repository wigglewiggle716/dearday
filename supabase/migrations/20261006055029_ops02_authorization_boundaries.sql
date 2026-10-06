-- OPS-02: authorization is evaluated against live profiles/memberships, not UI roles.
begin;
create function private.is_active_partner_member(p_partner_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.profiles pr
    join public.partner_users pu on pu.user_id=pr.id
    join public.partners pa on pa.id=pu.partner_id
    where pr.id=auth.uid() and pr.is_active and pr.role='partner_user'
      and pu.is_active and pa.status='active' and pa.id=p_partner_id
  );
$$;
create function private.is_active_actor() returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.profiles pr where pr.id=auth.uid() and pr.is_active
      and (pr.role <> 'partner_user' or exists (
        select 1 from public.partner_users pu join public.partners pa on pa.id=pu.partner_id
        where pu.user_id=pr.id and pu.is_active and pa.status='active'
      ))
  );
$$;
create function private.require_active_actor() returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if not private.is_active_actor() then
    raise exception 'Active account and partner access required' using errcode='42501';
  end if;
end;
$$;
revoke all on function private.is_active_partner_member(uuid), private.is_active_actor(), private.require_active_actor() from public, anon;
grant execute on function private.is_active_partner_member(uuid), private.is_active_actor(), private.require_active_actor() to authenticated;

-- Preserve staff visibility of suspended memberships for administration.
-- All partner-owned RLS paths use partner_users, so this closes their common boundary.
create policy partner_membership_active_boundary on public.partner_users
as restrictive for all to authenticated
using (private.is_staff() or (user_id=(select auth.uid()) and private.is_active_partner_member(partner_id)))
with check (private.is_staff() or (user_id=(select auth.uid()) and private.is_active_partner_member(partner_id)));

-- Restrictive policies cannot broaden any existing permission or ownership policy.
do $$ declare t text; begin
  foreach t in array array['partner_users','orders','partner_orders','order_items','audit_logs',
    'customer_addresses','partners','employee_permission_overrides','partner_settlements',
    'settlement_items','booking_reservations','notifications','cancellation_requests',
    'cancellation_request_items','account_deletion_requests'] loop
    execute format('create policy active_actor_boundary on public.%I as restrictive for all to authenticated using ((select private.is_active_actor())) with check ((select private.is_active_actor()))',t);
    execute format('revoke truncate, references, trigger on public.%I from anon, authenticated',t);
  end loop;
  -- Public catalog browsing stays available; only writes require an active actor.
  foreach t in array array['profiles','categories','listings','listing_versions',
    'listing_availability_settings','listing_availability_windows','listing_availability_exceptions','refund_policies'] loop
    execute format('create policy active_actor_update on public.%I as restrictive for update to authenticated using ((select private.is_active_actor())) with check ((select private.is_active_actor()))',t);
    execute format('create policy active_actor_delete on public.%I as restrictive for delete to authenticated using ((select private.is_active_actor()))',t);
    if t <> 'profiles' then
      execute format('create policy active_actor_insert on public.%I as restrictive for insert to authenticated with check ((select private.is_active_actor()))',t);
    end if;
    execute format('revoke truncate, references, trigger on public.%I from anon, authenticated',t);
  end loop;
end $$;

-- Publication permission is separate from editing, including direct Data API calls.
create function private.protect_catalog_publication() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  -- Trusted maintenance without a user JWT is still subject to database role privileges.
  if auth.uid() is null or private.has_permission('approvals.review') then
    if tg_op='DELETE' then return old; else return new; end if;
  end if;
  if tg_table_name='listing_versions' then
    if tg_op in ('UPDATE','DELETE') and old.status not in ('draft','pending_review') then
      raise exception 'Approval permission required for reviewed versions' using errcode='42501';
    end if;
    if tg_op <> 'DELETE' and (new.status not in ('draft','pending_review')
      or new.reviewed_by is not null or new.reviewed_at is not null or new.review_note is not null) then
      raise exception 'Approval permission required to publish or review' using errcode='42501';
    end if;
  elsif tg_table_name='listings' then
    if tg_op='INSERT' and new.published_version_id is not null then
      raise exception 'Approval permission required to publish' using errcode='42501';
    elsif tg_op='UPDATE' then
      if new.published_version_id is distinct from old.published_version_id
        or (old.published_version_id is not null and
          (new.partner_id,new.category_id,new.kind) is distinct from (old.partner_id,old.category_id,old.kind)) then
        raise exception 'Published catalog changes require approval' using errcode='42501';
      end if;
    elsif tg_op='DELETE' and old.published_version_id is not null then
      raise exception 'Approval permission required to delete a published listing' using errcode='42501';
    end if;
  end if;
  if tg_op='DELETE' then return old; else return new; end if;
end;
$$;
revoke all on function private.protect_catalog_publication() from public, anon, authenticated;
create trigger protect_catalog_publication before insert or update or delete on public.listings
for each row execute function private.protect_catalog_publication();
create trigger protect_catalog_publication before insert or update or delete on public.listing_versions
for each row execute function private.protect_catalog_publication();

-- Review-only employees may inspect proposals, but do not receive direct write grants.
create policy listings_reviewer_read on public.listings for select to authenticated
using (private.has_permission('approvals.review'));
-- Keep existing business logic; check the live actor before privileged operations.
CREATE OR REPLACE FUNCTION private.partner_submit_listing_impl(p_listing_id uuid, p_partner_id uuid, p_category_id uuid, p_kind listing_kind, p_name_ar text, p_name_en text, p_description_ar text, p_description_en text, p_price numeric, p_compare_at_price numeric, p_currency text, p_media jsonb, p_is_available boolean, p_stock_qty integer, p_capacity_per_day integer, p_submit boolean DEFAULT true)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare v_uid uuid:=auth.uid();v_listing_id uuid;v_version_id uuid;v_status public.listing_status;v_existing_partner uuid;
begin
  perform private.require_active_actor();
 if v_uid is null then raise exception 'Authentication required' using errcode='42501';end if;
 if not exists(select 1 from public.profiles p where p.id=v_uid and p.is_active=true and p.role='partner_user') then raise exception 'Partner access required' using errcode='42501';end if;
 if not exists(select 1 from public.partner_users pu join public.partners p on p.id=pu.partner_id where pu.user_id=v_uid and pu.partner_id=p_partner_id and pu.is_active=true and private.is_active_partner_member(pu.partner_id) and p.status='active') then raise exception 'Partner membership is not active' using errcode='42501';end if;
 if nullif(trim(p_name_ar),'') is null then raise exception 'Arabic name is required';end if;
 if coalesce(p_price,0)<0 then raise exception 'Price cannot be negative';end if;
 if p_compare_at_price is not null and p_compare_at_price<0 then raise exception 'Compare price cannot be negative';end if;
 if p_media is not null and jsonb_typeof(p_media)<>'array' then raise exception 'Media must be a JSON array';end if;
 v_status:=case when p_submit then 'pending_review'::public.listing_status else 'draft'::public.listing_status end;
 if p_listing_id is null then
  insert into public.listings(partner_id,category_id,kind,is_available,stock_qty,capacity_per_day) values(p_partner_id,p_category_id,p_kind,false,null,null) returning id into v_listing_id;
 else
  select l.partner_id into v_existing_partner from public.listings l where l.id=p_listing_id;
  if v_existing_partner is null then raise exception 'Listing not found';end if;
  if v_existing_partner<>p_partner_id then raise exception 'Listing does not belong to this partner' using errcode='42501';end if;
  v_listing_id:=p_listing_id;
 end if;
 if p_submit and exists(select 1 from public.listing_versions lv where lv.listing_id=v_listing_id and lv.status='pending_review') then raise exception 'This listing already has a version pending review';end if;
 insert into public.listing_versions(listing_id,status,name_ar,name_en,description_ar,description_en,price,compare_at_price,currency,media,metadata,submitted_by,submitted_at)
 values(v_listing_id,v_status,trim(p_name_ar),nullif(trim(p_name_en),''),nullif(trim(p_description_ar),''),nullif(trim(p_description_en),''),coalesce(p_price,0),p_compare_at_price,coalesce(nullif(trim(p_currency),''),'EGP'),coalesce(p_media,'[]'::jsonb),jsonb_build_object('source','partner','proposed',jsonb_build_object('partner_id',p_partner_id,'category_id',p_category_id,'kind',p_kind,'is_available',coalesce(p_is_available,true),'stock_qty',p_stock_qty,'capacity_per_day',p_capacity_per_day)),case when p_submit then v_uid else null end,case when p_submit then now() else null end) returning id into v_version_id;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,after_data) values(v_uid,case when p_submit then 'partner_listing_submitted' else 'partner_listing_draft_created' end,'listing',v_listing_id::text,jsonb_build_object('version_id',v_version_id,'status',v_status,'partner_id',p_partner_id));
 return jsonb_build_object('listing_id',v_listing_id,'version_id',v_version_id,'status',v_status);
end;$function$;

CREATE OR REPLACE FUNCTION private.partner_set_inventory_impl(p_listing_id uuid, p_is_available boolean, p_stock_qty integer, p_capacity_per_day integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare v_uid uuid:=auth.uid();v_listing public.listings%rowtype;
begin
  perform private.require_active_actor();
 if v_uid is null then raise exception 'Authentication required' using errcode='42501';end if;
 select l.* into v_listing from public.listings l where l.id=p_listing_id;
 if v_listing.id is null or not exists(select 1 from public.partner_users pu where pu.partner_id=v_listing.partner_id and pu.user_id=v_uid and pu.is_active=true and private.is_active_partner_member(pu.partner_id)) then raise exception 'Listing access denied' using errcode='42501';end if;
 update public.listings set is_available=coalesce(p_is_available,is_available),stock_qty=p_stock_qty,capacity_per_day=p_capacity_per_day,updated_at=now() where id=p_listing_id;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,before_data,after_data) values(v_uid,'partner_inventory_updated','listing',p_listing_id::text,jsonb_build_object('is_available',v_listing.is_available,'stock_qty',v_listing.stock_qty,'capacity_per_day',v_listing.capacity_per_day),jsonb_build_object('is_available',p_is_available,'stock_qty',p_stock_qty,'capacity_per_day',p_capacity_per_day));
 return jsonb_build_object('listing_id',p_listing_id,'updated',true);
end;$function$;

CREATE OR REPLACE FUNCTION private.partner_get_order_detail_impl(p_partner_order_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare v_uid uuid:=auth.uid();v_po public.partner_orders%rowtype;v_order jsonb;v_items jsonb;
begin
  perform private.require_active_actor();
 if v_uid is null then raise exception 'Authentication required' using errcode='42501';end if;
 select po.* into v_po from public.partner_orders po where po.id=p_partner_order_id;
 if v_po.id is null or not exists(select 1 from public.partner_users pu where pu.partner_id=v_po.partner_id and pu.user_id=v_uid and pu.is_active=true and private.is_active_partner_member(pu.partner_id)) then raise exception 'Partner order access denied' using errcode='42501';end if;
 select jsonb_build_object('order_number',o.order_number,'occasion_type',o.occasion_type,'occasion_date',o.occasion_date,'occasion_time',o.occasion_time,'delivery_area',o.delivery_area,'delivery_address',o.delivery_address,'customer_note',o.customer_note,'currency',o.currency,'created_at',o.created_at) into v_order from public.orders o where o.id=v_po.order_id;
 select coalesce(jsonb_agg(jsonb_build_object('id',oi.id,'item_name',oi.item_name,'unit_price',oi.unit_price,'quantity',oi.quantity,'line_total',oi.line_total,'item_snapshot',oi.item_snapshot) order by oi.created_at),'[]'::jsonb) into v_items from public.order_items oi where oi.order_id=v_po.order_id and oi.partner_id=v_po.partner_id;
 return jsonb_build_object('partner_order',jsonb_build_object('id',v_po.id,'status',v_po.status,'subtotal',v_po.subtotal,'commission_rate',v_po.commission_rate,'commission_amount',v_po.commission_amount,'partner_net',v_po.partner_net,'accepted_at',v_po.accepted_at,'completed_at',v_po.completed_at,'created_at',v_po.created_at),'order',coalesce(v_order,'{}'::jsonb),'items',v_items);
end;$function$;

CREATE OR REPLACE FUNCTION private.partner_update_order_status_impl(p_partner_order_id uuid, p_status partner_order_status)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare v_uid uuid:=auth.uid();v_po public.partner_orders%rowtype;v_allowed boolean:=false;
begin
  perform private.require_active_actor();
 if v_uid is null then raise exception 'Authentication required' using errcode='42501';end if;
 select po.* into v_po from public.partner_orders po where po.id=p_partner_order_id for update;
 if v_po.id is null or not exists(select 1 from public.partner_users pu where pu.partner_id=v_po.partner_id and pu.user_id=v_uid and pu.is_active=true and private.is_active_partner_member(pu.partner_id)) then raise exception 'Partner order access denied' using errcode='42501';end if;
 v_allowed:=(v_po.status='pending' and p_status in ('accepted','rejected')) or (v_po.status='accepted' and p_status='in_progress') or (v_po.status='in_progress' and p_status='ready') or (v_po.status='ready' and p_status='completed');
 if not v_allowed then raise exception 'Invalid partner order status transition: % -> %',v_po.status,p_status;end if;
 update public.partner_orders set status=p_status,accepted_at=case when p_status='accepted' and accepted_at is null then now() else accepted_at end,completed_at=case when p_status='completed' then now() else completed_at end,updated_at=now() where id=p_partner_order_id;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,before_data,after_data) values(v_uid,'partner_order_status_changed','partner_order',p_partner_order_id::text,jsonb_build_object('status',v_po.status),jsonb_build_object('status',p_status));
 return jsonb_build_object('partner_order_id',p_partner_order_id,'status',p_status);
end;$function$;

CREATE OR REPLACE FUNCTION private.partner_list_orders_impl()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare v_uid uuid:=auth.uid();v_result jsonb;
begin
  perform private.require_active_actor();
 if v_uid is null then raise exception 'Authentication required' using errcode='42501';end if;
 if not exists(select 1 from public.profiles p where p.id=v_uid and p.is_active=true and p.role='partner_user') then raise exception 'Partner access required' using errcode='42501';end if;
 select coalesce(jsonb_agg(row_data order by (row_data->>'created_at')::timestamptz desc),'[]'::jsonb) into v_result from (select jsonb_build_object('partner_order_id',po.id,'partner_id',po.partner_id,'partner_name',coalesce(pa.name_ar,pa.name_en),'status',po.status,'subtotal',po.subtotal,'commission_rate',po.commission_rate,'commission_amount',po.commission_amount,'partner_net',po.partner_net,'accepted_at',po.accepted_at,'completed_at',po.completed_at,'created_at',po.created_at,'order_number',o.order_number,'occasion_type',o.occasion_type,'occasion_date',o.occasion_date,'occasion_time',o.occasion_time,'delivery_area',o.delivery_area,'currency',o.currency,'item_count',(select count(*) from public.order_items oi where oi.order_id=po.order_id and oi.partner_id=po.partner_id)) row_data from public.partner_orders po join public.partner_users pu on pu.partner_id=po.partner_id and pu.user_id=v_uid and pu.is_active=true and private.is_active_partner_member(pu.partner_id) join public.partners pa on pa.id=po.partner_id join public.orders o on o.id=po.order_id) s;
 return v_result;
end;$function$;

CREATE OR REPLACE FUNCTION private.partner_list_cancellations_impl()
 RETURNS TABLE(request_id uuid, request_item_id uuid, order_id uuid, order_number bigint, item_name text, item_status cancellation_item_status, estimated_refund_amount numeric, approved_refund_amount numeric, currency text, reason_code text, reason_text text, requested_at timestamp with time zone, reviewed_at timestamp with time zone, admin_note text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare v_uid uuid:=auth.uid();
begin
  perform private.require_active_actor();
 if v_uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if not exists(select 1 from public.profiles where id=v_uid and role='partner_user' and is_active=true) then raise exception 'Partner access required' using errcode='42501'; end if;
 return query select r.id,ci.id,o.id,o.order_number,oi.item_name,ci.status,ci.estimated_refund_amount,ci.approved_refund_amount,ci.currency,r.reason_code,r.reason_text,r.requested_at,ci.reviewed_at,ci.admin_note
 from public.cancellation_request_items ci join public.cancellation_requests r on r.id=ci.cancellation_request_id join public.orders o on o.id=r.order_id join public.order_items oi on oi.id=ci.order_item_id
 where exists(select 1 from public.partner_users pu where pu.user_id=v_uid and pu.partner_id=ci.partner_id and pu.is_active=true and private.is_active_partner_member(pu.partner_id))
 order by r.requested_at desc;
end $function$;

CREATE OR REPLACE FUNCTION private.submit_refund_policy_impl(p_scope text, p_partner_id uuid, p_listing_id uuid, p_title text, p_rules jsonb, p_note_ar text DEFAULT NULL::text, p_note_en text DEFAULT NULL::text, p_submit boolean DEFAULT true)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare
  v_uid uuid:=(select auth.uid());
  v_scope public.refund_policy_scope;
  v_partner uuid:=p_partner_id;
  v_status public.refund_policy_status;
  v_prev uuid;
  v_id uuid;
  v_is_admin boolean;
begin
  perform private.require_active_actor();
  if v_uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
  begin v_scope:=p_scope::public.refund_policy_scope; exception when others then raise exception 'Invalid refund policy scope'; end;
  perform private.validate_refund_policy_rules(p_rules);
  if nullif(trim(p_title),'') is null then raise exception 'Policy title is required'; end if;
  v_is_admin:=private.has_permission('catalog.manage');
  if v_scope='listing' then
    select l.partner_id into v_partner from public.listings l where l.id=p_listing_id;
    if v_partner is null then raise exception 'Listing not found'; end if;
  end if;
  if not v_is_admin then
    if v_scope='platform' then raise exception 'Only Dear Day can manage platform policy' using errcode='42501'; end if;
    if not exists (
      select 1 from public.profiles p where p.id=v_uid and p.is_active=true and p.role='partner_user'
    ) then raise exception 'Partner access required' using errcode='42501'; end if;
    if v_partner is null or not exists (
      select 1 from public.partner_users pu join public.partners pa on pa.id=pu.partner_id
      where pu.user_id=v_uid and pu.partner_id=v_partner and pu.is_active=true and private.is_active_partner_member(pu.partner_id) and pa.status='active'
    ) then raise exception 'Partner membership is not active' using errcode='42501'; end if;
  end if;
  if v_scope='partner' and v_partner is null then raise exception 'Partner is required'; end if;
  if v_scope='listing' and p_listing_id is null then raise exception 'Listing is required'; end if;
  select rp.id into v_prev from public.refund_policies rp
   where rp.status='approved' and (
    (v_scope='platform' and rp.scope='platform') or
    (v_scope='partner' and rp.scope='partner' and rp.partner_id=v_partner) or
    (v_scope='listing' and rp.scope='listing' and rp.listing_id=p_listing_id)
   ) order by rp.effective_at desc nulls last,rp.created_at desc limit 1;
  v_status:=case when p_submit then 'pending_review'::public.refund_policy_status else 'draft'::public.refund_policy_status end;
  insert into public.refund_policies(scope,partner_id,listing_id,title,rules,note_ar,note_en,status,previous_policy_id,created_by,submitted_by,submitted_at)
  values(v_scope,case when v_scope in ('partner','listing') then v_partner else null end,case when v_scope='listing' then p_listing_id else null end,trim(p_title),p_rules,nullif(trim(p_note_ar),''),nullif(trim(p_note_en),''),v_status,v_prev,v_uid,case when p_submit then v_uid else null end,case when p_submit then now() else null end)
  returning id into v_id;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,after_data)
  values(v_uid,case when p_submit then 'refund_policy_submitted' else 'refund_policy_draft_created' end,'refund_policy',v_id::text,jsonb_build_object('scope',v_scope,'partner_id',v_partner,'listing_id',p_listing_id,'status',v_status));
  return jsonb_build_object('policy_id',v_id,'status',v_status);
end $function$;

CREATE OR REPLACE FUNCTION private.review_refund_policy_impl(p_policy_id uuid, p_decision text, p_note text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare
  v_uid uuid:=(select auth.uid());
  v public.refund_policies%rowtype;
  v_decision text:=lower(trim(p_decision));
begin
  perform private.require_active_actor();
  if v_uid is null or not private.has_permission('approvals.review') then raise exception 'Permission denied' using errcode='42501'; end if;
  select * into v from public.refund_policies where id=p_policy_id for update;
  if v.id is null then raise exception 'Refund policy not found'; end if;
  if v.status<>'pending_review' then raise exception 'Only pending refund policies can be reviewed'; end if;
  if v_decision='approved' then
    update public.refund_policies rp set status='archived',updated_at=now()
     where rp.id<>v.id and rp.status='approved' and (
       (v.scope='platform' and rp.scope='platform') or
       (v.scope='partner' and rp.scope='partner' and rp.partner_id=v.partner_id) or
       (v.scope='listing' and rp.scope='listing' and rp.listing_id=v.listing_id)
     );
    update public.refund_policies set status='approved',reviewed_by=v_uid,reviewed_at=now(),review_note=nullif(trim(p_note),''),effective_at=now(),updated_at=now() where id=v.id;
  elsif v_decision='rejected' then
    if nullif(trim(p_note),'') is null then raise exception 'Rejection note is required'; end if;
    update public.refund_policies set status='rejected',reviewed_by=v_uid,reviewed_at=now(),review_note=trim(p_note),updated_at=now() where id=v.id;
  else
    raise exception 'Decision must be approved or rejected';
  end if;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,after_data)
  values(v_uid,case when v_decision='approved' then 'refund_policy_approved' else 'refund_policy_rejected' end,'refund_policy',v.id::text,jsonb_build_object('decision',v_decision,'scope',v.scope,'partner_id',v.partner_id,'listing_id',v.listing_id,'note',nullif(trim(p_note),'')));
  return jsonb_build_object('policy_id',v.id,'status',case when v_decision='approved' then 'approved' else 'rejected' end);
end $function$;

CREATE OR REPLACE FUNCTION private.release_booking_hold_impl(p_hold_token uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare v_count integer;
begin
  perform private.require_active_actor();
  update public.booking_reservations
  set status='released',updated_at=now()
  where hold_token=p_hold_token and customer_id=auth.uid() and status='hold';
  get diagnostics v_count = row_count;
  return v_count>0;
end $function$;

CREATE OR REPLACE FUNCTION private.create_booking_hold_impl(p_listing_id uuid, p_date date, p_start_time time without time zone DEFAULT NULL::time without time zone, p_quantity integer DEFAULT 1)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare l public.listings%rowtype;s public.listing_availability_settings%rowtype;v_check jsonb;v_id uuid;v_token uuid;v_expiry timestamptz;v_end_time time;v_store_start time;v_existing public.booking_reservations%rowtype;
begin
  perform private.require_active_actor();
 if auth.uid() is null or not exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_active=true) then raise exception 'Authentication required';end if;
 select * into l from public.listings where id=p_listing_id;if not found then raise exception 'Listing not found';end if;
 select * into s from public.listing_availability_settings where listing_id=p_listing_id;if not found then raise exception 'Booking is not configured';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_listing_id::text||'|'||p_date::text,0));
 if s.booking_mode='time_slot' then v_store_start:=p_start_time;v_end_time:=p_start_time+make_interval(mins=>s.slot_minutes);else v_store_start:=null;v_end_time:=null;end if;
 select * into v_existing from public.booking_reservations r where r.listing_id=p_listing_id and r.customer_id=auth.uid() and r.reservation_date=p_date and r.start_time is not distinct from v_store_start and r.status='hold' and r.expires_at>now() order by r.created_at desc limit 1;
 v_check:=private.compute_listing_availability(p_listing_id,p_date,p_start_time,p_quantity,case when found then v_existing.id else null end);if coalesce((v_check->>'available')::boolean,false) is not true then return v_check;end if;
 if v_existing.id is not null then update public.booking_reservations set quantity=p_quantity,start_time=v_store_start,end_time=v_end_time,updated_at=now() where id=v_existing.id returning id,hold_token,expires_at into v_id,v_token,v_expiry;
 else v_expiry:=now()+make_interval(mins=>s.hold_minutes);insert into public.booking_reservations(listing_id,partner_id,customer_id,reservation_date,start_time,end_time,quantity,status,expires_at) values(p_listing_id,l.partner_id,auth.uid(),p_date,v_store_start,v_end_time,p_quantity,'hold',v_expiry) returning id,hold_token into v_id,v_token;end if;
 return v_check||jsonb_build_object('hold_id',v_id,'hold_token',v_token,'expires_at',v_expiry,'held_quantity',p_quantity);
end $function$;

CREATE OR REPLACE FUNCTION private.customer_create_cancellation_impl(p_order_id uuid, p_order_item_ids uuid[], p_reason_code text, p_reason_text text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare
  v_uid uuid:=auth.uid();
  v_order public.orders%rowtype;
  v_request uuid;
  v_item record;
  v_est jsonb;
  v_mode text;
  v_amount numeric;
  v_pct numeric;
  v_item_status public.cancellation_item_status;
  v_count int:=0;
  v_manual int:=0;
  v_auto int:=0;
  v_refund_count int:=0;
  v_refund_total numeric:=0;
  v_partner record;
  v_partner_order_status public.partner_order_status;
  v_req_status public.cancellation_request_status;
begin
  perform private.require_active_actor();
  if v_uid is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;
  if nullif(trim(coalesce(p_reason_code,'')),'') is null then
    raise exception 'Cancellation reason is required';
  end if;

  select * into v_order
  from public.orders
  where id=p_order_id and customer_id=v_uid
  for update;

  if not found then
    raise exception 'Order not found' using errcode='42501';
  end if;
  if v_order.status not in ('paid','confirmed','in_progress') then
    raise exception 'This order cannot be cancelled in its current status';
  end if;

  if not exists(
    select 1 from public.order_items oi
    where oi.order_id=p_order_id
      and oi.is_cancelled=false
      and (p_order_item_ids is null or cardinality(p_order_item_ids)=0 or oi.id=any(p_order_item_ids))
  ) then
    raise exception 'No cancellable items selected';
  end if;

  if exists(
    select 1
    from public.cancellation_request_items ci
    join public.order_items oi on oi.id=ci.order_item_id
    where oi.order_id=p_order_id
      and ci.status<>'rejected'
      and (p_order_item_ids is null or cardinality(p_order_item_ids)=0 or oi.id=any(p_order_item_ids))
  ) then
    raise exception 'A cancellation request already exists for one or more selected items';
  end if;

  insert into public.cancellation_requests(order_id,customer_id,reason_code,reason_text)
  values(p_order_id,v_uid,trim(p_reason_code),nullif(trim(coalesce(p_reason_text,'')),''))
  returning id into v_request;

  for v_item in
    select oi.*
    from public.order_items oi
    where oi.order_id=p_order_id
      and oi.is_cancelled=false
      and (p_order_item_ids is null or cardinality(p_order_item_ids)=0 or oi.id=any(p_order_item_ids))
    order by oi.created_at,oi.id
  loop
    v_count:=v_count+1;

    select po.status into v_partner_order_status
    from public.partner_orders po
    where po.order_id=v_order.id and po.partner_id=v_item.partner_id
    limit 1;

    if v_partner_order_status='completed' then
      v_est:=jsonb_build_object('mode','manual_review','refund_percent',null,'refund_amount',null,'reason','partner_order_completed');
    else
      v_est:=private.calculate_refund_estimate(v_item.refund_policy_snapshot,v_item.line_total,v_order.occasion_date,v_order.occasion_time);
    end if;

    v_mode:=coalesce(v_est->>'mode','manual_review');
    v_amount:=case when v_est->>'refund_amount' is null then null else (v_est->>'refund_amount')::numeric end;
    v_pct:=case when v_est->>'refund_percent' is null then null else (v_est->>'refund_percent')::numeric end;

    if v_mode='manual_review' then
      v_item_status:='pending_review';
      v_manual:=v_manual+1;
    else
      v_auto:=v_auto+1;
      v_amount:=coalesce(v_amount,0);
      v_item_status:=case when v_amount>0 then 'refund_pending'::public.cancellation_item_status else 'approved'::public.cancellation_item_status end;
      if v_amount>0 then
        v_refund_count:=v_refund_count+1;
        v_refund_total:=v_refund_total+v_amount;
      end if;
    end if;

    insert into public.cancellation_request_items(
      cancellation_request_id,order_item_id,partner_id,status,line_total_snapshot,currency,
      policy_snapshot,calculation_mode,estimated_refund_percent,estimated_refund_amount,
      approved_refund_amount,reviewed_at
    ) values(
      v_request,v_item.id,v_item.partner_id,v_item_status,v_item.line_total,v_order.currency,
      v_item.refund_policy_snapshot,v_mode,v_pct,v_amount,
      case when v_mode='automatic' then coalesce(v_amount,0) else null end,
      case when v_mode='automatic' then now() else null end
    );

    if v_mode='automatic' then
      update public.order_items
      set is_cancelled=true,
          cancelled_at=now(),
          approved_refund_amount=coalesce(v_amount,0),
          refund_status=case when coalesce(v_amount,0)>0 then 'pending' else 'none' end
      where id=v_item.id;

      update public.booking_reservations
      set status='cancelled',updated_at=now()
      where order_item_id=v_item.id and status in ('hold','confirmed');

      perform private.create_notification(
        v_uid,
        case when coalesce(v_amount,0)>0 then 'refund_pending' else 'cancellation_approved' end,
        'تم إلغاء العنصر تلقائيًا',
        case when coalesce(v_amount,0)>0
          then 'تم إلغاء "'||v_item.item_name||'" من الطلب #DD'||v_order.order_number||' وفق السياسة المطبقة. المبلغ المستحق للاسترداد: '||to_char(v_amount,'FM999999990.00')||' '||v_order.currency||'، والاسترداد قيد التنفيذ.'
          else 'تم إلغاء "'||v_item.item_name||'" من الطلب #DD'||v_order.order_number||' وفق السياسة المطبقة، ولا يوجد مبلغ مستحق للاسترداد.'
        end,
        'Item cancelled automatically',
        case when coalesce(v_amount,0)>0
          then 'The item "'||v_item.item_name||'" was cancelled under the applicable policy. Refund due: '||v_amount||' '||v_order.currency||'. Refund is pending.'
          else 'The item "'||v_item.item_name||'" was cancelled under the applicable policy with no refund due.'
        end,
        'cancellation_request',v_request,
        jsonb_build_object('order_id',v_order.id,'order_number',v_order.order_number,'order_item_id',v_item.id,'refund_amount',coalesce(v_amount,0),'automatic',true)
      );

      perform private.notify_partner(
        v_item.partner_id,
        case when coalesce(v_amount,0)>0 then 'partner_refund_pending' else 'partner_cancellation_approved' end,
        'تم تأكيد إلغاء عنصر',
        case when coalesce(v_amount,0)>0
          then 'تم إلغاء "'||v_item.item_name||'" من الطلب #DD'||v_order.order_number||' تلقائيًا وفق السياسة. أوقف التنفيذ. قيمة الاسترداد المستحقة للعميل: '||to_char(v_amount,'FM999999990.00')||' '||v_order.currency||'.'
          else 'تم إلغاء "'||v_item.item_name||'" من الطلب #DD'||v_order.order_number||' تلقائيًا وفق السياسة. أوقف التنفيذ.'
        end,
        'Item cancellation confirmed',
        'The item "'||v_item.item_name||'" in order #DD'||v_order.order_number||' was cancelled automatically under the applicable policy. Stop fulfilment.',
        'cancellation_request',v_request,
        jsonb_build_object('order_id',v_order.id,'order_number',v_order.order_number,'order_item_id',v_item.id,'refund_amount',coalesce(v_amount,0),'automatic',true)
      );
    end if;
  end loop;

  for v_partner in
    select distinct ci.partner_id
    from public.cancellation_request_items ci
    where ci.cancellation_request_id=v_request and ci.status in ('approved','refund_pending')
  loop
    if not exists(
      select 1 from public.order_items oi
      where oi.order_id=v_order.id and oi.partner_id=v_partner.partner_id and oi.is_cancelled=false
    ) then
      update public.partner_orders
      set status='cancelled',updated_at=now()
      where order_id=v_order.id and partner_id=v_partner.partner_id and status<>'completed';
    end if;
  end loop;

  if not exists(select 1 from public.order_items oi where oi.order_id=v_order.id and oi.is_cancelled=false) then
    update public.orders
    set status='cancelled',updated_at=now()
    where id=v_order.id and status not in ('completed','refunded');
  end if;

  if v_manual>0 then
    perform private.create_notification(
      v_uid,'cancellation_manual_review','بعض عناصر الإلغاء تحتاج مراجعة',
      'تم تنفيذ العناصر التي تغطيها السياسة تلقائيًا، ويوجد '||v_manual||' عنصر/عناصر تحتاج مراجعة Dear Day قبل اتخاذ القرار.',
      'Some cancellation items need review',
      'Items covered by a clear policy were processed automatically. Some items require Dear Day review.',
      'cancellation_request',v_request,
      jsonb_build_object('order_id',v_order.id,'order_number',v_order.order_number,'manual_review_items',v_manual)
    );

    perform private.notify_admins(
      'cancellation_exception_review','حالة إلغاء تحتاج مراجعة',
      'الطلب #DD'||v_order.order_number||' يحتوي على '||v_manual||' عنصر/عناصر لا يمكن حسمها تلقائيًا وتحتاج قرارًا يدويًا.',
      'Cancellation exception requires review',
      'Order #DD'||v_order.order_number||' has cancellation items that require manual review.',
      'cancellation_request',v_request,
      jsonb_build_object('order_id',v_order.id,'order_number',v_order.order_number,'manual_review_items',v_manual)
    );

    for v_partner in
      select ci.partner_id,count(*) c
      from public.cancellation_request_items ci
      where ci.cancellation_request_id=v_request and ci.status='pending_review'
      group by ci.partner_id
    loop
      perform private.notify_partner(
        v_partner.partner_id,'partner_cancellation_pending','طلب إلغاء قيد المراجعة',
        'يوجد طلب إلغاء قيد المراجعة للطلب #DD'||v_order.order_number||' ويشمل '||v_partner.c||' عنصر/عناصر تخصك. لا توقف التنفيذ حتى يصدر قرار Dear Day.',
        'Cancellation under review',
        'A cancellation exception is under review for order #DD'||v_order.order_number||'. Continue fulfilment until Dear Day confirms the decision.',
        'cancellation_request',v_request,
        jsonb_build_object('order_id',v_order.id,'order_number',v_order.order_number,'manual_review_items',v_partner.c)
      );
    end loop;
  end if;

  if v_refund_count>0 then
    perform private.notify_admins(
      'refund_action_required','استرداد مالي مطلوب',
      'يوجد استرداد مالي مطلوب للطلب #DD'||v_order.order_number||' بإجمالي '||to_char(v_refund_total,'FM999999990.00')||' '||v_order.currency||'. الإلغاء تم بالفعل؛ المطلوب فقط تنفيذ/تأكيد عودة المبلغ.',
      'Refund action required',
      'A refund is due for order #DD'||v_order.order_number||'. Cancellation is already complete; only the refund needs to be processed and confirmed.',
      'cancellation_request',v_request,
      jsonb_build_object('order_id',v_order.id,'order_number',v_order.order_number,'refund_item_count',v_refund_count,'refund_total',v_refund_total,'currency',v_order.currency)
    );
  end if;

  v_req_status:=private.recompute_cancellation_request_status(v_request);

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,after_data)
  values(
    v_uid,'cancellation_requested','cancellation_request',v_request::text,
    jsonb_build_object(
      'order_id',p_order_id,'item_count',v_count,'automatic_items',v_auto,
      'manual_review_items',v_manual,'refund_pending_items',v_refund_count,
      'refund_pending_total',v_refund_total,'request_status',v_req_status
    )
  );

  return jsonb_build_object(
    'request_id',v_request,'status',v_req_status,'item_count',v_count,
    'automatic_items',v_auto,'manual_review_items',v_manual,
    'refund_pending_items',v_refund_count,'refund_pending_total',v_refund_total,
    'currency',v_order.currency
  );
end $function$;

CREATE OR REPLACE FUNCTION private.preview_order_cancellation_impl(p_order_id uuid, p_order_item_ids uuid[] DEFAULT NULL::uuid[])
 RETURNS TABLE(order_item_id uuid, item_name text, partner_id uuid, line_total numeric, currency text, policy_title text, calculation_mode text, estimated_refund_percent numeric, estimated_refund_amount numeric, is_cancelled boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare
  v_uid uuid:=auth.uid();
  v_order public.orders%rowtype;
begin
  perform private.require_active_actor();
  if v_uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select * into v_order from public.orders where id=p_order_id and customer_id=v_uid;
  if not found then raise exception 'Order not found' using errcode='42501'; end if;
  if v_order.status not in ('paid','confirmed','in_progress') then raise exception 'This order cannot be cancelled in its current status'; end if;

  return query
  select oi.id,
         oi.item_name,
         oi.partner_id,
         oi.line_total,
         v_order.currency,
         coalesce(oi.refund_policy_snapshot->>'title','Dear Day policy'),
         case when po.status='completed' then 'manual_review' else est->>'mode' end,
         case when po.status='completed' or est->>'refund_percent' is null then null else (est->>'refund_percent')::numeric end,
         case when po.status='completed' or est->>'refund_amount' is null then null else (est->>'refund_amount')::numeric end,
         oi.is_cancelled
  from public.order_items oi
  left join public.partner_orders po on po.order_id=v_order.id and po.partner_id=oi.partner_id
  cross join lateral private.calculate_refund_estimate(oi.refund_policy_snapshot,oi.line_total,v_order.occasion_date,v_order.occasion_time) est
  where oi.order_id=v_order.id
    and oi.is_cancelled=false
    and (p_order_item_ids is null or cardinality(p_order_item_ids)=0 or oi.id=any(p_order_item_ids));
end $function$;

CREATE OR REPLACE FUNCTION private.mark_notification_read_impl(p_notification_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare v_uid uuid:=auth.uid();v_changed int;
begin
  perform private.require_active_actor();
 if v_uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
 update public.notifications set is_read=true,read_at=coalesce(read_at,now()) where id=p_notification_id and recipient_user_id=v_uid;
 get diagnostics v_changed=row_count;return v_changed>0;
end $function$;

CREATE OR REPLACE FUNCTION private.mark_all_notifications_read_impl()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare v_uid uuid:=auth.uid();v_changed int;
begin
  perform private.require_active_actor();
 if v_uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
 update public.notifications set is_read=true,read_at=coalesce(read_at,now()) where recipient_user_id=v_uid and is_read=false;
 get diagnostics v_changed=row_count;return v_changed;
end $function$;

CREATE OR REPLACE FUNCTION private.save_listing_availability_config_impl(p_listing_id uuid, p_settings jsonb, p_windows jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare
  v_before jsonb;
  v_window jsonb;
  v_mode public.booking_mode;
begin
  perform private.require_active_actor();
  if auth.uid() is null or not private.can_manage_listing_availability(p_listing_id) then
    raise exception 'Permission denied';
  end if;

  if not exists(select 1 from public.listings where id=p_listing_id) then
    raise exception 'Listing not found';
  end if;

  begin
    v_mode := coalesce(nullif(p_settings->>'booking_mode',''),'date')::public.booking_mode;
  exception when others then
    raise exception 'Invalid booking mode';
  end;

  select jsonb_build_object(
    'settings',to_jsonb(s),
    'windows',coalesce((select jsonb_agg(to_jsonb(w) order by w.weekday,w.start_time) from public.listing_availability_windows w where w.listing_id=p_listing_id),'[]'::jsonb)
  ) into v_before
  from public.listing_availability_settings s
  where s.listing_id=p_listing_id;

  insert into public.listing_availability_settings(
    listing_id,booking_enabled,booking_mode,timezone,slot_minutes,daily_capacity,slot_capacity,cutoff_hours,hold_minutes,updated_by
  ) values(
    p_listing_id,
    coalesce((p_settings->>'booking_enabled')::boolean,false),
    v_mode,
    coalesce(nullif(p_settings->>'timezone',''),'Africa/Cairo'),
    greatest(15,least(1440,coalesce((p_settings->>'slot_minutes')::integer,60))),
    nullif(p_settings->>'daily_capacity','')::integer,
    nullif(p_settings->>'slot_capacity','')::integer,
    greatest(0,least(8760,coalesce((p_settings->>'cutoff_hours')::integer,0))),
    greatest(5,least(60,coalesce((p_settings->>'hold_minutes')::integer,15))),
    auth.uid()
  )
  on conflict(listing_id) do update set
    booking_enabled=excluded.booking_enabled,
    booking_mode=excluded.booking_mode,
    timezone=excluded.timezone,
    slot_minutes=excluded.slot_minutes,
    daily_capacity=excluded.daily_capacity,
    slot_capacity=excluded.slot_capacity,
    cutoff_hours=excluded.cutoff_hours,
    hold_minutes=excluded.hold_minutes,
    updated_by=auth.uid(),
    updated_at=now();

  delete from public.listing_availability_windows where listing_id=p_listing_id;

  for v_window in select value from jsonb_array_elements(coalesce(p_windows,'[]'::jsonb))
  loop
    if coalesce((v_window->>'is_active')::boolean,true) then
      insert into public.listing_availability_windows(
        listing_id,weekday,start_time,end_time,is_active,capacity_override
      ) values(
        p_listing_id,
        (v_window->>'weekday')::smallint,
        (v_window->>'start_time')::time,
        (v_window->>'end_time')::time,
        true,
        nullif(v_window->>'capacity_override','')::integer
      );
    end if;
  end loop;

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,before_data,after_data)
  values(
    auth.uid(),'availability.config_changed','listing',p_listing_id::text,v_before,
    jsonb_build_object(
      'settings',(select to_jsonb(s) from public.listing_availability_settings s where s.listing_id=p_listing_id),
      'windows',coalesce((select jsonb_agg(to_jsonb(w) order by w.weekday,w.start_time) from public.listing_availability_windows w where w.listing_id=p_listing_id),'[]'::jsonb)
    )
  );
  return true;
end $function$;

CREATE OR REPLACE FUNCTION private.upsert_listing_availability_exception_impl(p_listing_id uuid, p_exception_id uuid, p_date date, p_is_closed boolean, p_start_time time without time zone, p_end_time time without time zone, p_capacity_override integer, p_note text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare v_id uuid; v_before jsonb;
begin
  perform private.require_active_actor();
  if auth.uid() is null or not private.can_manage_listing_availability(p_listing_id) then raise exception 'Permission denied'; end if;
  if p_date is null then raise exception 'Date is required'; end if;
  if not p_is_closed and (p_start_time is null or p_end_time is null or p_end_time<=p_start_time) then raise exception 'A valid custom opening window is required'; end if;
  if p_capacity_override is not null and p_capacity_override<1 then raise exception 'Capacity must be positive'; end if;

  if p_exception_id is not null then
    select to_jsonb(e) into v_before from public.listing_availability_exceptions e where e.id=p_exception_id and e.listing_id=p_listing_id;
    if v_before is null then raise exception 'Exception not found'; end if;
    update public.listing_availability_exceptions set
      exception_date=p_date,is_closed=p_is_closed,start_time=case when p_is_closed then null else p_start_time end,
      end_time=case when p_is_closed then null else p_end_time end,capacity_override=p_capacity_override,note=nullif(trim(p_note),'')
    where id=p_exception_id returning id into v_id;
  else
    insert into public.listing_availability_exceptions(listing_id,exception_date,is_closed,start_time,end_time,capacity_override,note)
    values(p_listing_id,p_date,p_is_closed,case when p_is_closed then null else p_start_time end,case when p_is_closed then null else p_end_time end,p_capacity_override,nullif(trim(p_note),''))
    on conflict(listing_id,exception_date) do update set
      is_closed=excluded.is_closed,start_time=excluded.start_time,end_time=excluded.end_time,capacity_override=excluded.capacity_override,note=excluded.note,updated_at=now()
    returning id into v_id;
  end if;

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,before_data,after_data)
  values(auth.uid(),'availability.exception_saved','listing',p_listing_id::text,v_before,(select to_jsonb(e) from public.listing_availability_exceptions e where e.id=v_id));
  return v_id;
end $function$;

CREATE OR REPLACE FUNCTION private.delete_listing_availability_exception_impl(p_exception_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare v_row public.listing_availability_exceptions%rowtype; v_count integer;
begin
  perform private.require_active_actor();
  select * into v_row from public.listing_availability_exceptions where id=p_exception_id;
  if not found then return false; end if;
  if auth.uid() is null or not private.can_manage_listing_availability(v_row.listing_id) then raise exception 'Permission denied'; end if;
  delete from public.listing_availability_exceptions where id=p_exception_id;
  get diagnostics v_count=row_count;
  if v_count>0 then
    insert into public.audit_logs(actor_id,action,entity_type,entity_id,before_data)
    values(auth.uid(),'availability.exception_deleted','listing',v_row.listing_id::text,to_jsonb(v_row));
  end if;
  return v_count>0;
end $function$;

CREATE OR REPLACE FUNCTION public.request_account_deletion()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  r record;
begin
  perform private.require_active_actor();
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.profiles
    where id=v_uid and is_active=true and role='customer'::public.app_role
  ) then
    raise exception 'Only active customer accounts can request deletion';
  end if;

  select id into v_id
  from public.account_deletion_requests
  where customer_id=v_uid and status='pending'
  order by requested_at desc
  limit 1;

  if v_id is not null then
    return v_id;
  end if;

  insert into public.account_deletion_requests(customer_id)
  values(v_uid)
  returning id into v_id;

  for r in
    select id from public.profiles
    where is_active=true and role='super_admin'::public.app_role
  loop
    perform private.create_notification(
      r.id,
      'account_deletion_requested',
      'طلب حذف حساب جديد',
      'قدّم عميل طلبًا لحذف حسابه وبياناته. راجع الطلب من صفحة العملاء.',
      'New account deletion request',
      'A customer requested permanent account and data deletion. Review it from Customers.',
      'account_deletion_request',
      v_id,
      jsonb_build_object('request_id',v_id)
    );
  end loop;

  return v_id;
end;
$function$;

CREATE OR REPLACE FUNCTION private.can_manage_listing_availability(p_listing_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
  select exists(
    select 1 from public.listings l
    where l.id=p_listing_id and (
      private.has_permission('availability.manage') or
      exists(select 1 from public.partner_users pu where pu.partner_id=l.partner_id and pu.user_id=auth.uid() and pu.is_active=true and private.is_active_partner_member(pu.partner_id))
    )
  );
$function$;

CREATE OR REPLACE FUNCTION private.review_listing_version_impl(p_version_id uuid, p_decision text, p_note text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_version public.listing_versions%rowtype;
  v_listing public.listings%rowtype;
  v_old_version_id uuid;
  v_now timestamptz := now();
  v_proposed jsonb := '{}'::jsonb;
begin
  if v_uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select p.role::text into v_role from public.profiles p where p.id=v_uid and p.is_active=true;
  if not private.has_permission('approvals.review') then raise exception 'Not allowed to review catalog changes' using errcode='42501'; end if;
  if p_decision not in ('approve','reject') then raise exception 'Decision must be approve or reject' using errcode='22023'; end if;

  select * into v_version from public.listing_versions where id=p_version_id for update;
  if not found then raise exception 'Listing version not found' using errcode='P0002'; end if;
  if v_version.status::text <> 'pending_review' then raise exception 'Only pending_review versions can be reviewed' using errcode='22023'; end if;

  select * into v_listing from public.listings where id=v_version.listing_id for update;
  if not found then raise exception 'Listing not found' using errcode='P0002'; end if;
  if jsonb_typeof(v_version.metadata->'proposed')='object' then v_proposed:=v_version.metadata->'proposed'; end if;

  if p_decision='approve' then
    v_old_version_id:=v_listing.published_version_id;
    if v_old_version_id is not null and v_old_version_id<>v_version.id then
      update public.listing_versions set status='archived' where id=v_old_version_id and status='published';
    end if;

    update public.listing_versions
      set status='published',reviewed_by=v_uid,reviewed_at=v_now,review_note=nullif(btrim(coalesce(p_note,'')),'')
      where id=v_version.id;

    update public.listings
    set published_version_id=v_version.id,
        partner_id=case when v_proposed ? 'partner_id' and nullif(v_proposed->>'partner_id','') is not null then (v_proposed->>'partner_id')::uuid else partner_id end,
        category_id=case when v_proposed ? 'category_id' then nullif(v_proposed->>'category_id','')::uuid else category_id end,
        kind=case when v_proposed ? 'kind' and nullif(v_proposed->>'kind','') is not null then (v_proposed->>'kind')::public.listing_kind else kind end,
        is_available=case when v_proposed ? 'is_available' then coalesce((v_proposed->>'is_available')::boolean,is_available) else is_available end,
        stock_qty=case when v_proposed ? 'stock_qty' then nullif(v_proposed->>'stock_qty','')::integer else stock_qty end,
        capacity_per_day=case when v_proposed ? 'capacity_per_day' then nullif(v_proposed->>'capacity_per_day','')::integer else capacity_per_day end
    where id=v_listing.id;

    insert into public.audit_logs(actor_id,action,entity_type,entity_id,before_data,after_data)
    values(v_uid,'listing_version.approved','listing_version',v_version.id::text,
      jsonb_build_object('status',v_version.status,'published_version_id',v_old_version_id,'listing',to_jsonb(v_listing)),
      jsonb_build_object('status','published','published_version_id',v_version.id,'proposed',v_proposed,'review_note',nullif(btrim(coalesce(p_note,'')),'')));

    return jsonb_build_object('decision','approved','listing_id',v_listing.id,'version_id',v_version.id,'published_version_id',v_version.id,'previous_published_version_id',v_old_version_id);
  end if;

  update public.listing_versions set status='rejected',reviewed_by=v_uid,reviewed_at=v_now,review_note=nullif(btrim(coalesce(p_note,'')),'') where id=v_version.id;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,before_data,after_data)
  values(v_uid,'listing_version.rejected','listing_version',v_version.id::text,jsonb_build_object('status',v_version.status),jsonb_build_object('status','rejected','review_note',nullif(btrim(coalesce(p_note,'')),'')));
  return jsonb_build_object('decision','rejected','listing_id',v_listing.id,'version_id',v_version.id,'published_version_id',v_listing.published_version_id);
end;
$function$;

revoke all on function private.review_listing_version_impl(uuid,text,text) from public, anon;
grant execute on function private.review_listing_version_impl(uuid,text,text) to authenticated;
create or replace function public.review_listing_version(p_version_id uuid,p_decision text,p_note text default null)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.review_listing_version_impl(p_version_id,p_decision,p_note);
$$;
revoke all on function public.review_listing_version(uuid,text,text) from public, anon;
grant execute on function public.review_listing_version(uuid,text,text) to authenticated;
-- These endpoints require a signed-in user; internal checks remain in place.
revoke all on function public.request_account_deletion(),public.my_account_deletion_request(),
  public.admin_account_deletion_list(),public.admin_review_account_deletion(uuid,text,text) from public, anon;
grant execute on function public.request_account_deletion(),public.my_account_deletion_request(),
  public.admin_account_deletion_list(),public.admin_review_account_deletion(uuid,text,text) to authenticated;
create policy refund_policies_reviewer_read on public.refund_policies for select to authenticated
using (private.has_permission('approvals.review'));
commit;
