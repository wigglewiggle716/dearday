"use client";

import Link from "next/link";
import {useEffect,useMemo,useRef,useState} from "react";
import {authClient,EMPLOYEE_ROLES,readCurrentAccount,rememberPreference} from "../lib/auth-client";
import {useAuthSession} from "./auth-session-provider";
import {pathFor} from "../lib/locales";

const STATES=["new","in_progress","awaiting_customer","resolved","closed"];
const REVIEW_ROLES=new Set(["super_admin","admin","customer_support"]);
const PAGE=30;
const texts={
 ar:{
  title:"رسائل خدمة العملاء",intro:"الرسائل والاستفسارات وطلبات تصميم الكيك، مع سجل متابعة داخلي.",
  back:"بوابة الفريق",refresh:"تحديث",loading:"جاري تحميل رسائل الدعم…",error:"تعذر تحميل الرسائل. تحقق من الاتصال أو صلاحيات الحساب.",
  restricted:"الصندوق متاح فقط للموظفين المصرّح لهم بمراجعة بيانات العملاء.",
  signIn:"تسجيل الدخول",setup:"تفعيل التحقق بخطوتين",mfa:"إكمال التحقق بخطوتين",
  search:"ابحث برقم التذكرة أو الاسم أو البريد أو الموضوع",all:"كل الحالات",allKinds:"كل أنواع الرسائل",contact:"رسالة تواصل",cake:"طلب تصميم كيك",
  total:"الرسائل",new:"جديد",progress:"قيد المتابعة",finished:"تم الحل / أُغلق",reference:"رقم التذكرة",
  name:"الاسم",subject:"الموضوع",kind:"النوع",status:"الحالة",created:"تاريخ الاستلام",detail:"تفاصيل",close:"إغلاق",
  empty:"لا توجد رسائل مطابقة.",email:"البريد",phone:"الهاتف",language:"لغة الرسالة",message:"الرسالة",updated:"آخر تحديث",
  notes:"ملاحظات فريق الدعم",history:"سجل المتابعة",historyEmpty:"لا توجد متابعة مسجلة.",historyError:"تعذر تحميل سجل المتابعة.",
  review:"تحديث التذكرة",save:"حفظ التحديث",saving:"جاري الحفظ…",readOnly:"هذا الحساب لديه صلاحية عرض فقط؛ تعديل الرسائل يتطلب دور خدمة عملاء مصرحًا.",
  saved:"تم حفظ التحديث وتسجيله في سجل المتابعة.",saveError:"تعذر تحديث الرسالة؛ ربما انتهت الجلسة أو تغيّرت الصلاحيات.",
  confirm:"تأكيد تغيير حالة رسالة خدمة العملاء على قاعدة البيانات الفعلية؟",
  manualEmail:"الرد عبر البريد يدويًا",call:"اتصال",notSent:"هذه الأزرار تفتح تطبيق البريد أو الهاتف فقط، ولا تُرسل رسالة تلقائيًا.",
  referenceImage:"صورة مرجعية خاصة بطلب الكيك",openImage:"فتح الصورة الخاصة",imageError:"تعذر فتح الصورة؛ راجع الصلاحيات والمرفق.",
  page:"صفحة",of:"من",previous:"السابق",next:"التالي",limit:"يتم عرض أحدث 250 رسالة فقط حاليًا. يلزم مراجعة التصفح الكامل لو زاد العدد.",
  states:{new:"جديد",in_progress:"قيد المتابعة",awaiting_customer:"في انتظار العميل",resolved:"تم الحل",closed:"مغلق"}
 },
 en:{
  title:"Customer Support Inbox",intro:"Contact enquiries, custom cake requests and internal support history.",
  back:"Staff workspace",refresh:"Refresh",loading:"Loading support tickets…",error:"Could not load tickets. Check the connection or permissions.",
  restricted:"This inbox requires authorised customer-data access.",
  signIn:"Log in",setup:"Set up authenticator",mfa:"Complete two-step verification",
  search:"Search ticket number, name, email or subject",all:"All statuses",allKinds:"All types",contact:"Contact message",cake:"Custom cake request",
  total:"Tickets",new:"New",progress:"In progress",finished:"Resolved / closed",reference:"Ticket",
  name:"Name",subject:"Subject",kind:"Type",status:"Status",created:"Received",detail:"Details",close:"Close",
  empty:"No matching tickets.",email:"Email",phone:"Phone",language:"Message language",message:"Message",updated:"Last updated",
  notes:"Internal support notes",history:"Activity history",historyEmpty:"No activity recorded.",historyError:"Could not load ticket history.",
  review:"Update ticket",save:"Save update",saving:"Saving…",readOnly:"Your account has view-only access. Ticket updates require an authorised customer support role.",
  saved:"Ticket updated and recorded in the activity log.",saveError:"Could not update ticket. Your session or permissions may have changed.",
  confirm:"Confirm updating this support ticket in the live Dear Day database?",
  manualEmail:"Reply by email manually",call:"Call",notSent:"These links open an email or phone app only. They do not automatically send messages.",
  referenceImage:"Private cake reference image",openImage:"Open private image",imageError:"Could not open the private image. Check file permissions.",
  page:"Page",of:"of",previous:"Previous",next:"Next",limit:"The newest 250 tickets are shown. Add server-side pagination if volume exceeds this limit.",
  states:{new:"New",in_progress:"In progress",awaiting_customer:"Awaiting customer",resolved:"Resolved",closed:"Closed"}
 }
};
const listFields="id,ticket_no,name,email,phone,subject,message,locale,status,internal_notes,created_at,updated_at,request_kind,reference_image_path,reference_image_name";
const eventFields="id,previous_status,next_status,note,created_at";
function date(value,locale){
 if(!value)return "—";const d=new Date(value);
 return Number.isNaN(d.getTime())?"—":new Intl.DateTimeFormat(locale==="ar"?"ar-EG":"en-GB",{dateStyle:"medium",timeStyle:"short"}).format(d);
}
function ticketRef(no){return "DD-CS-"+String(no||0).padStart(6,"0");}
function Detail({title,children}){return <div className="dd-cs-detail"><span>{title}</span><strong>{children||"—"}</strong></div>;}
export default function StaffSupport({locale="ar"}){
 const t=texts[locale]||texts.ar;
 const session=useAuthSession(),active=session.status==="authenticated"&&EMPLOYEE_ROLES.has(session.role),uid=active?session.user?.id:null;
 const client=useMemo(()=>typeof window==="undefined"?null:authClient(rememberPreference()),[]);
 const [data,setData]=useState({stage:"loading",tickets:[],perms:[]}),[version,setVersion]=useState(0);
 const [filter,setFilter]=useState(""),[kind,setKind]=useState(""),[search,setSearch]=useState(""),[page,setPage]=useState(0);
 const [selected,setSelected]=useState(null),[events,setEvents]=useState({stage:"loading",rows:[]});
 const [review,setReview]=useState({status:"new",notes:""}),[busy,setBusy]=useState(false),[fileBusy,setFileBusy]=useState(false);
 const [success,setSuccess]=useState(""),[error,setError]=useState("");
 const request=useRef(0),historySeq=useRef(0),dialog=useRef(null);
 const canView=data.stage==="ready",canReview=canView&&data.perms.includes("customers.view")&&REVIEW_ROLES.has(session.role);
 const ticket=selected&&data.tickets.find(x=>x.id===selected);
 const reload=()=>setVersion(n=>n+1);
 useEffect(()=>{
  const req=++request.current;
  if(!uid||!client){setData({stage:"loading",tickets:[],perms:[]});return;}
  setData({stage:"loading",tickets:[],perms:[]});
  (async()=>{
   try{
    const p=await client.rpc("get_my_permissions");
    if(p.error)throw p.error;
    const perms=(p.data||[]).map(x=>x.permission_code);
    if(!perms.includes("customers.view")){
     if(req===request.current)setData({stage:"denied",tickets:[],perms:[]});return;
    }
    const r=await client.from("support_tickets").select(listFields).order("created_at",{ascending:false}).limit(250);
    if(r.error)throw r.error;
    if(req===request.current)setData({stage:"ready",tickets:r.data||[],perms});
   }catch{if(req===request.current)setData({stage:"error",tickets:[],perms:[]});}
  })();
  return()=>{request.current++;};
 },[uid,client,version]);
 useEffect(()=>{
  const req=++historySeq.current;
  if(!selected||!canView||!client){setEvents({stage:"loading",rows:[]});return;}
  setEvents({stage:"loading",rows:[]});
  (async()=>{
   const r=await client.from("support_ticket_events").select(eventFields).eq("ticket_id",selected).order("created_at",{ascending:false}).limit(40);
   if(req===historySeq.current)setEvents({stage:r.error?"error":"ready",rows:r.error?[]:r.data||[]});
  })().catch(()=>{if(req===historySeq.current)setEvents({stage:"error",rows:[]});});
  return()=>{historySeq.current++;};
 },[selected,canView,client,version]);
 useEffect(()=>{
  if(!selected)return;
  const prev=document.activeElement;
  document.body.style.overflow="hidden";dialog.current?.focus();
  const key=e=>{if(e.key==="Escape"&&!busy)setSelected(null);};
  window.addEventListener("keydown",key);
  return()=>{document.body.style.overflow="";window.removeEventListener("keydown",key);if(prev instanceof HTMLElement)prev.focus();};
 },[Boolean(selected),busy]);

 function showTicket(x){
  setSelected(x.id);setReview({status:x.status,notes:x.internal_notes||""});setError("");
 }
 async function saveReview(){
  if(!ticket||!canReview||busy||!STATES.includes(review.status)||review.notes.length>4000)return;
  if(!window.confirm(t.confirm))return;
  setBusy(true);setError("");
  try{
   const account=await readCurrentAccount(client);
   if(account.status!=="authenticated"||account.user?.id!==uid||!REVIEW_ROLES.has(account.role))throw Error("not_allowed");
   const p=await client.rpc("get_my_permissions");
   if(p.error||!(p.data||[]).some(x=>x.permission_code==="customers.view"))throw Error("no_permission");
   const result=await client.rpc("review_support_ticket",{
    p_ticket_id:ticket.id,p_status:review.status,p_internal_notes:review.notes.trim()||null
   });
   if(result.error)throw result.error;
   setSelected(null);setSuccess(t.saved);reload();
  }catch{setError(t.saveError);}finally{setBusy(false);}
 }
 async function openImage(){
  if(!ticket?.reference_image_path||fileBusy||!canView)return;
  const win=window.open("about:blank","_blank");
  if(!win){setError(t.imageError);return;}
  win.opener=null;setFileBusy(true);setError("");
  try{
   const account=await readCurrentAccount(client);
   if(account.status!=="authenticated"||account.user?.id!==uid)throw Error("not_allowed");
   const p=await client.rpc("get_my_permissions");
   if(p.error||!(p.data||[]).some(x=>x.permission_code==="customers.view"))throw Error("no_permission");
   const signed=await client.storage.from("cake-design-references").createSignedUrl(ticket.reference_image_path,60);
   if(signed.error||!signed.data?.signedUrl)throw signed.error||Error("no_url");
   win.location.replace(signed.data.signedUrl);
  }catch{win.close();setError(t.imageError);}finally{setFileBusy(false);}
 }
 const filtered=data.tickets.filter(x=>{
  if(filter&&x.status!==filter)return false;
  if(kind&&(kind==="cake"?(x.request_kind!=="cake_design"):(x.request_kind==="cake_design")))return false;
  return !search.trim()||[ticketRef(x.ticket_no),x.name,x.email,x.phone,x.subject,x.message]
   .join(" ").toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
 });
 const maxPage=Math.max(1,Math.ceil(filtered.length/PAGE)),rows=filtered.slice(page*PAGE,(page+1)*PAGE);
 const gate=session.status==="mfa_setup_required"?{href:pathFor("security",locale),label:t.setup}:
 session.status==="mfa_required"?{href:pathFor("auth",locale)+"?mode=mfa",label:t.mfa}:
 session.status==="signed_out"?{href:pathFor("auth",locale)+"?next="+encodeURIComponent(pathFor("staffSupport",locale)),label:t.signIn}:null;
 return <main className="dd-staff-customer-support" id="main-content" dir={locale==="ar"?"rtl":"ltr"}>
  <div className="dd-cs-wrap">
   <header className="dd-cs-head">
    <div><Link href={pathFor("staffPortal",locale)}>{t.back} ↗</Link><h1>{t.title}</h1><p>{t.intro}</p></div>
    {canView&&<button type="button" className="dd-cs-outline" onClick={reload}>{t.refresh}</button>}
   </header>
   {!active?<section className="dd-cs-panel dd-cs-gate"><p>{session.status==="loading"?t.loading:t.restricted}</p>{gate&&<Link href={gate.href} className="dd-cs-primary">{gate.label}</Link>}</section>:
   data.stage==="loading"?<section className="dd-cs-panel dd-cs-gate" role="status">{t.loading}</section>:
   !canView?<section className="dd-cs-panel dd-cs-gate" role="alert">{data.stage==="denied"?t.restricted:t.error}<button type="button" className="dd-cs-outline" onClick={reload}>{t.refresh}</button></section>:<>
    {success&&<p className="dd-cs-success" role="status">{success}</p>}
    <div className="dd-cs-stats">
     <article><span>{t.total}</span><strong>{data.tickets.length}</strong></article>
     <article><span>{t.new}</span><strong>{data.tickets.filter(x=>x.status==="new").length}</strong></article>
     <article><span>{t.progress}</span><strong>{data.tickets.filter(x=>["in_progress","awaiting_customer"].includes(x.status)).length}</strong></article>
     <article><span>{t.finished}</span><strong>{data.tickets.filter(x=>["resolved","closed"].includes(x.status)).length}</strong></article>
    </div>
    <p className="dd-cs-hint">{t.limit}</p>
    <div className="dd-cs-filter">
     <input value={search} type="search" aria-label={t.search} placeholder={t.search} onChange={e=>{setSearch(e.target.value);setPage(0)}}/>
     <select value={filter} aria-label={t.status} onChange={e=>{setFilter(e.target.value);setPage(0)}}><option value="">{t.all}</option>
      {STATES.map(s=><option key={s} value={s}>{t.states[s]}</option>)}
     </select>
     <select value={kind} aria-label={t.kind} onChange={e=>{setKind(e.target.value);setPage(0)}}><option value="">{t.allKinds}</option><option value="contact">{t.contact}</option><option value="cake">{t.cake}</option></select>
    </div>
    <section className="dd-cs-panel">{rows.length?<div className="dd-cs-scroll"><table><thead><tr><th>{t.reference}</th><th>{t.name}</th><th>{t.subject}</th><th>{t.kind}</th><th>{t.status}</th><th>{t.created}</th><th></th></tr></thead>
     <tbody>{rows.map(x=><tr key={x.id}><td><strong dir="ltr">{ticketRef(x.ticket_no)}</strong></td><td>{x.name}<small>{x.email}</small></td>
      <td>{x.subject}</td><td>{x.request_kind==="cake_design"?t.cake:t.contact}</td>
      <td><span className={"dd-cs-pill s-"+x.status}>{t.states[x.status]||x.status}</span></td>
      <td>{date(x.created_at,locale)}</td><td><button type="button" className="dd-cs-outline small" onClick={()=>showTicket(x)}>{t.detail}</button></td>
     </tr>)}</tbody></table></div>:<p className="dd-cs-empty">{t.empty}</p>}
     <nav className="dd-cs-pages" aria-label={t.page}><span>{t.total}: {filtered.length} · {t.page} {page+1} {t.of} {maxPage}</span><div>
      <button className="dd-cs-outline small" type="button" disabled={page===0} onClick={()=>setPage(x=>x-1)}>{t.previous}</button>
      <button className="dd-cs-outline small" type="button" disabled={page+1>=maxPage} onClick={()=>setPage(x=>x+1)}>{t.next}</button>
     </div></nav>
    </section>
   </>}
  </div>
  {selected&&canView&&active&&<div className="dd-cs-overlay" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setSelected(null)}}>
   <section className="dd-cs-dialog" role="dialog" aria-modal="true" ref={dialog} tabIndex={-1} aria-labelledby="dd-cs-dialog-title">
    <header><h2 id="dd-cs-dialog-title">{t.detail}: {ticket?ticketRef(ticket.ticket_no):"—"}</h2><button type="button" aria-label={t.close} onClick={()=>setSelected(null)} disabled={busy}>×</button></header>
    {ticket&&<div className="dd-cs-dialog-body">
     <div className="dd-cs-grid">
      <Detail title={t.reference}>{ticketRef(ticket.ticket_no)}</Detail><Detail title={t.created}>{date(ticket.created_at,locale)}</Detail>
      <Detail title={t.name}>{ticket.name}</Detail><Detail title={t.email}>{ticket.email}</Detail>
      <Detail title={t.phone}>{ticket.phone}</Detail><Detail title={t.language}>{ticket.locale==="en"?"English":"العربية"}</Detail>
      <Detail title={t.subject}>{ticket.subject}</Detail><Detail title={t.status}>{t.states[ticket.status]||ticket.status}</Detail>
      <Detail title={t.message}>{ticket.message}</Detail><Detail title={t.updated}>{date(ticket.updated_at,locale)}</Detail>
     </div>
     <div className="dd-cs-actions">
      {ticket.email&&<a className="dd-cs-outline" href={"mailto:"+ticket.email.replace(/[\r\n<>]/g,"").trim()}>{t.manualEmail}</a>}
      {ticket.phone&&<a className="dd-cs-outline" href={"tel:"+ticket.phone.replace(/[^\d+]/g,"")}>{t.call}</a>}
      {ticket.request_kind==="cake_design"&&ticket.reference_image_path&&<button type="button" className="dd-cs-outline" disabled={fileBusy} onClick={openImage}>{fileBusy?t.loading:t.openImage}</button>}
     </div>
     <p className="dd-cs-hint">{t.notSent}</p>
     <section className="dd-cs-section">
      <h3>{t.review}</h3>
      <label className="dd-cs-label">{t.status}<select value={review.status} disabled={!canReview||busy} onChange={e=>setReview(r=>({...r,status:e.target.value}))}>
       {STATES.map(s=><option value={s} key={s}>{t.states[s]}</option>)}
      </select></label>
      <label className="dd-cs-label">{t.notes}<textarea value={review.notes} maxLength={4000} rows={3} disabled={!canReview||busy} onChange={e=>setReview(r=>({...r,notes:e.target.value}))}/></label>
      {error&&<p className="dd-cs-error" role="alert">{error}</p>}
      {canReview?<button className="dd-cs-primary" type="button" disabled={busy} onClick={saveReview}>{busy?t.saving:t.save}</button>:<p className="dd-cs-hint">{t.readOnly}</p>}
     </section>
     <section className="dd-cs-section"><h3>{t.history}</h3>
      {events.stage==="loading"?<p>{t.loading}</p>:events.stage==="error"?<p>{t.historyError}</p>:events.rows.length?
       <div className="dd-cs-cards">{events.rows.map(e=><article key={e.id}><strong>{date(e.created_at,locale)}</strong>
        <p>{t.states[e.previous_status]||e.previous_status||t.new} → {t.states[e.next_status]||e.next_status}</p>
        {e.note&&<p>{e.note}</p>}</article>)}</div>:<p>{t.historyEmpty}</p>}
     </section>
    </div>}
   </section>
  </div>}
 </main>;
}
