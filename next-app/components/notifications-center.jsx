"use client";
import Link from "next/link";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {authClient,rememberPreference,readCurrentAccount,EMPLOYEE_ROLES} from "../lib/auth-client";
import {useAuthSession} from "./auth-session-provider";
import {pathFor} from "../lib/locales";

const text={
 ar:{title:"الإشعارات",intro:"رسائل النظام الخاصة بحسابك فقط",back:"الرجوع للوحة التحكم",refresh:"تحديث",allRead:"تحديد الكل كمقروء",unread:"غير مقروء",all:"الكل",empty:"لا توجد إشعارات هنا.",loading:"جاري تحميل الإشعارات…",error:"تعذر تحميل الإشعارات.",denied:"سجّل دخولك لعرض إشعارات حسابك.",login:"تسجيل الدخول",count:"إشعار",read:"تمت القراءة",more:"تحميل المزيد",busy:"جاري الحفظ…",open:"فتح التفاصيل"},
 en:{title:"Notifications",intro:"Account-specific system updates",back:"Back to workspace",refresh:"Refresh",allRead:"Mark all read",unread:"Unread",all:"All",empty:"No notifications yet.",loading:"Loading notifications…",error:"Could not load notifications.",denied:"Log in to view your own notifications.",login:"Log in",count:"notifications",read:"Read",more:"Load more",busy:"Saving…",open:"Open details"}
};
const FIELDS="id,recipient_user_id,kind,title_ar,title_en,body_ar,body_en,entity_type,entity_id,is_read,created_at";
const PAGE_SIZE=30;
function targetOf(n,locale,role){
 if(n.entity_type==="partner_application"&&EMPLOYEE_ROLES.has(role))return pathFor("staffPartners",locale);
 if(n.entity_type==="support_ticket"&&EMPLOYEE_ROLES.has(role))return pathFor("staffSupport",locale);
 if(n.entity_type==="account_deletion_request"&&role==="super_admin")return pathFor("staffCustomers",locale);
 if(n.entity_type==="partner_order"&&role==="partner_user")return pathFor("partnerOrders",locale);
 if(n.entity_type==="order"&&EMPLOYEE_ROLES.has(role))return pathFor("staffOrders",locale);
 if(n.entity_type==="order"&&role==="customer")return pathFor("bookings",locale);
 if(n.entity_type==="listing"&&role==="partner_user")return pathFor("partnerProducts",locale);
 if(n.entity_type==="listing"&&EMPLOYEE_ROLES.has(role))return pathFor("staffCatalog",locale);
 if(n.entity_type==="refund_policy"&&role==="partner_user")return pathFor("partnerPolicies",locale);
 if(n.entity_type==="refund_policy"&&EMPLOYEE_ROLES.has(role))return pathFor("staffRefundPolicies",locale);
 if(n.entity_type==="cancellation_request"&&role==="partner_user")return pathFor("partnerCancellations",locale);
 if(n.entity_type==="cancellation_request"&&EMPLOYEE_ROLES.has(role))return pathFor("staffCancellations",locale);
 return null;
}
export default function NotificationsCenter({locale="ar"}){
 const t=text[locale]||text.ar,session=useAuthSession();
 const uid=session.status==="authenticated"?session.user?.id:null;
 const client=useMemo(()=>typeof window==="undefined"?null:authClient(rememberPreference()),[]);
 const [state,setState]=useState({status:"loading",rows:[],hasMore:false});
 const [onlyUnread,setOnlyUnread]=useState(false),[limit,setLimit]=useState(PAGE_SIZE);
 const [revision,setRevision]=useState(0),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const req=useRef(0);
 const reload=useCallback(()=>setRevision(n=>n+1),[]);
 useEffect(()=>{
  const x=++req.current;
  if(!uid||!client){setState({status:"idle",rows:[],hasMore:false});return;}
  setState({status:"loading",rows:[],hasMore:false});
  (async()=>{
   try{
    const auth=await readCurrentAccount(client);
    if(auth.status!=="authenticated"||auth.user?.id!==uid)throw Error("session");
    // recipient_user_id is enforced by notifications_self_read RLS.
    const r=await client.from("notifications").select(FIELDS)
      .eq("recipient_user_id",uid).order("created_at",{ascending:false}).limit(limit+1);
    if(r.error)throw r.error;
    if(x===req.current)setState({status:"ready",rows:(r.data||[]).slice(0,limit),hasMore:(r.data||[]).length>limit});
   }catch{if(x===req.current)setState({status:"error",rows:[],hasMore:false});}
  })();
  return()=>{req.current++;};
 },[uid,client,revision,limit]);
 async function markOne(n){
  if(!uid||busy||!client)return false;
  if(n.is_read)return true;
  setBusy(true);setMessage("");
  try{
   const auth=await readCurrentAccount(client);
   if(auth.status!=="authenticated"||auth.user?.id!==uid)throw Error("session");
   const r=await client.rpc("mark_notification_read",{p_notification_id:n.id});
   if(r.error||r.data!==true)throw r.error||Error("missing");
   setState(s=>({...s,rows:s.rows.map(x=>x.id===n.id?{...x,is_read:true}:x)}));return true;
  }catch{setMessage(t.error);return false;}finally{setBusy(false);}
 }
 async function markAll(){
  if(!uid||busy||!client)return;
  setBusy(true);setMessage("");
  try{
   const auth=await readCurrentAccount(client);
   if(auth.status!=="authenticated"||auth.user?.id!==uid)throw Error("session");
   const r=await client.rpc("mark_all_notifications_read");
   if(r.error)throw r.error;
   reload();
  }catch{setMessage(t.error);}finally{setBusy(false);}
 }
 function when(d){
  const v=new Date(d);return Number.isNaN(v.getTime())?"—":
   new Intl.DateTimeFormat(locale==="ar"?"ar-EG":"en-GB",{dateStyle:"medium",timeStyle:"short",timeZone:"Africa/Cairo"}).format(v);
 }
 const rows=state.rows.filter(n=>!onlyUnread||!n.is_read),unread=state.rows.filter(n=>!n.is_read).length;
 const back=EMPLOYEE_ROLES.has(session.role)?"staffPortal":session.role==="partner_user"?"partnerPortal":"account";
 return <main className="dd-notify-main" dir={locale==="ar"?"rtl":"ltr"} id="main-content">
  <div className="dd-notify-wrap">
   <header className="dd-notify-head"><div><Link href={pathFor(back,locale)}>← {t.back}</Link><h1>{t.title}</h1><p>{t.intro}</p></div>
    {state.status==="ready"&&<div className="dd-notify-actions">
     <button disabled={busy} onClick={markAll}>{busy?t.busy:t.allRead}</button><button onClick={reload}>{t.refresh}</button>
    </div>}
   </header>
   {session.status==="loading"||state.status==="loading"?<p role="status">{t.loading}</p>:
    !uid?<section className="dd-notify-empty"><p>{t.denied}</p><Link href={pathFor("auth",locale)+"?next="+encodeURIComponent(pathFor("notifications",locale))}>{t.login}</Link></section>:
    state.status==="error"?<p role="alert">{t.error}</p>:<>
     {message&&<p role="alert" className="dd-notify-error">{message}</p>}
     <nav className="dd-notify-filters" aria-label={t.title}>
      <button className={!onlyUnread?"active":""} aria-pressed={!onlyUnread} onClick={()=>setOnlyUnread(false)}>{t.all} ({state.rows.length})</button>
      <button className={onlyUnread?"active":""} aria-pressed={onlyUnread} onClick={()=>setOnlyUnread(true)}>{t.unread} ({unread})</button>
     </nav>
     {rows.length?<div className="dd-notify-list">{rows.map(n=>{
      const destination=targetOf(n,locale,session.role);
      const title=locale==="en"?n.title_en||n.title_ar:n.title_ar||n.title_en;
      const body=locale==="en"?n.body_en||n.body_ar:n.body_ar||n.body_en;
      return <article className={"dd-notify-card"+(n.is_read?"":" unread")} key={n.id}>
       <div><h2>{!n.is_read&&<span className="dd-notify-dot" aria-label={t.unread}/>} {title||"Dear Day"}</h2>
        <p>{body||""}</p><time>{when(n.created_at)}</time></div>
       <div className="dd-notify-card-actions">
        {!n.is_read&&<button disabled={busy} onClick={()=>markOne(n)}>{t.read}</button>}
        {destination&&<Link href={destination} onClick={()=>{if(!n.is_read)void markOne(n)}}>{t.open}</Link>}
       </div>
      </article>;
     })}</div>:<section className="dd-notify-empty">{t.empty}</section>}
     {state.hasMore&&<button className="dd-notify-more" onClick={()=>setLimit(n=>n+PAGE_SIZE)}>{t.more}</button>}
    </>}
  </div>
 </main>;
}
