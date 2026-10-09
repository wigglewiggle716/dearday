"use client";
import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {authClient,EMPLOYEE_ROLES,readCurrentAccount,rememberPreference} from "../lib/auth-client";
import {useAuthSession} from "./auth-session-provider";
import {pathFor} from "../lib/locales";

const words={
 ar:{
 title:"سياسات الإلغاء والاسترداد",subtitle:"إنشاء سياسات جديدة ومراجعتها قبل اعتمادها؛ السياسات المعتمدة فقط هي التي تُطبق.",
 back:"الإلغاءات والاستردادات",refresh:"تحديث",new:"سياسة جديدة",loading:"جاري تحميل السياسات…",
 denied:"هذه الصفحة للموظفين المصرح لهم بإدارة الكتالوج أو اعتماد السياسات.",failed:"تعذر تحميل السياسات.",
 signIn:"تسجيل الدخول",setup:"تفعيل التحقق بخطوتين",mfa:"إكمال التحقق بخطوتين",
 all:"الكل",allStatus:"كل الحالات",search:"ابحث في السياسات",scope:"نطاق السياسة",name:"اسم السياسة",
 target:"الجهة",status:"الحالة",rules:"قواعد الاسترداد",created:"التاريخ",review:"مراجعة السياسة",noPolicies:"لا توجد نتائج.",
 platform:"Dear Day بالكامل",partner:"شريك",listing:"منتج / خدمة",choosePartner:"اختر الشريك",chooseListing:"اختر المنتج",
 policyMode:"طريقة الحساب",tiered:"شرائح زمنية",manual:"مراجعة يدوية",cancelAllowed:"الإلغاء مسموح",
 time:"قبل المناسبة بالساعات",percent:"نسبة الاسترداد %",addTier:"إضافة شريحة",remove:"حذف",
 partnerCancel:"استرداد عند إلغاء الشريك %",noShow:"استرداد عند عدم الحضور %",deposit:"عربون غير قابل للاسترداد %",
 noteAr:"ملاحظة بالعربي",noteEn:"ملاحظة بالإنجليزي",note:"ملاحظة المراجع (مطلوبة للرفض)",
 draft:"حفظ مسودة",submit:"إرسال للمراجعة",approve:"اعتماد السياسة",reject:"رفض السياسة",
 close:"إغلاق",saving:"جاري التنفيذ…",success:"تم تسجيل الإجراء، وظهرت التغييرات في قائمة السياسات.",
 badRules:"راجع عنوان السياسة ونطاقها والنسب (0-100)، ولازم تتضمن الشرائح مستوى عند صفر ساعة.",
 needReject:"لازم تكتب سبب الرفض.",writeFail:"تعذر حفظ العملية. راجع صلاحياتك والبيانات.",
 confirmSave:"تأكيد تسجيل السياسة؟ مش هتبقى فعالة قبل الموافقة.",confirmApprove:"الاعتماد هيجعل السياسة سارية فورًا ويؤرشف المعتمدة السابقة لنفس النطاق. تأكيد؟",
 confirmReject:"تأكيد رفض هذه السياسة؟",warning:"تغيير السياسة المعتمدة قد يغيّر الاسترداد المستحق مستقبلًا. اختبر على سياسة اختبار فقط.",
 limit:"تُعرض أحدث 300 سياسة و400 منتج للاختيار. يلزم pagination عند زيادة العدد.",
 statuses:{draft:"مسودة",pending_review:"بانتظار الموافقة",approved:"معتمدة",rejected:"مرفوضة",archived:"مؤرشفة"}
 },en:{
 title:"Cancellation & Refund Policies",subtitle:"Create policies and review proposals; only approved versions are active.",
 back:"Cancellations & Refunds",refresh:"Refresh",new:"New policy",loading:"Loading policies…",
 denied:"This page requires catalog management or policy approval permission.",failed:"Could not load policies.",
 signIn:"Log in",setup:"Set up two-step verification",mfa:"Complete two-step verification",
 all:"All scopes",allStatus:"All statuses",search:"Search policies",scope:"Scope",name:"Policy title",
 target:"Applies to",status:"Status",rules:"Refund rules",created:"Date",review:"Review policy",noPolicies:"No results.",
 platform:"Dear Day platform",partner:"Partner",listing:"Product / service",choosePartner:"Select partner",chooseListing:"Select listing",
 policyMode:"Calculation mode",tiered:"Tiered rules",manual:"Manual review",cancelAllowed:"Cancellation permitted",
 time:"Hours before occasion",percent:"Refund percentage",addTier:"Add tier",remove:"Remove",
 partnerCancel:"Refund if partner cancels %",noShow:"No-show refund %",deposit:"Non-refundable deposit %",
 noteAr:"Arabic note",noteEn:"English note",note:"Reviewer note (required for rejection)",
 draft:"Save draft",submit:"Submit for approval",approve:"Approve policy",reject:"Reject policy",
 close:"Close",saving:"Saving…",success:"Action recorded; policy list updated.",
 badRules:"Check title, scope and percentage values (0-100). Tiered rules require a zero-hour tier.",
 needReject:"A rejection reason is required.",writeFail:"Could not save; recheck permissions and data.",
 confirmSave:"Record this policy? It will remain inactive until approved.",
 confirmApprove:"Approval activates this policy immediately and archives the previous approved policy for this scope. Confirm?",
 confirmReject:"Reject this policy?",warning:"Approving changes future refund calculations. Test with designated test policies only.",
 limit:"The newest 300 policies and 400 listings are shown. Add pagination if volumes grow.",
 statuses:{draft:"Draft",pending_review:"Pending review",approved:"Approved",rejected:"Rejected",archived:"Archived"}
 }};
