"use client";

import Link from "next/link";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {authClient,EMPLOYEE_ROLES,readCurrentAccount,rememberPreference} from "../lib/auth-client";
import {useAuthSession} from "./auth-session-provider";
import {pathFor} from "../lib/locales";

const PAGE_SIZE=30;
const statuses=["draft","pending_payment","paid","confirmed","in_progress","completed","cancelled","refunded"];
// Match the currently deployed Supabase orders_direct_write_boundary trigger.
// Never use this panel to mark payments received, cancel a booking or issue a refund.
const nextStatus={paid:"confirmed",confirmed:"in_progress",in_progress:"completed"};
const translations={
 ar:{
  title:"إدارة الطلبات",subtitle:"مراجعة الطلبات والتفاصيل وتحديث الحالات التشغيلية فقط حسب الصلاحيات.",
  back:"العودة للوحة الفريق",refresh:"تحديث",signIn:"تسجيل الدخول",
  setup:"تفعيل التحقق بخطوتين",challenge:"إكمال التحقق بخطوتين",blocked:"هذه الصفحة لموظفي Dear Day المصرح لهم بعرض الطلبات.",
  loading:"جاري تحميل الطلبات…",error:"تعذر تحميل الطلبات، يرجى المحاولة مجددًا.",none:"لا توجد طلبات مطابقة للبحث.",
  search:"ابحث برقم الطلب أو المناسبة أو المنطقة",searchButton:"بحث",all:"كل الحالات",
  order:"رقم الطلب",status:"الحالة",occasion:"المناسبة",date:"تاريخ المناسبة",area:"المنطقة",
  amount:"الإجمالي",created:"تاريخ الإنشاء",details:"تفاصيل الطلب",see:"عرض التفاصيل",
  customer:"العميل",phone:"التليفون",address:"عنوان التوصيل",note:"ملاحظة العميل",time:"وقت المناسبة",
  quantity:"الكمية",items:"العناصر",partnerOrders:"طلبات الشركاء",partner:"الشريك",
  subtotal:"إجمالي المنتجات",discount:"الخصم",delivery:"التوصيل",unit:"سعر القطعة",
  loadingDetails:"جاري تحميل تفاصيل الطلب…",detailsError:"تعذر تحميل تفاصيل الطلب.",
  unavailable:"تعذر عرض هذا القسم حاليًا.",noItems:"لا توجد عناصر مسجلة.",noPartnerOrders:"لا توجد طلبات شركاء مسجلة.",
  readonly:"عرض فقط — هذا الحساب لا يملك صلاحية تعديل الطلبات.",
  restricted:"لا يمكن تغيير الحالة الحالية من هنا. الدفع والإلغاء والاسترداد لهم إجراءات منفصلة.",
  statusEdit:"تغيير الحالة التشغيلية",save:"حفظ الحالة",saving:"جاري الحفظ…",
  unchanged:"اختر حالة جديدة قبل الحفظ.",confirm:"تأكيد تغيير حالة الطلب؟ سيتم تطبيق التعديل على بيانات Supabase الفعلية وتسجيله في سجل المراجعة.",
  changed:"تم تغيير حالة الطلب بنجاح.",saveError:"تعذر تحديث الحالة. ربما تغيّرت الحالة بواسطة موظف آخر أو لم تعد الصلاحية سارية. حدّث البيانات.",
  close:"إغلاق التفاصيل",previous:"السابق",next:"التالي",showing:"عدد الطلبات",page:"صفحة",of:"من",
  sessionError:"تعذر التحقق من صلاحية الحساب.",searchHelp:"البحث في جميع الطلبات، 30 نتيجة في الصفحة.",
  paymentsWarning:"لا يمكن اعتماد الدفع أو الإلغاء أو الاسترداد من صفحة إدارة الطلبات.",
  statusNames:{draft:"مسودة",pending_payment:"بانتظار الدفع",paid:"مدفوع",confirmed:"مؤكد",in_progress:"قيد التنفيذ",completed:"مكتمل",cancelled:"ملغي",refunded:"مسترد"}
 },
 en:{
  title:"Order Management",subtitle:"Review orders and details, and make authorised operational status changes only.",
  back:"Back to staff workspace",refresh:"Refresh",signIn:"Log in",
  setup:"Set up two-step verification",challenge:"Complete two-step verification",blocked:"This page is only available to staff authorised to view orders.",
  loading:"Loading orders…",error:"Could not load orders. Please try again.",none:"No orders match these filters.",
  search:"Search order number, occasion or area",searchButton:"Search",all:"All statuses",
  order:"Order number",status:"Status",occasion:"Occasion",date:"Occasion date",area:"Delivery area",
  amount:"Total",created:"Created",details:"Order details",see:"View details",
  customer:"Customer",phone:"Phone",address:"Delivery address",note:"Customer note",time:"Occasion time",
  quantity:"Quantity",items:"Items",partnerOrders:"Partner sub-orders",partner:"Partner",
  subtotal:"Subtotal",discount:"Discount",delivery:"Delivery",unit:"Unit price",
  loadingDetails:"Loading order details…",detailsError:"Could not load order details.",
  unavailable:"This section could not be loaded.",noItems:"No order items recorded.",noPartnerOrders:"No partner sub-orders recorded.",
  readonly:"Read only — your account does not have permission to edit orders.",
  restricted:"This status cannot be changed here. Payments, cancellations and refunds have separate workflows.",
  statusEdit:"Update operational status",save:"Save status",saving:"Saving…",
  unchanged:"Choose a different status before saving.",confirm:"Confirm the order status change? This will update live Supabase data and be audit-logged.",
  changed:"Order status updated.",saveError:"Could not update the status. Another employee may have changed it or your access may have expired. Refresh the data.",
  close:"Close details",previous:"Previous",next:"Next",showing:"Matching orders",page:"Page",of:"of",
  sessionError:"Unable to verify account permissions.",searchHelp:"Search across orders, 30 results per page.",
  paymentsWarning:"Payment capture, cancellation and refunds cannot be performed from this page.",
  statusNames:{draft:"Draft",pending_payment:"Pending payment",paid:"Paid",confirmed:"Confirmed",in_progress:"In progress",completed:"Completed",cancelled:"Cancelled",refunded:"Refunded"}
 }
};
const selectList="id,order_number,customer_id,status,occasion_type,occasion_date,delivery_area,grand_total,currency,created_at,updated_at";
const selectFull="id,order_number,customer_id,status,occasion_type,occasion_date,occasion_time,delivery_area,delivery_address,customer_note,subtotal,discount_total,delivery_total,grand_total,currency,created_at,updated_at";
const selectItems="id,item_name,unit_price,quantity,line_total,partner_id";
const selectPartners="id,partner_id,status,subtotal";
function money(n,c,locale){
 try{return new Intl.NumberFormat(locale==="ar"?"ar-EG":"en-EG",{style:"currency",currency:c||"EGP",maximumFractionDigits:2}).format(Number(n||0));}
 catch{return String(n??0)+" EGP";}
}
function date(v,locale){
 if(!v)return "—";
 const d=new Date(v);
 return Number.isNaN(d.getTime())?"—":new Intl.DateTimeFormat(locale==="ar"?"ar-EG":"en-GB",{day:"numeric",month:"short",year:"numeric"}).format(d);
}
function occasionDate(v,locale){
 if(!v)return "—";
 const parts=String(v).split("-");
 return parts.length===3?(locale==="ar"?[parts[2],parts[1],parts[0]].join("/"):[parts[2],parts[1],parts[0]].join("/")):String(v);
}
function addressLabel(obj){
 if(!obj)return "";
 if(typeof obj==="string")return obj;
 if(typeof obj!=="object"||Array.isArray(obj))return "";
 return Object.values(obj).filter(v=>typeof v==="string"||typeof v==="number").map(String).join(" · ");
}
function safeSearch(input){return String(input||"").replace(/[^\p{L}\p{N}\s-]/gu,"").trim().slice(0,70);}
function numberLabel(v){return v===null||v===undefined?"—":"#DD"+v;}
function Summary({label,value}){return <div className="dd-order-summary"><span>{label}</span><strong>{value??"—"}</strong></div>;}
export default function StaffOrders({locale="ar"}){
 const t=translations[locale]||translations.ar;
 const session=useAuthSession();
 const active=session.status==="authenticated"&&EMPLOYEE_ROLES.has(session.role);
 const client=useMemo(()=>typeof window==="undefined"?null:authClient(rememberPreference()),[]);
 const [permissions,setPermissions]=useState([]);
 const [stage,setStage]=useState("loading");
 const [orders,setOrders]=useState([]);
 const [total,setTotal]=useState(0);
 const [searchInput,setSearchInput]=useState("");
 const [search,setSearch]=useState("");
 const [statusFilter,setStatusFilter]=useState("");
 const [page,setPage]=useState(0);
 const [revision,setRevision]=useState(0);
 const [selected,setSelected]=useState(null);
 const [detail,setDetail]=useState({stage:"loading",order:null,items:[],partners:[],profiles:{},names:{},errors:[]});
 const [next,setNext]=useState("");
 const [busy,setBusy]=useState(false);
 const [feedback,setFeedback]=useState("");
 const [pageNotice,setPageNotice]=useState("");
 const dialogRef=useRef(null);
 const loadSeq=useRef(0);
 const detailSeq=useRef(0);
 const canView=permissions.includes("orders.view");
 const canManage=permissions.includes("orders.manage");
 const memberId=active?session.user?.id:null;
 const reload=useCallback(()=>setRevision(n=>n+1),[]);
 useEffect(()=>{
  const req=++loadSeq.current;
  if(!memberId||!client){
   setPermissions([]);setStage("loading");setOrders([]);return;
  }
  setStage("loading");setPermissions([]);
  (async()=>{
   try{
    const p=await client.rpc("get_my_permissions");
    if(p.error)throw p.error;
    if(req!==loadSeq.current)return;
    const grants=(p.data||[]).map(x=>x.permission_code);
    if(!grants.includes("orders.view")){
     setPermissions([]);setStage("forbidden");return;
    }
    let query=client.from("orders").select(selectList,{count:"exact"}).order("created_at",{ascending:false});
    if(statusFilter)query=query.eq("status",statusFilter);
    if(search){
      if(/^(?:dd)?\d+$/i.test(search))query=query.eq("order_number",Number(search.replace(/^dd/i,"")));
      else query=query.or("occasion_type.ilike.%"+search+"%,delivery_area.ilike.%"+search+"%");
    }
    const rows=await query.range(page*PAGE_SIZE,(page+1)*PAGE_SIZE-1);
    if(rows.error)throw rows.error;
    if(req!==loadSeq.current)return;
    setPermissions(grants);setOrders(rows.data||[]);setTotal(rows.count??0);setStage("ready");
   }catch{
    if(req!==loadSeq.current)return;
    setPermissions([]);setOrders([]);setStage("error");
   }
  })();
  return()=>{loadSeq.current++;};
 },[memberId,client,search,statusFilter,page,revision]);

 // Load only the selected order's sensitive contact/address data after the
 // staff permission check, never in the searchable list response.
 useEffect(()=>{
  const req=++detailSeq.current;
  if(!selected||!active||!canView||!client){
   setDetail({stage:"loading",order:null,items:[],partners:[],profiles:{},names:{},errors:[]});
   return;
  }
  setDetail({stage:"loading",order:null,items:[],partners:[],profiles:{},names:{},errors:[]});
  setFeedback("");setNext("");
  (async()=>{
   try{
    const o=await client.from("orders").select(selectFull).eq("id",selected).maybeSingle();
    if(o.error||!o.data)throw o.error||new Error("not found");
    const calls=[
     client.from("order_items").select(selectItems).eq("order_id",selected).order("created_at",{ascending:true}),
     client.from("partner_orders").select(selectPartners).eq("order_id",selected).order("created_at",{ascending:true})
    ];
    // Customer contact profile is additionally gated by customers.view, not
    // merely by permission to view order amounts and delivery metadata.
    if(permissions.includes("customers.view")&&o.data.customer_id){
     calls.push(client.from("profiles").select("id,full_name,phone").eq("id",o.data.customer_id).maybeSingle());
    }
    const responses=await Promise.all(calls);
    if(req!==detailSeq.current)return;
    const errors=[];
    if(responses[0].error)errors.push("items");
    if(responses[1].error)errors.push("partners");
    const partners=responses[1].data||[];
    let names={};
    const partnerIds=[...new Set(partners.map(p=>p.partner_id).filter(Boolean))];
    if(partnerIds.length){
     const n=await client.from("partner_directory").select("id,name_ar,name_en").in("id",partnerIds);
     if(req!==detailSeq.current)return;
     if(!n.error)names=Object.fromEntries((n.data||[]).map(p=>[p.id,p]));
    }
    const profile=responses[2]&&!responses[2].error?responses[2].data:null;
    setDetail({stage:"ready",order:o.data,items:responses[0].data||[],partners,profile,names,errors});
    setNext(o.data.status);
   }catch{
    if(req===detailSeq.current)setDetail({stage:"error",order:null,items:[],partners:[],profile:null,names:{},errors:[]});
   }
  })();
  return()=>{detailSeq.current++;};
 },[selected,memberId,client,active,canView,permissions.includes("customers.view")]);

 useEffect(()=>{
  if(!selected)return;
  const prev=document.activeElement;
  document.body.style.overflow="hidden";
  dialogRef.current?.focus();
  function key(e){if(e.key==="Escape"&&!busy)setSelected(null);}
  window.addEventListener("keydown",key);
  return()=>{
   document.body.style.overflow="";
   window.removeEventListener("keydown",key);
   if(prev instanceof HTMLElement)prev.focus();
  };
 },[selected,busy]);

 async function save(){
  if(!active||!canManage||!client||busy||detail.stage!=="ready")return;
  const o=detail.order;
  if(!o||!nextStatus[o.status]||next!==nextStatus[o.status]){
   setFeedback(t.unchanged);return;
  }
  if(!window.confirm(t.confirm))return;
  setBusy(true);setFeedback("");
  try{
   // Fresh server-validated AAL2 & role check immediately before a write.
   const who=await readCurrentAccount(client);
   if(who.status!=="authenticated"||!EMPLOYEE_ROLES.has(who.role))throw new Error("STALE_SESSION");
   const p=await client.rpc("get_my_permissions");
   if(p.error||!(p.data||[]).some(row=>row.permission_code==="orders.manage"))throw new Error("NO_PERMISSION");
   // Optimistic status comparison prevents two workers using a stale view.
   // Direct SQL trigger additionally restricts transitions and audits them.
   const updated=await client.from("orders").update({status:next})
    .eq("id",o.id).eq("status",o.status).eq("updated_at",o.updated_at)
    .select("id,status,updated_at").maybeSingle();
   if(updated.error||!updated.data)throw updated.error||new Error("CONCURRENT_UPDATE");
   setDetail(d=>({...d,order:{...d.order,status:updated.data.status,updated_at:updated.data.updated_at}}));
   setNext(updated.data.status);setFeedback(t.changed);setPageNotice(t.changed);setSelected(null);reload();
  }catch{setFeedback(t.saveError);}finally{setBusy(false);}
 }
 function applySearch(event){
  event.preventDefault();setPageNotice("");setPage(0);setSearch(safeSearch(searchInput));setSelected(null);
 }
 function filterStatus(value){setPageNotice("");setPage(0);setStatusFilter(value);setSelected(null);}
 const gate=session.status==="mfa_setup_required"?{href:pathFor("security",locale),label:t.setup}:
  session.status==="mfa_required"?{href:pathFor("auth",locale)+"?mode=mfa",label:t.challenge}:
  session.status==="signed_out"?{href:pathFor("auth",locale)+"?next="+encodeURIComponent(pathFor("staffOrders",locale)),label:t.signIn}:null;
 const o=detail.order;
 const changeTo=o&&nextStatus[o.status];
 return <main id="main-content" className="dd-staff-orders" dir={locale==="ar"?"rtl":"ltr"}>
   <div className="dd-orders-layout">
    <header className="dd-orders-heading">
      <div><Link className="dd-orders-back" href={pathFor("staffPortal",locale)}>← {t.back}</Link>
       <h1>{t.title}</h1><p>{t.subtitle}</p>
      </div>
      {active&&canView&&<button type="button" className="dd-orders-btn secondary" onClick={reload}>{t.refresh}</button>}
    </header>
    {!active?<section className="dd-orders-panel dd-orders-guard">
      <p role="status">{session.status==="loading"?t.loading:t.blocked}</p>
      {gate&&<Link className="dd-orders-btn" href={gate.href}>{gate.label}</Link>}
    </section>:stage==="loading"?<section className="dd-orders-panel dd-orders-guard" role="status">{t.loading}</section>:
     stage==="forbidden"?<section className="dd-orders-panel dd-orders-guard" role="alert">{t.blocked}</section>:
     stage==="error"?<section className="dd-orders-panel dd-orders-guard" role="alert">{t.error} <button type="button" className="dd-orders-btn secondary" onClick={reload}>{t.refresh}</button></section>:<>
     {pageNotice&&<p className="dd-orders-notice" role="status">{pageNotice}</p>}
     <form className="dd-orders-toolbar" onSubmit={applySearch}>
      <input type="search" value={searchInput} onChange={e=>setSearchInput(e.target.value)} placeholder={t.search} aria-label={t.search} maxLength={70}/>
      <button type="submit" className="dd-orders-btn">{t.searchButton}</button>
      <select aria-label={t.status} value={statusFilter} onChange={e=>filterStatus(e.target.value)}>
       <option value="">{t.all}</option>{statuses.map(s=><option value={s} key={s}>{t.statusNames[s]}</option>)}
      </select>
     </form>
     <p className="dd-orders-helper">{t.searchHelp}</p>
     <section className="dd-orders-panel">
      <div className="dd-orders-panel-heading"><h2>{t.title}</h2><span>{t.showing}: {total.toLocaleString(locale==="ar"?"ar-EG":"en-US")}</span></div>
      {orders.length?<div className="dd-orders-scroll"><table>
       <thead><tr><th>{t.order}</th><th>{t.status}</th><th>{t.occasion}</th><th>{t.date}</th><th>{t.area}</th><th>{t.amount}</th><th>{t.created}</th><th></th></tr></thead>
       <tbody>{orders.map(row=><tr key={row.id}>
        <td dir="ltr"><strong>{numberLabel(row.order_number)}</strong></td>
        <td><span className={"dd-order-status s-"+row.status}>{t.statusNames[row.status]||row.status}</span></td>
        <td>{row.occasion_type||"—"}</td><td>{occasionDate(row.occasion_date,locale)}</td><td>{row.delivery_area||"—"}</td>
        <td dir="ltr">{money(row.grand_total,row.currency,locale)}</td><td>{date(row.created_at,locale)}</td>
        <td><button type="button" className="dd-orders-text-btn" onClick={()=>setSelected(row.id)}>{t.see}</button></td>
       </tr>)}</tbody></table></div>:<p className="dd-orders-empty">{t.none}</p>}
      <nav className="dd-orders-pages" aria-label={t.page}>
       <span>{t.page} {page+1} {t.of} {Math.max(1,Math.ceil(total/PAGE_SIZE))}</span>
       <div><button type="button" className="dd-orders-btn secondary" disabled={page===0} onClick={()=>setPage(n=>n-1)}>{t.previous}</button>
        <button type="button" className="dd-orders-btn secondary" disabled={(page+1)*PAGE_SIZE>=total} onClick={()=>setPage(n=>n+1)}>{t.next}</button>
       </div>
      </nav>
     </section>
     <p className="dd-orders-hint">{t.paymentsWarning}</p>
    </>}
   </div>
   {selected&&active&&canView&&<div className="dd-orders-overlay" onMouseDown={event=>{if(event.target===event.currentTarget&&!busy)setSelected(null);}}>
    <aside role="dialog" aria-modal="true" aria-labelledby="dd-order-dialog-title" className="dd-orders-drawer" ref={dialogRef} tabIndex={-1}>
     <header className="dd-orders-drawer-head"><div><h2 id="dd-order-dialog-title">{t.details} {numberLabel(o?.order_number)}</h2>
      {o&&<p>{date(o.created_at,locale)}</p>}</div>
      <button type="button" className="dd-orders-close" onClick={()=>setSelected(null)} disabled={busy} aria-label={t.close}>×</button>
     </header>
     {detail.stage==="loading"?<p role="status">{t.loadingDetails}</p>:
       detail.stage==="error"?<p role="alert">{t.detailsError}</p>:o&&<>
      <div className="dd-orders-summary-grid">
       <Summary label={t.status} value={t.statusNames[o.status]||o.status}/>
       <Summary label={t.customer} value={detail.profile?.full_name||"—"}/>
       {detail.profile?.phone&&<Summary label={t.phone} value={detail.profile.phone}/>}
       <Summary label={t.occasion} value={o.occasion_type||"—"}/>
       <Summary label={t.date} value={occasionDate(o.occasion_date,locale)}/>
       <Summary label={t.time} value={o.occasion_time||"—"}/>
       <Summary label={t.area} value={o.delivery_area||"—"}/>
       <Summary label={t.subtotal} value={money(o.subtotal,o.currency,locale)}/>
       <Summary label={t.discount} value={money(o.discount_total,o.currency,locale)}/>
       <Summary label={t.delivery} value={money(o.delivery_total,o.currency,locale)}/>
       <Summary label={t.amount} value={money(o.grand_total,o.currency,locale)}/>
      </div>
      {addressLabel(o.delivery_address)&&<Summary label={t.address} value={addressLabel(o.delivery_address)}/>}
      {o.customer_note&&<Summary label={t.note} value={o.customer_note}/>}
      <section className="dd-orders-detail-section">
       <h3>{t.statusEdit}</h3>
       {!canManage?<p>{t.readonly}</p>:!changeTo?<p>{t.restricted}</p>:
        <div className="dd-orders-update"><select value={next} onChange={e=>setNext(e.target.value)} disabled={busy} aria-label={t.statusEdit}>
         <option value={o.status}>{t.statusNames[o.status]}</option><option value={changeTo}>{t.statusNames[changeTo]}</option>
        </select>
        <button className="dd-orders-btn" type="button" disabled={busy||next===o.status} onClick={save}>{busy?t.saving:t.save}</button></div>}
       {feedback&&<p role="status" className="dd-orders-feedback">{feedback}</p>}
      </section>
      <section className="dd-orders-detail-section"><h3>{t.items}</h3>
       {detail.errors.includes("items")?<p>{t.unavailable}</p>:detail.items.length?detail.items.map(item=><div key={item.id} className="dd-order-item">
        <div><strong>{item.item_name}</strong><small>{t.quantity}: {item.quantity} × {money(item.unit_price,o.currency,locale)}</small></div>
        <strong dir="ltr">{money(item.line_total,o.currency,locale)}</strong>
       </div>):<p>{t.noItems}</p>}
      </section>
      <section className="dd-orders-detail-section"><h3>{t.partnerOrders}</h3>
       {detail.errors.includes("partners")?<p>{t.unavailable}</p>:detail.partners.length?detail.partners.map(p=><div className="dd-order-item" key={p.id}>
        <div><strong>{detail.names[p.partner_id]?.[locale==="ar"?"name_ar":"name_en"]||detail.names[p.partner_id]?.name_ar||detail.names[p.partner_id]?.name_en||t.partner}</strong>
        <small>{p.status}</small></div>
        <strong dir="ltr">{money(p.subtotal,o.currency,locale)}</strong>
       </div>):<p>{t.noPartnerOrders}</p>}
      </section>
      <p className="dd-orders-hint">{t.paymentsWarning}</p>
     </>}
    </aside>
   </div>}
  </main>;
}
