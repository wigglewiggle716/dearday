"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {authClient,EMPLOYEE_ROLES,rememberPreference} from "../lib/auth-client";
import {useAuthSession} from "./auth-session-provider";
import {pathFor} from "../lib/locales";
import {staffAdminVisibleModules} from "../lib/staff-admin-navigation";

const OPEN=["draft","pending_payment","paid","confirmed","in_progress"];
const PAID=["paid","confirmed","in_progress","completed"];
const words={
 ar:{
  ownerTitle:"لوحة الـ Super Admin",ownerSubtitle:"مركز التحكم التشغيلي والمالي لـ Dear Day.",
  accountantTitle:"لوحة المحاسب",accountantSubtitle:"ملخص المالية والتسويات والطلبات في Dear Day.",
  staffTitle:"بوابة فريق Dear Day",staffSubtitle:"الأقسام المعروضة مبنية على صلاحيات حسابك الفعلية.",
  login:"تسجيل الدخول",mfa:"إكمال التحقق بخطوتين",mfaSetup:"تفعيل التحقق بخطوتين",
  unavailable:"الصفحة مخصصة لفريق Dear Day.",loading:"جاري تحميل لوحة الإدارة…",
  error:"تعذر تحميل لوحة الإدارة. حاول مجددًا.",noAccess:"هذا الحساب لا يملك صلاحية عرض لوحة الإدارة.",
  refresh:"تحديث البيانات",role:"الدور",email:"البريد",all:"كل الطلبات",open:"طلبات مفتوحة",
  customers:"العملاء",partners:"شركاء نشطون",pending:"بانتظار الموافقة",
  unsettled:"Partner Net غير مسوّى",paidRevenue:"قيمة الطلبات المدفوعة",cancelled:"إلغاءات / استردادات",
  draft:"تسويات Draft",approved:"تسويات Approved",paid:"إجمالي Paid",
  recentOrders:"أحدث الطلبات",allOrders:"عرض كل الطلبات",order:"رقم الطلب",status:"الحالة",
  occasion:"المناسبة",area:"المنطقة",total:"الإجمالي",created:"الإنشاء",emptyOrders:"لا توجد طلبات حتى الآن.",
  pendingApprovals:"موافقات تحتاج مراجعة",openApprovals:"فتح الموافقات",item:"العنصر",partner:"الشريك",
  price:"السعر",sent:"تاريخ الإرسال",emptyApprovals:"لا توجد موافقات معلقة.",
  financeTitle:"ملخص المالية والتسويات",openFinance:"فتح المالية",
  latestSettlements:"أحدث التسويات",period:"الفترة",reference:"المرجع",emptySettlements:"لا توجد تسويات حتى الآن.",
  workAreas:"أقسام العمل",oldNotice:"↗ يفتح القسم غير المنقول بعد على الموقع الأساسي، وقد يتطلب تسجيل دخول منفصل.",
  permissionNote:"الروابط والمؤشرات تتبع صلاحيات Supabase الفعلية، وليست وسيلة لمنح صلاحيات.",
  limited:"بعض البيانات لم تُحمّل؛ عرضنا فقط الأقسام التي سمحت بها الصلاحيات.",
  empty:"لا توجد بيانات حاليًا.",na:"—"
 },
 en:{
  ownerTitle:"Super Admin Dashboard",ownerSubtitle:"Dear Day operational and financial control centre.",
  accountantTitle:"Accountant Dashboard",accountantSubtitle:"Finance, settlements and order overview for Dear Day.",
  staffTitle:"Dear Day Staff Portal",staffSubtitle:"Available work areas are based on your actual account permissions.",
  login:"Log in",mfa:"Complete two-step verification",mfaSetup:"Set up two-step verification",
  unavailable:"This workspace is only for Dear Day staff.",loading:"Loading dashboard…",
  error:"Couldn't load the dashboard. Please try again.",noAccess:"This account cannot view the staff dashboard.",
  refresh:"Refresh",role:"Role",email:"Email",all:"All orders",open:"Open orders",
  customers:"Customers",partners:"Active partners",pending:"Pending approvals",
  unsettled:"Unsettled Partner Net",paidRevenue:"Paid order value",cancelled:"Cancellations / Refunds",
  draft:"Draft settlements",approved:"Approved settlements",paid:"Paid settlements",
  recentOrders:"Recent Orders",allOrders:"View all orders",order:"Order",status:"Status",
  occasion:"Occasion",area:"Area",total:"Total",created:"Created",emptyOrders:"No orders yet.",
  pendingApprovals:"Approvals Needing Review",openApprovals:"Review Approvals",item:"Item",partner:"Partner",
  price:"Price",sent:"Submitted",emptyApprovals:"No pending approvals.",
  financeTitle:"Finance & Settlements Summary",openFinance:"Open Finance",
  latestSettlements:"Recent Settlements",period:"Period",reference:"Reference",emptySettlements:"No settlements yet.",
  workAreas:"Work Areas",oldNotice:"↗ opens a module not yet moved to React on the original website; separate sign-in may be required.",
  permissionNote:"Cards and links use real Supabase permissions; they do not grant access.",
  limited:"Some records could not be loaded; only permitted data is shown.",
  empty:"No data available.",na:"—"
 }
};
const orderStatuses={
 ar:{draft:"مسودة",pending_payment:"بانتظار الدفع",paid:"مدفوع",confirmed:"مؤكد",in_progress:"قيد التنفيذ",completed:"مكتمل",cancelled:"ملغي",refunded:"مسترد"},
 en:{draft:"Draft",pending_payment:"Pending payment",paid:"Paid",confirmed:"Confirmed",in_progress:"In progress",completed:"Completed",cancelled:"Cancelled",refunded:"Refunded"}
};
function money(value,currency,locale){
 if(value===null||value===undefined)return "—";
 try{return new Intl.NumberFormat(locale==="ar"?"ar-EG":"en-EG",{style:"currency",currency:currency||"EGP",maximumFractionDigits:2}).format(Number(value));}
 catch{return String(value)+" "+(currency||"EGP");}
}
function number(value,locale){return value===undefined||value===null?"—":new Intl.NumberFormat(locale==="ar"?"ar-EG":"en-US").format(value);}
function shortDate(value,locale){
 if(!value)return "—";
 const d=new Date(value);return Number.isNaN(d.getTime())?"—":new Intl.DateTimeFormat(locale==="ar"?"ar-EG":"en-GB",{day:"numeric",month:"short",year:"numeric"}).format(d);
}
async function count(client,table,filter){
 let q=client.from(table).select("id",{count:"exact",head:true});
 if(filter)q=filter(q);
 const result=await q;if(result.error)throw result.error;return result.count??0;
}
async function financialSnapshot(client){
 const [partnerOrders,items,settlements]=await Promise.all([
  client.from("partner_orders").select("id,partner_net").eq("status","completed"),
  client.from("settlement_items").select("partner_order_id"),
  client.from("partner_settlements").select("status,partner_net")
 ]);
 for(const r of [partnerOrders,items,settlements])if(r.error)throw r.error;
 const already=new Set((items.data||[]).map(i=>i.partner_order_id));
 const numbers={unsettled:(partnerOrders.data||[]).filter(p=>!already.has(p.id)).reduce((sum,p)=>sum+Number(p.partner_net||0),0),draft:0,approved:0,paid:0};
 for(const s of settlements.data||[]){
  if(["draft","approved","paid"].includes(s.status))numbers[s.status]+=Number(s.partner_net||0);
 }
 return numbers;
}
async function paidOrderValue(client){
 const r=await client.from("orders").select("grand_total").in("status",PAID);
 if(r.error)throw r.error;
 return (r.data||[]).reduce((sum,item)=>sum+Number(item.grand_total||0),0);
}
async function recentApprovals(client){
 const r=await client.from("listing_versions")
  .select("id,listing_id,name_ar,name_en,price,currency,submitted_at,created_at")
  .eq("status","pending_review").order("submitted_at",{ascending:true,nullsFirst:false})
  .limit(6);
 if(r.error)throw r.error;
 const versions=r.data||[];
 if(!versions.length)return[];
 const listingIds=[...new Set(versions.map(v=>v.listing_id).filter(Boolean))];
 if(!listingIds.length)return versions;
 // Optional partner labels: display the approval safely even if this
 // supplementary lookup has a more restrictive RLS policy.
 const l=await client.from("listings").select("id,partner_id").in("id",listingIds);
 if(l.error)return versions;
 const partnersByListing=Object.fromEntries((l.data||[]).map(x=>[x.id,x.partner_id]));
 const partnerIds=[...new Set(Object.values(partnersByListing).filter(Boolean))];
 if(!partnerIds.length)return versions;
 const p=await client.from("partner_directory").select("id,name_ar,name_en").in("id",partnerIds);
 if(p.error)return versions;
 const names=Object.fromEntries((p.data||[]).map(x=>[x.id,x]));
 return versions.map(v=>({...v,partnerName:names[partnersByListing[v.listing_id]]||null}));
}
async function recentSettlements(client){
 const r=await client.from("partner_settlements")
  .select("id,partner_id,period_start,period_end,partner_net,status,payment_reference,created_at")
  .order("created_at",{ascending:false}).limit(6);
 if(r.error)throw r.error;
 const rows=r.data||[];
 if(!rows.length)return[];
 const p=await client.from("partner_directory").select("id,name_ar,name_en")
  .in("id",[...new Set(rows.map(x=>x.partner_id).filter(Boolean))]);
 if(p.error)return rows;
 const names=Object.fromEntries((p.data||[]).map(x=>[x.id,x]));
 return rows.map(x=>({...x,partnerName:names[x.partner_id]||null}));
}
function Panel({title,href,hrefLabel,children,external=false}){
 return <section className="dd-work-panel dd-work-parity-panel">
  <div className="dd-work-parity-heading"><h2 className="dd-work-section-title">{title}</h2>
   {href&&(external?<a href={href} target="_blank" rel="noopener noreferrer">{hrefLabel} ↗</a>:
    <Link href={href}>{hrefLabel} ←</Link>)}
  </div>{children}
 </section>;
}
export default function StaffWorkspace({locale="ar"}){
 const t=words[locale]||words.ar;
 const session=useAuthSession();
 const valid=session.status==="authenticated"&&EMPLOYEE_ROLES.has(session.role);
 const client=useMemo(()=>typeof window==="undefined"?null:authClient(rememberPreference()),[]);
 const [revision,setRevision]=useState(0);
 const [result,setResult]=useState({stage:"loading",id:null,permissions:[],stats:{},orders:[],approvals:[],settlements:[],warning:false});
 const id=valid?session.user?.id:null;
 useEffect(()=>{
  let alive=true;
  if(!valid||!client||!id){
   setResult({stage:"loading",id:null,permissions:[],stats:{},orders:[],approvals:[],settlements:[],warning:false});
   return()=>{alive=false;};
  }
  setResult({stage:"loading",id,permissions:[],stats:{},orders:[],approvals:[],settlements:[],warning:false});
  (async()=>{
   try{
    const p=await client.rpc("get_my_permissions");
    if(p.error)throw p.error;
    if(!alive)return;
    const permissions=[...new Set((p.data||[]).map(x=>x.permission_code))];
    if(!permissions.includes("dashboard.view")){
     setResult({stage:"forbidden",id,permissions,stats:{},orders:[],approvals:[],settlements:[],warning:false});return;
    }
    const grants=new Set(permissions),tasks=[];
    if(grants.has("orders.view")){
     tasks.push(["orders",()=>count(client,"orders")]);
     tasks.push(["open",()=>count(client,"orders",q=>q.in("status",OPEN))]);
     tasks.push(["cancelled",()=>count(client,"orders",q=>q.in("status",["cancelled","refunded"]))]);
     tasks.push(["paidRevenue",()=>paidOrderValue(client)]);
     tasks.push(["recent",async()=>{
      const q=await client.from("orders")
       .select("id,order_number,status,occasion_type,delivery_area,grand_total,currency,created_at")
       .order("created_at",{ascending:false}).limit(8);
      if(q.error)throw q.error;return q.data||[];
     }]);
    }
    if(grants.has("customers.view"))tasks.push(["customers",()=>count(client,"profiles",q=>q.eq("role","customer"))]);
    if(grants.has("partners.view"))tasks.push(["partners",()=>count(client,"partners",q=>q.eq("status","active"))]);
    if(grants.has("approvals.review")){
     tasks.push(["pending",()=>count(client,"listing_versions",q=>q.eq("status","pending_review"))]);
     tasks.push(["approvalsList",()=>recentApprovals(client)]);
    }
    if(grants.has("finance.view")){
     tasks.push(["financial",()=>financialSnapshot(client)]);
     tasks.push(["settlementsList",()=>recentSettlements(client)]);
    }
    const settled=await Promise.allSettled(tasks.map(async([key,fn])=>({key,value:await fn()})));
    if(!alive)return;
    const values={},warning=settled.some(x=>x.status==="rejected");
    settled.forEach(x=>{if(x.status==="fulfilled")values[x.value.key]=x.value.value;});
    const fin=values.financial||{};
    setResult({stage:"ready",id,permissions,
     stats:{orders:values.orders,open:values.open,customers:values.customers,partners:values.partners,
      pending:values.pending,unsettled:fin.unsettled,draft:fin.draft,approved:fin.approved,paid:fin.paid,
      paidRevenue:values.paidRevenue,cancelled:values.cancelled},
     orders:values.recent||[],approvals:values.approvalsList||[],
     settlements:values.settlementsList||[],warning});
   }catch{
    if(alive)setResult({stage:"error",id,permissions:[],stats:{},orders:[],approvals:[],settlements:[],warning:false});
   }
  })();
  return()=>{alive=false;};
 },[valid,client,id,revision]);
 const role=session.role||"";
 const owner=role==="super_admin"||role==="admin";
 const accountant=role==="accountant";
 const perms=new Set(result.permissions);
 const ar=locale==="ar";
 const signin=pathFor("auth",locale),secure=pathFor("security",locale);
 const gate=session.status==="mfa_setup_required"?{label:t.mfaSetup,href:secure}:
  session.status==="mfa_required"?{label:t.mfa,href:signin+"?mode=mfa"}:
  session.status==="signed_out"?{label:t.login,href:signin}:null;
 const metrics=owner?[
  ["orders","orders.view",t.all],["open","orders.view",t.open],
  ["customers","customers.view",t.customers],["partners","partners.view",t.partners],
  ["pending","approvals.review",t.pending],["unsettled","finance.view",t.unsettled],
  ["paidRevenue","orders.view",t.paidRevenue],["cancelled","orders.view",t.cancelled]
 ]:accountant?[
  ["unsettled","finance.view",t.unsettled],["draft","finance.view",t.draft],
  ["approved","finance.view",t.approved],["paid","finance.view",t.paid]
 ]:[
  ["orders","orders.view",t.all],["open","orders.view",t.open],
  ["customers","customers.view",t.customers],["partners","partners.view",t.partners],
  ["pending","approvals.review",t.pending],["draft","finance.view",t.draft]
 ];
 const visible=metrics.filter(x=>perms.has(x[1]));
 const moneyMetric=new Set(["unsettled","paidRevenue","draft","approved","paid"]);
 const title=owner?t.ownerTitle:accountant?t.accountantTitle:t.staffTitle;
 const subtitle=owner?t.ownerSubtitle:accountant?t.accountantSubtitle:t.staffSubtitle;
 const modules=staffAdminVisibleModules(result.permissions,role);
 return <main id="main-content" className="dd-staff-workspace" dir={ar?"rtl":"ltr"}>
  <div className="dd-work-wrap">
   <header className="dd-work-heading">
    <div><h1>{title}</h1><p>{subtitle}</p></div>
    {valid&&result.stage==="ready"&&<div className="dd-work-parity-badge">{t.role}: <strong>{role.replaceAll("_"," ")}</strong></div>}
   </header>
   {!valid?<section className="dd-work-panel dd-work-guard" role="status">
    <p>{session.status==="loading"?t.loading:t.unavailable}</p>
    {gate&&<Link className="dd-work-primary" href={gate.href}>{gate.label}</Link>}
   </section>:result.id!==id||result.stage==="loading"?<section className="dd-work-panel dd-work-guard" role="status">{t.loading}</section>:
    result.stage==="error"?<section className="dd-work-panel dd-work-guard" role="alert">
     <p>{t.error}</p><button type="button" className="dd-work-primary" onClick={()=>setRevision(x=>x+1)}>{t.refresh}</button>
    </section>:result.stage==="forbidden"?<section className="dd-work-panel dd-work-guard" role="alert">{t.noAccess}</section>:<>
    {visible.length>0&&<section className="dd-work-metrics" aria-label={t.role}>
     {visible.map(([key,,label])=><article className="dd-work-stat" key={key}>
      <span>{label}</span><strong dir={moneyMetric.has(key)?"ltr":undefined}>
       {moneyMetric.has(key)?money(result.stats[key]??null,"EGP",locale):number(result.stats[key],locale)}
      </strong>
     </article>)}
    </section>}
    {result.warning&&<p className="dd-work-warning" role="status">{t.limited}</p>}
    {perms.has("orders.view")&&<Panel title={t.recentOrders} href={pathFor("staffOrders",locale)} hrefLabel={t.allOrders}>
      {result.orders.length?<div className="dd-work-table-scroll"><table>
       <thead><tr><th>{t.order}</th><th>{t.status}</th><th>{t.occasion}</th><th>{t.area}</th><th>{t.total}</th><th>{t.created}</th></tr></thead>
       <tbody>{result.orders.map(order=><tr key={order.id}>
        <td dir="ltr"><Link href={pathFor("staffOrders",locale)}>{order.order_number==null?"—":"#DD"+order.order_number}</Link></td>
        <td><span className={"dd-work-status-badge "+(order.status==="paid"||order.status==="completed"?"good":order.status==="cancelled"||order.status==="refunded"?"bad":"warn")}>{orderStatuses[locale]?.[order.status]||order.status||"—"}</span></td>
        <td>{order.occasion_type||"—"}</td><td>{order.delivery_area||"—"}</td>
        <td dir="ltr">{money(order.grand_total,order.currency,locale)}</td><td>{shortDate(order.created_at,locale)}</td>
       </tr>)}</tbody>
      </table></div>:<p className="dd-work-empty dd-work-parity-empty">{t.emptyOrders}</p>}
    </Panel>}
    {owner&&<div className="dd-work-dual-panels">
     {perms.has("approvals.review")&&<Panel title={t.pendingApprovals} href={pathFor("staffApprovals",locale)} hrefLabel={t.openApprovals}>
       {result.approvals.length?<div className="dd-work-table-scroll"><table>
        <thead><tr><th>{t.item}</th><th>{t.partner}</th><th>{t.price}</th><th>{t.sent}</th></tr></thead>
        <tbody>{result.approvals.map(v=><tr key={v.id}>
         <td>{ar?v.name_ar||v.name_en||"—":v.name_en||v.name_ar||"—"}</td>
         <td>{ar?v.partnerName?.name_ar||v.partnerName?.name_en||"—":v.partnerName?.name_en||v.partnerName?.name_ar||"—"}</td>
         <td dir="ltr">{money(v.price,v.currency,locale)}</td>
         <td>{shortDate(v.submitted_at||v.created_at,locale)}</td>
        </tr>)}</tbody>
       </table></div>:<p className="dd-work-empty dd-work-parity-empty">{t.emptyApprovals}</p>}
      </Panel>}
     {perms.has("finance.view")&&<Panel title={t.financeTitle} external href="https://dear-day.com/Dear-Day-Finance.html" hrefLabel={t.openFinance}>
       <div className="dd-work-finance-summary">
        {[["draft",t.draft],["approved",t.approved],["paid",t.paid],["unsettled",t.unsettled]].map(([key,label])=>
         <div className="dd-work-finance-box" key={key}><span>{label}</span>
          <strong dir="ltr">{money(result.stats[key]??null,"EGP",locale)}</strong>
         </div>)}
       </div>
      </Panel>}
    </div>}
    {accountant&&perms.has("finance.view")&&<Panel title={t.latestSettlements} external href="https://dear-day.com/Dear-Day-Finance.html" hrefLabel={t.openFinance}>
     {result.settlements.length?<div className="dd-work-table-scroll"><table>
      <thead><tr><th>{t.partner}</th><th>{t.period}</th><th>Partner Net</th><th>{t.status}</th><th>{t.reference}</th></tr></thead>
      <tbody>{result.settlements.map(s=><tr key={s.id}>
       <td>{ar?s.partnerName?.name_ar||s.partnerName?.name_en||"—":s.partnerName?.name_en||s.partnerName?.name_ar||"—"}</td>
       <td>{s.period_start||"—"} — {s.period_end||"—"}</td>
       <td dir="ltr">{money(s.partner_net,"EGP",locale)}</td><td>{s.status}</td><td dir="ltr">{s.payment_reference||"—"}</td>
      </tr>)}</tbody></table></div>:<p className="dd-work-empty dd-work-parity-empty">{t.emptySettlements}</p>}
    </Panel>}
    {!owner&&!accountant&&<Panel title={t.workAreas}>
     <div className="dd-work-links dd-work-parity-links">
      {modules.map(mod=>mod.legacy?
       <a key={mod.id} href={"https://dear-day.com/"+mod.legacy} target="_blank" rel="noopener noreferrer">{ar?mod.ar:mod.en} ↗</a>:
       <Link key={mod.id} href={pathFor(mod.route,locale)}>{ar?mod.ar:mod.en}</Link>)}
     </div>
    </Panel>}
    <p className="dd-work-notice">{t.permissionNote}</p>
    {modules.some(m=>m.legacy)&&<p className="dd-work-notice">{t.oldNotice}</p>}
   </>}
  </div>
 </main>;
}
