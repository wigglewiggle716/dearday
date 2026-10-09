"use client";

import Link from "next/link";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {authClient,EMPLOYEE_ROLES,rememberPreference,readCurrentAccount} from "../lib/auth-client";
import {useAuthSession} from "./auth-session-provider";
import {pathFor} from "../lib/locales";

const STATES=["pending","sending","retry","sent","failed"];
const WORDS={
 ar:{
  title:"إشعارات الطلبات",subtitle:"متابعة إيميلات الدفع المسجلة بالفعل من الأوردرات في Supabase.",
  back:"العودة للوحة الفريق",orders:"الطلبات",refresh:"تحديث",all:"كل الحالات",
  pending:"في الانتظار",sending:"جاري الإرسال",retry:"إعادة محاولة مجدولة",
  sent:"تم تسليمها لخدمة الإرسال",failed:"فشل الإرسال",status:"حالة الإيميل",
  number:"رقم الطلب",recipient:"العميل",kind:"نوع الإشعار",attempts:"المحاولات",
  created:"تاريخ التسجيل",sentAt:"تاريخ الإرسال",error:"رمز المشكلة",actions:"الإجراء",
  payment:"استلام الدفع",noRows:"لا توجد إيميلات بهذه الحالة حتى الآن.",
  loading:"جاري تحميل سجل الإيميلات…",loadError:"تعذر تحميل سجل الإيميلات. جرّب التحديث.",
  forbidden:"هذه الصفحة مخصصة فقط للفريق المصرّح له بإدارة الطلبات.",
  mfa:"أكمل التحقق بخطوتين للوصول إلى سجل الإيميلات.",setup:"تفعيل التحقق بخطوتين",
  signin:"تسجيل الدخول",page:"صفحة",of:"من",previous:"السابق",next:"التالي",
  hint:"حالة «تم تسليمها لخدمة الإرسال» تعني أن Resend قبلت الرسالة؛ لا تؤكد وحدها وصولها لصندوق الوارد.",
  worker:"إعادة المحاولة اليدوية تضع الرسالة في قائمة الانتظار، ولا ترسلها فورًا. تشغيل عامل إعادة الإرسال الدوري لم يُفعّل بعد.",
  requeue:"إعادة جدولة",requeueConfirm:"هل تريد إعادة جدولة هذه الرسالة؟ هذا متاح فقط للفشل المؤكد دون قبول الرسالة من Resend.",
  queued:"تمت إعادة جدولة الإيميل. ستتم معالجته عند تشغيل نظام التوزيع.",
  queueError:"لم نتمكن من إعادة الجدولة. ربما تغيّرت الحالة أو لم تعد الصلاحية متاحة.",
  retryBusy:"جاري الجدولة…",count:"إجمالي الإشعارات"
 },
 en:{
  title:"Order Emails",subtitle:"Monitor real payment-related email records from orders stored in Supabase.",
  back:"Back to staff workspace",orders:"Orders",refresh:"Refresh",all:"All statuses",
  pending:"Pending",sending:"Sending",retry:"Retry scheduled",
  sent:"Accepted by email provider",failed:"Failed",status:"Email status",
  number:"Order",recipient:"Recipient",kind:"Notification",attempts:"Attempts",
  created:"Created",sentAt:"Accepted at",error:"Error code",actions:"Action",
  payment:"Payment received",noRows:"No email records match this filter.",
  loading:"Loading email records…",loadError:"Couldn't load email records. Try refreshing.",
  forbidden:"Only staff authorised to manage orders can open this page.",
  mfa:"Complete two-step verification to access email monitoring.",setup:"Set up two-step verification",
  signin:"Log in",page:"Page",of:"of",previous:"Previous",next:"Next",
  hint:"Accepted by provider means Resend accepted the message; it does not confirm inbox delivery.",
  worker:"Manual retry only requeues a message. The scheduled delivery worker has not been enabled yet.",
  requeue:"Queue retry",requeueConfirm:"Queue a retry for this message? Only definitively rejected or rate-limited messages qualify.",
  queued:"Email requeued. Delivery will resume when the dispatcher runs.",
  queueError:"Could not queue retry. The status or your permissions may have changed.",
  retryBusy:"Queueing…",count:"Email records"
 }
};
const pct=n=>Number.isFinite(Number(n))?Number(n):0;
function date(value,locale){
 if(!value)return "—";
 const d=new Date(value);
 return Number.isNaN(d.getTime())?"—":new Intl.DateTimeFormat(locale==="ar"?"ar-EG":"en-GB",{dateStyle:"medium",timeStyle:"short"}).format(d);
}
export default function StaffOrderEmails({locale="ar"}){
 const t=WORDS[locale]||WORDS.ar;
 const session=useAuthSession();
 const active=session.status==="authenticated"&&EMPLOYEE_ROLES.has(session.role);
 const client=useMemo(()=>typeof window==="undefined"?null:authClient(rememberPreference()),[]);
 const [stage,setStage]=useState("loading");
 const [statusFilter,setStatusFilter]=useState("");
 const [page,setPage]=useState(0);
 const [revision,setRevision]=useState(0);
 const [data,setData]=useState({items:[],total:0,page_size:25,counts:{}});
 const [busy,setBusy]=useState(null);
 const [message,setMessage]=useState("");
 const seq=useRef(0);
 const reload=useCallback(()=>setRevision(v=>v+1),[]);
 const memberId=active?session.user?.id:null;
 useEffect(()=>{
  const token=++seq.current;
  if(!memberId||!client){setStage("loading");setData({items:[],total:0,page_size:25,counts:{}});return;}
  setStage("loading");
  (async()=>{
   try{
    const who=await readCurrentAccount(client);
    if(who.status!=="authenticated"||!EMPLOYEE_ROLES.has(who.role))throw Error("INVALID_SESSION");
    const p=await client.rpc("get_my_permissions");
    if(p.error)throw p.error;
    if(!(p.data||[]).some(x=>x.permission_code==="orders.manage")){
     if(token===seq.current)setStage("forbidden");
     return;
    }
    const response=await client.rpc("staff_order_email_overview",{p_status:statusFilter||null,p_page:page});
    if(response.error)throw response.error;
    if(token===seq.current){
     const d=response.data||{};
     setData({items:Array.isArray(d.items)?d.items:[],total:pct(d.total),page_size:25,counts:d.counts||{}});
     setStage("ready");
    }
   }catch{
    if(token===seq.current)setStage("error");
   }
  })();
  return()=>{seq.current++;};
 },[client,memberId,statusFilter,page,revision]);
 async function requeue(row){
  if(busy||!row.can_retry||!client||!window.confirm(t.requeueConfirm))return;
  setMessage("");setBusy(row.id);
  try{
   const who=await readCurrentAccount(client);
   if(who.status!=="authenticated"||!EMPLOYEE_ROLES.has(who.role))throw Error("SESSION_INVALID");
   const p=await client.rpc("get_my_permissions");
   if(p.error||!(p.data||[]).some(x=>x.permission_code==="orders.manage"))throw Error("ACCESS_DENIED");
   const r=await client.rpc("staff_requeue_order_email",{p_id:row.id});
   if(r.error||r.data!==true)throw Error("RETRY_NOT_QUEUED");
   setMessage(t.queued);reload();
  }catch{setMessage(t.queueError);}finally{setBusy(null);}
 }
 const gate=session.status==="mfa_setup_required"?{label:t.setup,href:pathFor("security",locale)}:
  session.status==="mfa_required"?{label:t.mfa,href:pathFor("auth",locale)+"?mode=mfa"}:
  session.status==="signed_out"?{label:t.signin,href:pathFor("auth",locale)+"?next="+encodeURIComponent(pathFor("staffOrderEmails",locale))}:null;
 const pageCount=Math.max(1,Math.ceil(data.total/25));
 return <main id="main-content" className="dd-email-admin" dir={locale==="ar"?"rtl":"ltr"}>
  <div className="dd-email-admin-wrap">
   <header className="dd-email-heading">
    <div><Link className="dd-email-back" href={pathFor("staffPortal",locale)}>← {t.back}</Link>
     <h1>{t.title}</h1><p>{t.subtitle}</p></div>
    {active&&stage==="ready"&&<button type="button" className="dd-email-button outline" onClick={reload}>{t.refresh}</button>}
   </header>
   {!active?<section className="dd-email-panel dd-email-guard" role="status">
    <p>{session.status==="loading"?t.loading:t.forbidden}</p>
    {gate&&<Link href={gate.href} className="dd-email-button">{gate.label}</Link>}
   </section>:stage==="loading"?<section className="dd-email-panel dd-email-guard" role="status">{t.loading}</section>:
    stage==="forbidden"?<section className="dd-email-panel dd-email-guard" role="alert">{t.forbidden}</section>:
    stage==="error"?<section className="dd-email-panel dd-email-guard" role="alert">
     {t.loadError}<button type="button" className="dd-email-button outline" onClick={reload}>{t.refresh}</button>
    </section>:<>
    <section className="dd-email-metrics" aria-label={t.count}>
     {STATES.map(status=><div key={status} className="dd-email-metric">
      <span>{t[status]}</span><strong>{pct(data.counts[status]).toLocaleString(locale==="ar"?"ar-EG":"en-US")}</strong>
     </div>)}
    </section>
    <div className="dd-email-toolbar">
     <label htmlFor="dd-email-filter">{t.status}</label>
     <select id="dd-email-filter" value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setPage(0);setMessage("");}}>
      <option value="">{t.all}</option>{STATES.map(s=><option key={s} value={s}>{t[s]}</option>)}
     </select>
     <Link className="dd-email-button outline" href={pathFor("staffOrders",locale)}>{t.orders}</Link>
    </div>
    {message&&<p className="dd-email-message" role="status">{message}</p>}
    <section className="dd-email-panel">
     {data.items.length?<div className="dd-email-scroll"><table>
      <thead><tr><th>{t.number}</th><th>{t.recipient}</th><th>{t.kind}</th><th>{t.status}</th><th>{t.attempts}</th><th>{t.created}</th><th>{t.sentAt}</th><th>{t.error}</th><th>{t.actions}</th></tr></thead>
      <tbody>{data.items.map(row=><tr key={row.id}>
       <td dir="ltr"><strong>#DD{row.order_number}</strong></td>
       <td dir="ltr">{row.recipient_masked||"—"}</td>
       <td>{row.kind==="payment_received"?t.payment:row.kind}</td>
       <td><span className={"dd-email-state s-"+row.status}>{t[row.status]||row.status}</span></td>
       <td>{row.attempt_count??0}</td><td>{date(row.created_at,locale)}</td>
       <td>{date(row.sent_at,locale)}</td><td>{row.last_error_code||"—"}</td>
       <td>{row.can_retry?<button type="button" disabled={Boolean(busy)}
         onClick={()=>requeue(row)} className="dd-email-button outline">{busy===row.id?t.retryBusy:t.requeue}</button>:"—"}</td>
      </tr>)}</tbody></table></div>:<div className="dd-email-guard">{t.noRows}</div>}
     <footer className="dd-email-pages">
      <span>{t.count}: {data.total.toLocaleString(locale==="ar"?"ar-EG":"en-US")} · {t.page} {page+1} {t.of} {pageCount}</span>
      <div><button type="button" className="dd-email-button outline" onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page<=0}>{t.previous}</button>
       <button type="button" className="dd-email-button outline" onClick={()=>setPage(p=>p+1)} disabled={page+1>=pageCount}>{t.next}</button></div>
     </footer>
    </section>
    <p className="dd-email-help">{t.hint}</p><p className="dd-email-help">{t.worker}</p>
   </>}
  </div>
 </main>;
}
