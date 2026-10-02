alter table public.cancellation_request_items
  add column if not exists refund_reference text,
  add column if not exists refund_note text,
  add column if not exists refunded_by uuid references auth.users(id) on delete set null,
  add column if not exists refunded_at timestamptz;

create index if not exists cancellation_request_items_refunded_by_idx on public.cancellation_request_items(refunded_by);

create or replace function private.customer_create_cancellation_impl(
  p_order_id uuid,
  p_order_item_ids uuid[],
  p_reason_code text,
  p_reason_text text default null
) returns jsonb
language plpgsql security definer
set search_path='pg_catalog','public','private'
as $$
declare
  v_uid uuid:=auth.uid(); v_order public.orders%rowtype; v_request uuid; v_item record; v_est jsonb;
  v_mode text; v_amount numeric; v_pct numeric; v_item_status public.cancellation_item_status;
  v_count int:=0; v_manual int:=0; v_auto int:=0; v_refund_count int:=0; v_refund_total numeric:=0;
  v_partner record; v_partner_order_status public.partner_order_status; v_req_status public.cancellation_request_status;
begin
  if v_uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if nullif(trim(coalesce(p_reason_code,'')),'') is null then raise exception 'Cancellation reason is required'; end if;
  select * into v_order from public.orders where id=p_order_id and customer_id=v_uid for update;
  if not found then raise exception 'Order not found' using errcode='42501'; end if;
  if v_order.status not in ('paid','confirmed','in_progress') then raise exception 'This order cannot be cancelled in its current status'; end if;
  if not exists(select 1 from public.order_items oi where oi.order_id=p_order_id and oi.is_cancelled=false and (p_order_item_ids is null or cardinality(p_order_item_ids)=0 or oi.id=any(p_order_item_ids))) then raise exception 'No cancellable items selected'; end if;
  if exists(select 1 from public.cancellation_request_items ci join public.order_items oi on oi.id=ci.order_item_id where oi.order_id=p_order_id and ci.status<>'rejected' and (p_order_item_ids is null or cardinality(p_order_item_ids)=0 or oi.id=any(p_order_item_ids))) then raise exception 'A cancellation request already exists for one or more selected items'; end if;

  insert into public.cancellation_requests(order_id,customer_id,reason_code,reason_text)
  values(p_order_id,v_uid,trim(p_reason_code),nullif(trim(coalesce(p_reason_text,'')),'')) returning id into v_request;

  for v_item in select oi.* from public.order_items oi where oi.order_id=p_order_id and oi.is_cancelled=false and (p_order_item_ids is null or cardinality(p_order_item_ids)=0 or oi.id=any(p_order_item_ids)) order by oi.created_at,oi.id loop
    v_count:=v_count+1;
    select po.status into v_partner_order_status from public.partner_orders po where po.order_id=v_order.id and po.partner_id=v_item.partner_id limit 1;
    if v_partner_order_status='completed' then
      v_est:=jsonb_build_object('mode','manual_review','refund_percent',null,'refund_amount',null,'reason','partner_order_completed');
    else
      v_est:=private.calculate_refund_estimate(v_item.refund_policy_snapshot,v_item.line_total,v_order.occasion_date,v_order.occasion_time);
    end if;
    v_mode:=coalesce(v_est->>'mode','manual_review');
    v_amount:=case when v_est->>'refund_amount' is null then null else (v_est->>'refund_amount')::numeric end;
    v_pct:=case when v_est->>'refund_percent' is null then null else (v_est->>'refund_percent')::numeric end;
    if v_mode='manual_review' then v_item_status:='pending_review'; v_manual:=v_manual+1;
    else
      v_auto:=v_auto+1; v_amount:=coalesce(v_amount,0);
      v_item_status:=case when v_amount>0 then 'refund_pending'::public.cancellation_item_status else 'approved'::public.cancellation_item_status end;
      if v_amount>0 then v_refund_count:=v_refund_count+1; v_refund_total:=v_refund_total+v_amount; end if;
    end if;

    insert into public.cancellation_request_items(cancellation_request_id,order_item_id,partner_id,status,line_total_snapshot,currency,policy_snapshot,calculation_mode,estimated_refund_percent,estimated_refund_amount,approved_refund_amount,reviewed_at)
    values(v_request,v_item.id,v_item.partner_id,v_item_status,v_item.line_total,v_order.currency,v_item.refund_policy_snapshot,v_mode,v_pct,v_amount,case when v_mode='automatic' then coalesce(v_amount,0) else null end,case when v_mode='automatic' then now() else null end);

    if v_mode='automatic' then
      update public.order_items set is_cancelled=true,cancelled_at=now(),approved_refund_amount=coalesce(v_amount,0),refund_status=case when coalesce(v_amount,0)>0 then 'pending' else 'none' end where id=v_item.id;
      update public.booking_reservations set status='cancelled',updated_at=now() where order_item_id=v_item.id and status in ('hold','confirmed');
      perform private.create_notification(v_uid,case when coalesce(v_amount,0)>0 then 'refund_pending' else 'cancellation_approved' end,'تم إلغاء العنصر تلقائيًا',case when coalesce(v_amount,0)>0 then 'تم إلغاء "'||v_item.item_name||'" من الطلب #DD'||v_order.order_number||' وفق السياسة المطبقة. المبلغ المستحق للاسترداد: '||to_char(v_amount,'FM999999990.00')||' '||v_order.currency||'، والاسترداد قيد التنفيذ.' else 'تم إلغاء "'||v_item.item_name||'" من الطلب #DD'||v_order.order_number||' وفق السياسة المطبقة، ولا يوجد مبلغ مستحق للاسترداد.' end,'Item cancelled automatically',case when coalesce(v_amount,0)>0 then 'The item "'||v_item.item_name||'" was cancelled under the applicable policy. Refund due: '||v_amount||' '||v_order.currency||'. Refund is pending.' else 'The item "'||v_item.item_name||'" was cancelled under the applicable policy with no refund due.' end,'cancellation_request',v_request,jsonb_build_object('order_id',v_order.id,'order_number',v_order.order_number,'order_item_id',v_item.id,'refund_amount',coalesce(v_amount,0),'automatic',true));
      perform private.notify_partner(v_item.partner_id,case when coalesce(v_amount,0)>0 then 'partner_refund_pending' else 'partner_cancellation_approved' end,'تم تأكيد إلغاء عنصر',case when coalesce(v_amount,0)>0 then 'تم إلغاء "'||v_item.item_name||'" من الطلب #DD'||v_order.order_number||' تلقائيًا وفق السياسة. أوقف التنفيذ. قيمة الاسترداد المستحقة للعميل: '||to_char(v_amount,'FM999999990.00')||' '||v_order.currency||'.' else 'تم إلغاء "'||v_item.item_name||'" من الطلب #DD'||v_order.order_number||' تلقائيًا وفق السياسة. أوقف التنفيذ.' end,'Item cancellation confirmed','The item "'||v_item.item_name||'" in order #DD'||v_order.order_number||' was cancelled automatically under the applicable policy. Stop fulfilment.','cancellation_request',v_request,jsonb_build_object('order_id',v_order.id,'order_number',v_order.order_number,'order_item_id',v_item.id,'refund_amount',coalesce(v_amount,0),'automatic',true));
    end if;
  end loop;

  for v_partner in select distinct ci.partner_id from public.cancellation_request_items ci where ci.cancellation_request_id=v_request and ci.status in ('approved','refund_pending') loop
    if not exists(select 1 from public.order_items oi where oi.order_id=v_order.id and oi.partner_id=v_partner.partner_id and oi.is_cancelled=false) then
      update public.partner_orders set status='cancelled',updated_at=now() where order_id=v_order.id and partner_id=v_partner.partner_id and status<>'completed';
    end if;
  end loop;
  if not exists(select 1 from public.order_items oi where oi.order_id=v_order.id and oi.is_cancelled=false) then update public.orders set status='cancelled',updated_at=now() where id=v_order.id and status not in ('completed','refunded'); end if;

  if v_manual>0 then
    perform private.create_notification(v_uid,'cancellation_manual_review','بعض عناصر الإلغاء تحتاج مراجعة','تم تنفيذ العناصر التي تغطيها السياسة تلقائيًا، ويوجد '||v_manual||' عنصر/عناصر تحتاج مراجعة Dear Day قبل اتخاذ القرار.','Some cancellation items need review','Items covered by a clear policy were processed automatically. Some items require Dear Day review.','cancellation_request',v_request,jsonb_build_object('order_id',v_order.id,'order_number',v_order.order_number,'manual_review_items',v_manual));
    perform private.notify_admins('cancellation_exception_review','حالة إلغاء تحتاج مراجعة','الطلب #DD'||v_order.order_number||' يحتوي على '||v_manual||' عنصر/عناصر لا يمكن حسمها تلقائيًا وتحتاج قرارًا يدويًا.','Cancellation exception requires review','Order #DD'||v_order.order_number||' has cancellation items that require manual review.','cancellation_request',v_request,jsonb_build_object('order_id',v_order.id,'order_number',v_order.order_number,'manual_review_items',v_manual));
    for v_partner in select ci.partner_id,count(*) c from public.cancellation_request_items ci where ci.cancellation_request_id=v_request and ci.status='pending_review' group by ci.partner_id loop
      perform private.notify_partner(v_partner.partner_id,'partner_cancellation_pending','طلب إلغاء قيد المراجعة','يوجد طلب إلغاء قيد المراجعة للطلب #DD'||v_order.order_number||' ويشمل '||v_partner.c||' عنصر/عناصر تخصك. لا توقف التنفيذ حتى يصدر قرار Dear Day.','Cancellation under review','A cancellation exception is under review for order #DD'||v_order.order_number||'. Continue fulfilment until Dear Day confirms the decision.','cancellation_request',v_request,jsonb_build_object('order_id',v_order.id,'order_number',v_order.order_number,'manual_review_items',v_partner.c));
    end loop;
  end if;
  if v_refund_count>0 then perform private.notify_admins('refund_action_required','استرداد مالي مطلوب','يوجد استرداد مالي مطلوب للطلب #DD'||v_order.order_number||' بإجمالي '||to_char(v_refund_total,'FM999999990.00')||' '||v_order.currency||'. الإلغاء تم بالفعل؛ المطلوب فقط تنفيذ/تأكيد عودة المبلغ.','Refund action required','A refund is due for order #DD'||v_order.order_number||'. Cancellation is already complete; only the refund needs to be processed and confirmed.','cancellation_request',v_request,jsonb_build_object('order_id',v_order.id,'order_number',v_order.order_number,'refund_item_count',v_refund_count,'refund_total',v_refund_total,'currency',v_order.currency)); end if;

  v_req_status:=private.recompute_cancellation_request_status(v_request);
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,after_data) values(v_uid,'cancellation_requested','cancellation_request',v_request::text,jsonb_build_object('order_id',p_order_id,'item_count',v_count,'automatic_items',v_auto,'manual_review_items',v_manual,'refund_pending_items',v_refund_count,'refund_pending_total',v_refund_total,'request_status',v_req_status));
  return jsonb_build_object('request_id',v_request,'status',v_req_status,'item_count',v_count,'automatic_items',v_auto,'manual_review_items',v_manual,'refund_pending_items',v_refund_count,'refund_pending_total',v_refund_total,'currency',v_order.currency);
