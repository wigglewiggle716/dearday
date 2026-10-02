-- Dear Day structured refund policy framework
-- Priority: listing override -> partner default -> platform default.
-- Order items capture an immutable policy snapshot at creation time.

do $$ begin
  if not exists (select 1 from pg_type where typname='refund_policy_scope' and typnamespace='public'::regnamespace) then
    create type public.refund_policy_scope as enum ('platform','partner','listing');
  end if;
  if not exists (select 1 from pg_type where typname='refund_policy_status' and typnamespace='public'::regnamespace) then
    create type public.refund_policy_status as enum ('draft','pending_review','approved','rejected','archived');
  end if;
end $$;

create table if not exists public.refund_policies (
  id uuid primary key default gen_random_uuid(),
  scope public.refund_policy_scope not null,
  partner_id uuid references public.partners(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  title text not null,
  rules jsonb not null default '{}'::jsonb,
  note_ar text,
  note_en text,
  status public.refund_policy_status not null default 'draft',
  previous_policy_id uuid references public.refund_policies(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  submitted_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  review_note text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  effective_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint refund_policy_rules_object check (jsonb_typeof(rules)='object'),
  constraint refund_policy_target_ck check (
    (scope='platform' and partner_id is null and listing_id is null) or
    (scope='partner' and partner_id is not null and listing_id is null) or
    (scope='listing' and listing_id is not null)
  )
);

create index if not exists refund_policies_partner_idx on public.refund_policies(partner_id);
create index if not exists refund_policies_listing_idx on public.refund_policies(listing_id);
create index if not exists refund_policies_status_idx on public.refund_policies(status);
create unique index if not exists refund_policies_one_platform_active on public.refund_policies ((1)) where scope='platform' and status='approved';
create unique index if not exists refund_policies_one_partner_active on public.refund_policies(partner_id) where scope='partner' and status='approved';
create unique index if not exists refund_policies_one_listing_active on public.refund_policies(listing_id) where scope='listing' and status='approved';

alter table public.refund_policies enable row level security;
revoke all on public.refund_policies from anon;
revoke insert,update,delete on public.refund_policies from authenticated;
grant select on public.refund_policies to authenticated;
grant all on public.refund_policies to service_role;

drop policy if exists refund_policies_read_scoped on public.refund_policies;
create policy refund_policies_read_scoped on public.refund_policies for select to authenticated using (
  status='approved'
  or private.has_permission('catalog.manage')
  or exists (
    select 1 from public.partner_users pu
    where pu.user_id=(select auth.uid()) and pu.is_active=true and (
      pu.partner_id=refund_policies.partner_id
      or exists (select 1 from public.listings l where l.id=refund_policies.listing_id and l.partner_id=pu.partner_id)
    )
  )
);

create or replace function private.validate_refund_policy_rules(p_rules jsonb)
returns void language plpgsql security invoker set search_path='pg_catalog','public','private' as $$
declare v_mode text; v_tier jsonb; v_count integer; v_min integer; v_pct numeric; v_name text;
begin
  if p_rules is null or jsonb_typeof(p_rules)<>'object' then raise exception 'Refund policy rules must be a JSON object'; end if;
  v_mode:=coalesce(p_rules->>'mode','manual_review');
  if v_mode not in ('manual_review','tiered') then raise exception 'Unsupported refund policy mode'; end if;
  foreach v_name in array array['partner_cancellation_refund_percent','no_show_refund_percent','deposit_non_refundable_percent'] loop
    if p_rules ? v_name then
      begin v_pct:=(p_rules->>v_name)::numeric; exception when others then raise exception 'Invalid percentage for %',v_name; end;
      if v_pct<0 or v_pct>100 then raise exception 'Percentage % must be between 0 and 100',v_name; end if;
    end if;
  end loop;
  if v_mode='tiered' then
    if jsonb_typeof(p_rules->'tiers')<>'array' then raise exception 'Tiered policy requires tiers array'; end if;
    v_count:=jsonb_array_length(p_rules->'tiers');
    if v_count<1 or v_count>6 then raise exception 'Tiered policy must have between 1 and 6 tiers'; end if;
    if not exists (select 1 from jsonb_array_elements(p_rules->'tiers') x where coalesce(x->>'min_hours_before','') ~ '^\d+$' and (x->>'min_hours_before')::int=0) then raise exception 'Tiered policy must include a 0-hour tier'; end if;
    for v_tier in select * from jsonb_array_elements(p_rules->'tiers') loop
      begin v_min:=(v_tier->>'min_hours_before')::integer; exception when others then raise exception 'Invalid min_hours_before'; end;
      begin v_pct:=(v_tier->>'refund_percent')::numeric; exception when others then raise exception 'Invalid refund_percent'; end;
      if v_min<0 then raise exception 'min_hours_before cannot be negative'; end if;
      if v_pct<0 or v_pct>100 then raise exception 'refund_percent must be between 0 and 100'; end if;
    end loop;
    if exists (select 1 from (select (x->>'min_hours_before')::int h,count(*) c from jsonb_array_elements(p_rules->'tiers') x group by 1 having count(*)>1) d) then raise exception 'Duplicate min_hours_before tiers are not allowed'; end if;
  end if;
end $$;

create or replace function private.resolve_refund_policy(p_listing_id uuid, p_partner_id uuid default null)
returns jsonb language plpgsql security definer set search_path='pg_catalog','public','private' as $$
declare v_partner uuid:=p_partner_id; v_policy public.refund_policies%rowtype;
begin
  if p_listing_id is not null then
    select l.partner_id into v_partner from public.listings l where l.id=p_listing_id;
    select * into v_policy from public.refund_policies rp where rp.scope='listing' and rp.listing_id=p_listing_id and rp.status='approved' order by rp.effective_at desc nulls last,rp.created_at desc limit 1;
  end if;
  if v_policy.id is null and v_partner is not null then
    select * into v_policy from public.refund_policies rp where rp.scope='partner' and rp.partner_id=v_partner and rp.status='approved' order by rp.effective_at desc nulls last,rp.created_at desc limit 1;
  end if;
  if v_policy.id is null then
    select * into v_policy from public.refund_policies rp where rp.scope='platform' and rp.status='approved' order by rp.effective_at desc nulls last,rp.created_at desc limit 1;
  end if;
  if v_policy.id is null then return null; end if;
  return jsonb_build_object('policy_id',v_policy.id,'scope',v_policy.scope,'partner_id',v_policy.partner_id,'listing_id',v_policy.listing_id,'title',v_policy.title,'rules',v_policy.rules,'note_ar',v_policy.note_ar,'note_en',v_policy.note_en,'effective_at',v_policy.effective_at,'captured_at',now());
end $$;

create or replace function public.get_effective_refund_policy(p_listing_id uuid)
returns jsonb language sql security invoker set search_path='pg_catalog','public','private' as $$ select private.resolve_refund_policy(p_listing_id,null); $$;
revoke all on function public.get_effective_refund_policy(uuid) from public;
grant execute on function public.get_effective_refund_policy(uuid) to anon,authenticated,service_role;
grant usage on schema private to anon,authenticated;
grant execute on function private.resolve_refund_policy(uuid,uuid) to anon,authenticated;

create or replace function private.submit_refund_policy_impl(p_scope text,p_partner_id uuid,p_listing_id uuid,p_title text,p_rules jsonb,p_note_ar text default null,p_note_en text default null,p_submit boolean default true)
returns jsonb language plpgsql security definer set search_path='pg_catalog','public','private' as $$
declare v_uid uuid:=(select auth.uid()); v_scope public.refund_policy_scope; v_partner uuid:=p_partner_id; v_status public.refund_policy_status; v_prev uuid; v_id uuid; v_is_admin boolean;
begin
  if v_uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
  begin v_scope:=p_scope::public.refund_policy_scope; exception when others then raise exception 'Invalid refund policy scope'; end;
  perform private.validate_refund_policy_rules(p_rules);
  if nullif(trim(p_title),'') is null then raise exception 'Policy title is required'; end if;
  v_is_admin:=private.has_permission('catalog.manage');
  if v_scope='listing' then select l.partner_id into v_partner from public.listings l where l.id=p_listing_id; if v_partner is null then raise exception 'Listing not found'; end if; end if;
  if not v_is_admin then
    if v_scope='platform' then raise exception 'Only Dear Day can manage platform policy' using errcode='42501'; end if;
    if not exists(select 1 from public.profiles p where p.id=v_uid and p.is_active=true and p.role='partner_user') then raise exception 'Partner access required' using errcode='42501'; end if;
    if v_partner is null or not exists(select 1 from public.partner_users pu join public.partners pa on pa.id=pu.partner_id where pu.user_id=v_uid and pu.partner_id=v_partner and pu.is_active=true and pa.status='active') then raise exception 'Partner membership is not active' using errcode='42501'; end if;
  end if;
  if v_scope='partner' and v_partner is null then raise exception 'Partner is required'; end if;
  if v_scope='listing' and p_listing_id is null then raise exception 'Listing is required'; end if;
  select rp.id into v_prev from public.refund_policies rp where rp.status='approved' and ((v_scope='platform' and rp.scope='platform') or (v_scope='partner' and rp.scope='partner' and rp.partner_id=v_partner) or (v_scope='listing' and rp.scope='listing' and rp.listing_id=p_listing_id)) order by rp.effective_at desc nulls last,rp.created_at desc limit 1;
  v_status:=case when p_submit then 'pending_review'::public.refund_policy_status else 'draft'::public.refund_policy_status end;
  insert into public.refund_policies(scope,partner_id,listing_id,title,rules,note_ar,note_en,status,previous_policy_id,created_by,submitted_by,submitted_at)
  values(v_scope,case when v_scope in ('partner','listing') then v_partner else null end,case when v_scope='listing' then p_listing_id else null end,trim(p_title),p_rules,nullif(trim(p_note_ar),''),nullif(trim(p_note_en),''),v_status,v_prev,v_uid,case when p_submit then v_uid else null end,case when p_submit then now() else null end) returning id into v_id;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,after_data) values(v_uid,case when p_submit then 'refund_policy_submitted' else 'refund_policy_draft_created' end,'refund_policy',v_id::text,jsonb_build_object('scope',v_scope,'partner_id',v_partner,'listing_id',p_listing_id,'status',v_status));
  return jsonb_build_object('policy_id',v_id,'status',v_status);
end $$;

create or replace function public.submit_refund_policy(p_scope text,p_partner_id uuid,p_listing_id uuid,p_title text,p_rules jsonb,p_note_ar text default null,p_note_en text default null,p_submit boolean default true)
returns jsonb language sql security invoker set search_path='pg_catalog','public','private' as $$ select private.submit_refund_policy_impl(p_scope,p_partner_id,p_listing_id,p_title,p_rules,p_note_ar,p_note_en,p_submit); $$;
revoke all on function public.submit_refund_policy(text,uuid,uuid,text,jsonb,text,text,boolean) from public;
grant execute on function public.submit_refund_policy(text,uuid,uuid,text,jsonb,text,text,boolean) to authenticated,service_role;
grant execute on function private.submit_refund_policy_impl(text,uuid,uuid,text,jsonb,text,text,boolean) to authenticated;

create or replace function private.review_refund_policy_impl(p_policy_id uuid,p_decision text,p_note text default null)
returns jsonb language plpgsql security definer set search_path='pg_catalog','public','private' as $$
declare v_uid uuid:=(select auth.uid()); v public.refund_policies%rowtype; v_decision text:=lower(trim(p_decision));
begin
  if v_uid is null or not private.has_permission('catalog.manage') then raise exception 'Permission denied' using errcode='42501'; end if;
  select * into v from public.refund_policies where id=p_policy_id for update;
  if v.id is null then raise exception 'Refund policy not found'; end if;
  if v.status<>'pending_review' then raise exception 'Only pending refund policies can be reviewed'; end if;
  if v_decision='approved' then
    update public.refund_policies rp set status='archived',updated_at=now() where rp.id<>v.id and rp.status='approved' and ((v.scope='platform' and rp.scope='platform') or (v.scope='partner' and rp.scope='partner' and rp.partner_id=v.partner_id) or (v.scope='listing' and rp.scope='listing' and rp.listing_id=v.listing_id));
    update public.refund_policies set status='approved',reviewed_by=v_uid,reviewed_at=now(),review_note=nullif(trim(p_note),''),effective_at=now(),updated_at=now() where id=v.id;
  elsif v_decision='rejected' then
    if nullif(trim(p_note),'') is null then raise exception 'Rejection note is required'; end if;
    update public.refund_policies set status='rejected',reviewed_by=v_uid,reviewed_at=now(),review_note=trim(p_note),updated_at=now() where id=v.id;
  else raise exception 'Decision must be approved or rejected'; end if;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,after_data) values(v_uid,case when v_decision='approved' then 'refund_policy_approved' else 'refund_policy_rejected' end,'refund_policy',v.id::text,jsonb_build_object('decision',v_decision,'scope',v.scope,'partner_id',v.partner_id,'listing_id',v.listing_id,'note',nullif(trim(p_note),'')));
  return jsonb_build_object('policy_id',v.id,'status',case when v_decision='approved' then 'approved' else 'rejected' end);
