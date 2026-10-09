"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {authClient,EMPLOYEE_ROLES,rememberPreference} from "../lib/auth-client";
import {useAuthSession} from "./auth-session-provider";
import {pathFor} from "../lib/locales";

const words={
 ar:{
  title:"بوابة فريق Dear Day",subtitle:"مركز متابعة العمليات — البيانات والصلاحيات من حسابك الفعلي.",
  signIn:"تسجيل الدخول",setup:"تفعيل التحقق بخطوتين",challenge:"إكمال التحقق بخطوتين",
  noAccess:"الصفحة مخصصة لموظفي Dear Day النشطين فقط.",
  inactive:"الحساب غير نشط أو لا يمكن التحقق منه حاليًا.",
  load:"جاري التحقق من الصلاحيات وتحميل لوحة التحكم…",failed:"تعذر تحميل لوحة التحكم. جرّب مرة أخرى.",
  noDashboard:"حسابك لا يملك صلاحية عرض لوحة التحكم.",reload:"تحديث البيانات",
  stats:"نظرة عامة",orders:"إجمالي الطلبات",open:"طلبات مفتوحة",customers:"حسابات العملاء",
  partners:"شركاء نشطون",approvals:"موافقات معلّقة",settlements:"تسويات مسوّدة",
  latest:"أحدث الطلبات",noOrders:"لا توجد طلبات لعرضها.",number:"رقم الطلب",status:"الحالة",
  occasion:"المناسبة",total:"الإجمالي",date:"التاريخ",limited:"بعض البيانات لم تُحمّل؛ باقي اللوحة متاح حسب صلاحيات حسابك.",
  navigation:"أقسام العمل",now:"متاح على React",old:"متاح مؤقتًا على الموقع القديم",
  note:"الأقسام التي لم ننقلها بعد تفتح الموقع القديم وتحتاج تسجيل دخول منفصل. لا يتم مشاركة جلسة React بين النطاقين.",
  security:"أمان الحساب",permissions:"الموظفون والصلاحيات",website:"عرض موقع Dear Day",
  role:"دور الحساب",email:"بريد الموظف",source:"يتم التحقق من الصلاحيات على سيرفر Supabase لكل عملية؛ القائمة ليست وسيلة لمنح صلاحيات.",
  directory:"العملاء",catalog:"المنتجات والخدمات",partnerMenu:"الشركاء",review:"الموافقات",
  financial:"المالية والتسويات",ordersMenu:"الطلبات",availability:"التوفر والمواعيد",
  cancellations:"الإلغاءات والاستردادات",support:"رسائل العملاء",overview:"لوحة التحكم",
  emptySections:"ليس لهذا الحساب أي أقسام إضافية متاحة.",back:"بوابة الوصول",
  denied:"هذه الإحصائية غير متاحة لهذا الدور."
 },
 en:{
  title:"Dear Day Staff Workspace",subtitle:"Operations overview — data and permissions are tied to your actual account.",
  signIn:"Log in",setup:"Set up two-step verification",challenge:"Complete two-step verification",
  noAccess:"This workspace is for active Dear Day employees only.",
  inactive:"This account is inactive or its access cannot currently be verified.",
  load:"Checking permissions and loading your workspace…",failed:"Couldn't load the workspace. Please try again.",
  noDashboard:"Your account does not have permission to view the dashboard.",reload:"Refresh data",
  stats:"Overview",orders:"All orders",open:"Open orders",customers:"Customer accounts",
  partners:"Active partners",approvals:"Pending approvals",settlements:"Draft settlements",
  latest:"Recent orders",noOrders:"No orders to display.",number:"Order",status:"Status",
  occasion:"Occasion",total:"Total",date:"Date",limited:"Some data could not be loaded; the rest is shown according to your permissions.",
  navigation:"Work areas",now:"Available in React",old:"Temporarily on the old website",
  note:"Sections not migrated yet open the old website and may require a separate sign-in. React sessions are not transferred between domains.",
  security:"Account security",permissions:"Staff access & permissions",website:"View Dear Day website",
  role:"Account role",email:"Staff email",source:"Every action is authorized by Supabase server-side. This menu does not grant permissions.",
  directory:"Customers",catalog:"Products & services",partnerMenu:"Partners",review:"Approvals",
  financial:"Finance & settlements",ordersMenu:"Orders",availability:"Availability",
  cancellations:"Cancellations & refunds",support:"Customer messages",overview:"Dashboard",
  emptySections:"No other work areas are available for this account.",back:"Access hub",
  denied:"This metric is unavailable for this role."
 }
};
const OPEN=["draft","pending_payment","paid","confirmed","in_progress"];
const statusNames={
 ar:{draft:"مسودة",pending_payment:"بانتظار الدفع",paid:"مدفوع",confirmed:"مؤكد",in_progress:"قيد التنفيذ",completed:"مكتمل",cancelled:"ملغي",refunded:"مسترد"},
 en:{draft:"Draft",pending_payment:"Pending payment",paid:"Paid",confirmed:"Confirmed",in_progress:"In progress",completed:"Completed",cancelled:"Cancelled",refunded:"Refunded"}
};
const oldModules=[




 {id:"financial",p:["finance.view"],path:"Dear-Day-Finance.html"},

 {id:"availability",p:["availability.view"],path:"Dear-Day-Admin-Availability.html"},
 {id:"cancellations",p:["orders.manage"],path:"Dear-Day-Admin-Cancellations.html"},

];
function amount(value,currency,locale){
 try{return new Intl.NumberFormat(locale==="ar"?"ar-EG":"en-EG",{style:"currency",currency:currency||"EGP",maximumFractionDigits:2}).format(Number(value||0));}
 catch{return String(value||0)+" EGP";}
}
function shortDate(value,locale){
 if(!value)return "—";
 const d=new Date(value);
 return Number.isNaN(d.getTime())?"—":new Intl.DateTimeFormat(locale==="ar"?"ar-EG":"en-GB",{day:"numeric",month:"short",year:"numeric"}).format(d);
}
async function count(client,table,filter){
 let q=client.from(table).select("id",{count:"exact",head:true});
 if(filter)q=filter(q);
 const result=await q;
 if(result.error)throw result.error;
 return result.count;
}
export default function StaffWorkspace({locale="ar"}){
 const t=words[locale]||words.ar;
 const session=useAuthSession();
 const valid=session.status==="authenticated"&&EMPLOYEE_ROLES.has(session.role);
 const client=useMemo(()=>typeof window==="undefined"?null:authClient(rememberPreference()),[]);
 const [revision,setRevision]=useState(0);
 const [result,setResult]=useState({stage:"loading",id:null,permissions:[],stats:{},orders:[],warning:false});
 const id=valid?session.user?.id:null;
 useEffect(()=>{
  let alive=true;
  if(!valid||!client||!id){
   setResult({stage:"loading",id:null,permissions:[],stats:{},orders:[],warning:false});
   return()=>{alive=false;};
  }
  setResult({stage:"loading",id,permissions:[],stats:{},orders:[],warning:false});
  (async()=>{
   try{
    const permsResult=await client.rpc("get_my_permissions");
    if(permsResult.error)throw permsResult.error;
    if(!alive)return;
    const permissions=[...new Set((permsResult.data||[]).map(x=>x.permission_code))];
    if(!permissions.includes("dashboard.view")){
     setResult({stage:"forbidden",id,permissions,stats:{},orders:[],warning:false});
     return;
    }
    const permitted=new Set(permissions),tasks=[];
    if(permitted.has("orders.view")){
     tasks.push(["orders",()=>count(client,"orders")]);
     tasks.push(["open",()=>count(client,"orders",q=>q.in("status",OPEN))]);
     tasks.push(["recent",async()=>{
      const r=await client.from("orders").select("id,order_number,status,occasion_type,grand_total,currency,created_at")
       .order("created_at",{ascending:false}).limit(7);
      if(r.error)throw r.error;
      return r.data||[];
     }]);
    }
    if(permitted.has("customers.view"))tasks.push(["customers",()=>count(client,"profiles",q=>q.eq("role","customer"))]);
    if(permitted.has("partners.view"))tasks.push(["partners",()=>count(client,"partners",q=>q.eq("status","active"))]);
    if(permitted.has("approvals.review"))tasks.push(["approvals",()=>count(client,"listing_versions",q=>q.eq("status","pending_review"))]);
    if(permitted.has("finance.view"))tasks.push(["settlements",()=>count(client,"partner_settlements",q=>q.eq("status","draft"))]);
    const settled=await Promise.allSettled(tasks.map(async([key,fn])=>({key,value:await fn()})));
    if(!alive)return;
    const stats={},orders=[],warning=settled.some(x=>x.status==="rejected");
    let recent=[];
    settled.forEach(x=>{
     if(x.status!=="fulfilled")return;
     if(x.value.key==="recent")recent=x.value.value;
     else stats[x.value.key]=x.value.value;
    });
    setResult({stage:"ready",id,permissions,stats,orders:recent,warning});
   }catch{
    if(alive)setResult({stage:"error",id,permissions:[],stats:{},orders:[],warning:false});
   }
  })();
  return()=>{alive=false;};
 },[valid,client,id,revision]);
 const signin=pathFor("auth",locale);
 const secure=pathFor("security",locale);
 const work=pathFor("staffPortal",locale);
 const a=session.status;
 const gate=a==="mfa_setup_required"?{text:t.setup,href:secure}:a==="mfa_required"?{text:t.challenge,href:signin+"?mode=mfa"}:
  a==="signed_out"?{text:t.signIn,href:signin+"?next="+encodeURIComponent(work)}:null;
 const perms=new Set(result.permissions);
 const metrics=[
  {id:"orders",p:"orders.view",label:t.orders},
  {id:"open",p:"orders.view",label:t.open},
  {id:"customers",p:"customers.view",label:t.customers},
  {id:"partners",p:"partners.view",label:t.partners},
  {id:"approvals",p:"approvals.review",label:t.approvals},
  {id:"settlements",p:"finance.view",label:t.settlements}
 ].filter(x=>perms.has(x.p));
 const modules=oldModules.filter(x=>x.p.some(p=>perms.has(p)));
 return <main id="main-content" className="dd-staff-workspace" dir={locale==="ar"?"rtl":"ltr"}>
  <div className="dd-work-wrap">
   <header className="dd-work-heading">
    <div>
     <p className="dd-work-eyebrow">Dear Day · {t.overview}</p>
     <h1>{t.title}</h1>
     <p>{t.subtitle}</p>
    </div>
    <Link href={pathFor("home",locale)} className="dd-work-outline">{t.website} ↗</Link>
   </header>
   {!valid?<section className="dd-work-panel dd-work-guard" role="status">
    <p>{a==="loading"?t.load:gate? (a==="mfa_required"?t.challenge:a==="mfa_setup_required"?t.setup:t.noAccess):
       a==="inactive"||a==="error"?t.inactive:t.noAccess}</p>
    {gate&&<Link href={gate.href} className="dd-work-primary">{gate.text}</Link>}
   </section>:result.id!==id||result.stage==="loading"?<section className="dd-work-panel dd-work-guard" role="status">{t.load}</section>:
   result.stage==="error"?<section className="dd-work-panel dd-work-guard" role="alert">
    <p>{t.failed}</p><button type="button" onClick={()=>setRevision(n=>n+1)} className="dd-work-primary">{t.reload}</button>
   </section>:result.stage==="forbidden"?<section className="dd-work-panel dd-work-guard">
    <p>{t.noDashboard}</p><Link className="dd-work-outline" href={pathFor("access",locale)}>{t.back}</Link>
   </section>:<>
    <section className="dd-work-identity" aria-label={t.role}>
      <span>{t.role}: <strong>{session.role.replaceAll("_"," ")}</strong></span>
      <span>{t.email}: <strong dir="ltr">{session.user?.email||"—"}</strong></span>
      <button type="button" onClick={()=>setRevision(n=>n+1)} className="dd-work-outline">{t.reload}</button>
    </section>
    {metrics.length>0&&<section aria-labelledby="dd-work-overview">
     <h2 id="dd-work-overview" className="dd-work-section-title">{t.stats}</h2>
     <div className="dd-work-metrics">{metrics.map(x=><article className="dd-work-stat" key={x.id}>
       <span>{x.label}</span><strong>{result.stats[x.id]===undefined?"—":new Intl.NumberFormat(locale==="ar"?"ar-EG":"en-US").format(result.stats[x.id])}</strong>
     </article>)}</div>
    </section>}
    {result.warning&&<p className="dd-work-warning" role="status">{t.limited}</p>}
    {perms.has("orders.view")&&<section className="dd-work-panel" aria-labelledby="dd-work-orders">
      <h2 id="dd-work-orders" className="dd-work-section-title">{t.latest}</h2>
      {result.orders.length?<div className="dd-work-table-scroll"><table>
       <thead><tr><th>{t.number}</th><th>{t.status}</th><th>{t.occasion}</th><th>{t.total}</th><th>{t.date}</th></tr></thead>
       <tbody>{result.orders.map(order=><tr key={order.id}>
        <td dir="ltr"><Link href={pathFor("staffOrders",locale)}>{order.order_number===null?"—":"#DD"+order.order_number}</Link></td>
        <td>{statusNames[locale]?.[order.status]||order.status||"—"}</td><td>{order.occasion_type||"—"}</td>
        <td dir="ltr">{amount(order.grand_total,order.currency,locale)}</td><td>{shortDate(order.created_at,locale)}</td>
       </tr>)}</tbody>
      </table></div>:<p className="dd-work-empty">{result.stats.orders===undefined?t.limited:t.noOrders}</p>}
    </section>}
    <section className="dd-work-panel" aria-labelledby="dd-work-nav">
     <h2 id="dd-work-nav" className="dd-work-section-title">{t.navigation}</h2>
     <p className="dd-work-stage">{t.now}</p>
     <div className="dd-work-links">
       <Link href={work}>{t.overview}</Link>
       <Link href={secure}>{t.security}</Link>
       {perms.has("orders.view")&&<Link href={pathFor("staffOrders",locale)}>{t.ordersMenu}</Link>}
       {(perms.has("catalog.view")||perms.has("catalog.manage"))&&<Link href={pathFor("staffCatalog",locale)}>{t.catalog}</Link>}
       {perms.has("approvals.review")&&<Link href={pathFor("staffApprovals",locale)}>{t.review}</Link>}
       {(perms.has("partners.view")||perms.has("partners.manage"))&&<Link href={pathFor("staffPartners",locale)}>{t.partnerMenu}</Link>}
       {perms.has("customers.view")&&<Link href={pathFor("staffCustomers",locale)}>{t.directory}</Link>}
       {perms.has("customers.view")&&<Link href={pathFor("staffSupport",locale)}>{t.support}</Link>}
       {(perms.has("employees.view")||perms.has("employees.manage"))&&
        <Link href={pathFor("staffPermissions",locale)}>{t.permissions}</Link>}
     </div>
     <p className="dd-work-stage">{t.old}</p>
     {modules.length?<div className="dd-work-links">
       {modules.map(m=><a key={m.id} href={"https://dear-day.com/"+m.path} target="_blank" rel="noopener noreferrer">
         {t[m.id]} <span aria-hidden="true">↗</span>
       </a>)}
     </div>:<p className="dd-work-empty">{t.emptySections}</p>}
     <p className="dd-work-notice">{t.note}</p>
     <p className="dd-work-notice">{t.source}</p>
    </section>
   </>}
  </div>
 </main>;
}