const initial=()=>({scope:"partner",partner_id:"",listing_id:"",title:"",mode:"tiered",allowed:true,
 partnerPercent:"100",noShow:"0",deposit:"0",noteAr:"",noteEn:"",
 tiers:[{key:"a",hours:"168",percent:"100"},{key:"b",hours:"72",percent:"50"},{key:"c",hours:"0",percent:"0"}]});
function validate(f){
 const fraction=v=>v!==""&&Number.isFinite(Number(v))&&Number(v)>=0&&Number(v)<=100;
 if(!f.title.trim()||!["platform","partner","listing"].includes(f.scope)||!["tiered","manual_review"].includes(f.mode)||
 (f.scope!=="platform"&&!f.partner_id)||(f.scope==="listing"&&!f.listing_id)||
 !fraction(f.partnerPercent)||!fraction(f.noShow)||!fraction(f.deposit))return null;
 let tiers=[];
 if(f.mode==="tiered"){
  if(!f.tiers.length||f.tiers.some(x=>!fraction(x.percent)||!Number.isInteger(Number(x.hours))||x.hours===""||Number(x.hours)<0)||!f.tiers.some(x=>Number(x.hours)===0))return null;
  const hours=f.tiers.map(x=>Number(x.hours));
  if(new Set(hours).size!==hours.length)return null;
  tiers=f.tiers.map(x=>({min_hours_before:Number(x.hours),refund_percent:Number(x.percent)})).sort((a,b)=>b.min_hours_before-a.min_hours_before);
 }
 return {mode:f.mode,cancellation_allowed:f.allowed,tiers,
 partner_cancellation_refund_percent:Number(f.partnerPercent),no_show_refund_percent:Number(f.noShow),
 deposit_non_refundable_percent:Number(f.deposit)};
}
export default function StaffRefundPolicies({locale="ar"}){
 const t=words[locale]||words.ar,session=useAuthSession(),active=session.status==="authenticated"&&EMPLOYEE_ROLES.has(session.role);
 const uid=active?session.user?.id:null;
 const client=useMemo(()=>typeof window==="undefined"?null:authClient(rememberPreference()),[]);
 const [data,setData]=useState({stage:"loading",permissions:[],policies:[],partners:[],listings:[],names:{}});
 const [revision,setRevision]=useState(0),[term,setTerm]=useState(""),[scope,setScope]=useState(""),[status,setStatus]=useState("");
 const [draft,setDraft]=useState(null),[selected,setSelected]=useState(null),[note,setNote]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const ready=data.stage==="ready",canCreate=ready&&data.permissions.includes("catalog.manage");
 const canApprove=ready&&data.permissions.includes("approvals.review");
 const reload=()=>setRevision(x=>x+1);
 useEffect(()=>{
  let alive=true;
  if(!uid||!client){setData(x=>({...x,stage:"loading"}));return;}
  setData(x=>({...x,stage:"loading"}));
  (async()=>{
   try{
    const p=await client.rpc("get_my_permissions");
    if(p.error)throw p.error;
    const perms=(p.data||[]).map(x=>x.permission_code);
    if(!perms.includes("catalog.manage")&&!perms.includes("approvals.review")){if(alive)setData(x=>({...x,stage:"denied"}));return;}
    const [policies,partners,listings]=await Promise.all([
     client.from("refund_policies").select("id,scope,partner_id,listing_id,title,rules,status,submitted_at,created_at,review_note,updated_at").order("created_at",{ascending:false}).limit(300),
     client.from("partner_directory").select("id,name_ar,name_en").limit(500),
     client.from("listings").select("id,partner_id,published_version_id,kind").limit(400)
    ]);
    if([policies,partners,listings].some(x=>x.error))throw Error("load");
    const names={},ids=[...new Set((listings.data||[]).map(x=>x.published_version_id).filter(Boolean))];
    for(let i=0;i<ids.length;i+=40){
     const r=await client.from("listing_versions").select("id,name_ar,name_en").in("id",ids.slice(i,i+40));
     if(r.error)throw r.error;
     for(const row of r.data||[])names[row.id]=row;
    }
    if(alive)setData({stage:"ready",permissions:perms,policies:policies.data||[],partners:partners.data||[],listings:listings.data||[],names});
   }catch{if(alive)setData(x=>({...x,stage:"error"}));}
  })();
  return()=>{alive=false;};
 },[uid,client,revision]);
 const partnerMap=Object.fromEntries(data.partners.map(x=>[x.id,x]));
 const listingMap=Object.fromEntries(data.listings.map(x=>[x.id,x]));
 const name=row=>(locale==="en"?row?.name_en||row?.name_ar:row?.name_ar||row?.name_en)||"—";
 const target=p=>p.scope==="platform"?t.platform:p.scope==="partner"?name(partnerMap[p.partner_id]):name(data.names[listingMap[p.listing_id]?.published_version_id]);
 const summary=r=>r?.mode==="tiered"?(r.tiers||[]).map(x=>String(x.min_hours_before)+"h: "+String(x.refund_percent)+"%").join(" · "):t.manual;
 const visible=data.policies.filter(x=>(!scope||x.scope===scope)&&(!status||x.status===status)&&
  (!term.trim()||[x.title,target(x)].join(" ").toLowerCase().includes(term.trim().toLowerCase())));
 async function authorised(permission){
  const who=await readCurrentAccount(client);
  if(who.status!=="authenticated"||who.user?.id!==uid||!EMPLOYEE_ROLES.has(who.role))throw Error("session");
  const p=await client.rpc("get_my_permissions");
  if(p.error||!(p.data||[]).some(x=>x.permission_code===permission))throw Error("permission");
 }
 async function save(submit){
  if(!draft||!canCreate||busy)return;
  const rules=validate(draft);
  if(!rules){setError(t.badRules);return;}
  if(draft.scope==="listing"&&data.listings.find(x=>x.id===draft.listing_id)?.partner_id!==draft.partner_id){setError(t.badRules);return;}
  if(!window.confirm(t.confirmSave))return;
  setBusy(true);setError("");
  try{
   await authorised("catalog.manage");
   const r=await client.rpc("submit_refund_policy",{
    p_scope:draft.scope,p_partner_id:draft.scope==="platform"?null:draft.partner_id,
    p_listing_id:draft.scope==="listing"?draft.listing_id:null,p_title:draft.title.trim(),p_rules:rules,
    p_note_ar:draft.noteAr.trim()||null,p_note_en:draft.noteEn.trim()||null,p_submit:submit
   });
   if(r.error)throw r.error;
   setDraft(null);setNotice(t.success);reload();
  }catch{setError(t.writeFail);}finally{setBusy(false);}
 }
 async function decide(decision){
  if(!selected||!canApprove||busy)return;
  if(decision==="rejected"&&!note.trim()){setError(t.needReject);return;}
  if(!window.confirm(decision==="approved"?t.confirmApprove:t.confirmReject))return;
  setBusy(true);setError("");
  try{
   await authorised("approvals.review");
   const r=await client.rpc("review_refund_policy",{p_policy_id:selected.id,p_decision:decision,p_note:note.trim()||null});
   if(r.error)throw r.error;
   setSelected(null);setNotice(t.success);reload();
  }catch{setError(t.writeFail);}finally{setBusy(false);}
 }
 const gate=session.status==="mfa_setup_required"?{href:pathFor("security",locale),label:t.setup}:
 session.status==="mfa_required"?{href:pathFor("auth",locale)+"?mode=mfa",label:t.mfa}:
 session.status==="signed_out"?{href:pathFor("auth",locale)+"?next="+encodeURIComponent(pathFor("staffRefundPolicies",locale)),label:t.signIn}:null;
 return <main id="main-content" className="dd-cancellations-staff" dir={locale==="ar"?"rtl":"ltr"}><div className="dd-ca-wrap">
  <header className="dd-ca-head"><div><Link href={pathFor("staffCancellations",locale)}>{t.back} ↗</Link><h1>{t.title}</h1><p>{t.subtitle}</p></div>
   {ready&&<div className="dd-ca-actions">{canCreate&&<button className="dd-ca-primary" type="button" onClick={()=>{setDraft(initial());setError("");}}>+ {t.new}</button>}
     <button className="dd-ca-outline" type="button" onClick={reload}>{t.refresh}</button></div>}
  </header>
  {!active?<section className="dd-ca-panel dd-ca-guard">{session.status==="loading"?t.loading:t.denied}{gate&&<Link className="dd-ca-primary" href={gate.href}>{gate.label}</Link>}</section>:
   data.stage==="loading"?<section className="dd-ca-panel dd-ca-guard" role="status">{t.loading}</section>:
   !ready?<section className="dd-ca-panel dd-ca-guard">{data.stage==="denied"?t.denied:t.failed}</section>:<>
    {notice&&<p className="dd-ca-success" role="status">{notice}</p>}
    {!draft&&!selected&&error&&<p className="dd-ca-error">{error}</p>}
    <p className="dd-ca-warning">{t.warning} {t.limit}</p>
    <div className="dd-ca-count"><span>{t.status}: {data.policies.length}</span><span>{t.pending}: {data.policies.filter(x=>x.status==="pending_review").length}</span></div>
    <div className="dd-ca-policy-filter"><input type="search" value={term} aria-label={t.search} placeholder={t.search} onChange={e=>setTerm(e.target.value)}/>
     <select aria-label={t.scope} value={scope} onChange={e=>setScope(e.target.value)}><option value="">{t.all}</option>
      {["platform","partner","listing"].map(x=><option key={x} value={x}>{t[x]}</option>)}</select>
     <select aria-label={t.status} value={status} onChange={e=>setStatus(e.target.value)}><option value="">{t.allStatus}</option>
      {Object.keys(t.statuses).map(x=><option key={x} value={x}>{t.statuses[x]}</option>)}</select>
    </div>
    <section className="dd-ca-panel">{visible.length?<div className="dd-ca-scroll"><table><thead><tr><th>{t.name}</th><th>{t.scope}</th><th>{t.target}</th><th>{t.status}</th><th>{t.rules}</th><th>{t.actions}</th></tr></thead><tbody>
     {visible.map(x=><tr key={x.id}><td><strong>{x.title}</strong><small>{x.review_note||""}</small></td><td>{t[x.scope]}</td><td>{target(x)}</td><td>{t.statuses[x.status]}</td><td>{summary(x.rules)}</td>
      <td>{canApprove&&x.status==="pending_review"?<button className="dd-ca-outline small" type="button" onClick={()=>{setSelected(x);setNote("");setError("");}}>{t.review}</button>:"—"}</td></tr>)}
    </tbody></table></div>:<p className="dd-ca-empty">{t.noPolicies}</p>}</section>
   </>}
  </div>
  {(draft||selected)&&active&&ready&&<div className="dd-ca-overlay" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy){setDraft(null);setSelected(null);}}}>
   <section className="dd-ca-dialog" role="dialog" aria-modal="true" aria-labelledby="dd-ca-dialog-title" tabIndex={-1}>
    <header><h2 id="dd-ca-dialog-title">{draft?t.new:t.review}</h2><button aria-label={t.close} disabled={busy} onClick={()=>{setDraft(null);setSelected(null);setError("");}}>×</button></header>
    {draft?<div className="dd-ca-modal-body">
     <div className="dd-ca-grid">
      <label>{t.name}<input maxLength={180} value={draft.title} disabled={busy} onChange={e=>setDraft(x=>({...x,title:e.target.value}))}/></label>
      <label>{t.scope}<select disabled={busy} value={draft.scope} onChange={e=>setDraft(x=>({...x,scope:e.target.value,partner_id:"",listing_id:""}))}>
       {["platform","partner","listing"].map(s=><option key={s} value={s}>{t[s]}</option>)}</select></label>
      {draft.scope!=="platform"&&<label>{t.choosePartner}<select disabled={busy} value={draft.partner_id} onChange={e=>setDraft(x=>({...x,partner_id:e.target.value,listing_id:""}))}>
       <option value="">{t.choosePartner}</option>{data.partners.map(p=><option key={p.id} value={p.id}>{name(p)}</option>)}</select></label>}
      {draft.scope==="listing"&&<label>{t.chooseListing}<select disabled={busy} value={draft.listing_id} onChange={e=>setDraft(x=>({...x,listing_id:e.target.value}))}>
       <option value="">{t.chooseListing}</option>{data.listings.filter(l=>l.partner_id===draft.partner_id).map(l=><option key={l.id} value={l.id}>{name(data.names[l.published_version_id])}</option>)}</select></label>}
      <label>{t.policyMode}<select value={draft.mode} disabled={busy} onChange={e=>setDraft(x=>({...x,mode:e.target.value}))}>
       <option value="tiered">{t.tiered}</option><option value="manual_review">{t.manual}</option></select></label>
      <label className="dd-ca-check"><input type="checkbox" disabled={busy} checked={draft.allowed} onChange={e=>setDraft(x=>({...x,allowed:e.target.checked}))}/>{t.cancelAllowed}</label>
      {[[ "partnerPercent",t.partnerCancel],["noShow",t.noShow],["deposit",t.deposit]].map(([key,label])=><label key={key}>{label}
       <input type="number" min="0" max="100" step="0.01" disabled={busy} value={draft[key]} onChange={e=>setDraft(x=>({...x,[key]:e.target.value}))}/></label>)}
      <label>{t.noteAr}<textarea value={draft.noteAr} disabled={busy} onChange={e=>setDraft(x=>({...x,noteAr:e.target.value}))}/></label>
      <label>{t.noteEn}<textarea value={draft.noteEn} disabled={busy} onChange={e=>setDraft(x=>({...x,noteEn:e.target.value}))}/></label>
     </div>
     {draft.mode==="tiered"&&<div className="dd-ca-tiers"><h3>{t.tiered}</h3>
      {draft.tiers.map(tier=><div className="dd-ca-tier" key={tier.key}>
       <label>{t.time}<input type="number" min="0" step="1" disabled={busy} value={tier.hours} onChange={e=>setDraft(x=>({...x,tiers:x.tiers.map(y=>y.key===tier.key?{...y,hours:e.target.value}:y)}))}/></label>
       <label>{t.percent}<input type="number" min="0" max="100" step="0.01" disabled={busy} value={tier.percent} onChange={e=>setDraft(x=>({...x,tiers:x.tiers.map(y=>y.key===tier.key?{...y,percent:e.target.value}:y)}))}/></label>
       <button className="dd-ca-outline small" disabled={busy} type="button" onClick={()=>setDraft(x=>({...x,tiers:x.tiers.filter(y=>y.key!==tier.key)}))}>{t.remove}</button>
      </div>)}
      <button className="dd-ca-outline" disabled={busy} type="button" onClick={()=>setDraft(x=>({...x,tiers:[...x.tiers,{key:"new"+Date.now(),hours:"",percent:""}]}))}>+ {t.addTier}</button>
     </div>}
     {error&&<p className="dd-ca-error" role="alert">{error}</p>}
     <footer><button className="dd-ca-outline" type="button" disabled={busy} onClick={()=>save(false)}>{busy?t.saving:t.draft}</button>
      <button className="dd-ca-primary" type="button" disabled={busy} onClick={()=>save(true)}>{busy?t.saving:t.submit}</button></footer>
    </div>:selected&&<div className="dd-ca-modal-body">
      <h3>{selected.title}</h3><p>{summary(selected.rules)} · {target(selected)}</p><p className="dd-ca-warning">{t.warning}</p>
      <label className="dd-ca-note">{t.note}<textarea rows={4} maxLength={1000} disabled={busy} value={note} onChange={e=>setNote(e.target.value)}/></label>
      {error&&<p className="dd-ca-error" role="alert">{error}</p>}
      <footer><button className="dd-ca-primary" type="button" disabled={busy} onClick={()=>decide("approved")}>{busy?t.saving:t.approve}</button>
       <button className="dd-ca-danger" type="button" disabled={busy} onClick={()=>decide("rejected")}>{busy?t.saving:t.reject}</button></footer>
    </div>}
   </section>
  </div>}
 </main>;
}
