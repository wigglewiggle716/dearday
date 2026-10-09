"use client";

import Link from "next/link";
import {useEffect,useMemo,useRef,useState} from "react";
import {authClient,EMPLOYEE_ROLES,readCurrentAccount,rememberPreference} from "../lib/auth-client";
import {useAuthSession} from "./auth-session-provider";
import {pathFor} from "../lib/locales";

const partnerStatuses=["pending","under_review","active","suspended","rejected"];
const applicationStatuses=["new","under_review","contacted","accepted","rejected"];
const PAGE_SIZE=30;
const languages={
 ar:{
  title:"إدارة الشركاء",subtitle:"الشركاء الحاليون وطلبات الانضمام في مكان واحد، مع الحفاظ على الفصل بينهما.",
  back:"بوابة الفريق",partners:"الشركاء الحاليون",applications:"طلبات الانضمام",refresh:"تحديث",
  signIn:"تسجيل الدخول",setup:"تفعيل التحقق بخطوتين",verify:"إكمال التحقق بخطوتين",restricted:"الصفحة متاحة فقط للموظفين المصرّح لهم ببيانات الشركاء.",
  loading:"جاري التحقق وتحميل بيانات الشركاء…",failed:"تعذر تحميل البيانات. حاول مرة أخرى.",
  all:"كل الحالات",searchPartners:"ابحث بالاسم أو البريد أو الهاتف أو المنطقة",searchApplications:"ابحث باسم البراند أو مسؤول التواصل أو البريد",
  name:"اسم البراند",contact:"مسؤول التواصل",status:"الحالة",commission:"العمولة",areas:"مناطق الخدمة",
  updated:"آخر تعديل",created:"تاريخ التقديم",details:"تفاصيل",close:"إغلاق",noRows:"لا توجد نتائج مطابقة.",
  phone:"الهاتف",email:"البريد",notes:"ملاحظات داخلية",slug:"Slug",listings:"المنتجات والخدمات",action:"إجراءات",
  total:"إجمالي",active:"شركاء نشطون",waiting:"قيد المراجعة",add:"إضافة شريك",edit:"تعديل شريك",save:"حفظ التعديلات",
  creating:"إضافة شريك جديد",nameAr:"الاسم بالعربي",nameEn:"الاسم بالإنجليزي",coverage:"مناطق الخدمة (افصل بفواصل)",
  country:"الدولة",city:"المدينة",categories:"التخصصات",years:"سنوات النشاط",website:"الموقع الإلكتروني",social:"وسائل التواصل",
  description:"وصف النشاط",businessModel:"نموذج الشراكة",currentPartners:"الشراكات الحالية",documents:"مستندات التقديم",
  profile:"Company Profile",productsFile:"قائمة المنتجات",download:"فتح مستند خاص",opening:"جاري تجهيز الرابط الخاص…",
  review:"تحديث حالة الطلب",createHint:"قبول طلب الانضمام لا يضيف شريكًا أو يفعّله تلقائيًا.",statusHint:"تفعيل شريك حالي أو إيقافه قد يؤثر على ظهور خدماته في الموقع.",
  selectStatus:"الحالة",rejectReason:"سبب الرفض / ملاحظة داخلية",readonly:"لديك صلاحية عرض فقط.",saving:"جاري الحفظ…",
  saved:"تم حفظ التعديل.",statusSaved:"تم حفظ حالة طلب الانضمام.",downloadError:"تعذر فتح الملف الخاص. تحقق من الصلاحية.",
  invalid:"راجع الحقول: الاسم، الاسم المختصر (slug)، والعمولة بين 0 و100%.",errorSave:"تعذر حفظ التعديل. قد تكون الصلاحيات أو البيانات تغيّرت؛ حدّث الصفحة.",
  confirmPartner:"تأكيد حفظ بيانات الشريك في قاعدة Dear Day الفعلية؟",confirmReview:"تأكيد حفظ حالة طلب الانضمام والملاحظات؟",
  duplicate:"اسم رابط الشريك (slug) مستخدم بالفعل.",report:"عرض",previous:"السابق",next:"التالي",page:"صفحة",of:"من",
  limitPartners:"يتم عرض أحدث 500 شريك فقط في هذه المرحلة. راجع الحاجة لتصفح مجزأ لو العدد أكبر.",
  limitApplications:"يتم عرض أحدث 250 طلب انضمام فقط في هذه المرحلة. يجب مراجعة التصفح إذا زاد العدد.",
  pageCount:"النتائج",applyInfo:"تغيير حالة طلب الانضمام لا ينشئ حساب شريك ولا يرسل بريداً تلقائيًا.",
  required:"الاسم العربي وslug مطلوبان.",currency:"عمولة Dear Day (%)",
  statuses:{pending:"في الانتظار",under_review:"قيد المراجعة",active:"نشط",suspended:"موقوف",rejected:"مرفوض",new:"جديد",contacted:"تم التواصل",accepted:"مقبول"}
 },
 en:{
  title:"Partner Management",subtitle:"Manage existing partners and applications separately, within one staff workspace.",
  back:"Staff workspace",partners:"Existing partners",applications:"Join applications",refresh:"Refresh",
  signIn:"Log in",setup:"Set up two-step verification",verify:"Complete two-step verification",restricted:"This page is available only to authorised partner-management staff.",
  loading:"Checking access and loading partner information…",failed:"Could not load the data. Please try again.",
  all:"All statuses",searchPartners:"Search name, email, phone or coverage",searchApplications:"Search brand, contact or email",
  name:"Brand",contact:"Contact person",status:"Status",commission:"Commission",areas:"Service areas",
  updated:"Updated",created:"Applied",details:"Details",close:"Close",noRows:"No matching results.",
  phone:"Phone",email:"Email",notes:"Internal notes",slug:"Slug",listings:"Products & services",action:"Actions",
  total:"Total",active:"Active partners",waiting:"Under review",add:"Add partner",edit:"Edit partner",save:"Save changes",
  creating:"Add a new partner",nameAr:"Arabic name",nameEn:"English name",coverage:"Service areas (comma-separated)",
  country:"Country",city:"City",categories:"Categories",years:"Years in business",website:"Website",social:"Social media",
  description:"Business description",businessModel:"Partnership model",currentPartners:"Current partnerships",documents:"Application attachments",
  profile:"Company profile",productsFile:"Product list",download:"Open private attachment",opening:"Preparing private link…",
  review:"Update application status",createHint:"Accepting an application does not automatically create or activate a partner.",
  statusHint:"Activating or suspending an existing partner can affect their public listings.",
  selectStatus:"Status",rejectReason:"Rejection reason / internal notes",readonly:"Your access is read only.",saving:"Saving…",
  saved:"Changes saved.",statusSaved:"Application status saved.",downloadError:"Could not open the private file. Check your permissions.",
  invalid:"Check the partner name, slug and commission between 0 and 100%.",errorSave:"Could not save. Permissions or data may have changed; refresh.",
  confirmPartner:"Confirm saving this partner to the live Dear Day database?",confirmReview:"Confirm saving the application status and internal notes?",
  duplicate:"This partner slug is already in use.",report:"View",previous:"Previous",next:"Next",page:"Page",of:"of",
  limitPartners:"Only the latest 500 partners are displayed in this phase. Paginate if the partner list grows.",
  limitApplications:"Only the latest 250 applications are displayed. Add pagination if this limit is exceeded.",
  pageCount:"Results",applyInfo:"Changing application status does not create a partner account or send automatic mail.",
  required:"Arabic name and slug are required.",currency:"Dear Day commission (%)",
  statuses:{pending:"Pending",under_review:"Under review",active:"Active",suspended:"Suspended",rejected:"Rejected",new:"New",contacted:"Contacted",accepted:"Accepted"}
 }
};
const partnerFields="id,name_ar,name_en,slug,status,commission_rate,contact_name,phone,email,coverage_areas,notes,created_at,updated_at";
const applicationFields="id,company_name,contact_name,email,phone,country,city,years_in_business,categories,other_category,company_description,website,social_media,partnership_model,current_partnerships,company_profile_path,company_profile_name,product_list_path,product_list_name,status,internal_notes,reviewed_at,created_at";
const emptyPartner={id:"",name_ar:"",name_en:"",slug:"",status:"pending",commission_rate:"0",contact_name:"",phone:"",email:"",coverage_areas:"",notes:""};
const initial={stage:"loading",permissions:[],partners:[],applications:[],counts:{},pOverflow:false,aOverflow:false};
function displayName(p,locale){return (locale==="en"?p?.name_en||p?.name_ar:p?.name_ar||p?.name_en)||"—";}
function toAreas(v){return Array.isArray(v)?v.join("، "):"";}
function date(v,locale){
 if(!v)return "—";
 const d=new Date(v);
 return Number.isNaN(d.getTime())?"—":new Intl.DateTimeFormat(locale==="en"?"en-GB":"ar-EG",{day:"numeric",month:"short",year:"numeric"}).format(d);
}
function draftOf(p){return p?{...p,commission_rate:String(p.commission_rate??0),coverage_areas:toAreas(p.coverage_areas),name_en:p.name_en||"",contact_name:p.contact_name||"",phone:p.phone||"",email:p.email||"",notes:p.notes||""}:{...emptyPartner};}
function slugSafe(value){return /^[a-z0-9\u0600-\u06ff]+(?:-[a-z0-9\u0600-\u06ff]+)*$/.test(value);}
function validatePartner(form){
 const ar=form.name_ar.trim(),slug=form.slug.trim().toLowerCase(),commission=Number(form.commission_rate);
 if(!ar||ar.length>200||!slugSafe(slug)||slug.length>160||!Number.isFinite(commission)||commission<0||commission>100)throw new Error("validation");
 if(form.email&&(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)||form.email.length>254))throw new Error("validation");
 return {name_ar:ar,name_en:form.name_en.trim()||null,slug,status:form.status,
  commission_rate:commission,contact_name:form.contact_name.trim()||null,
  phone:form.phone.trim()||null,email:form.email.trim()||null,
  coverage_areas:form.coverage_areas.split(/[,،\n]/g).map(x=>x.trim()).filter(Boolean).slice(0,40),
  notes:form.notes.trim()||null};
}
function Field({title,children}){return <div className="dd-partners-admin-field"><span>{title}</span><strong>{children??"—"}</strong></div>;}
function extractError(error){return error?.message==="validation"?"validation":"other";}
export default function StaffPartners({locale="ar"}){
 const t=languages[locale]||languages.ar;
 const auth=useAuthSession();
 const active=auth.status==="authenticated"&&EMPLOYEE_ROLES.has(auth.role);
 const id=active?auth.user?.id:null;
 const client=useMemo(()=>typeof window==="undefined"?null:authClient(rememberPreference()),[]);
 const [tab,setTab]=useState("partners"),[data,setData]=useState(initial),[revision,setRevision]=useState(0);
 const [term,setTerm]=useState(""),[status,setStatus]=useState(""),[page,setPage]=useState(0);
 const [opened,setOpened]=useState(null),[editing,setEditing]=useState(null),[busy,setBusy]=useState(false);
 const [review,setReview]=useState({status:"",notes:""}),[notice,setNotice]=useState(""),[err,setErr]=useState("");
 const [fileBusy,setFileBusy]=useState(false);
 const seq=useRef(0),dialogRef=useRef(null);
 const permissions=new Set(data.permissions);
 const canView=data.stage==="ready"&&(permissions.has("partners.view")||permissions.has("partners.manage"));
 const canManage=canView&&permissions.has("partners.manage");
 const ownPartner=opened?.kind==="partner" ? data.partners.find(x=>x.id===opened.id):null;
 const ownApplication=opened?.kind==="application" ? data.applications.find(x=>x.id===opened.id):null;
 const refresh=()=>setRevision(n=>n+1);
 useEffect(()=>{
  const requested=++seq.current;
  if(!id||!client){setData(initial);return;}
  setData(initial);
  (async()=>{
   try{
    const grant=await client.rpc("get_my_permissions");
    if(grant.error)throw grant.error;
    const perms=(grant.data||[]).map(x=>x.permission_code);
    if(!perms.some(x=>["partners.view","partners.manage"].includes(x))){
     if(requested===seq.current)setData({...initial,stage:"forbidden"});
     return;
    }
    const [p,a]=await Promise.all([
     client.from("partners").select(partnerFields).order("created_at",{ascending:false}).limit(501),
     client.from("partner_applications").select(applicationFields).order("created_at",{ascending:false}).limit(251)
    ]);
    if(p.error||a.error)throw p.error||a.error;
    const partners=(p.data||[]).slice(0,500);
    // Listing counts are retrieved only for an opened partner. This avoids
    // making hundreds of parallel queries when listing partner records.
    if(requested===seq.current)setData({
     stage:"ready",permissions:perms,partners,applications:(a.data||[]).slice(0,250),
     pOverflow:(p.data||[]).length>500,aOverflow:(a.data||[]).length>250,counts:{}
    });
   }catch{if(requested===seq.current)setData({...initial,stage:"error"});}
  })();
  return()=>{seq.current++};
 },[id,client,revision]);
 useEffect(()=>{
  if(!opened&&!editing)return;
  const prev=document.activeElement;
  document.body.style.overflow="hidden";dialogRef.current?.focus();
  const key=e=>{if(e.key==="Escape"&&!busy){setEditing(null);setOpened(null);}};
  window.addEventListener("keydown",key);
  return()=>{document.body.style.overflow="";window.removeEventListener("keydown",key);if(prev instanceof HTMLElement)prev.focus();};
 },[Boolean(opened),Boolean(editing),busy]);
 function go(next){setTab(next);setPage(0);setStatus("");setTerm("");setErr("");setNotice("");setOpened(null);}
 async function openPartner(p){
  if(!canView)return;
  setOpened({kind:"partner",id:p.id});setEditing(null);setErr("");
  const r=await client.from("listings").select("id",{head:true,count:"exact"}).eq("partner_id",p.id);
  if(!r.error)setData(d=>({...d,counts:{...d.counts,[p.id]:r.count}}));
 }
 function openApplication(a){setOpened({kind:"application",id:a.id});setReview({status:a.status,notes:a.internal_notes||""});setErr("");}
 function editPartner(p){if(!canManage)return;setOpened(null);setErr("");setEditing(draftOf(p));}
 async function ensureManage(){
  const who=await readCurrentAccount(client);
  if(who.status!=="authenticated"||who.user?.id!==id||!EMPLOYEE_ROLES.has(who.role))throw Error("permission");
  const grants=await client.rpc("get_my_permissions");
  if(grants.error||!(grants.data||[]).some(x=>x.permission_code==="partners.manage"))throw Error("permission");
 }
 async function savePartner(){
  if(!editing||!canManage||busy||!client)return;
  setErr("");
  let payload;
  try{payload=validatePartner(editing);}catch{setErr(t.invalid);return;}
  const isDup=data.partners.some(p=>p.id!==editing.id&&p.slug===payload.slug);
  if(isDup){setErr(t.duplicate);return;}
  if(!window.confirm(t.confirmPartner))return;
  setBusy(true);
  try{
   await ensureManage();
   let saved;
   if(editing.id){
    const old=data.partners.find(p=>p.id===editing.id);
    if(!old)throw Error("not_found");
    const r=await client.from("partners").update(payload).eq("id",editing.id)
     .eq("updated_at",old.updated_at).select(partnerFields).maybeSingle();
    if(r.error||!r.data)throw r.error||Error("stale");
    saved=r.data;
   }else{
    const r=await client.from("partners").insert({...payload,created_by:id}).select(partnerFields).single();
    if(r.error)throw r.error;
    saved=r.data;
   }
   // The legacy panel logs audits as a separate statement. No claim of an
   // atomic audit is made. Treat partner changes as live writes requiring QA.
   const log=await client.from("audit_logs").insert({
    actor_id:id,action:editing.id?"partner.updated":"partner.created",entity_type:"partner",
    entity_id:saved.id,before_data:null,
    after_data:{status:saved.status,slug:saved.slug,operation:editing.id?"edit":"create",source:"staff_react"}
   });
   setEditing(null);setNotice(log.error?t.saved+" ("+t.errorSave+")":t.saved);refresh();
  }catch(e){setErr(extractError(e)==="validation"?t.invalid:t.errorSave);}finally{setBusy(false);}
 }
 async function saveApplication(){
  if(!opened||opened.kind!=="application"||!ownApplication||!canManage||busy)return;
  if(!applicationStatuses.includes(review.status)||review.notes.length>4000){setErr(t.invalid);return;}
  if(!window.confirm(t.confirmReview))return;
  setBusy(true);setErr("");
  try{
   await ensureManage();
   // Existing SECURITY DEFINER RPC checks partners.manage before each write.
   const result=await client.rpc("review_partner_application",{
    p_application_id:ownApplication.id,p_status:review.status,p_internal_notes:review.notes.trim()||null
   });
   if(result.error)throw result.error;
   setOpened(null);setNotice(t.statusSaved);refresh();
  }catch{setErr(t.errorSave);}finally{setBusy(false);}
 }
 async function documentUrl(kind){
  if(!ownApplication||fileBusy||!client||!canView)return;
  const current=ownApplication;
  const file=kind==="profile"?current.company_profile_path:current.product_list_path;
  const filename=kind==="profile"?current.company_profile_name:current.product_list_name;
  if(!file)return;
  // Open within the user gesture so Safari/iOS pop-up blockers don't reject
  // the signed link after the asynchronous permission check.
  const viewer=window.open("about:blank","_blank");
  if(!viewer){setErr(t.downloadError);return;}
  viewer.opener=null;
  setFileBusy(true);setErr("");
  try{
   const who=await readCurrentAccount(client);
   if(who.status!=="authenticated"||who.user?.id!==id)throw Error("session");
   const perms=await client.rpc("get_my_permissions");
   if(perms.error||!(perms.data||[]).some(x=>["partners.view","partners.manage"].includes(x.permission_code)))throw Error("permission");
   const signed=await client.storage.from("partner-applications")
    .createSignedUrl(file,60,{download:filename||"partner-file"});
   if(signed.error||!signed.data?.signedUrl)throw signed.error||Error("no_url");
   // Link lifetime is 60 seconds and the bucket remains private.
   viewer.location.replace(signed.data.signedUrl);
  }catch{viewer.close();setErr(t.downloadError);}finally{setFileBusy(false);}
 }
 const source=tab==="partners"?data.partners:data.applications;
 const rows=source.filter(p=>{
  if(status&&p.status!==status)return false;
  const hay=tab==="partners"?
   [p.name_ar,p.name_en,p.slug,p.contact_name,p.phone,p.email,toAreas(p.coverage_areas)]:
   [p.company_name,p.contact_name,p.email,p.phone,p.city,p.categories?.join(" ")];
  return !term.trim()||hay.join(" ").toLocaleLowerCase().includes(term.trim().toLocaleLowerCase());
 });
 const pagination=rows.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);
 const maxPage=Math.max(1,Math.ceil(rows.length/PAGE_SIZE));
 const gate=auth.status==="mfa_setup_required"?{href:pathFor("security",locale),label:t.setup}:
  auth.status==="mfa_required"?{href:pathFor("auth",locale)+"?mode=mfa",label:t.verify}:
  auth.status==="signed_out"?{href:pathFor("auth",locale)+"?next="+encodeURIComponent(pathFor("staffPartners",locale)),label:t.signIn}:null;
 const editable=(key,value)=>setEditing(d=>({...d,[key]:value}));
 return <main id="main-content" className="dd-partners-admin" dir={locale==="ar"?"rtl":"ltr"}>
  <div className="dd-partners-admin-width">
   <header className="dd-partners-admin-head">
    <div><Link href={pathFor("staffPortal",locale)}>{t.back} ↗</Link><h1>{t.title}</h1><p>{t.subtitle}</p></div>
    {canView&&<button type="button" className="dd-pa-outline" onClick={refresh}>{t.refresh}</button>}
   </header>
   {!active?<section className="dd-pa-panel dd-pa-gate"><p>{auth.status==="loading"?t.loading:t.restricted}</p>{gate&&<Link className="dd-pa-primary" href={gate.href}>{gate.label}</Link>}</section>:
    data.stage==="loading"?<section className="dd-pa-panel dd-pa-gate" role="status">{t.loading}</section>:
    !canView?<section className="dd-pa-panel dd-pa-gate" role="alert">{data.stage==="forbidden"?t.restricted:t.failed}<button className="dd-pa-outline" onClick={refresh}>{t.refresh}</button></section>:<>
     <div className="dd-pa-tabs" role="tablist" aria-label={t.title}>
      <button type="button" role="tab" aria-selected={tab==="partners"} onClick={()=>go("partners")}>{t.partners} ({data.partners.length})</button>
      <button type="button" role="tab" aria-selected={tab==="applications"} onClick={()=>go("applications")}>{t.applications} ({data.applications.length})</button>
     </div>
     {notice&&<p className="dd-pa-notice" role="status">{notice}</p>}
     {err&&!opened&&!editing&&<p className="dd-pa-error" role="alert">{err}</p>}
     <div className="dd-pa-kpis">
      <article><span>{t.total}</span><strong>{source.length}</strong></article>
      <article><span>{tab==="partners"?t.active:t.waiting}</span><strong>{tab==="partners"?source.filter(x=>x.status==="active").length:source.filter(x=>["new","under_review"].includes(x.status)).length}</strong></article>
     </div>
     {((tab==="partners"&&data.pOverflow)||(tab==="applications"&&data.aOverflow))&&<p className="dd-pa-warning">{tab==="partners"?t.limitPartners:t.limitApplications}</p>}
     <div className="dd-pa-filters">
      <input value={term} onChange={e=>{setTerm(e.target.value);setPage(0)}} type="search" placeholder={tab==="partners"?t.searchPartners:t.searchApplications} aria-label={tab==="partners"?t.searchPartners:t.searchApplications}/>
      <select value={status} onChange={e=>{setStatus(e.target.value);setPage(0)}} aria-label={t.status}><option value="">{t.all}</option>
       {(tab==="partners"?partnerStatuses:applicationStatuses).map(x=><option value={x} key={x}>{t.statuses[x]}</option>)}
      </select>
      {tab==="partners"&&canManage&&<button type="button" className="dd-pa-primary" onClick={()=>editPartner(null)}>+ {t.add}</button>}
     </div>
     <section className="dd-pa-panel">
      {pagination.length?<div className="dd-pa-scroll"><table>
       <thead><tr><th>{t.name}</th><th>{t.status}</th><th>{t.contact}</th>
        {tab==="partners"?<><th>{t.commission}</th><th>{t.areas}</th></>:<><th>{t.city}</th><th>{t.categories}</th></>}
        <th>{tab==="partners"?t.updated:t.created}</th><th>{t.action}</th></tr></thead>
       <tbody>{pagination.map(row=><tr key={row.id}>
        <td><strong>{tab==="partners"?displayName(row,locale):row.company_name}</strong>{tab==="partners"&&<small>{row.slug}</small>}</td>
        <td><span className={"dd-pa-status s-"+row.status}>{t.statuses[row.status]||row.status}</span></td>
        <td>{row.contact_name||"—"}<small dir="ltr">{row.email||row.phone||"—"}</small></td>
        {tab==="partners"?<><td>{Number(row.commission_rate||0).toFixed(2)}%</td><td>{toAreas(row.coverage_areas)||"—"}</td></>:
         <><td>{row.city||"—"}</td><td>{(row.categories||[]).join("، ")||row.other_category||"—"}</td></>}
        <td>{date(tab==="partners"?row.updated_at:row.created_at,locale)}</td>
        <td><button type="button" className="dd-pa-outline small" onClick={()=>tab==="partners"?openPartner(row):openApplication(row)}>{t.details}</button></td>
       </tr>)}</tbody>
      </table></div>:<p className="dd-pa-empty">{t.noRows}</p>}
      <div className="dd-pa-pagination"><span>{t.pageCount}: {rows.length} · {t.page} {page+1} {t.of} {maxPage}</span>
       <div><button className="dd-pa-outline small" type="button" disabled={page===0} onClick={()=>setPage(p=>p-1)}>{t.previous}</button>
        <button className="dd-pa-outline small" type="button" disabled={page+1>=maxPage} onClick={()=>setPage(p=>p+1)}>{t.next}</button></div>
      </div>
     </section>
     <p className="dd-pa-hint">{tab==="partners"?t.statusHint:t.applyInfo}</p>
    </>}
  </div>
  {(opened||editing)&&active&&canView&&<div className="dd-pa-overlay" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy){setOpened(null);setEditing(null)}}}>
   <section className="dd-pa-dialog" role="dialog" aria-modal="true" ref={dialogRef} tabIndex={-1} aria-labelledby="dd-pa-dialog-title">
    <header><h2 id="dd-pa-dialog-title">{editing?(editing.id?t.edit:t.creating):opened?.kind==="partner"?displayName(ownPartner,locale):ownApplication?.company_name||t.details}</h2>
     <button type="button" aria-label={t.close} disabled={busy} onClick={()=>{setEditing(null);setOpened(null);setErr("")}}>×</button></header>
    {editing?<div className="dd-pa-editor">
      <div className="dd-pa-form">
       {[
        ["name_ar",t.nameAr],["name_en",t.nameEn],["slug",t.slug],
        ["contact_name",t.contact],["phone",t.phone],["email",t.email],["commission_rate",t.currency],
        ["coverage_areas",t.coverage],["notes",t.notes]
       ].map(([key,label])=><label key={key} className={key==="notes"||key==="coverage_areas"?"wide":""}>{label}
        {key==="notes"||key==="coverage_areas"?<textarea rows={3} value={editing[key]??""} onChange={e=>editable(key,e.target.value)} disabled={busy}/>:
         <input value={editing[key]??""} type={key==="commission_rate"?"number":key==="email"?"email":"text"} min={key==="commission_rate"?"0":undefined} max={key==="commission_rate"?"100":undefined} step={key==="commission_rate"?"0.01":undefined} maxLength={key==="name_ar"||key==="name_en"?"200":undefined} onChange={e=>editable(key,e.target.value)} disabled={busy}/>}
       </label>)}
       <label>{t.selectStatus}<select value={editing.status} disabled={busy} onChange={e=>editable("status",e.target.value)}>
        {partnerStatuses.map(s=><option key={s} value={s}>{t.statuses[s]}</option>)}</select></label>
      </div>
      <p className="dd-pa-hint">{t.statusHint}</p>
      {err&&<p role="alert" className="dd-pa-error">{err}</p>}
      <footer><button className="dd-pa-primary" type="button" onClick={savePartner} disabled={busy}>{busy?t.saving:t.save}</button>
       <button className="dd-pa-outline" type="button" disabled={busy} onClick={()=>setEditing(null)}>{t.close}</button></footer>
     </div>:opened?.kind==="partner"&&ownPartner?<div className="dd-pa-detail">
      <div className="dd-pa-detail-grid">
       <Field title={t.status}>{t.statuses[ownPartner.status]}</Field>
       <Field title={t.nameAr}>{ownPartner.name_ar}</Field>
       <Field title={t.nameEn}>{ownPartner.name_en}</Field>
       <Field title={t.slug}>{ownPartner.slug}</Field>
       <Field title={t.commission}>{Number(ownPartner.commission_rate||0).toFixed(2)}%</Field>
       <Field title={t.contact}>{ownPartner.contact_name}</Field>
       <Field title={t.phone}>{ownPartner.phone}</Field>
       <Field title={t.email}>{ownPartner.email}</Field>
       <Field title={t.areas}>{toAreas(ownPartner.coverage_areas)}</Field>
       <Field title={t.notes}>{ownPartner.notes}</Field>
       <Field title={t.updated}>{date(ownPartner.updated_at,locale)}</Field>
       <Field title={t.listings}>{data.counts[ownPartner.id]??"—"}</Field>
      </div>
      {canManage?<footer><button type="button" className="dd-pa-primary" onClick={()=>editPartner(ownPartner)}>{t.edit}</button></footer>:<p className="dd-pa-hint">{t.readonly}</p>}
     </div>:opened?.kind==="application"&&ownApplication?<div className="dd-pa-detail">
       <div className="dd-pa-detail-grid">
        {[
         [t.name,ownApplication.company_name],[t.contact,ownApplication.contact_name],
         [t.phone,ownApplication.phone],[t.email,ownApplication.email],
         [t.country,ownApplication.country],[t.city,ownApplication.city],
         [t.years,ownApplication.years_in_business],[t.categories,(ownApplication.categories||[]).join("، ")||ownApplication.other_category],
         [t.description,ownApplication.company_description],[t.website,ownApplication.website],
         [t.social,ownApplication.social_media],[t.businessModel,ownApplication.partnership_model],
         [t.currentPartners,ownApplication.current_partnerships],[t.created,date(ownApplication.created_at,locale)]
        ].map(([label,value])=><Field key={label} title={label}>{value}</Field>)}
       </div>
       <h3>{t.documents}</h3><div className="dd-pa-document-links">
        {ownApplication.company_profile_path&&<button type="button" className="dd-pa-outline" disabled={fileBusy} onClick={()=>documentUrl("profile")}>{fileBusy?t.opening:t.profile+" ↗"}</button>}
        {ownApplication.product_list_path&&<button type="button" className="dd-pa-outline" disabled={fileBusy} onClick={()=>documentUrl("products")}>{fileBusy?t.opening:t.productsFile+" ↗"}</button>}
       </div>
       <p className="dd-pa-hint">{t.createHint}</p>
       <div className="dd-pa-editor">
        <label>{t.selectStatus}<select value={review.status} disabled={busy||!canManage} onChange={e=>setReview(r=>({...r,status:e.target.value}))}>
         {applicationStatuses.map(s=><option value={s} key={s}>{t.statuses[s]}</option>)}
        </select></label>
        <label>{t.rejectReason}<textarea rows={4} maxLength={4000} value={review.notes} disabled={busy||!canManage} onChange={e=>setReview(r=>({...r,notes:e.target.value}))}/></label>
        {err&&<p role="alert" className="dd-pa-error">{err}</p>}
        {canManage?<footer><button type="button" className="dd-pa-primary" disabled={busy} onClick={saveApplication}>{busy?t.saving:t.review}</button></footer>:<p className="dd-pa-hint">{t.readonly}</p>}
       </div>
     </div>:<p className="dd-pa-empty">{t.noRows}</p>}
   </section>
  </div>}
 </main>;
}
