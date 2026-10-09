"use client";

import Link from "next/link";
import {useEffect,useMemo,useRef,useState} from "react";
import {authClient,EMPLOYEE_ROLES,readCurrentAccount,rememberPreference} from "../lib/auth-client";
import {useAuthSession} from "./auth-session-provider";
import {pathFor} from "../lib/locales";

const PER_PAGE=30;
const localeText={
 ar:{
  title:"إدارة العملاء",intro:"مراجعة حسابات العملاء وطلباتهم وعناوينهم وفق الصلاحيات.",
  back:"بوابة الفريق",refresh:"تحديث البيانات",search:"ابحث بالاسم أو البريد أو رقم الهاتف أو المنطقة",
  all:"كل الحالات",active:"نشط",suspended:"موقوف",allCustomers:"إجمالي الحسابات",activeAccounts:"حسابات نشطة",suspendedAccounts:"حسابات موقوفة",
  name:"العميل",email:"البريد",phone:"الهاتف",area:"المنطقة",status:"الحالة",orders:"الطلبات",spent:"إجمالي الطلبات",last:"آخر طلب",registered:"تاريخ التسجيل",
  details:"التفاصيل",none:"لا توجد نتائج.",loading:"جاري تحميل حسابات العملاء…",failure:"تعذر تحميل العملاء. تحقق من الاتصال أو الصلاحيات.",denied:"هذه الصفحة متاحة فقط لموظفي Dear Day المصرح لهم بمراجعة بيانات العملاء.",
  signIn:"تسجيل الدخول",setup:"تفعيل التحقق بخطوتين",challenge:"إكمال التحقق بخطوتين",
  close:"إغلاق",birthday:"تاريخ الميلاد",addresses:"العناوين المحفوظة",noAddresses:"لا توجد عناوين محفوظة.",
  customerOrders:"آخر طلبات العميل",noOrders:"لا توجد طلبات لهذا العميل.",detailsFailed:"تعذر تحميل تفاصيل الحساب بالكامل.",
  address:"العنوان",default:"افتراضي",changeStatus:"إدارة حالة الحساب",suspend:"إيقاف حساب العميل",activate:"إعادة تفعيل الحساب",
  restricted:"العرض فقط — لا توجد صلاحية لتغيير حالة العميل.",busy:"جارٍ حفظ التغيير…",
  caution:"إيقاف الحساب يمنع استخدامه كحساب نشط، لكنه لا يحذف الطلبات أو البيانات التاريخية.",
  confirm:"هل تؤكد تغيير حالة الحساب في قاعدة Dear Day الحية؟",
  success:"تم تحديث حالة الحساب.",saveFail:"تعذر تغيير حالة الحساب. تحقق من الجلسة والصلاحيات.",
  deletionTitle:"طلبات حذف الحسابات",deletionPending:"طلبات تنتظر المراجعة",
  deletionHint:"معروضة للمشرف العام فقط. الحذف النهائي معطّل في نسخة React حاليًا لحين مراجعة مستقلة وآمنة.",
  deletionNone:"لا توجد طلبات حذف.",deletionError:"تعذر تحميل طلبات الحذف.",
  deletionDate:"تاريخ الطلب",deletionStatus:"حالة الطلب",deletionNote:"ملاحظة المشرف",
  page:"صفحة",of:"من",previous:"السابق",next:"التالي",total:"النتائج",
  more:"قد تُقيّد Supabase عدد نتائج دليل العملاء. يجب مراجعة التصفح الكامل قبل الإطلاق.",
  noPermission:"هذه البيانات غير متاحة.",
  orderStatuses:{draft:"مسودة",pending_payment:"بانتظار الدفع",paid:"مدفوع",confirmed:"مؤكد",in_progress:"قيد التنفيذ",completed:"مكتمل",cancelled:"ملغي",refunded:"مسترد"},
  deleteStatuses:{pending:"معلق",completed:"اكتمل",rejected:"مرفوض"}
 },
 en:{
  title:"Customer Management",intro:"Review customer profiles, addresses and orders within your staff permissions.",
  back:"Staff workspace",refresh:"Refresh",search:"Search names, email, phone or area",
  all:"All statuses",active:"Active",suspended:"Suspended",allCustomers:"Customer accounts",activeAccounts:"Active accounts",suspendedAccounts:"Suspended accounts",
  name:"Customer",email:"Email",phone:"Phone",area:"Area",status:"Status",orders:"Orders",spent:"Order value",last:"Last order",registered:"Registered",
  details:"Details",none:"No matching customers.",loading:"Loading customer accounts…",failure:"Could not load customers. Check access and connection.",denied:"This area requires authorised Dear Day customer-data permissions.",
  signIn:"Log in",setup:"Set up two-step verification",challenge:"Complete two-step verification",
  close:"Close",birthday:"Date of birth",addresses:"Saved addresses",noAddresses:"No saved addresses.",
  customerOrders:"Recent customer orders",noOrders:"No orders for this customer.",detailsFailed:"Could not fully load account details.",
  address:"Address",default:"Default",changeStatus:"Account status",suspend:"Suspend customer account",activate:"Reactivate customer account",
  restricted:"Read-only — you cannot change customer status.",busy:"Saving change…",
  caution:"Suspension blocks active account use but preserves historical orders and records.",
  confirm:"Confirm this account-status change in Dear Day's live database?",
  success:"Customer status updated.",saveFail:"Unable to change account status. Check your session and permissions.",
  deletionTitle:"Account deletion requests",deletionPending:"Pending deletion requests",
  deletionHint:"Visible only to Super Admins. Permanent deletion is deliberately disabled in React pending a separate controlled review.",
  deletionNone:"No deletion requests.",deletionError:"Could not load deletion requests.",
  deletionDate:"Requested",deletionStatus:"Request status",deletionNote:"Admin note",
  page:"Page",of:"of",previous:"Previous",next:"Next",total:"Matches",
  more:"Supabase may cap the number of directory results. Validate full pagination before release.",
  noPermission:"Data unavailable.",
  orderStatuses:{draft:"Draft",pending_payment:"Pending payment",paid:"Paid",confirmed:"Confirmed",in_progress:"In progress",completed:"Completed",cancelled:"Cancelled",refunded:"Refunded"},
  deleteStatuses:{pending:"Pending",completed:"Completed",rejected:"Rejected"}
 }
};
function date(value,locale){
 if(!value)return "—";const d=new Date(value);
 return Number.isNaN(d.getTime())?"—":new Intl.DateTimeFormat(locale==="ar"?"ar-EG":"en-GB",{day:"numeric",month:"short",year:"numeric"}).format(d);
}
function money(value,locale,currency="EGP"){
 try{return new Intl.NumberFormat(locale==="ar"?"ar-EG":"en-EG",{style:"currency",currency,maximumFractionDigits:0}).format(Number(value||0));}
 catch{return String(value??0)+" EGP";}
}
function displayName(c){return c.full_name||[c.first_name,c.last_name].filter(Boolean).join(" ")||"—";}
function LabelValue({label,children}){return <div className="dd-cs-detail"><span>{label}</span><strong>{children||"—"}</strong></div>;}
export default function StaffCustomers({locale="ar"}){
 const t=localeText[locale]||localeText.ar;
 const session=useAuthSession(),active=session.status==="authenticated"&&EMPLOYEE_ROLES.has(session.role),uid=active?session.user?.id:null;
 const client=useMemo(()=>typeof window==="undefined"?null:authClient(rememberPreference()),[]);
 const [data,setData]=useState({stage:"loading",customers:[],permissions:[],deletions:[],deletionError:false});
 const [version,setVersion]=useState(0),[needle,setNeedle]=useState(""),[status,setStatus]=useState(""),[page,setPage]=useState(0);
 const [selected,setSelected]=useState(null),[detail,setDetail]=useState({stage:"loading",addresses:[],orders:[]});
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[error,setError]=useState("");
 const req=useRef(0),detailReq=useRef(0),dialog=useRef(null);
 const canView=data.stage==="ready",canManage=canView&&data.permissions.includes("customers.manage");
 const customer=selected&&data.customers.find(x=>x.id===selected);
 const refresh=()=>setVersion(n=>n+1);
 useEffect(()=>{
  const current=++req.current;
  if(!uid||!client){setData({stage:"loading",customers:[],permissions:[],deletions:[],deletionError:false});return;}
  setData({stage:"loading",customers:[],permissions:[],deletions:[],deletionError:false});
  (async()=>{
   try{
    const response=await client.rpc("get_my_permissions");
    if(response.error)throw response.error;
    if(current!==req.current)return;
    const perms=(response.data||[]).map(x=>x.permission_code);
    if(!perms.includes("customers.view")){setData({stage:"denied",customers:[],permissions:[],deletions:[],deletionError:false});return;}
    const customers=await client.rpc("customer_list");
    if(customers.error)throw customers.error;
    let deletions=[],deletionError=false;
    if(session.role==="super_admin"){
     const result=await client.rpc("admin_account_deletion_list");
     if(result.error)deletionError=true;
     else deletions=result.data||[];
    }
    if(current===req.current)setData({stage:"ready",customers:customers.data||[],permissions:perms,deletions,deletionError});
   }catch{
    if(current===req.current)setData({stage:"error",customers:[],permissions:[],deletions:[],deletionError:false});
   }
  })();
  return()=>{req.current++;};
 },[uid,client,session.role,version]);
 useEffect(()=>{
  const current=++detailReq.current;
  if(!selected||!canView||!client){setDetail({stage:"loading",addresses:[],orders:[]});return;}
  setDetail({stage:"loading",addresses:[],orders:[]});
  (async()=>{
   const responses=await Promise.all([
    client.from("customer_addresses").select("id,label,recipient_name,phone,area,address_line1,address_line2,landmark,is_default").eq("user_id",selected).order("is_default",{ascending:false}).limit(20),
    client.from("orders").select("id,order_number,status,occasion_type,delivery_area,grand_total,currency,created_at").eq("customer_id",selected).order("created_at",{ascending:false}).limit(20)
   ]);
   if(current!==detailReq.current)return;
   setDetail({stage:responses.some(r=>r.error)?"partial":"ready",
    addresses:responses[0].error?[]:responses[0].data||[],
    orders:responses[1].error?[]:responses[1].data||[]});
  })().catch(()=>{if(current===detailReq.current)setDetail({stage:"error",addresses:[],orders:[]});});
  return()=>{detailReq.current++;};
 },[selected,canView,client,version]);
 useEffect(()=>{
  if(!selected)return;const prev=document.activeElement;document.body.style.overflow="hidden";dialog.current?.focus();
  const key=e=>{if(e.key==="Escape"&&!busy)setSelected(null)};
  window.addEventListener("keydown",key);
  return()=>{document.body.style.overflow="";window.removeEventListener("keydown",key);if(prev instanceof HTMLElement)prev.focus();};
 },[Boolean(selected),busy]);
 async function changeStatus(){
  if(!customer||!canManage||busy||!client)return;
  const next=!customer.is_active;
  if(!window.confirm(t.confirm))return;
  setBusy(true);setError("");
  try{
   const account=await readCurrentAccount(client);
   if(account.status!=="authenticated"||account.user?.id!==uid||!EMPLOYEE_ROLES.has(account.role))throw Error("session");
   const permissions=await client.rpc("get_my_permissions");
   if(permissions.error||!(permissions.data||[]).some(p=>p.permission_code==="customers.manage"))throw Error("permission");
   const result=await client.rpc("customer_set_active",{p_customer_id:customer.id,p_is_active:next});
   if(result.error)throw result.error;
   setSelected(null);setNotice(t.success);refresh();
  }catch{setError(t.saveFail);}finally{setBusy(false);}
 }
 const filtered=data.customers.filter(c=>{
  if(status==="active"&&!c.is_active)return false;
  if(status==="suspended"&&c.is_active)return false;
  const hay=[displayName(c),c.email,c.phone,c.area].join(" ").toLocaleLowerCase();
  return !needle.trim()||hay.includes(needle.trim().toLocaleLowerCase());
 });
 const pages=Math.max(1,Math.ceil(filtered.length/PER_PAGE));
 const rows=filtered.slice(page*PER_PAGE,(page+1)*PER_PAGE);
 const gate=session.status==="mfa_setup_required"?{href:pathFor("security",locale),label:t.setup}:
 session.status==="mfa_required"?{href:pathFor("auth",locale)+"?mode=mfa",label:t.challenge}:
 session.status==="signed_out"?{href:pathFor("auth",locale)+"?next="+encodeURIComponent(pathFor("staffCustomers",locale)),label:t.signIn}:null;
 return <main className="dd-staff-customer-support" id="main-content" dir={locale==="ar"?"rtl":"ltr"}>
  <div className="dd-cs-wrap">
   <header className="dd-cs-head"><div><Link href={pathFor("staffPortal",locale)}>{t.back} ↗</Link><h1>{t.title}</h1><p>{t.intro}</p></div>
    {canView&&<button type="button" className="dd-cs-outline" onClick={refresh}>{t.refresh}</button>}
   </header>
   {!active?<section className="dd-cs-panel dd-cs-gate"><p>{session.status==="loading"?t.loading:t.denied}</p>{gate&&<Link className="dd-cs-primary" href={gate.href}>{gate.label}</Link>}</section>:
    data.stage==="loading"?<section className="dd-cs-panel dd-cs-gate" role="status">{t.loading}</section>:
    !canView?<section className="dd-cs-panel dd-cs-gate" role="alert">{data.stage==="denied"?t.denied:t.failure}<button className="dd-cs-outline" type="button" onClick={refresh}>{t.refresh}</button></section>:<>
    {notice&&<p className="dd-cs-success" role="status">{notice}</p>}
    <div className="dd-cs-stats">
     <article><span>{t.allCustomers}</span><strong>{data.customers.length}</strong></article>
     <article><span>{t.activeAccounts}</span><strong>{data.customers.filter(x=>x.is_active).length}</strong></article>
     <article><span>{t.suspendedAccounts}</span><strong>{data.customers.filter(x=>!x.is_active).length}</strong></article>
    </div>
    <p className="dd-cs-hint">{t.more}</p>
    <div className="dd-cs-filter"><input type="search" value={needle} onChange={e=>{setNeedle(e.target.value);setPage(0)}} placeholder={t.search} aria-label={t.search}/>
     <select value={status} aria-label={t.status} onChange={e=>{setStatus(e.target.value);setPage(0)}}><option value="">{t.all}</option><option value="active">{t.active}</option><option value="suspended">{t.suspended}</option></select>
    </div>
    <section className="dd-cs-panel">
     {rows.length?<div className="dd-cs-scroll"><table><thead><tr><th>{t.name}</th><th>{t.email}</th><th>{t.phone}</th><th>{t.area}</th><th>{t.status}</th><th>{t.orders}</th><th>{t.spent}</th><th>{t.last}</th><th></th></tr></thead>
      <tbody>{rows.map(c=><tr key={c.id}><td><strong>{displayName(c)}</strong></td><td dir="ltr">{c.email||"—"}</td><td dir="ltr">{c.phone||"—"}</td><td>{c.area||"—"}</td>
       <td><span className={"dd-cs-pill "+(c.is_active?"active":"suspended")}>{c.is_active?t.active:t.suspended}</span></td><td>{c.order_count??0}</td>
       <td dir="ltr">{money(c.total_spend,locale)}</td><td>{date(c.last_order_at,locale)}</td><td><button type="button" className="dd-cs-outline small" onClick={()=>{setSelected(c.id);setError("")}}>{t.details}</button></td>
      </tr>)}</tbody></table></div>:<p className="dd-cs-empty">{t.none}</p>}
     <nav className="dd-cs-pages" aria-label={t.page}><span>{t.total}: {filtered.length} · {t.page} {page+1} {t.of} {pages}</span><div>
      <button className="dd-cs-outline small" type="button" disabled={page===0} onClick={()=>setPage(p=>p-1)}>{t.previous}</button>
      <button className="dd-cs-outline small" type="button" disabled={page+1>=pages} onClick={()=>setPage(p=>p+1)}>{t.next}</button>
     </div></nav>
    </section>
    {session.role==="super_admin"&&<section className="dd-cs-panel dd-cs-delete">
     <h2>{t.deletionTitle}</h2><p className="dd-cs-hint">{t.deletionHint}</p>
     {data.deletionError?<p role="alert">{t.deletionError}</p>:!data.deletions.length?<p>{t.deletionNone}</p>:
      <div className="dd-cs-scroll"><table><thead><tr><th>{t.name}</th><th>{t.email}</th><th>{t.deletionDate}</th><th>{t.deletionStatus}</th><th>{t.deletionNote}</th></tr></thead><tbody>
       {data.deletions.slice(0,100).map(x=><tr key={x.id}><td>{x.full_name||"—"}</td><td>{x.email||"—"}</td><td>{date(x.requested_at,locale)}</td><td>{t.deleteStatuses[x.status]||x.status}</td><td>{x.admin_note||"—"}</td></tr>)}
      </tbody></table></div>}
    </section>}
   </>}
  </div>
  {selected&&active&&canView&&<div className="dd-cs-overlay" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setSelected(null)}}>
   <section className="dd-cs-dialog" role="dialog" aria-modal="true" tabIndex={-1} ref={dialog} aria-labelledby="dd-cs-dialog-title">
    <header><h2 id="dd-cs-dialog-title">{displayName(customer||{})}</h2><button type="button" aria-label={t.close} disabled={busy} onClick={()=>setSelected(null)}>×</button></header>
    {customer&&<div className="dd-cs-dialog-body">
     <div className="dd-cs-grid">
      <LabelValue label={t.name}>{displayName(customer)}</LabelValue><LabelValue label={t.email}>{customer.email}</LabelValue>
      <LabelValue label={t.phone}>{customer.phone}</LabelValue><LabelValue label={t.area}>{customer.area}</LabelValue>
      <LabelValue label={t.birthday}>{customer.birth_date}</LabelValue>
      <LabelValue label={t.status}>{customer.is_active?t.active:t.suspended}</LabelValue>
      <LabelValue label={t.orders}>{customer.order_count}</LabelValue><LabelValue label={t.spent}>{money(customer.total_spend,locale)}</LabelValue>
     </div>
     <section className="dd-cs-section"><h3>{t.changeStatus}</h3>
      <p className="dd-cs-hint">{t.caution}</p>
      {canManage?<button type="button" className="dd-cs-primary" disabled={busy} onClick={changeStatus}>{busy?t.busy:customer.is_active?t.suspend:t.activate}</button>:<p className="dd-cs-hint">{t.restricted}</p>}
      {error&&<p className="dd-cs-error" role="alert">{error}</p>}
     </section>
     <section className="dd-cs-section"><h3>{t.addresses}</h3>
      {detail.stage==="loading"?<p>{t.loading}</p>:!detail.addresses.length?<p>{detail.stage==="ready"?t.noAddresses:t.detailsFailed}</p>:
       <div className="dd-cs-cards">{detail.addresses.map(a=><article key={a.id}>
        <strong>{a.label||t.address}{a.is_default?" · "+t.default:""}</strong>
        <p>{[a.address_line1,a.address_line2,a.area,a.landmark].filter(Boolean).join(" — ")}</p>
        <small>{[a.recipient_name,a.phone].filter(Boolean).join(" · ")}</small>
       </article>)}</div>}
     </section>
     <section className="dd-cs-section"><h3>{t.customerOrders}</h3>
      {detail.stage==="loading"?<p>{t.loading}</p>:!detail.orders.length?<p>{detail.stage==="ready"?t.noOrders:t.detailsFailed}</p>:
       <div className="dd-cs-cards">{detail.orders.map(o=><article key={o.id}>
        <strong dir="ltr">#DD{o.order_number}</strong><span className="dd-cs-pill">{t.orderStatuses[o.status]||o.status}</span>
        <p>{[o.occasion_type,o.delivery_area,date(o.created_at,locale)].filter(Boolean).join(" · ")}</p><strong>{money(o.grand_total,locale,o.currency)}</strong>
       </article>)}</div>}
     </section>
    </div>}
   </section>
  </div>}
 </main>;
}