end $$;

create or replace function private.admin_mark_refund_completed_impl(p_request_item_id uuid,p_refund_reference text default null,p_note text default null)
returns jsonb language plpgsql security definer set search_path='pg_catalog','public','private' as $$
declare
  v_uid uuid:=auth.uid(); v_ci public.cancellation_request_items%rowtype; v_req public.cancellation_requests%rowtype; v_order public.orders%rowtype; v_oi public.order_items%rowtype; v_req_status public.cancellation_request_status; v_all_items_cancelled boolean; v_pending_refunds int; v_any_refunded boolean;
begin
  if v_uid is null or not private.has_permission('orders.manage') then raise exception 'Permission denied' using errcode='42501'; end if;
  select * into v_ci from public.cancellation_request_items where id=p_request_item_id for update;
  if not found then raise exception 'Cancellation item not found'; end if;
  if v_ci.status<>'refund_pending' then raise exception 'This item is not waiting for a refund'; end if;
  if coalesce(v_ci.approved_refund_amount,0)<=0 then raise exception 'There is no refund amount to complete'; end if;
  select * into v_req from public.cancellation_requests where id=v_ci.cancellation_request_id for update;
  select * into v_order from public.orders where id=v_req.order_id for update;
  select * into v_oi from public.order_items where id=v_ci.order_item_id for update;
  update public.cancellation_request_items set status='refunded',refund_reference=nullif(trim(coalesce(p_refund_reference,'')),''),refund_note=nullif(trim(coalesce(p_note,'')),''),refunded_by=v_uid,refunded_at=now(),updated_at=now() where id=v_ci.id;
  update public.order_items set refund_status='refunded' where id=v_oi.id;
  v_req_status:=private.recompute_cancellation_request_status(v_req.id);
  select not exists(select 1 from public.order_items oi where oi.order_id=v_order.id and oi.is_cancelled=false) into v_all_items_cancelled;
  select count(*) filter(where oi.refund_status='pending'),exists(select 1 from public.order_items x where x.order_id=v_order.id and x.refund_status='refunded') into v_pending_refunds,v_any_refunded from public.order_items oi where oi.order_id=v_order.id;
  if v_all_items_cancelled and v_pending_refunds=0 then update public.orders set status=case when v_any_refunded then 'refunded'::public.order_status else 'cancelled'::public.order_status end,updated_at=now() where id=v_order.id and status not in ('completed'); end if;
  perform private.create_notification(v_req.customer_id,'refund_completed','تم رد المبلغ','تم تأكيد رد مبلغ '||to_char(v_ci.approved_refund_amount,'FM999999990.00')||' '||v_ci.currency||' الخاص بـ"'||v_oi.item_name||'" من الطلب #DD'||v_order.order_number||'.','Refund completed','Your refund of '||v_ci.approved_refund_amount||' '||v_ci.currency||' for "'||v_oi.item_name||'" in order #DD'||v_order.order_number||' has been confirmed.','cancellation_request',v_req.id,jsonb_build_object('request_item_id',v_ci.id,'order_id',v_order.id,'refund_amount',v_ci.approved_refund_amount,'refund_reference',nullif(trim(coalesce(p_refund_reference,'')),'')));
  perform private.notify_partner(v_ci.partner_id,'partner_refund_completed','تم تنفيذ الاسترداد للعميل','تم تأكيد رد مبلغ '||to_char(v_ci.approved_refund_amount,'FM999999990.00')||' '||v_ci.currency||' للعميل عن "'||v_oi.item_name||'" في الطلب #DD'||v_order.order_number||'.','Customer refund completed','The customer refund for "'||v_oi.item_name||'" in order #DD'||v_order.order_number||' has been confirmed.','cancellation_request',v_req.id,jsonb_build_object('request_item_id',v_ci.id,'order_id',v_order.id,'refund_amount',v_ci.approved_refund_amount));
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,before_data,after_data) values(v_uid,'refund_completed','cancellation_request_item',v_ci.id::text,to_jsonb(v_ci),jsonb_build_object('refund_amount',v_ci.approved_refund_amount,'refund_reference',nullif(trim(coalesce(p_refund_reference,'')),''),'note',nullif(trim(coalesce(p_note,'')),''),'request_status',v_req_status));
  return jsonb_build_object('request_id',v_req.id,'request_item_id',v_ci.id,'item_status','refunded','request_status',v_req_status,'refund_amount',v_ci.approved_refund_amount,'currency',v_ci.currency,'refund_reference',nullif(trim(coalesce(p_refund_reference,'')),''));
end $$;

create or replace function public.admin_mark_refund_completed(p_request_item_id uuid,p_refund_reference text default null,p_note text default null)
returns jsonb language sql security invoker set search_path='pg_catalog','public','private' as $$ select private.admin_mark_refund_completed_impl(p_request_item_id,p_refund_reference,p_note); $$;
revoke all on function public.admin_mark_refund_completed(uuid,text,text) from public,anon;
grant execute on function public.admin_mark_refund_completed(uuid,text,text) to authenticated;
revoke all on function private.admin_mark_refund_completed_impl(uuid,text,text) from public,anon;
grant execute on function private.admin_mark_refund_completed_impl(uuid,text,text) to authenticated;
