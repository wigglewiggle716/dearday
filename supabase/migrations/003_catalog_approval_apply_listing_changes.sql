create or replace function public.review_listing_version(
  p_version_id uuid,
  p_decision text,
  p_note text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
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
  if v_role is null or v_role not in ('super_admin','admin','partner_manager') then raise exception 'Not allowed to review catalog changes' using errcode='42501'; end if;
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
$$;

revoke execute on function public.review_listing_version(uuid,text,text) from public;
revoke execute on function public.review_listing_version(uuid,text,text) from anon;
grant execute on function public.review_listing_version(uuid,text,text) to authenticated;
