"use client";
import {useEffect,useMemo,useState} from "react";
import {usePartnerPortal,usePartnerMutations} from "./partner-portal-base";
import {blankDraft,draftFromListing,createVersionPayload,kinds,localeName,priceLabel} from "../lib/staff-catalog";
const lex={
 ar:{title:"منتجاتي وخدماتي",new:"إضافة عنصر",refresh:"تحديث",loading:"جاري تحميل الكتالوج…",error:"تعذر تحميل بيانات الكتالوج.",search:"ابحث بالاسم",all:"كل الحالات",none:"لا توجد منتجات أو خدمات مطابقة.",
 name:"اسم المنتج",kind:"نوع الخدمة",status:"آخر نسخة",price:"السعر",available:"التوفر",inventory:"المخزون / السعة",edit:"تعديل",stock:"تعديل التوفر",live:"الإصدار المنشور لم يتغير",
 partner:"الشريك",category:"التصنيف",nameAr:"الاسم بالعربي",nameEn:"الاسم بالإنجليزي",descAr:"الوصف بالعربي",descEn:"الوصف بالإنجليزي",compare:"السعر قبل الخصم",
 stockQty:"المخزون",daily:"السعة اليومية",media:"روابط الصور (كل رابط HTTPS في سطر)",enabled:"إتاحة المنتج",draft:"حفظ مسودة",submit:"إرسال للمراجعة",save:"حفظ التوفر",close:"إغلاق",
 bad:"راجع الاسم العربي والسعر وروابط الصور (HTTPS فقط) والمخزون والسعة.",confirm:"هل تؤكد حفظ هذا التعديل على كتالوج Dear Day؟ النسخة المنشورة لن تتغير إلا بعد الموافقة.",
 confirmStock:"تحديث المخزون والتوفر هيغيّر الإتاحة الحالية مباشرة. هل تؤكد؟",saved:"تم حفظ التعديل؛ النسخة المنشورة لم تتغير.",
 stockSaved:"تم تحديث التوفر والمخزون.",failed:"تعذر حفظ التعديل. قد تكون الصلاحيات أو البيانات تغيرت.",busy:"جاري الحفظ…",
 stats:["المنتجات والخدمات","بانتظار الموافقة","منشور","متاح"],
 statuses:{draft:"مسودة",pending_review:"بانتظار الموافقة",published:"منشور",rejected:"مرفوض",archived:"مؤرشف"},
 kinds:{product:"منتج",service:"خدمة",venue:"مكان",experience:"تجربة"},limit:"أحدث 300 عنصر فقط، و1000 نسخة لكل 40 عنصر؛ يلزم Pagination قبل زيادة الأعداد."},
 en:{title:"My Products & Services",new:"Add listing",refresh:"Refresh",loading:"Loading catalog…",error:"Unable to load your catalog.",search:"Search by name",all:"All statuses",none:"No matching listings.",
 name:"Listing",kind:"Type",status:"Latest version",price:"Price",available:"Available",inventory:"Stock / capacity",edit:"Edit",stock:"Inventory",live:"Published version remains unchanged",
 partner:"Partner",category:"Category",nameAr:"Arabic name",nameEn:"English name",descAr:"Arabic description",descEn:"English description",compare:"Compare-at price",
 stockQty:"Stock",daily:"Daily capacity",media:"Image URLs (one HTTPS URL per line)",enabled:"Enable listing",draft:"Save draft",submit:"Submit for review",save:"Save inventory",close:"Close",
 bad:"Check Arabic name, nonnegative price, HTTPS images, stock and capacity.",confirm:"Confirm saving this listing? Existing published details will remain unchanged until approved.",
 confirmStock:"Inventory and availability change immediately. Confirm?",saved:"Proposal saved; published listing unchanged.",
 stockSaved:"Inventory and availability updated.",failed:"Could not save. Access or data may have changed.",busy:"Saving…",
 stats:["Total listings","Pending review","Published","Available"],
 statuses:{draft:"Draft",pending_review:"Pending review",published:"Published",rejected:"Rejected",archived:"Archived"},
 kinds:{product:"Product",service:"Service",venue:"Venue",experience:"Experience"},limit:"Newest 300 listings and up to 1000 versions per group of 40. Add server pagination for larger catalogs."}
};
const cap=300;
export default function PartnerProductsPanel(){
 const {client,partner,locale}=usePartnerPortal(),verify=usePartnerMutations(),t=lex[locale]||lex.ar;
 const [data,setData]=useState({stage:"loading",listings:[],versions:[],categories:[]});
 const [revision,setRevision]=useState(0),[query,setQuery]=useState(""),[status,setStatus]=useState("");
 const [draft,setDraft]=useState(null),[inventory,setInventory]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const reload=()=>setRevision(n=>n+1);
 useEffect(()=>{
  let live=true;setData({stage:"loading",listings:[],versions:[],categories:[]});
  (async()=>{
   try{
    if(!partner)return;
    const [l,c]=await Promise.all([
     client.from("listings").select("id,partner_id,category_id,kind,published_version_id,is_available,stock_qty,capacity_per_day,updated_at").eq("partner_id",partner.id).order("updated_at",{ascending:false}).limit(cap+1),
     client.from("categories").select("id,name_ar,name_en,is_active").eq("is_active",true)
    ]);
    if(l.error||c.error)throw l.error||c.error;
    const listings=(l.data||[]).slice(0,cap),ids=listings.map(x=>x.id),versions=[];
    for(let i=0;i<ids.length;i+=40){
     const v=await client.from("listing_versions").select("id,listing_id,status,name_ar,name_en,description_ar,description_en,price,compare_at_price,currency,media,metadata,created_at").in("listing_id",ids.slice(i,i+40)).order("created_at",{ascending:false}).limit(1000);
     if(v.error)throw v.error;versions.push(...(v.data||[]));
    }
    if(live)setData({stage:"ready",listings,versions,categories:c.data||[],overflow:(l.data||[]).length>cap});
   }catch{if(live)setData({stage:"error",listings:[],versions:[],categories:[]});}
  })();
  return()=>{live=false;};
 },[client,partner?.id,revision]);
 const versionMap=useMemo(()=>{
  const out={};for(const v of data.versions.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))){if(!out[v.listing_id])out[v.listing_id]=v;}
  return out;
 },[data.versions]);
 const results=data.listings.filter(l=>{
  const v=versionMap[l.id];return (!status||v?.status===status)&&(!query.trim()||[v?.name_ar,v?.name_en].join(" ").toLowerCase().includes(query.trim().toLowerCase()));
 });
 function begin(listing){
  setError("");setNotice("");
  const v=listing?versionMap[listing.id]:null;
  setDraft(listing?draftFromListing(listing,v):{...blankDraft(),partner_id:partner.id});
 }
 async function submit(draftOnly){
  if(!draft||busy||!partner)return;
  let payload;
  try{payload=createVersionPayload({...draft,partner_id:partner.id,submit:!draftOnly},null);}catch{setError(t.bad);return;}
  if(!window.confirm(t.confirm))return;
  setBusy(true);setError("");setNotice("");
  try{
   const id=await verify();
   if(draft.id&&!data.listings.some(l=>l.id===draft.id&&l.partner_id===id))throw Error("scope");
   const r=await client.rpc("partner_submit_listing",{
    p_listing_id:draft.id||null,p_partner_id:id,p_category_id:payload.proposed.category_id,
    p_kind:payload.proposed.kind,p_name_ar:payload.version.name_ar,p_name_en:payload.version.name_en,
    p_description_ar:payload.version.description_ar,p_description_en:payload.version.description_en,
    p_price:payload.version.price,p_compare_at_price:payload.version.compare_at_price,p_currency:"EGP",
    p_media:payload.version.media,p_is_available:payload.proposed.is_available,
    p_stock_qty:payload.proposed.stock_qty,p_capacity_per_day:payload.proposed.capacity_per_day,p_submit:!draftOnly
   });
   if(r.error)throw r.error;setDraft(null);setNotice(t.saved);reload();
  }catch{setError(t.failed);}finally{setBusy(false);}
 }
 async function saveStock(){
  if(!inventory||busy||!partner)return;
  const stock=inventory.stock_qty===""?null:Number(inventory.stock_qty);
  const capacity=inventory.capacity_per_day===""?null:Number(inventory.capacity_per_day);
  if([stock,capacity].some(x=>x!==null&&(!Number.isInteger(x)||x<0))){setError(t.bad);return;}
  if(!window.confirm(t.confirmStock))return;
  setBusy(true);setError("");
  try{
   const pid=await verify(),listing=data.listings.find(x=>x.id===inventory.id);
   if(!listing||listing.partner_id!==pid)throw Error("scope");
   const r=await client.rpc("partner_set_inventory",{p_listing_id:inventory.id,
    p_is_available:inventory.is_available,p_stock_qty:stock,p_capacity_per_day:capacity});
   if(r.error)throw r.error;setInventory(null);setNotice(t.stockSaved);reload();
  }catch{setError(t.failed);}finally{setBusy(false);}
 }
 const field=(key,value)=>setDraft(x=>({...x,[key]:value}));
 return <div className="dd-pp-page">
  <div className="dd-pp-heading"><h1>{t.title}</h1><div className="dd-pp-actions">
   <button type="button" onClick={reload}>{t.refresh}</button><button type="button" onClick={()=>begin(null)}>+ {t.new}</button>
  </div></div>
  {error&&<p role="alert" className="dd-pp-error">{error}</p>}{notice&&<p role="status" className="dd-pp-success">{notice}</p>}
  {data.stage==="loading"?<p role="status">{t.loading}</p>:data.stage==="error"?<p role="alert">{t.error}</p>:<>
   {data.overflow&&<p className="dd-pp-warning">{t.limit}</p>}
   <div className="dd-pp-kpis">{[data.listings.length,data.versions.filter(x=>x.status==="pending_review").length,data.listings.filter(x=>x.published_version_id).length,data.listings.filter(x=>x.is_available).length]
     .map((n,i)=><article key={i}><span>{t.stats[i]}</span><strong>{n}</strong></article>)}</div>
   <div className="dd-pp-filters"><input type="search" aria-label={t.search} placeholder={t.search} value={query} onChange={e=>setQuery(e.target.value)}/>
    <select value={status} aria-label={t.status} onChange={e=>setStatus(e.target.value)}><option value="">{t.all}</option>{Object.keys(t.statuses).map(x=><option key={x} value={x}>{t.statuses[x]}</option>)}</select></div>
   <div className="dd-pp-panel">{results.length?<div className="dd-pp-table-wrap"><table><thead><tr>
    <th>{t.name}</th><th>{t.kind}</th><th>{t.status}</th><th>{t.price}</th><th>{t.available}</th><th>{t.inventory}</th><th></th>
   </tr></thead><tbody>{results.map(l=>{
    const v=versionMap[l.id];return <tr key={l.id}><td>{localeName(v,locale)}{l.published_version_id&&v?.id!==l.published_version_id&&<small>{t.live}</small>}</td>
     <td>{t.kinds[l.kind]}</td><td>{t.statuses[v?.status]||"—"}</td>
     <td dir="ltr">{priceLabel(v?.price,v?.currency,locale)}</td><td>{l.is_available?"✓":"—"}</td>
     <td>{l.kind==="product"?(l.stock_qty??"—"):(l.capacity_per_day??"—")}</td>
     <td><div className="dd-pp-actions"><button type="button" onClick={()=>begin(l)}>{t.edit}</button>
      <button type="button" onClick={()=>{setInventory({...l,stock_qty:l.stock_qty==null?"":String(l.stock_qty),capacity_per_day:l.capacity_per_day==null?"":String(l.capacity_per_day)});setError("");}}>{t.stock}</button></div></td>
    </tr>;
   })}</tbody></table></div>:<p className="dd-pp-empty">{t.none}</p>}</div>
  </>}
  {(draft||inventory)&&<div className="dd-pp-overlay" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy){setDraft(null);setInventory(null)}}}>
   <section className="dd-pp-dialog" role="dialog" aria-modal="true" aria-labelledby="dd-pp-product-title">
    <header><h2 id="dd-pp-product-title">{inventory?t.stock:draft.id?t.edit:t.new}</h2>
     <button aria-label={t.close} disabled={busy} onClick={()=>{setDraft(null);setInventory(null);setError("")}}>×</button></header>
    <div className="dd-pp-modal-body">
     {draft?<div className="dd-pp-form">
      {[[t.nameAr,"name_ar"],[t.nameEn,"name_en"],[t.descAr,"description_ar"],[t.descEn,"description_en"],
        [t.price,"price"],[t.compare,"compare_at_price"],[t.stockQty,"stock_qty"],[t.daily,"capacity_per_day"],[t.media,"media"]].map(([label,key])=>
       <label key={key}>{label}{["description_ar","description_en","media"].includes(key)?<textarea rows={3} value={draft[key]??""} disabled={busy} onChange={e=>field(key,e.target.value)}/>:
        <input value={draft[key]??""} disabled={busy} type={["price","compare_at_price","stock_qty","capacity_per_day"].includes(key)?"number":"text"} min="0" step={["stock_qty","capacity_per_day"].includes(key)?"1":"0.01"} onChange={e=>field(key,e.target.value)}/>}</label>)}
      <label>{t.kind}<select value={draft.kind} disabled={busy} onChange={e=>field("kind",e.target.value)}>{kinds.map(x=><option key={x} value={x}>{t.kinds[x]}</option>)}</select></label>
      <label>{t.category}<select value={draft.category_id} disabled={busy} onChange={e=>field("category_id",e.target.value)}>
       <option value="">—</option>{data.categories.map(x=><option key={x.id} value={x.id}>{localeName(x,locale)}</option>)}</select></label>
      <label className="dd-pp-check"><input type="checkbox" checked={draft.is_available} disabled={busy} onChange={e=>field("is_available",e.target.checked)}/>{t.enabled}</label>
     </div>:inventory&&<div className="dd-pp-form">
      <label className="dd-pp-check"><input type="checkbox" checked={inventory.is_available} disabled={busy} onChange={e=>setInventory(x=>({...x,is_available:e.target.checked}))}/>{t.enabled}</label>
      {[[t.stockQty,"stock_qty"],[t.daily,"capacity_per_day"]].map(([label,key])=><label key={key}>{label}
       <input type="number" min="0" step="1" value={inventory[key]} disabled={busy} onChange={e=>setInventory(x=>({...x,[key]:e.target.value}))}/></label>)}
     </div>}
     {error&&<p className="dd-pp-error" role="alert">{error}</p>}
     <div className="dd-pp-actions">{draft?<><button disabled={busy} onClick={()=>submit(true)}>{busy?t.busy:t.draft}</button>
      <button disabled={busy} onClick={()=>submit(false)}>{busy?t.busy:t.submit}</button></>:<button disabled={busy} onClick={saveStock}>{busy?t.busy:t.save}</button>}</div>
    </div>
   </section>
  </div>}
 </div>;
}
