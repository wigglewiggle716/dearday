"use client";
import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {usePartnerPortal,usePartnerMutations} from "./partner-portal-base";
import {pathFor} from "../lib/locales";
const STATUS=["pending","accepted","rejected","in_progress","ready","completed","cancelled","refunded"];
const transitions={pending:["accepted","rejected"],accepted:["in_progress"],in_progress:["ready"],ready:["completed"]};
const labels={
 ar:{overview:"نظرة عامة",orders:"طلبات الشريك",cancellations:"الإلغاءات والاسترداد",refresh:"تحديث",
  error:"تعذر تحميل البيانات؛ حاول مرة أخرى.",loading:"جاري تحميل الطلبات…",search:"ابحث برقم الطلب أو المناسبة أو المنطقة",
  all:"كل الحالات",empty:"لا توجد بيانات حالياً.",number:"رقم الطلب",status:"الحالة",occasion:"المناسبة",
  date:"التاريخ",area:"المنطقة",items:"العناصر",subtotal:"إجمالي الشريك",net:"صافي الشريك",commission:"العمولة",
  open:"فتح التفاصيل",address:"عنوان التوصيل",note:"ملاحظة العميل",details:"تفاصيل الطلب",update:"تحديث الحالة",
  close:"إغلاق",quantity:"الكمية",price:"السعر",loadingDetail:"جاري تحميل التفاصيل…",confirm:"هل تؤكد تغيير حالة الطلب؟ التعديل سيُسجّل في النظام الفعلي.",
  saved:"تم تغيير حالة الطلب.",saveError:"تعذر تغيير الحالة؛ ربما تغيّرت حالة الطلب أو صلاحية الحساب.",
  allOrders:"إجمالي الطلبات",await:"بانتظار الرد",active:"تحت التنفيذ",products:"المنتجات والخدمات",
  overviewOrders:"آخر الطلبات",viewAll:"عرض كل الطلبات",cancellationReason:"سبب الإلغاء",
  estimated:"الاسترداد المتوقع",approved:"الاسترداد المعتمد",reviewNote:"ملاحظة المراجعة",
  cancellationHint:"الاستثناء قيد المراجعة: استمر في تنفيذ الطلب. إذا تم الإلغاء أو أصبح الاسترداد معلقًا، أوقف تنفيذ العنصر.",
  multiPartnerCancellations:"هذا الحساب مرتبط بأكثر من شريك. لا تتضمن بيانات الإلغاءات الحالية معرف الشريك، لذلك عرضها مفصلاً حسب الشريك يحتاج تحديث RPC قبل الاعتماد.",
  statuses:{pending:"بانتظار الرد",accepted:"مقبول",rejected:"مرفوض",in_progress:"قيد التنفيذ",ready:"جاهز",completed:"مكتمل",cancelled:"ملغي",refunded:"مسترد"},
  cancelStatuses:{pending_review:"استثناء قيد المراجعة — استمر في التنفيذ",approved:"إلغاء بدون استرداد",partially_approved:"مقبول جزئيًا",rejected:"تم رفض الإلغاء — استمر في التنفيذ",refund_pending:"تم الإلغاء — أوقف التنفيذ",refunded:"تم الإلغاء — تم الاسترداد"}
 },
 en:{overview:"Overview",orders:"Partner Orders",cancellations:"Cancellations & Refunds",refresh:"Refresh",
  error:"Could not load data. Retry.",loading:"Loading partner orders…",search:"Search order, occasion or area",
  all:"All statuses",empty:"No records yet.",number:"Order",status:"Status",occasion:"Occasion",
  date:"Date",area:"Area",items:"Items",subtotal:"Partner subtotal",net:"Partner net",commission:"Commission",
  open:"Open details",address:"Delivery address",note:"Customer note",details:"Order details",update:"Update status",
  close:"Close",quantity:"Quantity",price:"Price",loadingDetail:"Loading details…",confirm:"Confirm changing this live partner order status?",
  saved:"Order status updated.",saveError:"Update failed; order state or access may have changed.",
  allOrders:"Total orders",await:"Awaiting response",active:"In progress",products:"Products & Services",
  overviewOrders:"Recent orders",viewAll:"View all orders",cancellationReason:"Cancellation reason",
  estimated:"Estimated refund",approved:"Approved refund",reviewNote:"Review note",
  cancellationHint:"While manual cancellation is under review, continue fulfilment. Stop fulfilment when cancelled/refund pending.",
  multiPartnerCancellations:"This account manages multiple partners. Cancellation records lack a partner ID, so accurate per-partner filtering needs a backend RPC update before sign-off.",
  statuses:{pending:"Pending",accepted:"Accepted",rejected:"Rejected",in_progress:"In progress",ready:"Ready",completed:"Completed",cancelled:"Cancelled",refunded:"Refunded"},
  cancelStatuses:{pending_review:"Manual review — continue",approved:"Cancelled without refund",partially_approved:"Partially approved",rejected:"Rejected — continue",refund_pending:"Cancelled — stop fulfilment",refunded:"Cancelled — refunded"}
 }
};
function money(value,currency,locale){try{return new Intl.NumberFormat(locale==="en"?"en-EG":"ar-EG",{style:"currency",currency:currency||"EGP",maximumFractionDigits:2}).format(Number(value||0));}catch{return String(value??0)+" EGP";}}
function date(value,locale){if(!value)return "—";const d=new Date(value);return Number.isNaN(d.getTime())?String(value).slice(0,10):new Intl.DateTimeFormat(locale==="en"?"en-GB":"ar-EG",{dateStyle:"medium",timeZone:"Africa/Cairo"}).format(d);}
export default function PartnerOrdersPanel({section="overview"}){
 const {client,locale,partner,partners}=usePartnerPortal(),verify=usePartnerMutations();
 const t=labels[locale]||labels.ar;
 const [state,setState]=useState({stage:"loading",orders:[],cancellations:[]});
 const [search,setSearch]=useState(""),[status,setStatus]=useState(""),[revision,setRevision]=useState(0);
 const [detail,setDetail]=useState({id:null,stage:"idle",data:null}),[busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[error,setError]=useState("");
 useEffect(()=>{
  let live=true;setState({stage:"loading",orders:[],cancellations:[]});
  (async()=>{
   try{
    if(!partner)return;
    const orders=await client.rpc("partner_list_orders");
    if(orders.error)throw orders.error;
    let cancellations=[];
    if(section==="cancellations"&&partners.length===1){
     const r=await client.rpc("partner_list_cancellations");if(r.error)throw r.error;
     cancellations=r.data||[];
    }
    if(live)setState({stage:"ready",partnerId:partner.id,orders:(Array.isArray(orders.data)?orders.data:[]).filter(o=>o.partner_id===partner.id),cancellations});
   }catch{if(live)setState({stage:"error",orders:[],cancellations:[]});}
  })();
  return()=>{live=false;};
 },[client,partner?.id,section,revision,partners.length]);
 useEffect(()=>{setDetail({id:null,stage:"idle",data:null});setError("");},[partner?.id]);
 const rows=state.orders.filter(o=>(!status||o.status===status)&&(!search.trim()||
   [o.order_number,o.occasion_type,o.delivery_area].join(" ").toLowerCase().includes(search.trim().toLowerCase())));
 async function open(o){
  setDetail({id:o.partner_order_id,stage:"loading",data:null});setError("");
  const r=await client.rpc("partner_get_order_detail",{p_partner_order_id:o.partner_order_id});
  if(r.error){setDetail({id:o.partner_order_id,stage:"error",data:null});return;}
  setDetail({id:o.partner_order_id,stage:"ready",data:r.data});
 }
 async function update(next){
  if(!detail.data||busy||!transitions[detail.data.partner_order?.status]?.includes(next))return;
  if(!window.confirm(t.confirm))return;
  setBusy(true);setError("");setNotice("");
  try{
   const id=await verify(),po=detail.data.partner_order;
   const inScope=state.orders.find(x=>x.partner_order_id===po.id&&x.partner_id===id);
   if(!inScope||inScope.status!==po.status)throw Error("stale");
   const fresh=await client.rpc("partner_get_order_detail",{p_partner_order_id:po.id});
   if(fresh.error||fresh.data?.partner_order?.status!==po.status)throw Error("stale");
   const r=await client.rpc("partner_update_order_status",{p_partner_order_id:po.id,p_status:next});
   if(r.error)throw r.error;
   setDetail({id:null,stage:"idle",data:null});setNotice(t.saved);setRevision(v=>v+1);
  }catch{setError(t.saveError);}finally{setBusy(false);}
 }
 const header=section==="overview"?t.overview:section==="cancellations"?t.cancellations:t.orders;
 return <div className="dd-pp-page"><div className="dd-pp-heading"><h1>{header}</h1><button type="button" onClick={()=>setRevision(v=>v+1)}>{t.refresh}</button></div>
  {error&&<p role="alert" className="dd-pp-error">{error}</p>}{notice&&<p role="status" className="dd-pp-success">{notice}</p>}
  {(state.stage==="ready"&&state.partnerId!==partner?.id||state.stage==="loading")?<p role="status">{t.loading}</p>:state.stage==="error"?<p role="alert">{t.error}</p>:section==="cancellations"?<>
   <p className="dd-pp-warning">{t.cancellationHint}</p>
   {partners.length>1?<p className="dd-pp-warning">{t.multiPartnerCancellations}</p>:state.cancellations.length?
    <div className="dd-pp-cards">{state.cancellations.map(x=><article className="dd-pp-card" key={x.request_item_id}>
      <div className="dd-pp-card-head"><strong>#DD{x.order_number} — {x.item_name}</strong><span>{t.cancelStatuses[x.item_status]||x.item_status}</span></div>
      <p>{date(x.requested_at,locale)} · {t.cancellationReason}: {x.reason_text||x.reason_code||"—"}</p>
      <div className="dd-pp-details-grid"><div><small>{t.estimated}</small><strong>{money(x.estimated_refund_amount,x.currency,locale)}</strong></div>
       <div><small>{t.approved}</small><strong>{money(x.approved_refund_amount,x.currency,locale)}</strong></div></div>
      {x.admin_note&&<p>{t.reviewNote}: {x.admin_note}</p>}
    </article>)}</div>:<p className="dd-pp-empty">{t.empty}</p>}
  </>:<>
   {section==="overview"&&<div className="dd-pp-kpis">
    <article><span>{t.allOrders}</span><strong>{state.orders.length}</strong></article>
    <article><span>{t.await}</span><strong>{state.orders.filter(o=>o.status==="pending").length}</strong></article>
    <article><span>{t.active}</span><strong>{state.orders.filter(o=>["accepted","in_progress","ready"].includes(o.status)).length}</strong></article>
    <article><span>{t.net}</span><strong>{money(state.orders.reduce((a,o)=>a+Number(o.partner_net||0),0),"EGP",locale)}</strong></article>
   </div>}
   {section==="orders"&&<div className="dd-pp-filters"><input type="search" aria-label={t.search} placeholder={t.search} value={search} onChange={e=>setSearch(e.target.value)}/>
    <select aria-label={t.status} value={status} onChange={e=>setStatus(e.target.value)}><option value="">{t.all}</option>{STATUS.map(s=><option value={s} key={s}>{t.statuses[s]||s}</option>)}</select></div>}
   {section==="overview"&&<div className="dd-pp-heading"><h2>{t.overviewOrders}</h2><Link href={pathFor("partnerOrders",locale)}>{t.viewAll}</Link></div>}
   <div className="dd-pp-panel">{(section==="overview"?rows.slice(0,6):rows).length?
    <div className="dd-pp-table-wrap"><table><thead><tr><th>{t.number}</th><th>{t.status}</th><th>{t.occasion}</th><th>{t.date}</th><th>{t.area}</th><th>{t.items}</th><th>{t.net}</th><th></th></tr></thead>
     <tbody>{(section==="overview"?rows.slice(0,6):rows).map(o=><tr key={o.partner_order_id}>
      <td dir="ltr">#DD{o.order_number}</td><td>{t.statuses[o.status]||o.status}</td>
      <td>{o.occasion_type||"—"}</td><td>{o.occasion_date||"—"}</td><td>{o.delivery_area||"—"}</td><td>{o.item_count??"—"}</td>
      <td dir="ltr">{money(o.partner_net,o.currency,locale)}</td>
      <td><button type="button" onClick={()=>open(o)}>{t.open}</button></td>
     </tr>)}</tbody></table></div>:<p className="dd-pp-empty">{t.empty}</p>}</div>
   {section==="overview"&&<div className="dd-pp-actions"><Link href={pathFor("partnerProducts",locale)}>{t.products}</Link>
    <Link href={pathFor("partnerCancellations",locale)}>{t.cancellations}</Link></div>}
  </>}
  {detail.id&&<div className="dd-pp-overlay" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setDetail({id:null,stage:"idle",data:null});}}>
   <section role="dialog" aria-modal="true" aria-labelledby="dd-pp-order-title" className="dd-pp-dialog">
    <header><h2 id="dd-pp-order-title">{t.details}</h2><button type="button" disabled={busy} aria-label={t.close} onClick={()=>setDetail({id:null,stage:"idle",data:null})}>×</button></header>
    {detail.stage!=="ready"?<p>{detail.stage==="error"?t.error:t.loadingDetail}</p>:<div className="dd-pp-modal-body">
     <div className="dd-pp-details-grid">{[[t.number,"#DD"+(detail.data.order?.order_number||"—")],[t.status,t.statuses[detail.data.partner_order?.status]],
      [t.occasion,detail.data.order?.occasion_type],[t.date,detail.data.order?.occasion_date],[t.area,detail.data.order?.delivery_area],
      [t.address,Object.values(detail.data.order?.delivery_address||{}).filter(x=>typeof x==="string").join(" — ")],
      [t.note,detail.data.order?.customer_note],[t.subtotal,money(detail.data.partner_order?.subtotal,detail.data.order?.currency,locale)],
      [t.net,money(detail.data.partner_order?.partner_net,detail.data.order?.currency,locale)]].map(([k,v])=>
      <div key={k}><small>{k}</small><strong>{v||"—"}</strong></div>)}</div>
     <h3>{t.items}</h3>{(detail.data.items||[]).map(x=><div className="dd-pp-detail-line" key={x.id}>
      <span>{x.item_name} · {t.quantity}: {x.quantity}</span><strong>{money(x.line_total,detail.data.order?.currency,locale)}</strong>
     </div>)}
     {transitions[detail.data.partner_order?.status]?.length>0&&<div className="dd-pp-actions">{transitions[detail.data.partner_order.status].map(s=>
      <button type="button" key={s} disabled={busy} onClick={()=>update(s)}>{t.statuses[s]}</button>)}</div>}
    </div>}
   </section>
  </div>}
 </div>;
}
