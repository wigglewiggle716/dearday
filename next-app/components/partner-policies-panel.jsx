"use client";
import {useEffect,useState} from "react";
import {usePartnerPortal,usePartnerMutations} from "./partner-portal-base";
const copy={
 ar:{title:"سياسات الإلغاء والاسترداد",add:"سياسة جديدة",refresh:"تحديث",loading:"جاري تحميل السياسات…",error:"تعذر تحميل السياسات.",none:"لا توجد سياسات.",
  name:"اسم السياسة",scope:"النطاق",target:"تطبق على",status:"الحالة",rules:"القواعد",partner:"الشريك",listing:"المنتج",
  platform:"سياسة Dear Day العامة",partnerScope:"سياسة الشريك",listingScope:"سياسة منتج / خدمة",mode:"نوع السياسة",
  tiered:"شرائح زمنية",manual:"مراجعة يدوية",hours:"ساعات قبل المناسبة",percent:"نسبة الاسترداد %",
  partnerCancel:"رد المبلغ إذا ألغى الشريك %",noShow:"عدم الحضور %",deposit:"عربون غير مسترد %",
  noteAr:"ملاحظة بالعربي",noteEn:"ملاحظة بالإنجليزي",allowed:"السماح بالإلغاء",
  addTier:"إضافة شريحة",delete:"حذف",draft:"حفظ مسودة",submit:"إرسال للمراجعة",close:"إغلاق",
  bad:"راجع العنوان والشريك والنسب وشريحة صفر ساعة وصحة الساعات.",confirm:"هل تؤكد تسجيل سياسة جديدة؟ لن تُفعّل حتى موافقة Dear Day.",
  saved:"تم تسجيل السياسة؛ تظل غير نشطة حتى موافقة Dear Day.",failed:"تعذر حفظ السياسة.",working:"جاري الحفظ…",
  warning:"اعتماد السياسة يتم من إدارة Dear Day. السياسة الجديدة لا تغيّر بيانات الطلبات السابقة.",
  statuses:{draft:"مسودة",pending_review:"بانتظار الموافقة",approved:"معتمدة",rejected:"مرفوضة",archived:"مؤرشفة"}},
 en:{title:"Cancellation & Refund Policies",add:"New policy",refresh:"Refresh",loading:"Loading policies…",error:"Failed to load policies.",none:"No policies.",
  name:"Policy title",scope:"Scope",target:"Applies to",status:"Status",rules:"Rules",partner:"Partner",listing:"Listing",
  platform:"Dear Day platform default",partnerScope:"Partner default",listingScope:"Listing override",mode:"Policy mode",
  tiered:"Time-based tiers",manual:"Manual review",hours:"Hours before occasion",percent:"Refund %",
  partnerCancel:"Partner cancellation refund %",noShow:"No-show refund %",deposit:"Non-refundable deposit %",
  noteAr:"Arabic note",noteEn:"English note",allowed:"Cancellation allowed",addTier:"Add tier",delete:"Delete",
  draft:"Save draft",submit:"Submit for review",close:"Close",
  bad:"Check title, partner, percentages, zero-hour tier and valid lead hours.",confirm:"Create this policy? It will not be active until Dear Day approves it.",
  saved:"Policy saved pending Dear Day approval.",failed:"Failed to save policy.",working:"Saving…",
  warning:"Dear Day approves policies. New policies do not retroactively replace the order policy snapshot.",
  statuses:{draft:"Draft",pending_review:"Pending review",approved:"Approved",rejected:"Rejected",archived:"Archived"}}
};
function initial(id){return {scope:"partner",title:"",listing_id:"",mode:"tiered",cancel_allowed:true,
 partner_cancel:"100",no_show:"0",deposit:"0",note_ar:"",note_en:"",
 tiers:[{key:"a",hours:"168",percent:"100"},{key:"b",hours:"72",percent:"50"},{key:"c",hours:"0",percent:"0"}]};}
