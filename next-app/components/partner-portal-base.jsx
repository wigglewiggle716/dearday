"use client";
import Link from "next/link";
import {createContext,useContext,useEffect,useMemo,useState} from "react";
import {authClient,rememberPreference,readCurrentAccount} from "../lib/auth-client";
import {useAuthSession} from "./auth-session-provider";
import {pathFor} from "../lib/locales";

const PortalContext=createContext(null);
export function usePartnerPortal(){const ctx=useContext(PortalContext);if(!ctx)throw Error("PartnerPortalProvider required");return ctx;}
const labels={
 ar:{title:"بوابة الشريك",pick:"الشريك",loading:"جاري التحقق من حساب الشريك…",denied:"هذه البوابة مخصصة لحساب شريك نشط مرتبط ببراند فعّال.",error:"تعذر تحميل بيانات الشريك.",login:"تسجيل الدخول",refresh:"تحديث الحساب",signout:"تسجيل الخروج",
 overview:"نظرة عامة",orders:"طلباتي",products:"منتجاتي وخدماتي",availability:"التوفر والمواعيد",policies:"سياسات الاسترداد",cancellations:"الإلغاءات والاسترداد",notifications:"الإشعارات"},
 en:{title:"Partner Portal",pick:"Partner",loading:"Checking partner account…",denied:"An active partner membership is required to access this portal.",error:"Unable to load partner information.",login:"Log in",refresh:"Refresh account",signout:"Sign out",
 overview:"Overview",orders:"Orders",products:"Products & Services",availability:"Availability",policies:"Refund policies",cancellations:"Cancellations",notifications:"Notifications"}
};
const nav=[["partnerPortal","overview"],["partnerOrders","orders"],["partnerProducts","products"],["partnerAvailability","availability"],["partnerPolicies","policies"],["partnerCancellations","cancellations"],["notifications","notifications"]];
export function PartnerPortalProvider({locale="ar",children}){
 const session=useAuthSession();
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
 return <PortalContext.Provider value={context}>
  <main className="dd-pp-main" id="main-content" dir={locale==="ar"?"rtl":"ltr"}>
   <div className="dd-pp-container">
    <header className="dd-pp-top">
     <div><Link href={pathFor("home",locale)} className="dd-pp-brand">Dear Day</Link>
      <span className="dd-pp-subtitle">{t.title}</span></div>
     {data.stage==="ready"&&<div className="dd-pp-top-actions">
      {data.partners.length>1&&<label>{t.pick}<select value={selected} onChange={e=>setSelected(e.target.value)}>
       {data.partners.map(p=><option key={p.id} value={p.id}>{locale==="en"?p.name_en||p.name_ar:p.name_ar||p.name_en}</option>)}</select></label>}
      <button type="button" onClick={()=>setVersion(n=>n+1)}>{t.refresh}</button>
      <button type="button" disabled={busy} onClick={logout}>{t.signout}</button></div>}
    </header>
    {!active?<div className="dd-pp-guard"><p>{session.status==="loading"?t.loading:t.denied}</p><Link href={pathFor("auth",locale)+"?next="+encodeURIComponent(pathFor("partnerPortal",locale))}>{t.login}</Link></div>:
     data.stage==="loading"?<div role="status" className="dd-pp-guard">{t.loading}</div>:
     data.stage!=="ready"?<div role="alert" className="dd-pp-guard"><p>{data.stage==="error"?t.error:t.denied}</p><button type="button" onClick={()=>setVersion(n=>n+1)}>{t.refresh}</button></div>:<>
      <div className="dd-pp-body">
       <aside className="dd-pp-aside"><button type="button" className="dd-pp-mobile-toggle" aria-expanded={menu} onClick={()=>setMenu(v=>!v)}>{t.title} ☰</button>
        <nav className={menu?"open":""} aria-label={t.title}>{nav.map(([route,key])=>
         <Link onClick={()=>setMenu(false)} key={key} href={pathFor(route,locale)}>{t[key]}</Link>)}</nav></aside>
       <section className="dd-pp-content">
        <div className="dd-pp-partnername">{locale==="en"?partner?.name_en||partner?.name_ar:partner?.name_ar||partner?.name_en}</div>
        {children}
       </section>
      </div>
     </>}
   </div>
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