end $$;

create or replace function public.review_refund_policy(p_policy_id uuid,p_decision text,p_note text default null)
returns jsonb language sql security invoker set search_path='pg_catalog','public','private' as $$ select private.review_refund_policy_impl(p_policy_id,p_decision,p_note); $$;
revoke all on function public.review_refund_policy(uuid,text,text) from public;
grant execute on function public.review_refund_policy(uuid,text,text) to authenticated,service_role;
grant execute on function private.review_refund_policy_impl(uuid,text,text) to authenticated;

alter table public.order_items add column if not exists refund_policy_id uuid references public.refund_policies(id) on delete set null;
alter table public.order_items add column if not exists refund_policy_snapshot jsonb not null default '{}'::jsonb;
create index if not exists order_items_refund_policy_idx on public.order_items(refund_policy_id);

create or replace function private.capture_order_item_refund_policy()
returns trigger language plpgsql security definer set search_path='pg_catalog','public','private' as $$
declare v_snapshot jsonb;
begin
  v_snapshot:=private.resolve_refund_policy(new.listing_id,new.partner_id);
  if v_snapshot is not null then new.refund_policy_id:=(v_snapshot->>'policy_id')::uuid; new.refund_policy_snapshot:=v_snapshot; end if;
  return new;
end $$;

drop trigger if exists order_items_capture_refund_policy on public.order_items;
create trigger order_items_capture_refund_policy before insert on public.order_items for each row execute function private.capture_order_item_refund_policy();

insert into public.refund_policies(scope,title,rules,note_ar,note_en,status,effective_at)
select 'platform','Dear Day — Manual Review Default',jsonb_build_object('mode','manual_review','cancellation_allowed',true,'tiers','[]'::jsonb,'partner_cancellation_refund_percent',100,'no_show_refund_percent',0,'deposit_non_refundable_percent',0),'إذا لم توجد سياسة معتمدة خاصة بالشريك أو المنتج، تتم مراجعة طلب الإلغاء يدويًا وتحديد المبلغ المستحق وفق حالة الطلب وطبيعته والحقوق القانونية المقررة.','If no approved partner or listing-specific policy applies, the cancellation request is reviewed manually based on the order status, nature of the item, and applicable legal rights.','approved',now()
where not exists(select 1 from public.refund_policies where scope='platform' and status='approved');