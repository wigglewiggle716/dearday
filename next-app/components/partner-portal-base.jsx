"use client";
import Link from "next/link";
import {createContext,useContext,useEffect,useMemo,useState} from "react";
import {usePathname} from "next/navigation";
import {authClient,rememberPreference,readCurrentAccount} from "../lib/auth-client";
import {useAuthSession} from "./auth-session-provider";
import {pathFor,alternatePath} from "../lib/locales";

const PortalContext=createContext(null);
export function usePartnerPortal(){const ctx=useContext(PortalContext);if(!ctx)throw Error("PartnerPortalProvider required");return ctx;}
export function usePartnerPortalOptional(){return useContext(PortalContext);}
const labels={
 ar:{
  title:"لوحة التحكم",pick:"حسابي",loading:"جاري فتح لوحة التحكم…",
  denied:"لوحة التحكم متاحة للحسابات التجارية النشطة فقط.",error:"تعذر تحميل بيانات حسابك.",
  login:"تسجيل الدخول",refresh:"تحديث",signout:"تسجيل الخروج",summary:"نظرة سريعة على طلباتك ومنتجاتك ومواعيدك.",
  active:"نشط",lang:"English",nav:"أقسام حسابي",menu:"فتح القائمة",close:"إغلاق القائمة",
  overview:"نظرة عامة",orders:"طلباتي",products:"منتجاتي وخدماتي",
  availability:"التوفر والمواعيد",policies:"سياسات الإلغاء والاسترداد",
  cancellations:"الإلغاءات والاسترداد",notifications:"الإشعارات",
  quickAvailability:"إدارة التوفر",viewSite:"عرض الموقع"
 },
 en:{
  title:"My Dashboard",pick:"My business",loading:"Opening your dashboard…",
  denied:"This dashboard is available to active business accounts only.",error:"Couldn't load your account details.",
  login:"Log in",refresh:"Refresh",signout:"Sign out",summary:"Your orders, catalog and availability at a glance.",
  active:"Active",lang:"العربية",nav:"My workspace",menu:"Open menu",close:"Close menu",
  overview:"Overview",orders:"My Orders",products:"My Products & Services",
  availability:"Availability & Schedule",policies:"Cancellation & Refund Policies",
  cancellations:"Cancellations & Refunds",notifications:"Notifications",
  quickAvailability:"Manage Availability",viewSite:"View Website"
 }
};
const nav=[["partnerPortal","overview"],["partnerOrders","orders"],["partnerProducts","products"],["partnerAvailability","availability"],["partnerPolicies","policies"],["partnerCancellations","cancellations"],["notifications","notifications"]];
export function PartnerPortalProvider({locale="ar",children}){
 const session=useAuthSession();
 const pathname=usePathname()||pathFor("partnerPortal",locale);
 const client=useMemo(()=>typeof window==="undefined"?null:authClient(rememberPreference()),[]);
 const [data,setData]=useState({stage:"loading",partners:[],members:[]}),[selected,setSelected]=useState(""),[version,setVersion]=useState(0);
 const [busy,setBusy]=useState(false),[menu,setMenu]=useState(false);
 const active=session.status==="authenticated"&&session.role==="partner_user";
 const uid=active?session.user?.id:null;
 const t=labels[locale]||labels.ar;
 useEffect(()=>{
  let live=true;
  if(!uid||!client){setData({stage:"denied",partners:[],members:[]});return;}
  setData({stage:"loading",partners:[],members:[]});
  (async()=>{
   try{
    const a=await readCurrentAccount(client);
    if(a.status!=="authenticated"||a.user?.id!==uid||a.role!=="partner_user")throw Error("account");
    const m=await client.from("partner_users").select("partner_id,partner_role,is_active").eq("user_id",uid).eq("is_active",true);
    if(m.error)throw m.error;
    const ids=[...new Set((m.data||[]).map(x=>x.partner_id))];
    if(!ids.length){if(live)setData({stage:"denied",partners:[],members:[]});return;}
    const p=await client.from("partners").select("id,name_ar,name_en,status").in("id",ids).eq("status","active");
    if(p.error)throw p.error;
    const rows=p.data||[];
    if(live){
     setData({stage:rows.length?"ready":"denied",partners:rows,members:m.data||[]});
     setSelected(old=>rows.some(x=>x.id===old)?old:rows[0]?.id||"");
    }
   }catch{if(live)setData({stage:"error",partners:[],members:[]});}
  })();
  return()=>{live=false;};
 },[uid,client,version]);
 const partner=data.partners.find(x=>x.id===selected)||null;
 const context=useMemo(()=>({client,session,locale,partner,partners:data.partners,member:data.members.find(x=>x.partner_id===selected),
  status:data.stage,refresh:()=>setVersion(n=>n+1)}),[client,session,locale,partner,data,selected]);
 async function logout(){
  if(busy)return;setBusy(true);
  try{await session.signOut();window.location.assign(pathFor("auth",locale));}
  finally{setBusy(false);}
 }
 const businessName=locale==="en"?partner?.name_en||partner?.name_ar:partner?.name_ar||partner?.name_en;
 return <PortalContext.Provider value={context}>
  <main className="dd-pp-main" id="main-content" dir={locale==="ar"?"rtl":"ltr"}>
   {!active?<div className="dd-pp-guard">
    <p>{session.status==="loading"?t.loading:t.denied}</p>
    <Link href={pathFor("auth",locale)+"?next="+encodeURIComponent(pathFor("partnerPortal",locale))}>{t.login}</Link>
   </div>:data.stage==="loading"?<div className="dd-pp-guard" role="status">{t.loading}</div>:
    data.stage!=="ready"?<div className="dd-pp-guard" role="alert">
     <p>{data.stage==="error"?t.error:t.denied}</p>
     <button type="button" onClick={()=>setVersion(v=>v+1)}>{t.refresh}</button>
    </div>:
    <div className="dd-pp-container">
     <aside className={"dd-pp-aside"+(menu?" dd-mobile-open":"")} aria-label={t.nav}>
      <div className="dd-pp-side-brand">
       <div><Link href={pathFor("partnerPortal",locale)} className="dd-pp-brand" onClick={()=>setMenu(false)}>Dear Day</Link>
        <span className="dd-pp-subtitle">{t.title}</span></div>
       <button type="button" className="dd-pp-mobile-toggle" onClick={()=>setMenu(v=>!v)}
        aria-expanded={menu} aria-label={menu?t.close:t.menu}><span/><span/><span/></button>
      </div>
      <nav className="dd-pp-side-nav" aria-label={t.nav}>
       {nav.map(([route,key])=>{
        const href=pathFor(route,locale),activeLink=pathname===href||pathname===href+"/";
        return <Link key={key} href={href} aria-current={activeLink?"page":undefined}
         className={activeLink?"is-active":""} onClick={()=>setMenu(false)}>{t[key]}</Link>;
       })}
      </nav>
      <div className="dd-pp-sidebar-foot">
       <p dir="auto">{session.user?.email||businessName||""}</p>
       <button type="button" className="dd-pp-logout" disabled={busy} onClick={logout}>{t.signout}</button>
      </div>
     </aside>
     <div className="dd-pp-main-column">
      <header className="dd-pp-topbar">
       <div className="dd-pp-topbar-text">
        <h1>{businessName||t.title}</h1>
        <p>{t.summary}</p>
       </div>
       <div className="dd-pp-quick-actions">
        {data.partners.length>1&&<label className="dd-pp-switcher">{t.pick}
         <select value={selected} onChange={e=>{setSelected(e.target.value);setMenu(false);}}>
          {data.partners.map(p=><option value={p.id} key={p.id}>{locale==="en"?p.name_en||p.name_ar:p.name_ar||p.name_en}</option>)}
         </select></label>}
        <Link href={pathFor("notifications",locale)}>{t.notifications}</Link>
        <Link href={pathFor("partnerOrders",locale)}>{t.orders}</Link>
        <Link href={pathFor("partnerProducts",locale)}>{t.products}</Link>
        <Link href={pathFor("partnerAvailability",locale)} className="is-primary">{t.quickAvailability}</Link>
        <button type="button" onClick={()=>setVersion(v=>v+1)}>{t.refresh}</button>
        <Link href={alternatePath(pathname,locale)} className="dd-pp-language">{t.lang}</Link>
        <span className="dd-pp-status">{t.active}</span>
       </div>
      </header>
      <div className="dd-pp-content">{children}</div>
     </div>
    </div>}
  </main>
 </PortalContext.Provider>;
}
export function PortalPage({locale="ar",children}){return <PartnerPortalProvider locale={locale}>{children}</PartnerPortalProvider>}
export function usePartnerMutations(){
 const {client,session,partner}=usePartnerPortal();
 return async function revalidate(){
  if(!client||!partner)throw Error("No active partner");
  const auth=await readCurrentAccount(client);
  if(auth.status!=="authenticated"||auth.role!=="partner_user"||auth.user?.id!==session.user?.id)throw Error("Session expired");
  const member=await client.from("partner_users").select("partner_id").eq("partner_id",partner.id).eq("user_id",auth.user.id).eq("is_active",true).maybeSingle();
  if(member.error||!member.data)throw Error("Partner membership inactive");
  const p=await client.from("partners").select("id,status").eq("id",partner.id).maybeSingle();
  if(p.error||p.data?.status!=="active")throw Error("Partner inactive");
  return partner.id;
 };
}
