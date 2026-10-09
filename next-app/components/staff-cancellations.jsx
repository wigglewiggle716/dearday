"use client";
import Link from "next/link";
import {useEffect,useMemo,useRef,useState} from "react";
import {authClient,EMPLOYEE_ROLES,readCurrentAccount,rememberPreference} from "../lib/auth-client";
import {useAuthSession} from "./auth-session-provider";
import {pathFor} from "../lib/locales";

const S={
 ar:{
  title:"الإلغاءات والاستردادات",intro:"طلبات الإلغاء والاسترداد حسب سياسة كل طلب؛ تنفيذ رد الأموال يتم خارج هذه الصفحة.",
  back:"بوابة الموظفين",policies:"سياسات الاسترداد",reload:"تحديث",loading:"جاري تحميل طلبات الإلغاء…",
  denied:"الصفحة متاحة فقط لموظفي Dear Day المصرح لهم بعرض الطلبات.",failed:"تعذر تحميل الطلبات. حاول مرة أخرى.",
  signIn:"تسجيل الدخول",setup:"تفعيل التحقق بخطوتين",mfa:"إكمال التحقق بخطوتين",
  all:"الكل",action:"مطلوب إجراء",manual:"مراجعة يدوية",refund:"استرداد معلّق",refunded:"تم الاسترداد",
  order:"طلب",customer:"العميل",occasion:"المناسبة",date:"موعد المناسبة",requested:"تاريخ الطلب",reason:"سبب الإلغاء",
  partner:"الشريك",item:"العنصر",itemAmount:"قيمة العنصر",estimate:"تقدير السياسة",approved:"مبلغ الاسترداد المعتمد",
  method:"طريقة القرار",automatic:"تلقائي من السياسة",manualMode:"مراجعة استثنائية",status:"الحالة",
  note:"ملاحظة الإدارة",refundNote:"ملاحظة الاسترداد",refundReference:"رقم مرجع الاسترداد من بوابة الدفع",
  amount:"مبلغ الاسترداد المعتمد",accept:"اعتماد الإلغاء",reject:"رفض الإلغاء",mark:"تسجيل الاسترداد كمكتمل",
  notTransferred:"هذا الزر لا يعيد المال تلقائيًا. تأكد أن المبلغ وصل للعميل من بوابة الدفع أولًا، واكتب المرجع الحقيقي.",
  verifyAmount:"قيمة الاسترداد المعتمد تختلف عن تقدير السياسة. راجع القرار بعناية.",
  needAmount:"اكتب مبلغ الاسترداد الصحيح بين صفر وقيمة العنصر.",needReject:"اكتب سبب رفض طلب الإلغاء.",
  needReference:"يلزم إدخال مرجع عملية الاسترداد الفعلية قبل تسجيلها كمكتملة.",
  confirmReview:"هل تؤكد القرار؟ الاعتماد قد يلغي العنصر ويحجز الاسترداد المطلوب ويوقف تنفيذ الشريك، وستُرسل إشعارات داخل النظام.",
  confirmRefund:"هل تحققت بنفسك من تنفيذ رد المبلغ خارج Dear Day وبنفس القيمة المعتمدة؟ ستصبح حالة الاسترداد «مكتمل» ويُخطر العميل داخل النظام.",
  confirmReject:"هل تؤكد رفض الإلغاء وكتابة السبب؟ سيتم إبلاغ العميل والشريك داخل النظام.",
  saved:"تم تسجيل القرار في Supabase.",marked:"تم تسجيل اكتمال الاسترداد بعد تأكيدك تنفيذ العملية الخارجية.",
  saveError:"تعذر تنفيذ الإجراء. تأكد من حالة الطلب الحالية والصلاحيات وأعد تحميل الصفحة.",
  readonly:"لا تملك صلاحية مراجعة طلب الإلغاء.",financeOnly:"تأكيد الاسترداد يتطلب صلاحية إدارة الطلبات وصلاحية مالية معًا في النسخة الجديدة.",
  noItems:"لا توجد عناصر إلغاء مطابقة.",count:"عناصر الإلغاء",required:"مطلوب إجراء",
  pending:"قيد المراجعة",expires:"مراجعة مطلوبة",limit:"يتم تحميل أحدث 150 طلب إلغاء فقط حاليًا؛ يجب استكمال pagination للحالات الأكبر.",
  orderLimit:"لا تُعرض قيمة مالية على أنها تمت إعادتها إلا بعد تنفيذ العملية خارج الموقع والتحقق منها.",
  form:"اتخاذ قرار",working:"جاري الحفظ…",readOnly:"عرض فقط",
  statuses:{pending_review:"مراجعة يدوية",approved:"تم الإلغاء بدون استرداد",partially_approved:"مقبول جزئيًا",rejected:"تم رفض الإلغاء",refund_pending:"مستحق للاسترداد",refunded:"تم الاسترداد"},
  select:"فلترة الحالات"
 },
 en:{
  title:"Cancellations & Refunds",intro:"Cancellation requests under each order's captured policy. Money is refunded outside this page.",
  back:"Staff workspace",policies:"Refund policies",reload:"Refresh",loading:"Loading cancellation requests…",
  denied:"This page requires staff permission to view orders.",failed:"Couldn't load requests. Please try again.",
  signIn:"Log in",setup:"Set up authenticator",mfa:"Complete two-step verification",
  all:"All",action:"Action required",manual:"Manual review",refund:"Refund pending",refunded:"Refunded",
  order:"Order",customer:"Customer",occasion:"Occasion",date:"Occasion date",requested:"Requested",reason:"Cancellation reason",
  partner:"Partner",item:"Item",itemAmount:"Item total",estimate:"Policy estimate",approved:"Approved refund",
  method:"Calculation mode",automatic:"Automatic policy",manualMode:"Manual exception",status:"Status",
  note:"Internal decision note",refundNote:"Refund note",refundReference:"External refund transaction reference",
  amount:"Approved refund amount",accept:"Approve cancellation",reject:"Reject cancellation",mark:"Record refund completed",
  notTransferred:"This button does not transfer money. First verify the refund was completed through your payment provider and enter the actual transaction reference.",
  verifyAmount:"The approved refund amount differs from the policy estimate. Review this decision.",
  needAmount:"Enter a refund amount between zero and the item total.",needReject:"Provide a reason for rejection.",
  needReference:"An actual external refund reference is required to record completion.",
  confirmReview:"Confirm this decision? Approval can cancel the order item, initiate a refund liability and notify staff, customer and partner inside the system.",
  confirmRefund:"Have you independently confirmed that the exact approved amount was refunded through the external payment service? The refund will be recorded completed and the customer notified in-app.",
  confirmReject:"Reject this cancellation and notify the customer and partner in-app?",
  saved:"Decision recorded in Supabase.",marked:"Refund completion recorded after you confirmed the external transfer.",
  saveError:"Action failed. Recheck the current status and your permissions, then reload.",
  readonly:"You may not review cancellation decisions.",financeOnly:"Refund completion requires both order-management and finance permission in this new interface.",
  noItems:"No matching cancellation items.",count:"Cancellation items",required:"Action required",
  pending:"Pending review",expires:"Review needed",limit:"Only the newest 150 cancellation requests are loaded; add server pagination when larger.",
  orderLimit:"A refund must not be marked completed until the money was actually returned outside Dear Day.",
  form:"Decision",working:"Saving…",readOnly:"Read only",
  statuses:{pending_review:"Manual review",approved:"Cancelled, no refund",partially_approved:"Partially approved",rejected:"Cancellation rejected",refund_pending:"Refund pending",refunded:"Refunded"},
  select:"Filter statuses"
 }
};
const requestCols="id,order_id,customer_id,status,reason_code,reason_text,requested_at";
const itemCols="id,cancellation_request_id,order_item_id,partner_id,status,line_total_snapshot,currency,calculation_mode,estimated_refund_percent,estimated_refund_amount,approved_refund_amount,admin_note,refund_note,refund_reference,refunded_at,updated_at";
const filterSet=["action_required","pending_review","refund_pending","refunded","all"];
function money(value,currency,locale){
 if(value==null)return "—";
 try{return new Intl.NumberFormat(locale==="ar"?"ar-EG":"en-EG",{style:"currency",currency:currency||"EGP",maximumFractionDigits:2}).format(Number(value));}
 catch{return String(value)+" EGP";}
}
function date(value,locale){if(!value)return "—";const x=new Date(value);if(isNaN(x.getTime()))return "—";return new Intl.DateTimeFormat(locale==="ar"?"ar-EG":"en-GB",{timeZone:"Africa/Cairo",dateStyle:"medium",timeStyle:"short"}).format(x);}
async function batches(client,table,columns,key,ids){
 const unique=[...new Set(ids.filter(Boolean))],all=[];
 for(let i=0;i<unique.length;i+=50){
  const r=await client.from(table).select(columns).in(key,unique.slice(i,i+50));
  if(r.error)throw r.error;
  all.push(...(r.data||[]));
 }
 return all;
}
export default function StaffCancellations({locale="ar"}){
 const t=S[locale]||S.ar,session=useAuthSession(),active=session.status==="authenticated"&&EMPLOYEE_ROLES.has(session.role);
 const uid=active?session.user?.id:null;
 const client=useMemo(()=>typeof window==="undefined"?null:authClient(rememberPreference()),[]);
 const [data,setData]=useState({stage:"loading",requests:[],items:[],orders:{},orderItems:{},partners:{},customers:{},permissions:[],overflow:false});
 const [filter,setFilter]=useState("action_required"),[revision,setRevision]=useState(0);
 const [forms,setForms]=useState({}),[busy,setBusy]=useState(""),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const seq=useRef(0);
 const view=data.stage==="ready",canReview=view&&data.permissions.includes("orders.manage");
 // Strictly narrower frontend gate: live DB RPC allows orders.manage alone.
 // Finance access alone is insufficient and accountants have no orders.manage.
 const canConfirmRefund=canReview&&data.permissions.some(p=>p==="finance.view"||p==="finance.manage");
 const reload=()=>setRevision(x=>x+1);
 useEffect(()=>{
  const id=++seq.current;
  if(!uid||!client){setData(x=>({...x,stage:"loading",requests:[],items:[],permissions:[]}));return;}
  setData(x=>({...x,stage:"loading",requests:[],items:[],permissions:[]}));
  (async()=>{
   try{
    const p=await client.rpc("get_my_permissions");
    if(p.error)throw p.error;
    const permissions=(p.data||[]).map(x=>x.permission_code);
    if(!permissions.includes("orders.view")){if(seq.current===id)setData(x=>({...x,stage:"denied",permissions:[]}));return;}
    const rq=await client.from("cancellation_requests").select(requestCols).order("requested_at",{ascending:false}).limit(151);
    if(rq.error)throw rq.error;
    const requests=(rq.data||[]).slice(0,150);
    const [items,orders,orderItems,partners,customers]=await (async()=>{
     const its=await batches(client,"cancellation_request_items",itemCols,"cancellation_request_id",requests.map(x=>x.id));
     const os=await batches(client,"orders","id,order_number,occasion_type,occasion_date,currency","id",requests.map(x=>x.order_id));
     const ois=await batches(client,"order_items","id,item_name","id",its.map(x=>x.order_item_id));
     const ps=await batches(client,"partner_directory","id,name_ar,name_en","id",its.map(x=>x.partner_id));
     // PII only under a separate customers.view entitlement.
     const customers=permissions.includes("customers.view")?
      await batches(client,"profiles","id,full_name","id",requests.map(x=>x.customer_id)):[];
     return [its,os,ois,ps,customers];
    })();
    if(seq.current!==id)return;
    const map=a=>Object.fromEntries(a.map(x=>[x.id,x]));
    setData({stage:"ready",permissions,requests,items,orders:map(orders),orderItems:map(orderItems),
      partners:map(partners),customers:map(customers),overflow:(rq.data||[]).length>150});
   }catch{if(seq.current===id)setData(x=>({...x,stage:"error",requests:[],items:[],permissions:[]}));}
  })();
  return()=>{seq.current++};
 },[uid,client,revision]);
 const visible=useMemo(()=>{
  const allowed=filter==="action_required"?new Set(["pending_review","refund_pending"]):null;
  return data.requests.map(request=>({
    request,items:data.items.filter(item=>item.cancellation_request_id===request.id&&
     (filter==="all"||allowed?.has(item.status)||item.status===filter))
  })).filter(r=>r.items.length);
 },[filter,data.requests,data.items]);
 const totalAction=data.items.filter(x=>x.status==="pending_review"||x.status==="refund_pending").length;
 const setField=(id,k,value)=>setForms(s=>({...s,[id]:{...(s[id]||{}),[k]:value}}));
 async function action(item,kind){
  if(!active||!canReview||busy||!client)return;
  if(kind==="refund"&&!canConfirmRefund){setError(t.financeOnly);return;}
  const fields=forms[item.id]||{};
  let amount=null;
  if(kind==="approve"){
   if(String(fields.amount??"").trim()===""||!Number.isFinite(Number(fields.amount))||
    Number(fields.amount)<0||Number(fields.amount)>Number(item.line_total_snapshot)){
    setError(t.needAmount);return;}
   amount=Number(fields.amount);
  }
  if(kind==="reject"&&!String(fields.note||"").trim()){setError(t.needReject);return;}
  if(kind==="refund"&&!String(fields.reference||"").trim()){setError(t.needReference);return;}
  const confirmMessage=kind==="refund"?t.confirmRefund:kind==="reject"?t.confirmReject:t.confirmReview;
  if(!window.confirm(confirmMessage))return;
  setBusy(item.id);setError("");setNotice("");
  try{
   const who=await readCurrentAccount(client);
   if(who.status!=="authenticated"||who.user?.id!==uid||!EMPLOYEE_ROLES.has(who.role))throw Error("account");
   const p=await client.rpc("get_my_permissions");
   if(p.error)throw p.error;
   const granted=new Set((p.data||[]).map(x=>x.permission_code));
   if(!granted.has("orders.manage")||(kind==="refund"&&!granted.has("finance.view")&&!granted.has("finance.manage")))throw Error("permission");
   const fresh=await client.from("cancellation_request_items").select("id,status,updated_at,approved_refund_amount,line_total_snapshot")
    .eq("id",item.id).maybeSingle();
   if(fresh.error||!fresh.data||fresh.data.status!==item.status||fresh.data.updated_at!==item.updated_at)throw Error("stale");
   if(kind==="refund"&&(fresh.data.status!=="refund_pending"||Number(fresh.data.approved_refund_amount)<=0))throw Error("bad_status");
   if(kind!=="refund"&&fresh.data.status!=="pending_review")throw Error("bad_status");
   const r=kind==="refund"?
    await client.rpc("admin_mark_refund_completed",{
     p_request_item_id:item.id,p_refund_reference:String(fields.reference).trim().slice(0,160),
     p_note:String(fields.refundNote||"").trim().slice(0,500)||null
    }):
    await client.rpc("admin_review_cancellation_item",{
     p_request_item_id:item.id,p_decision:kind,p_approved_refund_amount:kind==="approve"?amount:null,
     p_note:String(fields.note||"").trim().slice(0,1000)||null
    });
   if(r.error)throw r.error;
   setNotice(kind==="refund"?t.marked:t.saved);reload();
  }catch{setError(t.saveError);}finally{setBusy("");}
 }
 const gate=session.status==="mfa_setup_required"?{href:pathFor("security",locale),label:t.setup}:
  session.status==="mfa_required"?{href:pathFor("auth",locale)+"?mode=mfa",label:t.mfa}:
  session.status==="signed_out"?{href:pathFor("auth",locale)+"?next="+encodeURIComponent(pathFor("staffCancellations",locale)),label:t.signIn}:null;
 return <main id="main-content" className="dd-cancellations-staff" dir={locale==="ar"?"rtl":"ltr"}>
  <div className="dd-ca-wrap">
   <header className="dd-ca-head">
    <div><Link href={pathFor("staffPortal",locale)}>{t.back} ↗</Link><h1>{t.title}</h1><p>{t.intro}</p></div>
    {view&&<div className="dd-ca-actions"><Link className="dd-ca-outline" href={pathFor("staffRefundPolicies",locale)}>{t.policies}</Link>
      <button type="button" className="dd-ca-outline" onClick={reload}>{t.reload}</button></div>}
   </header>
   {!active?<section className="dd-ca-panel dd-ca-guard"><p>{session.status==="loading"?t.loading:t.denied}</p>{gate&&<Link className="dd-ca-primary" href={gate.href}>{gate.label}</Link>}</section>:
    data.stage==="loading"?<section className="dd-ca-panel dd-ca-guard" role="status">{t.loading}</section>:
    !view?<section className="dd-ca-panel dd-ca-guard" role="alert">{data.stage==="denied"?t.denied:t.failed}</section>:<>
     {error&&<p className="dd-ca-error" role="alert">{error}</p>}
     {notice&&<p className="dd-ca-success" role="status">{notice}</p>}
     {data.overflow&&<p className="dd-ca-warning">{t.limit}</p>}
     <p className="dd-ca-warning">{t.notTransferred}</p>
     <div className="dd-ca-count"><span>{t.count}: <strong>{data.items.length}</strong></span>
      <span>{t.required}: <strong>{totalAction}</strong></span></div>
     <nav className="dd-ca-filters" aria-label={t.select}>
      {filterSet.map(x=><button type="button" key={x} className={filter===x?"active":""} aria-pressed={filter===x}
       onClick={()=>{setFilter(x);setError("");}}>{x==="action_required"?t.action:x==="pending_review"?t.manual:x==="refund_pending"?t.refund:x==="refunded"?t.refunded:t.all}</button>)}
     </nav>
     {visible.length?<div className="dd-ca-requests">{visible.map(({request,items})=>{
      const order=data.orders[request.order_id],person=data.customers[request.customer_id];
      return <article className="dd-ca-panel" key={request.id}>
       <div className="dd-ca-request-head"><div><h2>{t.order} {order?.order_number!=null?"#DD"+order.order_number:"—"}{person?.full_name?" — "+person.full_name:""}</h2>
        <p>{order?.occasion_type||"—"} · {order?.occasion_date||"—"} · {date(request.requested_at,locale)}</p></div>
        <span className="dd-ca-tag">{t.statuses[request.status]||request.status}</span>
       </div>
       <p className="dd-ca-reason"><strong>{t.reason}:</strong> {request.reason_code||"—"}{request.reason_text?" — "+request.reason_text:""}</p>
       {items.map(item=>{
        const oi=data.orderItems[item.order_item_id],partner=data.partners[item.partner_id],f=forms[item.id]||{};
        const manual=item.status==="pending_review",pending=item.status==="refund_pending";
        const amountPending=Number(item.approved_refund_amount||0);
        return <section className="dd-ca-item" key={item.id}>
          <div><h3>{oi?.item_name||"—"} <span className="dd-ca-tag">{t.statuses[item.status]||item.status}</span></h3>
           <div className="dd-ca-facts">
            <div><small>{t.partner}</small><strong>{(locale==="en"?partner?.name_en||partner?.name_ar:partner?.name_ar||partner?.name_en)||"—"}</strong></div>
            <div><small>{t.itemAmount}</small><strong>{money(item.line_total_snapshot,item.currency,locale)}</strong></div>
            <div><small>{t.method}</small><strong>{item.calculation_mode==="manual_review"?t.manualMode:t.automatic}</strong></div>
            <div><small>{t.estimate}</small><strong>{item.calculation_mode==="manual_review"?t.manualMode:money(item.estimated_refund_amount,item.currency,locale)+" ("+(item.estimated_refund_percent??0)+"%)"}</strong></div>
            {item.approved_refund_amount!=null&&<div><small>{t.approved}</small><strong>{money(item.approved_refund_amount,item.currency,locale)}</strong></div>}
            {item.refunded_at&&<div><small>{t.refunded}</small><strong>{date(item.refunded_at,locale)}</strong></div>}
            {item.refund_reference&&<div><small>{t.refundReference}</small><strong>{item.refund_reference}</strong></div>}
           </div>
           {item.admin_note&&<p className="dd-ca-muted">{t.note}: {item.admin_note}</p>}
           {item.refund_note&&<p className="dd-ca-muted">{t.refundNote}: {item.refund_note}</p>}
          </div>
          {manual&&canReview&&<div className="dd-ca-form"><p className="dd-ca-muted">{t.manualMode}</p>
           <label>{t.amount}<input type="number" min="0" max={item.line_total_snapshot} step="0.01" placeholder="0.00" disabled={!!busy}
            value={f.amount??""} onChange={e=>setField(item.id,"amount",e.target.value)}/></label>
           <label>{t.note}<textarea maxLength={1000} value={f.note??""} disabled={!!busy}
            onChange={e=>setField(item.id,"note",e.target.value)}/></label>
           <div className="dd-ca-actions"><button className="dd-ca-primary" disabled={!!busy} type="button" onClick={()=>action(item,"approve")}>{busy===item.id?t.working:t.accept}</button>
            <button className="dd-ca-danger" disabled={!!busy} type="button" onClick={()=>action(item,"reject")}>{busy===item.id?t.working:t.reject}</button></div>
          </div>}
          {pending&&canConfirmRefund&&<div className="dd-ca-form">
           <p className="dd-ca-warning">{t.notTransferred} <strong>{money(amountPending,item.currency,locale)}</strong></p>
           <label>{t.refundReference}<input type="text" maxLength={160} value={f.reference??""} disabled={!!busy}
             onChange={e=>setField(item.id,"reference",e.target.value)} required/></label>
           <label>{t.refundNote}<textarea maxLength={500} value={f.refundNote??""} disabled={!!busy}
             onChange={e=>setField(item.id,"refundNote",e.target.value)}/></label>
           <button className="dd-ca-primary" disabled={!!busy} type="button" onClick={()=>action(item,"refund")}>{busy===item.id?t.working:t.mark}</button>
          </div>}
          {(pending&&!canConfirmRefund||manual&&!canReview)&&<p className="dd-ca-muted">{pending?t.financeOnly:t.readonly}</p>}
         </section>;
       })}
      </article>;
     })}</div>:<section className="dd-ca-panel dd-ca-guard">{t.noItems}</section>}
    </>}
  </div>
 </main>;
}
