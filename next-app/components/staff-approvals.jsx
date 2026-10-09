"use client";
import Link from "next/link";
import {useEffect,useMemo,useRef,useState} from "react";
import {authClient,EMPLOYEE_ROLES,readCurrentAccount,rememberPreference} from "../lib/auth-client";
import {useAuthSession} from "./auth-session-provider";
import {pathFor} from "../lib/locales";
import {dateLabel,kinds,localeName,priceLabel,proposedOf} from "../lib/staff-catalog";

const copy={
 ar:{
 title:"موافقات المنتجات والخدمات",intro:"قارن النسخ المقترحة بالإصدارات المنشورة قبل اتخاذ قرار النشر.",
 back:"المنتجات والخدمات",workspace:"لوحة الفريق",
 loading:"جاري تحميل طلبات المراجعة…",denied:"هذه الصفحة مخصصة للموظفين الذين لديهم صلاحية اعتماد التعديلات.",
 error:"تعذر تحميل الموافقات. حاول مجددًا.",signin:"تسجيل الدخول",setup:"تفعيل المصادقة",mfa:"التحقق بخطوتين",
 refresh:"تحديث",search:"ابحث بالاسم أو الشريك",partner:"الشريك",all:"كل الشركاء",kind:"النوع",
 allKinds:"كل الأنواع",pending:"نسخ بانتظار المراجعة",new:"عناصر جديدة",updates:"تعديلات على منشور",
 item:"العنصر",kindCol:"النوع",proposal:"مقترح",current:"السعر المنشور",submitted:"تاريخ الإرسال",
 show:"مراجعة",none:"لا توجد نسخ معلقة ضمن النتائج المحمّلة.",
 compare:"مقارنة التغييرات",existing:"النسخة المنشورة",proposed:"النسخة المقترحة",
 first:"عنصر جديد لا توجد له نسخة منشورة",field:"الحقل",noValue:"—",changed:"تم تغيير هذه القيمة",
 status:"حالة المراجعة",nameAr:"الاسم العربي",nameEn:"الاسم الإنجليزي",price:"السعر",
 comparePrice:"السعر قبل الخصم",descAr:"الوصف العربي",descEn:"الوصف الإنجليزي",media:"عدد الصور",
 category:"التصنيف",available:"الإتاحة",stock:"المخزون",capacity:"السعة اليومية",
 yes:"متاح",no:"غير متاح",kindLabel:{product:"منتج",service:"خدمة",venue:"مكان",experience:"تجربة"},
 note:"ملاحظة القرار",noteHint:"سبب الرفض مطلوب، وملاحظات القبول اختيارية.",
 approve:"موافقة ونشر",reject:"رفض",close:"إغلاق",working:"جاري تنفيذ القرار…",
 rejectNote:"اكتب سبب الرفض قبل المتابعة.",confirmApprove:"تأكيد اعتماد ونشر هذه النسخة على الموقع؟ سيتم تعديل البيانات الحية وتسجيل القرار في سجل المراجعة.",
 confirmReject:"تأكيد رفض هذه النسخة؟ سيُسجل السبب في سجل المراجعة.",
 doneApprove:"تم نشر النسخة الجديدة عن طريق إجراء الاعتماد الآمن في Supabase.",
 doneReject:"تم رفض النسخة وتسجيل سبب الرفض.",
 failed:"لم يتم حفظ القرار. ربما تغيرت النسخة أو لم تعد صلاحياتك سارية؛ حدّث القائمة.",
 limit:"تُعرض أول 200 نسخة معلقة. يلزم استكمال التصفح قبل اعتماد هذه الصفحة لو زاد العدد.",
 noteWarn:"قرارات الاعتماد والرفض تغيّر بيانات الكتالوج الفعلية؛ استخدم بيانات اختبار فقط أثناء القبول."
 },
 en:{
 title:"Product & Service Approvals",intro:"Compare proposed versions with current published listings before a publication decision.",
 back:"Products & Services",workspace:"Staff workspace",
 loading:"Loading pending approvals…",denied:"This page requires catalog approval permission.",
 error:"Couldn't load approvals. Please try again.",signin:"Log in",setup:"Set up authenticator",mfa:"Verify two-step authentication",
 refresh:"Refresh",search:"Search item or partner",partner:"Partner",all:"All partners",kind:"Kind",
 allKinds:"All kinds",pending:"Pending versions",new:"New listings",updates:"Changes to live listings",
 item:"Item",kindCol:"Kind",proposal:"Proposed price",current:"Published price",submitted:"Submitted",
 show:"Review",none:"No pending versions match the loaded results.",
 compare:"Compare changes",existing:"Currently published",proposed:"Proposed version",
 first:"New listing without a published version",field:"Field",noValue:"—",changed:"Value changed",
 status:"Review status",nameAr:"Arabic name",nameEn:"English name",price:"Price",
 comparePrice:"Compare-at price",descAr:"Arabic description",descEn:"English description",media:"Image count",
 category:"Category",available:"Availability",stock:"Stock",capacity:"Daily capacity",
 yes:"Available",no:"Unavailable",kindLabel:{product:"Product",service:"Service",venue:"Venue",experience:"Experience"},
 note:"Review note",noteHint:"A reason is required to reject; approval notes are optional.",
 approve:"Approve & publish",reject:"Reject",close:"Close",working:"Submitting decision…",
 rejectNote:"A rejection reason is required.",confirmApprove:"Approve and publish this version? This will update the live catalog and record an audit event.",
 confirmReject:"Reject this version and record your reason?",
 doneApprove:"Version published via the authorised Supabase approval procedure.",
 doneReject:"Version rejected and the reason recorded.",
 failed:"Could not complete the decision. It may have been reviewed already or your access changed. Refresh.",
 limit:"Showing the first 200 pending versions. Pagination is required if there are more.",
 noteWarn:"Approvals and rejections change live catalog records; use designated test entries during acceptance."
 }
};
const pendingColumns="id,listing_id,status,name_ar,name_en,description_ar,description_en,price,compare_at_price,currency,media,metadata,submitted_at,created_at,submitted_by";
const listingColumns="id,partner_id,category_id,kind,is_available,stock_qty,capacity_per_day,published_version_id";
const liveColumns="id,name_ar,name_en,description_ar,description_en,price,compare_at_price,currency,media";
const blank={stage:"loading",permissions:[],pending:[],listings:{},live:{},partners:{},categories:{},overflow:false};
function v(value){return value===null||value===undefined||value===""?"—":String(value);}
function row(label,before,after){
 const changed=String(before??"")!==String(after??"");
 return {label,before:v(before),after:v(after),changed};
}
function trMeta(ver,listing,partners,categories,locale,t,live){
 const proposed=proposedOf(ver);
 const effectivePartner=proposed.partner_id||listing?.partner_id;
 const proposedCategory=Object.prototype.hasOwnProperty.call(proposed,"category_id")?proposed.category_id:listing?.category_id;
 const effectiveKind=proposed.kind||listing?.kind;
 const mediaLength=x=>Array.isArray(x)?x.length:0;
 const yes=x=>x?t.yes:t.no;
 return [
 row(t.nameAr,live?.name_ar,ver.name_ar),
 row(t.nameEn,live?.name_en,ver.name_en),
 row(t.descAr,live?.description_ar,ver.description_ar),
 row(t.descEn,live?.description_en,ver.description_en),
 row(t.price,live?priceLabel(live.price,live.currency,locale):null,priceLabel(ver.price,ver.currency,locale)),
 row(t.comparePrice,live?.compare_at_price==null?null:priceLabel(live.compare_at_price,live.currency,locale),ver.compare_at_price==null?null:priceLabel(ver.compare_at_price,ver.currency,locale)),
 row(t.partner,localeName(partners[listing?.partner_id],locale),localeName(partners[effectivePartner],locale)),
 row(t.category,localeName(categories[listing?.category_id],locale),localeName(categories[proposedCategory],locale)),
 row(t.kind,t.kindLabel[listing?.kind],t.kindLabel[effectiveKind]),
 row(t.available,listing?yes(listing.is_available):null,yes(proposed.is_available??listing?.is_available)),
 row(t.stock,listing?.stock_qty,proposed.stock_qty??listing?.stock_qty),
 row(t.capacity,listing?.capacity_per_day,proposed.capacity_per_day??listing?.capacity_per_day),
 row(t.media,live?mediaLength(live.media):null,mediaLength(ver.media))
 ];
}
export default function StaffApprovals({locale="ar"}){
 const t=copy[locale]||copy.ar,session=useAuthSession();
 const active=session.status==="authenticated"&&EMPLOYEE_ROLES.has(session.role);
 const memberId=active?session.user?.id:null;
 const client=useMemo(()=>typeof window==="undefined"?null:authClient(rememberPreference()),[]);
 const [data,setData]=useState(blank),[revision,setRevision]=useState(0);
 const [term,setTerm]=useState(""),[partnerFilter,setPartnerFilter]=useState(""),[kindFilter,setKindFilter]=useState("");
 const [selected,setSelected]=useState(null),[note,setNote]=useState(""),[busy,setBusy]=useState(false);
 const [message,setMessage]=useState(""),[error,setError]=useState("");
 const req=useRef(0),dialog=useRef(null);
 const reload=()=>setRevision(n=>n+1);
 useEffect(()=>{
  const requestId=++req.current;
  if(!active||!memberId||!client){setData(blank);return;}
  setData(blank);
  (async()=>{
   try{
    const perms=await client.rpc("get_my_permissions");
    if(perms.error)throw perms.error;
    if(requestId!==req.current)return;
    const granted=(perms.data||[]).map(x=>x.permission_code);
    if(!granted.includes("approvals.review")){setData({...blank,stage:"denied"});return;}
    const pv=await client.from("listing_versions").select(pendingColumns).eq("status","pending_review")
      .order("submitted_at",{ascending:true,nullsFirst:false}).order("created_at",{ascending:true}).limit(201);
    if(pv.error)throw pv.error;
    const pending=(pv.data||[]).slice(0,200),ids=[...new Set(pending.map(x=>x.listing_id).filter(Boolean))];
    let listings={},live={},partners={},categories={};
    if(ids.length){
     const lookup=async(table,columns,idsToFetch)=>{
      const groups=[];
      for(let i=0;i<idsToFetch.length;i+=60)groups.push(idsToFetch.slice(i,i+60));
      const replies=await Promise.all(groups.map(group=>client.from(table).select(columns).in("id",group)));
      if(replies.some(r=>r.error))throw replies.find(r=>r.error).error;
      return replies.flatMap(r=>r.data||[]);
     };
     const source=await lookup("listings",listingColumns,ids);
     listings=Object.fromEntries(source.map(x=>[x.id,x]));
     const publishedIds=[...new Set(source.map(x=>x.published_version_id).filter(Boolean))];
     const pp=[...new Set([
      ...source.map(x=>x.partner_id).filter(Boolean),
      ...pending.map(x=>proposedOf(x).partner_id).filter(Boolean)
     ])];
     const cc=[...new Set([
      ...source.map(x=>x.category_id).filter(Boolean),
      ...pending.map(x=>proposedOf(x).category_id).filter(Boolean)
     ])];
     const [lv,ps,cs]=await Promise.all([
      lookup("listing_versions",liveColumns,publishedIds),
      lookup("partner_directory","id,name_ar,name_en",pp),
      lookup("categories","id,name_ar,name_en",cc)
     ]);
     live=Object.fromEntries(lv.map(x=>[x.id,x]));
     partners=Object.fromEntries(ps.map(x=>[x.id,x]));
     categories=Object.fromEntries(cs.map(x=>[x.id,x]));
    }
    if(requestId===req.current)setData({stage:"ready",permissions:granted,pending,listings,live,partners,categories,overflow:(pv.data||[]).length>200});
   }catch{if(requestId===req.current)setData({...blank,stage:"error"});}
  })();
  return()=>{req.current++;};
 },[active,memberId,client,revision]);

 useEffect(()=>{
  if(!selected)return;
  const prev=document.activeElement;
  document.body.style.overflow="hidden";dialog.current?.focus();
  function key(e){if(e.key==="Escape"&&!busy)setSelected(null);}
  window.addEventListener("keydown",key);
  return()=>{document.body.style.overflow="";window.removeEventListener("keydown",key);if(prev instanceof HTMLElement)prev.focus();};
 },[Boolean(selected),busy]);

 const filtered=useMemo(()=>{
  const needle=term.trim().toLocaleLowerCase();
  return data.pending.filter(ver=>{
   const l=data.listings[ver.listing_id],p=proposedOf(ver);
   const partnerId=p.partner_id||l?.partner_id,kind=p.kind||l?.kind;
   if(partnerFilter&&partnerId!==partnerFilter)return false;
   if(kindFilter&&kindFilter!==kind)return false;
   const partner=data.partners[partnerId];
   return !needle||[ver.name_ar,ver.name_en,partner?.name_ar,partner?.name_en].some(x=>String(x||"").toLocaleLowerCase().includes(needle));
  });
 },[data,term,partnerFilter,kindFilter]);

 function open(version){setSelected(version.id);setNote("");setError("");setMessage("");}
 async function decide(decision){
  if(!selected||busy||data.stage!=="ready")return;
  const found=data.pending.find(x=>x.id===selected);
  if(!found)return;
  if(decision==="reject"&&!note.trim()){setError(t.rejectNote);return;}
  const confirmText=decision==="approve"?t.confirmApprove:t.confirmReject;
  if(!window.confirm(confirmText))return;
  setBusy(true);setError("");
  try{
   const who=await readCurrentAccount(client);
   if(who.status!=="authenticated"||who.user?.id!==memberId||!EMPLOYEE_ROLES.has(who.role))throw Error("session");
   const perm=await client.rpc("get_my_permissions");
   if(perm.error||!(perm.data||[]).some(x=>x.permission_code==="approvals.review"))throw Error("denied");
   // RPC locks and validates pending version and records approval in audit_logs.
   // Never update published_version_id or published status from browser directly.
   const answer=await client.rpc("review_listing_version",{
    p_version_id:found.id,p_decision:decision,p_note:note.trim()||null
   });
   if(answer.error)throw answer.error;
   setSelected(null);setMessage(decision==="approve"?t.doneApprove:t.doneReject);reload();
  }catch{setError(t.failed);}finally{setBusy(false);}
 }
 const vSel=data.pending.find(v=>v.id===selected),listing=vSel&&data.listings[vSel.listing_id];
 const live=listing?.published_version_id&&data.live[listing.published_version_id];
 const differences=vSel?trMeta(vSel,listing,data.partners,data.categories,locale,t,live):[];
 const gate=session.status==="mfa_setup_required"?{href:pathFor("security",locale),label:t.setup}:
  session.status==="mfa_required"?{href:pathFor("auth",locale)+"?mode=mfa",label:t.mfa}:
  session.status==="signed_out"?{href:pathFor("auth",locale)+"?next="+encodeURIComponent(pathFor("staffApprovals",locale)),label:t.signin}:null;
 return <main className="dd-staff-catalog" id="main-content" dir={locale==="ar"?"rtl":"ltr"}>
  <div className="dd-catalog-width">
   <header className="dd-catalog-heading">
    <div><Link href={pathFor("staffCatalog",locale)}>{t.back} ↗</Link><h1>{t.title}</h1><p>{t.intro}</p></div>
    {data.stage==="ready"&&<div className="dd-catalog-actions"><Link className="dd-catalog-outline" href={pathFor("staffPortal",locale)}>{t.workspace}</Link>
     <button className="dd-catalog-outline" type="button" onClick={reload}>{t.refresh}</button></div>}
   </header>
   {!active?<section className="dd-catalog-panel dd-catalog-gate"><p>{session.status==="loading"?t.loading:t.denied}</p>{gate&&<Link className="dd-catalog-main" href={gate.href}>{gate.label}</Link>}</section>:
    data.stage==="loading"?<section className="dd-catalog-panel dd-catalog-gate" role="status">{t.loading}</section>:
    data.stage!=="ready"?<section className="dd-catalog-panel dd-catalog-gate" role="alert">{data.stage==="denied"?t.denied:t.error}<button className="dd-catalog-outline" onClick={reload}>{t.refresh}</button></section>:<>
    {message&&<p role="status" className="dd-catalog-notice">{message}</p>}
    {error&&!selected&&<p role="alert" className="dd-catalog-error">{error}</p>}
    <div className="dd-catalog-stats">
     <article><span>{t.pending}</span><strong>{data.pending.length}</strong></article>
     <article><span>{t.new}</span><strong>{data.pending.filter(v=>!data.listings[v.listing_id]?.published_version_id).length}</strong></article>
     <article><span>{t.updates}</span><strong>{data.pending.filter(v=>data.listings[v.listing_id]?.published_version_id).length}</strong></article>
    </div>
    {data.overflow&&<p className="dd-catalog-warning">{t.limit}</p>}
    <div className="dd-catalog-toolbar">
     <input type="search" value={term} onChange={e=>setTerm(e.target.value)} placeholder={t.search} aria-label={t.search}/>
     <select value={partnerFilter} aria-label={t.partner} onChange={e=>setPartnerFilter(e.target.value)}>
      <option value="">{t.all}</option>{Object.values(data.partners).map(p=><option key={p.id} value={p.id}>{localeName(p,locale)}</option>)}
     </select>
     <select value={kindFilter} aria-label={t.kind} onChange={e=>setKindFilter(e.target.value)}>
      <option value="">{t.allKinds}</option>{kinds.map(k=><option key={k} value={k}>{t.kindLabel[k]}</option>)}
     </select>
    </div>
    <section className="dd-catalog-panel">{filtered.length?<div className="dd-catalog-table-scroll"><table>
     <thead><tr><th>{t.item}</th><th>{t.partner}</th><th>{t.kindCol}</th><th>{t.proposal}</th><th>{t.current}</th><th>{t.submitted}</th><th></th></tr></thead>
     <tbody>{filtered.map(x=>{
      const l=data.listings[x.listing_id],p=proposedOf(x),partner=data.partners[p.partner_id||l?.partner_id];
      const current=data.live[l?.published_version_id];
      return <tr key={x.id}><td><strong>{localeName(x,locale)}</strong></td><td>{localeName(partner,locale)}</td>
       <td>{t.kindLabel[p.kind||l?.kind]||"—"}</td>
       <td dir="ltr">{priceLabel(x.price,x.currency,locale)}</td>
       <td dir="ltr">{priceLabel(current?.price,current?.currency,locale)}</td>
       <td>{dateLabel(x.submitted_at||x.created_at,locale)}</td>
       <td><button type="button" className="dd-catalog-outline small" onClick={()=>open(x)}>{t.show}</button></td>
      </tr>;
     })}</tbody>
    </table></div>:<p className="dd-catalog-empty">{t.none}</p>}</section>
    <p className="dd-catalog-warning">{t.noteWarn}</p>
   </>}
  </div>
  {selected&&vSel&&active&&data.stage==="ready"&&<div className="dd-catalog-overlay" onMouseDown={e=>{if(e.currentTarget===e.target&&!busy)setSelected(null);}}>
   <section role="dialog" aria-modal="true" className="dd-catalog-dialog" tabIndex={-1} ref={dialog} aria-labelledby="dd-catalog-review-title">
    <header><h2 id="dd-catalog-review-title">{t.compare}: {localeName(vSel,locale)}</h2>
     <button type="button" disabled={busy} onClick={()=>setSelected(null)} aria-label={t.close}>×</button></header>
    {!live&&<p className="dd-catalog-dialog-hint">{t.first}</p>}
    <div className="dd-catalog-compare">
     <div className="dd-compare-head"><strong>{t.field}</strong><strong>{t.existing}</strong><strong>{t.proposed}</strong></div>
     {differences.map((r,i)=><div key={i} className={"dd-compare-row"+(r.changed?" is-changed":"")} aria-label={r.changed?t.changed:undefined}>
      <strong>{r.label}</strong><span>{r.before}</span><span>{r.after}</span></div>)}
    </div>
    <label className="dd-catalog-review-note">{t.note}<textarea rows={3} value={note} disabled={busy} onChange={e=>setNote(e.target.value)} placeholder={t.noteHint} maxLength={1000}/></label>
    {error&&<p role="alert" className="dd-catalog-error">{error}</p>}
    <footer>
     <button type="button" className="dd-catalog-main" disabled={busy} onClick={()=>decide("approve")}>{busy?t.working:t.approve}</button>
     <button type="button" className="dd-catalog-danger" disabled={busy} onClick={()=>decide("reject")}>{busy?t.working:t.reject}</button>
     <button type="button" className="dd-catalog-outline" disabled={busy} onClick={()=>setSelected(null)}>{t.close}</button>
    </footer>
   </section>
  </div>}
 </main>;
}
