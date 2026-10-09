"use client";

import Link from "next/link";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {authClient,EMPLOYEE_ROLES,readCurrentAccount,rememberPreference} from "../lib/auth-client";
import {useAuthSession} from "./auth-session-provider";
import {pathFor} from "../lib/locales";
import {blankDraft,createVersionPayload,dateLabel,draftFromListing,kinds,latestOf,localeName,priceLabel,proposedOf} from "../lib/staff-catalog";

const MAX_ROWS=500;
const copy={
 ar:{
  title:"المنتجات والخدمات",subtitle:"إدارة الكتالوج بنظام نسخ: التعديل لا ينشر إلا بعد موافقة منفصلة.",
  back:"لوحة الفريق",approvals:"الموافقات",add:"إضافة منتج أو خدمة",refresh:"تحديث",
  loading:"جاري تحميل الكتالوج…",denied:"هذه الصفحة لموظفي Dear Day المصرح لهم بالكتالوج.",
  failed:"تعذر تحميل الكتالوج. حاول مرة أخرى.",signin:"تسجيل الدخول",setup:"تفعيل المصادقة",verify:"التحقق بخطوتين",
  total:"إجمالي العناصر المحمّلة",available:"متاح حاليًا",published:"لديه إصدار منشور",pending:"بانتظار الموافقة",
  find:"ابحث باسم المنتج أو الشريك",allPartners:"كل الشركاء",allKinds:"كل الأنواع",allAvailability:"كل حالات التوفر",
  availableOnly:"متاح",unavailableOnly:"غير متاح",name:"اسم العنصر",partner:"الشريك",kind:"النوع",
  status:"حالة أحدث نسخة",price:"السعر",availability:"التوفر",updated:"آخر تعديل",stock:"المخزون / السعة",
  noItems:"لا توجد عناصر مطابقة.",edit:"تعديل",view:"عرض التفاصيل",history:"سجل النسخ",noHistory:"لا توجد نسخ مسجلة.",
  formTitle:"إنشاء نسخة للمنتج أو الخدمة",newTitle:"إضافة منتج أو خدمة",
  category:"التصنيف",noCategory:"بدون تصنيف",arName:"الاسم بالعربي",enName:"الاسم بالإنجليزي",
  descAr:"الوصف بالعربي",descEn:"الوصف بالإنجليزي",compare:"السعر قبل الخصم",stockQty:"المخزون",
  capacity:"السعة اليومية",media:"روابط الصور (رابط https في كل سطر، بحد أقصى 12)",
  isAvailable:"مقترح إتاحة العنصر بعد الموافقة",
  draft:"حفظ مسودة",submit:"إرسال للمراجعة",cancel:"إلغاء",saving:"جاري الحفظ…",
  saved:"تم حفظ نسخة مسودة. النسخة المنشورة لم تتغير.",submitted:"تم إرسال نسخة للمراجعة. النسخة المنشورة لم تتغير.",
  errorSave:"تعذر حفظ النسخة. راجع الصلاحيات والبيانات ثم حاول مجددًا.",
  errorValidate:"يرجى إدخال شريك واسم عربي وسعر صحيح ومخزون وسعة صالحين.",
  errorMedia:"روابط الصور لازم تبدأ بـhttps وألا تزيد عن 12 رابطًا.",
  confirmNew:"تأكيد إنشاء نسخة في قاعدة بيانات Dear Day الفعلية؟ التعديل لن ينشر تلقائيًا.",
  close:"إغلاق",readonly:"هذا الحساب لديه حق العرض فقط.",proposed:"التعديلات المقترحة",
  oldLive:"النسخة المنشورة لا تتغير إلا من صفحة الموافقات.",
  countWarning:"يتم عرض أحدث 500 عنصر. لو الكتالوج أكبر، يلزم استكمال التصفح بصفحات لاحقًا.",
  kinds:{product:"منتج",service:"خدمة",venue:"مكان",experience:"تجربة"},
  statuses:{draft:"مسودة",pending_review:"بانتظار المراجعة",published:"منشور",rejected:"مرفوض",archived:"مؤرشف"}
 },
 en:{
  title:"Products & Services",subtitle:"Versioned catalog management: proposed changes are not published until independently approved.",
  back:"Staff dashboard",approvals:"Approvals",add:"Add product or service",refresh:"Refresh",
  loading:"Loading catalog…",denied:"This page is for staff with catalog access.",
  failed:"Couldn't load the catalog. Please try again.",signin:"Log in",setup:"Set up authenticator",verify:"Complete two-step verification",
  total:"Loaded listings",available:"Currently available",published:"With published version",pending:"Awaiting approval",
  find:"Search item or partner name",allPartners:"All partners",allKinds:"All kinds",allAvailability:"All availability",
  availableOnly:"Available",unavailableOnly:"Unavailable",name:"Listing",partner:"Partner",kind:"Kind",
  status:"Latest version",price:"Price",availability:"Availability",updated:"Updated",stock:"Stock / capacity",
  noItems:"No matching listings.",edit:"Edit",view:"View details",history:"Version history",noHistory:"No versions recorded.",
  formTitle:"Create a new proposal version",newTitle:"Add product or service",
  category:"Category",noCategory:"No category",arName:"Arabic name",enName:"English name",
  descAr:"Arabic description",descEn:"English description",compare:"Compare-at price",stockQty:"Stock quantity",
  capacity:"Daily capacity",media:"Image URLs (one https URL per line, maximum 12)",
  isAvailable:"Propose availability after approval",
  draft:"Save draft",submit:"Submit for review",cancel:"Cancel",saving:"Saving…",
  saved:"Draft version saved. The published listing has not changed.",submitted:"Version submitted for review. The published listing has not changed.",
  errorSave:"Couldn't save the version. Check your permissions and values.",
  errorValidate:"Select a partner and enter an Arabic name, valid price and valid stock/capacity.",
  errorMedia:"Image links must start with https; maximum 12 links.",
  confirmNew:"Create this version in the live Dear Day database? It will not be published automatically.",
  close:"Close",readonly:"Your account has view-only catalog access.",proposed:"Proposed changes",
  oldLive:"The published version changes only from the approvals workflow.",
  countWarning:"The newest 500 items are shown. A larger catalog requires server-side pagination in a follow-up.",
  kinds:{product:"Product",service:"Service",venue:"Venue",experience:"Experience"},
  statuses:{draft:"Draft",pending_review:"Pending review",published:"Published",rejected:"Rejected",archived:"Archived"}
 }
};
const columns="id,partner_id,category_id,kind,published_version_id,is_available,stock_qty,capacity_per_day,updated_at";
const versionFields="id,listing_id,status,name_ar,name_en,description_ar,description_en,price,compare_at_price,currency,media,metadata,review_note,created_at,submitted_at";
const empty={stage:"loading",permissions:[],listings:[],versions:[],partners:[],categories:[],hasMore:false};
export default function StaffCatalog({locale="ar"}){
 const t=copy[locale]||copy.ar,session=useAuthSession();
 const active=session.status==="authenticated"&&EMPLOYEE_ROLES.has(session.role);
 const memberId=active?session.user?.id:null;
 const client=useMemo(()=>typeof window==="undefined"?null:authClient(rememberPreference()),[]);
 const [data,setData]=useState(empty);
 const [version,setVersion]=useState(0);
 const [term,setTerm]=useState(""),[partnerFilter,setPartnerFilter]=useState(""),[kindFilter,setKindFilter]=useState(""),[availabilityFilter,setAvailabilityFilter]=useState("");
 const [draft,setDraft]=useState(null),[saveBusy,setSaveBusy]=useState(false),[notice,setNotice]=useState("");
 const [editorError,setEditorError]=useState("");
 const req=useRef(0),dialogRef=useRef(null);
 const canView=data.stage==="ready";
 const canManage=canView&&data.permissions.includes("catalog.manage");
 const canReview=canView&&data.permissions.includes("approvals.review");
 const reload=useCallback(()=>setVersion(n=>n+1),[]);
 useEffect(()=>{
  const current=++req.current;
  if(!active||!client||!memberId){setData(empty);return;}
  setData(empty);
  (async()=>{
   try{
    const p=await client.rpc("get_my_permissions");
    if(p.error)throw p.error;
    if(current!==req.current)return;
    const permissions=(p.data||[]).map(x=>x.permission_code);
    if(!permissions.some(s=>["catalog.view","catalog.manage"].includes(s))){
     setData({...empty,stage:"denied"});return;
    }
    const listings=await client.from("listings").select(columns).order("updated_at",{ascending:false}).limit(MAX_ROWS+1);
    if(listings.error)throw listings.error;
    const rows=(listings.data||[]).slice(0,MAX_ROWS);
    const ids=rows.map(l=>l.id);
    // Supabase/PostgREST queries with hundreds of UUIDs can exceed proxy URL
    // limits; fetch version history in bounded batches and sort it globally.
    const batches=[];
    for(let i=0;i<ids.length;i+=60)batches.push(ids.slice(i,i+60));
    const responses=await Promise.all([
      client.from("partner_directory").select("id,name_ar,name_en,status").order("name_ar").limit(1000),
      client.from("categories").select("id,slug,name_ar,name_en,is_active").order("sort_order"),
      ...batches.map(batch=>client.from("listing_versions").select(versionFields)
        .in("listing_id",batch).order("created_at",{ascending:false}).limit(1000))
    ]);
    if(responses.some(r=>r.error))throw responses.find(r=>r.error).error;
    const [partners,categories,...versionBatches]=responses;
    const versions=versionBatches.flatMap(r=>r.data||[])
      .sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
    if(current!==req.current)return;
    setData({stage:"ready",permissions,listings:rows,partners:partners.data||[],categories:categories.data||[],versions,hasMore:(listings.data||[]).length>MAX_ROWS});
   }catch{if(current===req.current)setData({...empty,stage:"error"});}
  })();
  return()=>{req.current++;};
 },[active,client,memberId,version]);

 useEffect(()=>{
  if(!draft)return;
  const prev=document.activeElement;
  document.body.style.overflow="hidden";
  dialogRef.current?.focus();
  const escape=e=>{if(e.key==="Escape"&&!saveBusy)setDraft(null);};
  window.addEventListener("keydown",escape);
  return()=>{document.body.style.overflow="";window.removeEventListener("keydown",escape);if(prev instanceof HTMLElement)prev.focus();};
 },[Boolean(draft),saveBusy]);

 const maps=useMemo(()=>({
  partners:Object.fromEntries(data.partners.map(x=>[x.id,x])),
  categories:Object.fromEntries(data.categories.map(x=>[x.id,x]))
 }),[data.partners,data.categories]);
 const versionMap=useMemo(()=>{
   const rows={};
   for(const v of data.versions){if(!rows[v.listing_id])rows[v.listing_id]=v;}
   return rows;
 },[data.versions]);
 const filtered=useMemo(()=>{
  const needle=term.trim().toLocaleLowerCase();
  return data.listings.filter(l=>{
   if(partnerFilter&&l.partner_id!==partnerFilter)return false;
   if(kindFilter&&l.kind!==kindFilter)return false;
   if(availabilityFilter&&(availabilityFilter==="available")!==l.is_available)return false;
   const v=versionMap[l.id],p=maps.partners[l.partner_id];
   return !needle||[v?.name_ar,v?.name_en,p?.name_ar,p?.name_en,l.kind].some(x=>String(x||"").toLocaleLowerCase().includes(needle));
  });
 },[data.listings,term,partnerFilter,kindFilter,availabilityFilter,versionMap,maps]);
 function openNew(){
  if(!canManage)return;
  setEditorError("");setDraft(blankDraft());
 }
 function openExisting(l){
  setEditorError("");setDraft({...draftFromListing(l,versionMap[l.id]),readOnly:!canManage});
 }
 function field(key,value){setDraft(old=>({...old,[key]:value}));}
 async function save(submit){
  if(!canManage||!draft||saveBusy||!client||!memberId)return;
  setEditorError("");setSaveBusy(true);
  try{
   const next={...draft,submit},payload=createVersionPayload(next,memberId);
   if(!window.confirm(t.confirmNew))return;
   const who=await readCurrentAccount(client);
   if(who.status!=="authenticated"||who.user.id!==memberId||!EMPLOYEE_ROLES.has(who.role))throw Error("session");
   const own=await client.rpc("get_my_permissions");
   if(own.error||!(own.data||[]).some(x=>x.permission_code==="catalog.manage"))throw Error("permission");
   let id=next.id;
   if(!id){
    // Unpublished placeholder only; proposed availability is applied by the
    // authenticated review RPC. A failed version insert cannot publish it.
    const l=await client.from("listings").insert({
     partner_id:payload.proposed.partner_id,category_id:payload.proposed.category_id,
     kind:payload.proposed.kind,is_available:false,
     stock_qty:payload.proposed.stock_qty,capacity_per_day:payload.proposed.capacity_per_day
    }).select("id").single();
    if(l.error)throw l.error;
    id=l.data.id;
   }
   const v=await client.from("listing_versions").insert({...payload.version,listing_id:id}).select("id").single();
   if(v.error)throw v.error;
   setDraft(null);setNotice(submit?t.submitted:t.saved);reload();
  }catch(e){setEditorError(e.message==="invalid"?t.errorValidate:e.message==="invalid_media"?t.errorMedia:t.errorSave);}
  finally{setSaveBusy(false);}
 }
 const gate=session.status==="mfa_setup_required"?{href:pathFor("security",locale),label:t.setup}:
  session.status==="mfa_required"?{href:pathFor("auth",locale)+"?mode=mfa",label:t.verify}:
  session.status==="signed_out"?{href:pathFor("auth",locale)+"?next="+encodeURIComponent(pathFor("staffCatalog",locale)),label:t.signin}:null;
 return <main className="dd-staff-catalog" id="main-content" dir={locale==="ar"?"rtl":"ltr"}>
  <div className="dd-catalog-width">
   <header className="dd-catalog-heading">
     <div><Link href={pathFor("staffPortal",locale)}>{t.back} ↗</Link><h1>{t.title}</h1><p>{t.subtitle}</p></div>
     {canView&&<div className="dd-catalog-actions">
       {canReview&&<Link className="dd-catalog-outline" href={pathFor("staffApprovals",locale)}>{t.approvals}</Link>}
       {canManage&&<button className="dd-catalog-main" type="button" onClick={openNew}>+ {t.add}</button>}
       <button className="dd-catalog-outline" type="button" onClick={reload}>{t.refresh}</button>
     </div>}
   </header>
   {!active?<section className="dd-catalog-panel dd-catalog-gate"><p>{session.status==="loading"?t.loading:t.denied}</p>{gate&&<Link href={gate.href} className="dd-catalog-main">{gate.label}</Link>}</section>:
    data.stage==="loading"?<section className="dd-catalog-panel dd-catalog-gate" role="status">{t.loading}</section>:
    data.stage!=="ready"?<section className="dd-catalog-panel dd-catalog-gate" role="alert">{data.stage==="denied"?t.denied:t.failed}<button className="dd-catalog-outline" onClick={reload}>{t.refresh}</button></section>:<>
     {notice&&<p className="dd-catalog-notice" role="status">{notice}</p>}
     <div className="dd-catalog-stats">
      {[
       [t.total,data.listings.length],
       [t.available,data.listings.filter(l=>l.is_available).length],
       [t.published,data.listings.filter(l=>l.published_version_id).length],
       [t.pending,data.versions.filter(v=>v.status==="pending_review").length]
      ].map(([label,value])=><article key={label}><span>{label}</span><strong>{value}</strong></article>)}
     </div>
     {data.hasMore&&<p className="dd-catalog-warning">{t.countWarning}</p>}
     <div className="dd-catalog-toolbar">
      <input type="search" value={term} onChange={e=>setTerm(e.target.value)} placeholder={t.find} aria-label={t.find}/>
      <select value={partnerFilter} aria-label={t.partner} onChange={e=>setPartnerFilter(e.target.value)}><option value="">{t.allPartners}</option>
       {data.partners.map(p=><option key={p.id} value={p.id}>{localeName(p,locale)}</option>)}
      </select>
      <select value={kindFilter} aria-label={t.kind} onChange={e=>setKindFilter(e.target.value)}><option value="">{t.allKinds}</option>
       {kinds.map(k=><option key={k} value={k}>{t.kinds[k]}</option>)}
      </select>
      <select value={availabilityFilter} aria-label={t.availability} onChange={e=>setAvailabilityFilter(e.target.value)}>
       <option value="">{t.allAvailability}</option><option value="available">{t.availableOnly}</option><option value="unavailable">{t.unavailableOnly}</option>
      </select>
     </div>
     <section className="dd-catalog-panel">
      {filtered.length?<div className="dd-catalog-table-scroll"><table>
       <thead><tr><th>{t.name}</th><th>{t.partner}</th><th>{t.kind}</th><th>{t.status}</th><th>{t.price}</th><th>{t.availability}</th><th>{t.stock}</th><th>{t.updated}</th><th></th></tr></thead>
       <tbody>{filtered.map(l=>{
        const v=versionMap[l.id],p=maps.partners[l.partner_id],published=l.published_version_id;
        return <tr key={l.id}>
         <td><strong>{localeName(v,locale)}</strong>{published&&published!==v?.id&&<small>Live ✓</small>}</td>
         <td>{localeName(p,locale)}</td><td>{t.kinds[l.kind]||l.kind}</td>
         <td><span className={"dd-catalog-tag s-"+(v?.status||"draft")}>{t.statuses[v?.status]||"—"}</span></td>
         <td dir="ltr">{priceLabel(v?.price,v?.currency,locale)}</td>
         <td>{l.is_available?t.availableOnly:t.unavailableOnly}</td>
         <td>{l.kind==="product"?(l.stock_qty??"—"):(l.capacity_per_day??"—")}</td>
         <td>{dateLabel(l.updated_at,locale)}</td>
         <td><button type="button" className="dd-catalog-outline small" onClick={()=>openExisting(l)}>{canManage?t.edit:t.view}</button></td>
        </tr>;
       })}</tbody>
      </table></div>:<p className="dd-catalog-empty">{t.noItems}</p>}
     </section>
    </>}
  </div>
  {draft&&active&&canView&&<div className="dd-catalog-overlay" onMouseDown={e=>{if(e.target===e.currentTarget&&!saveBusy)setDraft(null);}}>
    <section className="dd-catalog-dialog" ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="dd-catalog-dialog-title">
     <header><h2 id="dd-catalog-dialog-title">{draft.id?t.formTitle:t.newTitle}</h2><button type="button" onClick={()=>setDraft(null)} disabled={saveBusy} aria-label={t.close}>×</button></header>
     <p className="dd-catalog-dialog-hint">{canManage?t.oldLive:t.readonly}</p>
     <div className="dd-catalog-form">
      <label>{t.partner}<select required value={draft.partner_id} disabled={!canManage||saveBusy} onChange={e=>field("partner_id",e.target.value)}>
       <option value="">—</option>{data.partners.map(p=><option value={p.id} key={p.id}>{localeName(p,locale)}</option>)}
      </select></label>
      <label>{t.category}<select value={draft.category_id} disabled={!canManage||saveBusy} onChange={e=>field("category_id",e.target.value)}>
       <option value="">{t.noCategory}</option>{data.categories.filter(x=>x.is_active).map(c=><option key={c.id} value={c.id}>{localeName(c,locale)}</option>)}
      </select></label>
      <label>{t.kind}<select value={draft.kind} disabled={!canManage||saveBusy} onChange={e=>field("kind",e.target.value)}>
       {kinds.map(k=><option key={k} value={k}>{t.kinds[k]}</option>)}
      </select></label>
      <label>{t.arName}<input required maxLength={250} value={draft.name_ar} disabled={!canManage||saveBusy} onChange={e=>field("name_ar",e.target.value)}/></label>
      <label>{t.enName}<input maxLength={250} value={draft.name_en} disabled={!canManage||saveBusy} onChange={e=>field("name_en",e.target.value)}/></label>
      <label>{t.price} (EGP)<input type="number" min="0" step="0.01" required value={draft.price} disabled={!canManage||saveBusy} onChange={e=>field("price",e.target.value)}/></label>
      <label>{t.compare}<input type="number" min="0" step="0.01" value={draft.compare_at_price} disabled={!canManage||saveBusy} onChange={e=>field("compare_at_price",e.target.value)}/></label>
      <label>{t.stockQty}<input type="number" min="0" step="1" value={draft.stock_qty} disabled={!canManage||saveBusy} onChange={e=>field("stock_qty",e.target.value)}/></label>
      <label>{t.capacity}<input type="number" min="0" step="1" value={draft.capacity_per_day} disabled={!canManage||saveBusy} onChange={e=>field("capacity_per_day",e.target.value)}/></label>
      <label className="wide">{t.descAr}<textarea rows={3} value={draft.description_ar} disabled={!canManage||saveBusy} onChange={e=>field("description_ar",e.target.value)}/></label>
      <label className="wide">{t.descEn}<textarea rows={3} value={draft.description_en} disabled={!canManage||saveBusy} onChange={e=>field("description_en",e.target.value)}/></label>
      <label className="wide">{t.media}<textarea rows={4} dir="ltr" value={draft.media} disabled={!canManage||saveBusy} onChange={e=>field("media",e.target.value)}/></label>
      <label className="wide dd-catalog-checkbox"><input type="checkbox" checked={draft.is_available} disabled={!canManage||saveBusy} onChange={e=>field("is_available",e.target.checked)}/>{t.isAvailable}</label>
     </div>
     {draft.id&&<section className="dd-catalog-history"><h3>{t.history}</h3>
      {data.versions.filter(v=>v.listing_id===draft.id).length?data.versions.filter(v=>v.listing_id===draft.id).map(v=><p key={v.id}><span>{t.statuses[v.status]} · {dateLabel(v.created_at,locale)}</span><strong>{priceLabel(v.price,v.currency,locale)}</strong></p>):<p>{t.noHistory}</p>}
     </section>}
     {editorError&&<p role="alert" className="dd-catalog-error">{editorError}</p>}
     <footer>{canManage&&<>
      <button type="button" disabled={saveBusy} className="dd-catalog-outline" onClick={()=>save(false)}>{saveBusy?t.saving:t.draft}</button>
      <button type="button" disabled={saveBusy} className="dd-catalog-main" onClick={()=>save(true)}>{saveBusy?t.saving:t.submit}</button>
     </>}<button type="button" className="dd-catalog-outline" disabled={saveBusy} onClick={()=>setDraft(null)}>{t.cancel}</button></footer>
    </section>
  </div>}
 </main>;
}