function percent(x){return x!==""&&Number.isFinite(Number(x))&&Number(x)>=0&&Number(x)<=100;}
function rulesOf(f){
 if(!percent(f.partner_cancel)||!percent(f.no_show)||!percent(f.deposit))throw Error("invalid");
 const tiers=[];
 if(f.mode==="tiered"){
  for(const row of f.tiers){
   if(row.hours===""||!Number.isInteger(Number(row.hours))||Number(row.hours)<0||!percent(row.percent))throw Error("invalid");
   tiers.push({min_hours_before:Number(row.hours),refund_percent:Number(row.percent)});
  }
  const hours=tiers.map(x=>x.min_hours_before);
  if(!hours.includes(0)||new Set(hours).size!==hours.length)throw Error("invalid");
  tiers.sort((a,b)=>b.min_hours_before-a.min_hours_before);
 }
 return {mode:f.mode,cancellation_allowed:f.cancel_allowed,tiers,partner_cancellation_refund_percent:Number(f.partner_cancel),
  no_show_refund_percent:Number(f.no_show),deposit_non_refundable_percent:Number(f.deposit)};
}
export default function PartnerPoliciesPanel(){
 const {client,partner,locale}=usePartnerPortal(),verify=usePartnerMutations(),t=copy[locale]||copy.ar;
 const [data,setData]=useState({stage:"loading",policies:[],listings:[],names:{}});
 const [revision,setRevision]=useState(0),[draft,setDraft]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 useEffect(()=>{
  let live=true;setData({stage:"loading",policies:[],listings:[],names:{}});
  (async()=>{
   try{
    if(!partner)return;
    const [policies,listings]=await Promise.all([
     client.from("refund_policies").select("id,scope,partner_id,listing_id,title,rules,status,review_note,created_at").order("created_at",{ascending:false}).limit(301),
     client.from("listings").select("id,partner_id,published_version_id").eq("partner_id",partner.id).limit(300)
    ]);
    if(policies.error||listings.error)throw policies.error||listings.error;
    const ls=listings.data||[],own=new Set(ls.map(x=>x.id));
    const rows=(policies.data||[]).filter(p=>p.scope==="platform"&&p.status==="approved"||
     p.scope==="partner"&&p.partner_id===partner.id||p.scope==="listing"&&own.has(p.listing_id));
    const ids=ls.map(x=>x.published_version_id).filter(Boolean),names={};
    for(let i=0;i<ids.length;i+=40){
     const r=await client.from("listing_versions").select("id,name_ar,name_en").in("id",ids.slice(i,i+40));
     if(r.error)throw r.error;
     for(const x of r.data||[])names[x.id]=x;
    }
    if(live)setData({stage:"ready",partnerId:partner.id,policies:rows,listings:ls,names});
   }catch{if(live)setData({stage:"error",policies:[],listings:[],names:{}});}
  })();
  return()=>{live=false;};
 },[client,partner?.id,revision]);
 useEffect(()=>{setDraft(null);setError("");},[partner?.id]);
 const name=x=>(locale==="en"?x?.name_en||x?.name_ar:x?.name_ar||x?.name_en)||"—";
 const target=p=>p.scope==="platform"?t.platform:p.scope==="partner"?(locale==="en"?partner?.name_en||partner?.name_ar:partner?.name_ar||partner?.name_en):
  name(data.names[data.listings.find(x=>x.id===p.listing_id)?.published_version_id]);
 async function save(submit){
  if(!draft||busy||!partner)return;
  let rules;
  try{
   rules=rulesOf(draft);
   if(!draft.title.trim()||draft.title.length>180||draft.scope==="listing"&&!data.listings.some(x=>x.id===draft.listing_id))throw Error("invalid");
  }catch{setError(t.bad);return;}
  if(!window.confirm(t.confirm))return;
  setBusy(true);setError("");setNotice("");
  try{
   const id=await verify();
   const r=await client.rpc("submit_refund_policy",{
    p_scope:draft.scope,p_partner_id:id,p_listing_id:draft.scope==="listing"?draft.listing_id:null,
    p_title:draft.title.trim(),p_rules:rules,p_note_ar:draft.note_ar.trim()||null,
    p_note_en:draft.note_en.trim()||null,p_submit:submit
   });
   if(r.error)throw r.error;
   setDraft(null);setNotice(t.saved);setRevision(x=>x+1);
  }catch{setError(t.failed);}finally{setBusy(false);}
 }
 function field(k,v){setDraft(d=>({...d,[k]:v}));}
 return <div className="dd-pp-page">
  <div className="dd-pp-heading"><h1>{t.title}</h1><div className="dd-pp-actions">
   <button type="button" onClick={()=>setRevision(x=>x+1)}>{t.refresh}</button>
   <button type="button" onClick={()=>{setDraft(initial(partner.id));setError("");}}>+ {t.add}</button></div></div>
  <p className="dd-pp-warning">{t.warning}</p>{notice&&<p role="status" className="dd-pp-success">{notice}</p>}
  {error&&!draft&&<p role="alert" className="dd-pp-error">{error}</p>}
  {(data.stage==="ready"&&data.partnerId!==partner?.id||data.stage==="loading")?<p>{t.loading}</p>:data.stage==="error"?<p role="alert">{t.error}</p>:<div className="dd-pp-panel">
   {data.policies.length?<div className="dd-pp-table-wrap"><table><thead><tr><th>{t.name}</th><th>{t.scope}</th><th>{t.target}</th><th>{t.status}</th><th>{t.rules}</th></tr></thead>
    <tbody>{data.policies.map(p=><tr key={p.id}>
     <td><strong>{p.title}</strong>{p.review_note&&<small>{p.review_note}</small>}</td>
     <td>{p.scope==="platform"?t.platform:p.scope==="partner"?t.partnerScope:t.listingScope}</td>
     <td>{target(p)}</td><td>{t.statuses[p.status]||p.status}</td>
     <td>{p.rules?.mode==="tiered"?(p.rules.tiers||[]).map(x=>x.min_hours_before+"h: "+x.refund_percent+"%").join(" · "):t.manual}</td>
    </tr>)}</tbody></table></div>:<p className="dd-pp-empty">{t.none}</p>}
  </div>}
  {draft&&<div className="dd-pp-overlay" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setDraft(null)}}>
   <section role="dialog" aria-modal="true" aria-labelledby="dd-policy-title" className="dd-pp-dialog">
    <header><h2 id="dd-policy-title">{t.add}</h2><button type="button" disabled={busy} aria-label={t.close} onClick={()=>setDraft(null)}>×</button></header>
    <div className="dd-pp-modal-body">
     <div className="dd-pp-form">
      <label>{t.name}<input value={draft.title} maxLength={180} disabled={busy} onChange={e=>field("title",e.target.value)}/></label>
      <label>{t.scope}<select value={draft.scope} disabled={busy} onChange={e=>setDraft(x=>({...x,scope:e.target.value,listing_id:""}))}>
       <option value="partner">{t.partnerScope}</option><option value="listing">{t.listingScope}</option></select></label>
      {draft.scope==="listing"&&<label>{t.listing}<select value={draft.listing_id} disabled={busy} onChange={e=>field("listing_id",e.target.value)}>
       <option value="">—</option>{data.listings.map(x=><option key={x.id} value={x.id}>{target({scope:"listing",listing_id:x.id})}</option>)}</select></label>}
      <label>{t.mode}<select value={draft.mode} disabled={busy} onChange={e=>field("mode",e.target.value)}>
       <option value="tiered">{t.tiered}</option><option value="manual_review">{t.manual}</option></select></label>
      <label className="dd-pp-check"><input type="checkbox" checked={draft.cancel_allowed} disabled={busy} onChange={e=>field("cancel_allowed",e.target.checked)}/>{t.allowed}</label>
      {[[t.partnerCancel,"partner_cancel"],[t.noShow,"no_show"],[t.deposit,"deposit"]].map(([title,k])=><label key={k}>{title}
       <input type="number" min="0" max="100" step="0.01" value={draft[k]} disabled={busy} onChange={e=>field(k,e.target.value)}/></label>)}
      {[[t.noteAr,"note_ar"],[t.noteEn,"note_en"]].map(([label,k])=><label key={k}>{label}
       <textarea value={draft[k]} rows={2} disabled={busy} onChange={e=>field(k,e.target.value)}/></label>)}
     </div>
     {draft.mode==="tiered"&&<div className="dd-pp-tiers">
      {draft.tiers.map(r=><div className="dd-pp-tier" key={r.key}>
       <label>{t.hours}<input type="number" min="0" step="1" value={r.hours} disabled={busy} onChange={e=>setDraft(x=>({...x,tiers:x.tiers.map(z=>z.key===r.key?{...z,hours:e.target.value}:z)}))}/></label>
       <label>{t.percent}<input type="number" min="0" max="100" step="0.01" value={r.percent} disabled={busy} onChange={e=>setDraft(x=>({...x,tiers:x.tiers.map(z=>z.key===r.key?{...z,percent:e.target.value}:z)}))}/></label>
       <button type="button" disabled={busy} onClick={()=>setDraft(x=>({...x,tiers:x.tiers.filter(z=>z.key!==r.key)}))}>{t.delete}</button>
      </div>)}
      <button type="button" disabled={busy} onClick={()=>setDraft(x=>({...x,tiers:[...x.tiers,{key:"t"+Date.now(),hours:"",percent:""}]}))}>+ {t.addTier}</button>
     </div>}
     {error&&<p role="alert" className="dd-pp-error">{error}</p>}
     <div className="dd-pp-actions"><button type="button" disabled={busy} onClick={()=>save(false)}>{busy?t.working:t.draft}</button>
      <button type="button" disabled={busy} onClick={()=>save(true)}>{busy?t.working:t.submit}</button></div>
    </div>
   </section>
  </div>}
 </div>;
}
