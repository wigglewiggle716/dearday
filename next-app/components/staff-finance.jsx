"use client";
import Link from "next/link";
import {useEffect,useMemo,useRef,useState} from "react";
import {authClient,EMPLOYEE_ROLES,readCurrentAccount,rememberPreference} from "../lib/auth-client";
import {useAuthSession} from "./auth-session-provider";
import {pathFor} from "../lib/locales";

const MAX=600,PAGE=25;
const SET_FIELDS="id,partner_id,period_start,period_end,gross_amount,commission_amount,adjustments,partner_net,currency,status,payment_reference,notes,created_by,approved_by,approved_at,paid_at,created_at,updated_at";
const ORDER_FIELDS="id,partner_id,status,subtotal,commission_amount,partner_net,completed_at";
const dictionary={
 ar:{
  title:"المالية والتسويات",intro:"من طلبات الشركاء المكتملة إلى العمولة وصافي المستحقات وتسجيل التحويلات.",
  back:"بوابة الفريق",ordersLink:"الطلبات",cancellationsLink:"الإلغاءات والاسترداد",reload:"تحديث",
  loading:"جاري تحميل بيانات المالية…",denied:"الصفحة متاحة فقط للموظفين المصرح لهم ببيانات المالية.",
  failed:"تعذر تحميل بيانات المالية. حاول مرة أخرى.",signIn:"تسجيل الدخول",setup:"تفعيل التحقق بخطوتين",mfa:"إكمال التحقق بخطوتين",
  unsettled:"صافي المستحقات غير المسوّاة",draftTotal:"مسودات التسوية",approvedTotal:"التسويات المعتمدة",paidTotal:"المسجل كمدفوع",
  summary:"ملخص من النتائج المحمّلة",partial:"بعض السجلات أقدم من حد العرض؛ الأرقام الظاهرة جزئية وليست إجماليات حسابية نهائية.",
  add:"إنشاء تسوية جديدة",new:"إنشاء مسودة تسوية",settlements:"التسويات",eligible:"طلبات الشركاء المكتملة وغير المسوّاة",
  partner:"الشريك",period:"الفترة",from:"من",to:"إلى",gross:"قيمة الطلبات",commission:"عمولة Dear Day",adjustments:"التسويات الإضافية",
  net:"صافي مستحقات الشريك",status:"الحالة",reference:"مرجع التحويل",notes:"ملاحظات",created:"تاريخ الإنشاء",
  completed:"اكتمال الطلب",action:"الإجراء",date:"تاريخ العملية",count:"عدد الطلبات",view:"تفاصيل",approve:"اعتماد",
  mark:"تسجيل كمدفوعة",save:"إنشاء مسودة",cancel:"إلغاء",close:"إغلاق",
  filter:"ابحث باسم الشريك أو المرجع",all:"كل الحالات",allPartners:"كل الشركاء",none:"لا توجد تسويات مطابقة.",
  noEligible:"لا توجد طلبات مكتملة غير مسوّاة ضمن البيانات المحمّلة.",selected:"التسوية المحددة",
  lines:"بنود التسوية",noLines:"لا توجد بنود مسجلة.",readOnly:"صلاحية عرض فقط — لا يمكنك إنشاء تسوية أو اعتمادها أو تسجيل الدفع.",
  paidWarning:"هذا الإجراء لا يحوّل الأموال. لا تضغط «تسجيل كمدفوعة» إلا بعد التأكد من تحويل المبلغ الحقيقي للشريك خارج Dear Day.",
  createHint:"إنشاء مسودة يجمع تلقائيًا طلبات هذا الشريك المكتملة خلال الفترة وغير المرتبطة بأي تسوية سابقة. حساب Supabase النهائي هو المعتمد.",
  confirmationCreate:"تأكيد إنشاء مسودة تسوية في قاعدة Dear Day الفعلية؟ سيُربط بها كل طلب شريك مكتمل غير مسوّى في الفترة المحددة.",
  confirmationApprove:"هل راجعت الطلبات والعمولة والتعديلات، وتؤكد اعتماد هذه التسوية؟",
  confirmationPaid:"هل تم تحويل صافي قيمة التسوية للشريك بالفعل خارج الموقع، وتحققت من المرجع والمبلغ؟ سيتم تسجيلها كمدفوعة في Dear Day.",
  referenceRequired:"أدخل رقم مرجع التحويل الحقيقي قبل تسجيل الدفع.",badDates:"حدد شريكًا وفترة صحيحة؛ تاريخ النهاية لازم يكون بعد البداية أو مساويًا له.",
  badAdjustment:"أدخل تعديلات مالية رقمية صحيحة في حدود مليون جنيه، بدقتين عشريتين.",
  noPermission:"ليس لديك صلاحية تنفيذ الإجراء.",failedSave:"تعذر تنفيذ الإجراء. ربما تغيرت الحالة أو الصلاحية؛ حدث البيانات.",
  saved:"تم إنشاء مسودة التسوية. لم يحدث تحويل مالي.",approved:"تم اعتماد التسوية. لم يحدث تحويل مالي.",
  marked:"تم تسجيل التسوية كمدفوعة بعد إقرارك بتنفيذ التحويل الخارجي.",
  working:"جاري الحفظ…",bankReference:"رقم تحويل بنكي/محفظة/وسيلة الدفع الخارجي",refreshFirst:"تغيرت حالة التسوية؛ راجع الصفحة.",
  page:"صفحة",of:"من",previous:"السابق",next:"التالي",loaded:"نتائج محمّلة",limit:"لكل جدول سقف تحميل 600 سجل؛ لو الأعداد أكبر يلزم استعلامات تجميع وتصفح من السيرفر قبل الاعتماد.",
  verification:"تأكيد دفع التسوية ليس معاملة دفع بنكية أو API لبوابة دفع. إثبات التحويل والمراجعة المحاسبية مطلوبان.",
  policy:"مراجعة مالية لازمة قبل اعتماد الإنتاج: قاعدة البيانات تسمح لنفس finance.manage بإنشاء واعتماد وتسجيل دفع التسوية.",
  already:"مستخدم بالفعل في تسوية",eligibleCount:"عدد الطلبات غير المسوّاة",statusText:{draft:"مسودة",approved:"معتمدة",paid:"مدفوعة",cancelled:"ملغاة"},
  detailsTitle:"تفاصيل التسوية",detailsLoad:"جاري تحميل بنود التسوية…",detailsError:"تعذر تحميل بنود التسوية.",detailsLimit:"أول 100 بند فقط؛ يلزم pagination إن كانت التسوية أكبر."
 },
 en:{
  title:"Finance & Settlements",intro:"Track completed partner orders, Dear Day commissions, net payables and recorded transfers.",
  back:"Staff workspace",ordersLink:"Orders",cancellationsLink:"Cancellations & Refunds",reload:"Refresh",
  loading:"Loading finance data…",denied:"This page requires finance-view permission.",
  failed:"Could not load finance data. Try again.",signIn:"Log in",setup:"Set up two-step verification",mfa:"Complete two-step verification",
  unsettled:"Unsettled partner net",draftTotal:"Draft settlements",approvedTotal:"Approved settlements",paidTotal:"Recorded as paid",
  summary:"Summary of loaded rows",partial:"Older rows exceeded the display cap. These sums are partial, not accounting-grade final totals.",
  add:"New settlement",new:"Create draft settlement",settlements:"Settlements",eligible:"Completed, unsettled partner orders",
  partner:"Partner",period:"Period",from:"From",to:"To",gross:"Gross",commission:"Dear Day commission",adjustments:"Adjustments",
  net:"Partner net",status:"Status",reference:"Transfer reference",notes:"Notes",created:"Created",
  completed:"Completed",action:"Action",date:"Date",count:"Order count",view:"Details",approve:"Approve",
  mark:"Record paid",save:"Create draft",cancel:"Cancel",close:"Close",
  filter:"Search partner or reference",all:"All statuses",allPartners:"All partners",none:"No matching settlements.",
  noEligible:"No completed, unsettled orders in the loaded results.",selected:"Selected settlement",
  lines:"Settlement items",noLines:"No settlement items.",readOnly:"Read-only access — you cannot create, approve or mark settlements as paid.",
  paidWarning:"This action does not transfer money. Only record 'Paid' after independently verifying the real partner transfer outside Dear Day.",
  createHint:"Creates a draft from this partner's completed orders in the chosen period that were not linked to a prior settlement. Supabase calculates the authoritative final amount.",
  confirmationCreate:"Create this settlement draft in the live Dear Day database? All currently eligible completed partner orders in the period will be linked.",
  confirmationApprove:"Have you verified the orders, commission and adjustments and want to approve this settlement?",
  confirmationPaid:"Have you independently completed the exact partner transfer outside Dear Day and verified its reference and amount? It will be marked paid in Dear Day.",
  referenceRequired:"Enter the actual transfer reference before recording payment.",
  badDates:"Choose a partner and valid date range (end on or after start).",
  badAdjustment:"Enter valid adjustments within ±1,000,000 EGP, with two decimal places.",
  noPermission:"You cannot perform that operation.",failedSave:"Action failed. Status or permission may have changed; refresh.",
  saved:"Draft settlement created. No funds were transferred.",approved:"Settlement approved. No funds were transferred.",
  marked:"Settlement marked as paid after your external-transfer confirmation.",
  working:"Saving…",bankReference:"Bank / wallet / payment-provider transfer reference",refreshFirst:"This settlement status changed. Refresh first.",
  page:"Page",of:"of",previous:"Previous",next:"Next",loaded:"Loaded results",limit:"Each table is capped at 600 rows; use server aggregation and pagination before production use at larger volumes.",
  verification:"Recording settlement payment is not a bank transfer or payment-provider API. Independently verify receipts and reconciliation.",
  policy:"Before production: the backend currently allows one finance.manage employee to create, approve and mark paid.",
  already:"Already linked to settlement",eligibleCount:"Unsettled order count",statusText:{draft:"Draft",approved:"Approved",paid:"Paid",cancelled:"Cancelled"},
  detailsTitle:"Settlement details",detailsLoad:"Loading settlement items…",detailsError:"Couldn't load settlement items.",detailsLimit:"First 100 items shown; add pagination for larger settlements."
 }
};
function money(v,currency,locale){if(v==null)return "—";try{return new Intl.NumberFormat(locale==="ar"?"ar-EG":"en-EG",{style:"currency",currency:currency||"EGP",maximumFractionDigits:2}).format(Number(v));}catch{return String(v)+" EGP"}}
function day(v,locale){if(!v)return "—";const d=new Date(v);return Number.isNaN(d.getTime())?"—":new Intl.DateTimeFormat(locale==="ar"?"ar-EG":"en-GB",{day:"numeric",month:"short",year:"numeric",timeZone:"Africa/Cairo"}).format(d)}
function localDate(){const p=new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Cairo",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());const a=Object.fromEntries(p.map(x=>[x.type,x.value]));return [a.year,a.month,a.day].join("-");}
function firstOfMonth(d){return String(d).slice(0,7)+"-01";}
function validAdjustment(x){if(!/^-?\d+(?:\.\d{1,2})?$/.test(String(x).trim()))return false;const n=Number(x);return Number.isFinite(n)&&Math.abs(n)<=1000000;}
async function paged(client,table,fields,sort,filters,cap=MAX){
 const out=[];let exhausted=false;
 while(out.length<cap+1){
  let query=client.from(table).select(fields);
  for(const [field,operator,value] of filters){query=query[operator](field,value);}
  const max=Math.min(200,cap+1-out.length);
  const result=await query.order(sort,{ascending:false}).range(out.length,out.length+max-1);
  if(result.error)throw result.error;
  const chunk=result.data||[];
  out.push(...chunk);
  if(chunk.length<max){exhausted=true;break;}
 }
 return {rows:out.slice(0,cap),overflow:!exhausted};
}
export default function StaffFinance({locale="ar"}){
 const t=dictionary[locale]||dictionary.ar;
 const session=useAuthSession(),active=session.status==="authenticated"&&EMPLOYEE_ROLES.has(session.role),uid=active?session.user?.id:null;
 const client=useMemo(()=>typeof window==="undefined"?null:authClient(rememberPreference()),[]);
 const [data,setData]=useState({stage:"loading",permissions:[],partners:[],settlements:[],eligible:[],overflow:false});
 const [rev,setRev]=useState(0),[filter,setFilter]=useState(""),[partnerFilter,setPartnerFilter]=useState(""),[statusFilter,setStatusFilter]=useState(""),[page,setPage]=useState(0);
 const [form,setForm]=useState(null),[selected,setSelected]=useState(null),[paymentRef,setPaymentRef]=useState("");
 const [items,setItems]=useState({stage:"loading",rows:[],overflow:false});
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const seq=useRef(0),detailSeq=useRef(0),dlg=useRef(null);
 const ready=data.stage==="ready";
 const canManage=ready&&data.permissions.includes("finance.manage");
 const canView=ready&&data.permissions.includes("finance.view");
 const partnerName=id=>{const p=data.partners.find(x=>x.id===id);return (locale==="en"?p?.name_en||p?.name_ar:p?.name_ar||p?.name_en)||"—";}
 const refresh=()=>setRev(v=>v+1);
 useEffect(()=>{
  const run=++seq.current;
  if(!uid||!client){setData({stage:"loading",permissions:[],partners:[],settlements:[],eligible:[],overflow:false});return;}
  setData({stage:"loading",permissions:[],partners:[],settlements:[],eligible:[],overflow:false});
  (async()=>{
   try{
    const p=await client.rpc("get_my_permissions");
    if(p.error)throw p.error;
    const perms=(p.data||[]).map(x=>x.permission_code);
    if(!perms.includes("finance.view")){if(run===seq.current)setData(x=>({...x,stage:"denied"}));return;}
    const [partners,settlements,used,completed]=await Promise.all([
     paged(client,"partner_directory","id,name_ar,name_en","name_ar",[],MAX),
     paged(client,"partner_settlements",SET_FIELDS,"created_at",[],MAX),
     paged(client,"settlement_items","partner_order_id,settlement_id","partner_order_id",[],MAX),
     paged(client,"partner_orders",ORDER_FIELDS,"completed_at",[["status","eq","completed"]],MAX)
    ]);
    if(run!==seq.current)return;
    const usedIds=new Set(used.rows.map(x=>x.partner_order_id));
    const eligible=completed.rows.filter(x=>!usedIds.has(x.id));
    const overflow=[partners,settlements,used,completed].some(x=>x.overflow);
    setData({stage:"ready",permissions:perms,partners:partners.rows,settlements:settlements.rows,eligible,overflow});
   }catch{if(run===seq.current)setData(x=>({...x,stage:"error"}));}
  })();
  return()=>{seq.current++;};
 },[uid,client,rev]);

 useEffect(()=>{
  const req=++detailSeq.current;
  if(!selected||!canView||!client){setItems({stage:"loading",rows:[],overflow:false});return;}
  setItems({stage:"loading",rows:[],overflow:false});
  (async()=>{
   const r=await client.from("settlement_items").select("settlement_id,partner_order_id,gross_amount,commission_amount,partner_net").eq("settlement_id",selected.id).limit(101);
   if(detailSeq.current===req)setItems({stage:r.error?"error":"ready",rows:(r.data||[]).slice(0,100),overflow:(r.data||[]).length>100});
  })().catch(()=>{if(detailSeq.current===req)setItems({stage:"error",rows:[],overflow:false})});
  return()=>{detailSeq.current++;};
 },[selected?.id,canView,client,rev]);

 useEffect(()=>{
  if(!selected&&!form)return;
  const prev=document.activeElement;
  document.body.style.overflow="hidden";dlg.current?.focus();
  const onKey=e=>{if(e.key==="Escape"&&!busy){setSelected(null);setForm(null);}};
  window.addEventListener("keydown",onKey);
  return()=>{document.body.style.overflow="";window.removeEventListener("keydown",onKey);if(prev instanceof HTMLElement)prev.focus();};
 },[!!selected,!!form,busy]);

 async function authorised(){
  if(!canManage||!client)throw Error("permission");
  const who=await readCurrentAccount(client);
  if(who.status!=="authenticated"||who.user?.id!==uid||!EMPLOYEE_ROLES.has(who.role))throw Error("session");
  const r=await client.rpc("get_my_permissions");
  if(r.error||!(r.data||[]).some(x=>x.permission_code==="finance.manage"))throw Error("permission");
 }
 function createOpen(){
  if(!canManage)return;
  const now=localDate();setForm({partner_id:"",start:firstOfMonth(now),end:now,adjustments:"0",notes:""});
  setSelected(null);setError("");setPaymentRef("");
 }
 async function create(event){
  event.preventDefault();
  if(!form||!canManage||busy)return;
  if(!form.partner_id||!data.partners.some(p=>p.id===form.partner_id)||!form.start||!form.end||form.end<form.start){setError(t.badDates);return;}
  if(!validAdjustment(form.adjustments)){setError(t.badAdjustment);return;}
  if(!window.confirm(t.confirmationCreate))return;
  setBusy(true);setError("");setNotice("");
  try{
   await authorised();
   const r=await client.rpc("finance_create_settlement",{
    p_partner_id:form.partner_id,p_period_start:form.start,p_period_end:form.end,
    p_adjustments:Number(form.adjustments),p_notes:form.notes.trim().slice(0,1000)||null
   });
   if(r.error||!r.data)throw r.error||Error("no result");
   setForm(null);setNotice(t.saved);refresh();
  }catch{setError(t.failedSave)}finally{setBusy(false)}
 }
 async function change(status){
  if(!selected||!canManage||busy)return;
  if(!(selected.status==="draft"&&status==="approved"||selected.status==="approved"&&status==="paid"))return;
  if(status==="paid"&&!paymentRef.trim()){setError(t.referenceRequired);return;}
  if(!window.confirm(status==="paid"?t.confirmationPaid:t.confirmationApprove))return;
  setBusy(true);setError("");setNotice("");
  try{
   await authorised();
   const fresh=await client.from("partner_settlements").select("id,status,partner_net,payment_reference,updated_at").eq("id",selected.id).maybeSingle();
   if(fresh.error||!fresh.data||fresh.data.status!==selected.status||fresh.data.updated_at!==selected.updated_at)throw Error("stale");
   const result=await client.rpc("finance_update_settlement_status",{
    p_settlement_id:selected.id,p_status:status,p_payment_reference:status==="paid"?paymentRef.trim().slice(0,160):null
   });
   if(result.error||result.data!==status)throw result.error||Error("not saved");
   setSelected(null);setNotice(status==="paid"?t.marked:t.approved);refresh();
  }catch{setError(t.failedSave);}finally{setBusy(false)}
 }
 const filtered=data.settlements.filter(x=>{
  if(statusFilter&&x.status!==statusFilter)return false;
  if(partnerFilter&&x.partner_id!==partnerFilter)return false;
  return !filter.trim()||[partnerName(x.partner_id),x.payment_reference,x.status].join(" ").toLocaleLowerCase().includes(filter.trim().toLocaleLowerCase());
 });
 const pages=Math.max(1,Math.ceil(filtered.length/PAGE)),visible=filtered.slice(page*PAGE,(page+1)*PAGE);
 const sum=(values)=>values.reduce((a,x)=>a+Number(x.partner_net||0),0);
 const summary=[
  [t.unsettled,sum(data.eligible)],
  [t.draftTotal,sum(data.settlements.filter(x=>x.status==="draft"))],
  [t.approvedTotal,sum(data.settlements.filter(x=>x.status==="approved"))],
  [t.paidTotal,sum(data.settlements.filter(x=>x.status==="paid"))]
 ];
 const gate=session.status==="mfa_setup_required"?{href:pathFor("security",locale),label:t.setup}:
 session.status==="mfa_required"?{href:pathFor("auth",locale)+"?mode=mfa",label:t.mfa}:
 session.status==="signed_out"?{href:pathFor("auth",locale)+"?next="+encodeURIComponent(pathFor("staffFinance",locale)),label:t.signIn}:null;
 return <main className="dd-staff-finance" id="main-content" dir={locale==="ar"?"rtl":"ltr"}>
  <div className="dd-fin-wrap">
   <header className="dd-fin-head"><div><Link href={pathFor("staffPortal",locale)}>{t.back} ↗</Link><h1>{t.title}</h1><p>{t.intro}</p></div>
    {canView&&<div className="dd-fin-actions"><Link href={pathFor("staffOrders",locale)} className="dd-fin-secondary">{t.ordersLink}</Link>
     <Link href={pathFor("staffCancellations",locale)} className="dd-fin-secondary">{t.cancellationsLink}</Link>
     <button className="dd-fin-secondary" onClick={refresh} type="button">{t.reload}</button></div>}
   </header>
   {!active?<section className="dd-fin-panel dd-fin-gate"><p>{session.status==="loading"?t.loading:t.denied}</p>{gate&&<Link href={gate.href} className="dd-fin-primary">{gate.label}</Link>}</section>:
    data.stage==="loading"?<section className="dd-fin-panel dd-fin-gate" role="status">{t.loading}</section>:
    !canView?<section className="dd-fin-panel dd-fin-gate" role="alert">{data.stage==="denied"?t.denied:t.failed}<button className="dd-fin-secondary" type="button" onClick={refresh}>{t.reload}</button></section>:<>
    {notice&&<p className="dd-fin-success" role="status">{notice}</p>}
    {error&&!selected&&!form&&<p className="dd-fin-error" role="alert">{error}</p>}
    <p className="dd-fin-hint">{t.summary}{data.overflow?" — "+t.partial:""}</p>
    {data.overflow&&<p className="dd-fin-warning">{t.limit}</p>}
    <div className="dd-fin-stats">{summary.map(([label,value])=><article key={label}><span>{label}</span><strong dir="ltr">{money(value,"EGP",locale)}</strong></article>)}</div>
    <p className="dd-fin-warning">{t.policy}</p>
    <div className="dd-fin-toolbar"><h2>{t.settlements}</h2>{canManage&&<button type="button" className="dd-fin-primary" onClick={createOpen}>+ {t.add}</button>}</div>
    <div className="dd-fin-filters"><input type="search" value={filter} placeholder={t.filter} aria-label={t.filter} onChange={e=>{setFilter(e.target.value);setPage(0)}}/>
     <select aria-label={t.partner} value={partnerFilter} onChange={e=>{setPartnerFilter(e.target.value);setPage(0)}}><option value="">{t.allPartners}</option>
      {data.partners.map(x=><option key={x.id} value={x.id}>{partnerName(x.id)}</option>)}</select>
     <select aria-label={t.status} value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setPage(0)}}><option value="">{t.all}</option>
      {Object.keys(t.statusText).map(s=><option key={s} value={s}>{t.statusText[s]}</option>)}</select>
    </div>
    <section className="dd-fin-panel">
     {visible.length?<div className="dd-fin-scroll"><table><thead><tr>
      <th>{t.partner}</th><th>{t.period}</th><th>{t.gross}</th><th>{t.commission}</th><th>{t.adjustments}</th><th>{t.net}</th><th>{t.status}</th><th>{t.reference}</th><th>{t.action}</th>
     </tr></thead><tbody>
      {visible.map(x=><tr key={x.id}><td><strong>{partnerName(x.partner_id)}</strong></td>
       <td>{x.period_start} — {x.period_end}</td>
       <td dir="ltr">{money(x.gross_amount,x.currency,locale)}</td><td dir="ltr">{money(x.commission_amount,x.currency,locale)}</td>
       <td dir="ltr">{money(x.adjustments,x.currency,locale)}</td><td dir="ltr"><strong>{money(x.partner_net,x.currency,locale)}</strong></td>
       <td><span className={"dd-fin-status s-"+x.status}>{t.statusText[x.status]||x.status}</span></td><td dir="ltr">{x.payment_reference||"—"}</td>
       <td><button type="button" className="dd-fin-secondary small" onClick={()=>{setSelected(x);setPaymentRef("");setError("");}}>{t.view}</button></td></tr>)}
     </tbody></table></div>:<p className="dd-fin-empty">{t.none}</p>}
     <nav className="dd-fin-pages" aria-label={t.page}><span>{t.loaded}: {filtered.length} · {t.page} {page+1} {t.of} {pages}</span><div>
      <button className="dd-fin-secondary small" disabled={page===0} onClick={()=>setPage(p=>p-1)}>{t.previous}</button>
      <button className="dd-fin-secondary small" disabled={page+1>=pages} onClick={()=>setPage(p=>p+1)}>{t.next}</button>
     </div></nav>
    </section>
    <div className="dd-fin-toolbar"><h2>{t.eligible}</h2><span>{t.eligibleCount}: {data.eligible.length}</span></div>
    <section className="dd-fin-panel">{data.eligible.length?<div className="dd-fin-scroll"><table>
     <thead><tr><th>{t.partner}</th><th>{t.status}</th><th>{t.gross}</th><th>{t.commission}</th><th>{t.net}</th><th>{t.completed}</th></tr></thead>
     <tbody>{data.eligible.slice(0,150).map(x=><tr key={x.id}><td>{partnerName(x.partner_id)}</td><td>{x.status}</td>
      <td dir="ltr">{money(x.subtotal,"EGP",locale)}</td><td dir="ltr">{money(x.commission_amount,"EGP",locale)}</td>
      <td dir="ltr"><strong>{money(x.partner_net,"EGP",locale)}</strong></td><td>{day(x.completed_at,locale)}</td></tr>)}</tbody>
    </table></div>:<p className="dd-fin-empty">{t.noEligible}</p>}</section>
    <p className="dd-fin-hint">{t.verification}</p>
   </>}
  </div>
  {(form||selected)&&active&&canView&&<div className="dd-fin-overlay" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy){setForm(null);setSelected(null);setError("")}}}>
   <section className="dd-fin-dialog" role="dialog" aria-modal="true" ref={dlg} tabIndex={-1} aria-labelledby="dd-fin-title">
    <header><h2 id="dd-fin-title">{form?t.new:t.detailsTitle}</h2><button type="button" disabled={busy} aria-label={t.close} onClick={()=>{setForm(null);setSelected(null);setError("")}}>×</button></header>
    {form?<form onSubmit={create} className="dd-fin-form">
     <p className="dd-fin-hint">{t.createHint}</p>
     <div className="dd-fin-grid">
      <label>{t.partner}<select required value={form.partner_id} disabled={busy} onChange={e=>setForm(s=>({...s,partner_id:e.target.value}))}>
       <option value="">{t.allPartners}</option>{data.partners.map(x=><option value={x.id} key={x.id}>{partnerName(x.id)}</option>)}</select></label>
      <label>{t.from}<input type="date" required value={form.start} disabled={busy} onChange={e=>setForm(s=>({...s,start:e.target.value}))}/></label>
      <label>{t.to}<input type="date" required value={form.end} disabled={busy} onChange={e=>setForm(s=>({...s,end:e.target.value}))}/></label>
      <label>{t.adjustments} (EGP)<input type="number" min="-1000000" max="1000000" step="0.01" value={form.adjustments} disabled={busy} required onChange={e=>setForm(s=>({...s,adjustments:e.target.value}))}/></label>
      <label className="wide">{t.notes}<textarea rows={3} maxLength={1000} value={form.notes} disabled={busy} onChange={e=>setForm(s=>({...s,notes:e.target.value}))}/></label>
     </div>
     {error&&<p className="dd-fin-error" role="alert">{error}</p>}
     <footer><button type="submit" className="dd-fin-primary" disabled={busy}>{busy?t.working:t.save}</button>
      <button type="button" className="dd-fin-secondary" disabled={busy} onClick={()=>setForm(null)}>{t.cancel}</button></footer>
    </form>:selected&&<div className="dd-fin-detail">
     <div className="dd-fin-grid">
      {[[t.partner,partnerName(selected.partner_id)],[t.period,selected.period_start+" — "+selected.period_end],
       [t.gross,money(selected.gross_amount,selected.currency,locale)],
       [t.commission,money(selected.commission_amount,selected.currency,locale)],
       [t.adjustments,money(selected.adjustments,selected.currency,locale)],
       [t.net,money(selected.partner_net,selected.currency,locale)],
       [t.status,t.statusText[selected.status]||selected.status],[t.reference,selected.payment_reference||"—"],
       [t.notes,selected.notes||"—"],[t.created,day(selected.created_at,locale)]].map(([label,value])=>
        <div className="dd-fin-fact" key={label}><span>{label}</span><strong>{value}</strong></div>)}
     </div>
     <h3>{t.lines}</h3>
     {items.stage==="loading"?<p>{t.detailsLoad}</p>:items.stage==="error"?<p>{t.detailsError}</p>:items.rows.length?
      <div className="dd-fin-scroll"><table><thead><tr><th>{t.ordersLink}</th><th>{t.gross}</th><th>{t.commission}</th><th>{t.net}</th></tr></thead>
       <tbody>{items.rows.map(line=><tr key={line.partner_order_id}><td dir="ltr">{line.partner_order_id.slice(0,8)}…</td>
        <td dir="ltr">{money(line.gross_amount,selected.currency,locale)}</td>
        <td dir="ltr">{money(line.commission_amount,selected.currency,locale)}</td>
        <td dir="ltr">{money(line.partner_net,selected.currency,locale)}</td></tr>)}</tbody></table></div>:<p>{t.noLines}</p>}
     {items.overflow&&<p className="dd-fin-warning">{t.detailsLimit}</p>}
     {selected.status==="approved"&&canManage&&<>
      <p className="dd-fin-warning">{t.paidWarning} <strong>{money(selected.partner_net,selected.currency,locale)}</strong></p>
      <label className="dd-fin-reference">{t.bankReference}<input type="text" maxLength={160} value={paymentRef} disabled={busy} onChange={e=>setPaymentRef(e.target.value)}/></label>
     </>}
     {error&&<p role="alert" className="dd-fin-error">{error}</p>}
     <footer>
      {canManage&&selected.status==="draft"&&<button type="button" className="dd-fin-primary" disabled={busy} onClick={()=>change("approved")}>{busy?t.working:t.approve}</button>}
      {canManage&&selected.status==="approved"&&<button type="button" className="dd-fin-primary" disabled={busy} onClick={()=>change("paid")}>{busy?t.working:t.mark}</button>}
      {!canManage&&<span className="dd-fin-hint">{t.readOnly}</span>}
      <button type="button" className="dd-fin-secondary" disabled={busy} onClick={()=>{setSelected(null);setError("")}}>{t.close}</button>
     </footer>
    </div>}
   </section>
  </div>}
 </main>;
}
