"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {useEffect,useMemo,useRef,useState} from "react";
import {authClient,EMPLOYEE_ROLES,rememberPreference} from "../lib/auth-client";
import {pathFor,alternatePath} from "../lib/locales";
import {useAuthSession} from "./auth-session-provider";
import {staffAdminVisibleModules} from "../lib/staff-admin-navigation";

const words={
 ar:{
  panel:"لوحة الإدارة",staff:"بوابة الفريق",finance:"بوابة المالية",
  visit:"عرض الموقع",language:"English",logout:"تسجيل الخروج",loggingOut:"جاري تسجيل الخروج…",
  menu:"فتح قائمة الإدارة",close:"إغلاق قائمة الإدارة",nav:"أقسام الإدارة",external:"الصفحة على الموقع القديم (تفتح في نافذة جديدة)",
  pending:"جاري تحميل الصلاحيات…",error:"تعذر تحميل قائمة الأقسام. حدّث الصفحة.",
  role:"الدور",failed:"تعذر تسجيل الخروج.",guest:"تسجيل الدخول",signin:"تسجيل الدخول",
  recovery:"التحقق من الحساب",label:"Dear Day · الإدارة"
 },
 en:{
  panel:"Admin Panel",staff:"Staff Portal",finance:"Finance Portal",
  visit:"View Website",language:"العربية",logout:"Log out",loggingOut:"Signing out…",
  menu:"Open admin menu",close:"Close admin menu",nav:"Administration sections",external:"Original-site module (opens in a new tab)",
  pending:"Loading permissions…",error:"Couldn't load the module list. Refresh the page.",
  role:"Role",failed:"Couldn't sign out.",guest:"Log in",signin:"Log in",
  recovery:"Verify account",label:"Dear Day · Administration"
 }
};
export default function StaffAdminShell({children,locale="ar"}){
 const t=words[locale]||words.ar;
 const session=useAuthSession();
 const pathname=usePathname()||pathFor("staffPortal",locale);
 const [open,setOpen]=useState(false);
 const [permissions,setPermissions]=useState([]);
 const [state,setState]=useState("loading");
 const [signoutBusy,setSignoutBusy]=useState(false);
 const [signoutError,setSignoutError]=useState(false);
 const request=useRef(0);
 const staff=session.status==="authenticated"&&EMPLOYEE_ROLES.has(session.role);
 const id=staff?session.user?.id:null;
 const client=useMemo(()=>typeof window==="undefined"?null:authClient(rememberPreference()),[]);
 useEffect(()=>{setOpen(false);},[pathname]);
 useEffect(()=>{
  const current=++request.current;
  if(!id||!client){setPermissions([]);setState("loading");return;}
  setPermissions([]);setState("loading");
  (async()=>{
   try{
    const result=await client.rpc("get_my_permissions");
    if(result.error)throw result.error;
    if(current!==request.current)return;
    setPermissions((result.data||[]).map(row=>row.permission_code));
    setState("ready");
   }catch{
    if(current!==request.current)return;
    setPermissions([]);setState("error");
   }
  })();
  return()=>{request.current++;};
 },[id,client]);
 useEffect(()=>{
  if(!open)return;
  function escape(e){if(e.key==="Escape")setOpen(false);}
  window.addEventListener("keydown",escape);
  return()=>window.removeEventListener("keydown",escape);
 },[open]);
 const modules=staff&&state==="ready"?staffAdminVisibleModules(permissions,session.role):[];
 const title=session.role==="super_admin"||session.role==="admin"?t.panel:session.role==="accountant"?t.finance:t.staff;
 const current=pathname.replace(/\/$/,"")||"/";
 async function signOut(){
  if(signoutBusy)return;
  setSignoutError(false);setSignoutBusy(true);
  try{
   await session.signOut();
   window.location.assign(pathFor("auth",locale));
  }catch{setSignoutError(true);setSignoutBusy(false);}
 }
 return <div className="dd-admin-shell" dir={locale==="ar"?"rtl":"ltr"}>
  {open&&<button type="button" className="dd-admin-mobile-backdrop" aria-label={t.close} onClick={()=>setOpen(false)}/>}
  <aside className={"dd-admin-sidebar"+(open?" is-open":"")} aria-label={t.nav}>
   <div className="dd-admin-side-brand">
    <div className="dd-admin-brand-copy"><strong>Dear Day</strong><span>{title}</span></div>
    <button type="button" className="dd-admin-menu-close" onClick={()=>setOpen(false)} aria-label={t.close}>×</button>
   </div>
   <nav className="dd-admin-side-nav" aria-label={t.nav}>
    {staff&&state==="loading"&&<p className="dd-admin-side-status" role="status">{t.pending}</p>}
    {staff&&state==="error"&&<p className="dd-admin-side-status" role="alert">{t.error}</p>}
    {modules.map(mod=>{
     const href=mod.legacy?"https://dear-day.com/"+mod.legacy:pathFor(mod.route,locale);
     const active=!mod.legacy&&current===(href.replace(/\/$/,"")||"/");
     return mod.legacy?
      <a key={mod.id} href={href} target="_blank" rel="noopener noreferrer" title={t.external}
       className="dd-admin-side-link is-legacy">
       <span>{locale==="ar"?mod.ar:mod.en}</span><span className="dd-admin-external-icon" aria-label={t.external}>↗</span>
      </a>:
      <Link key={mod.id} href={href} onClick={()=>setOpen(false)}
       aria-current={active?"page":undefined} className={"dd-admin-side-link"+(active?" is-active":"")}>
       <span>{locale==="ar"?mod.ar:mod.en}</span>
      </Link>;
    })}
    {!staff&&<Link href={pathFor("auth",locale)} className="dd-admin-side-link">{t.signin}</Link>}
    {session.status==="mfa_setup_required"&&
      <Link href={pathFor("security",locale)} className="dd-admin-side-link">{t.recovery}</Link>}
   </nav>
   <div className="dd-admin-sidebar-foot">
    {staff&&<p title={session.user?.email||""} dir="ltr">{session.user?.email||"—"}</p>}
    {staff&&<span className="dd-admin-role-label">{t.role}: {String(session.role||"").replaceAll("_"," ")}</span>}
    {staff&&<button type="button" disabled={signoutBusy} className="dd-admin-logout" onClick={signOut}>
     {signoutBusy?t.loggingOut:t.logout}
    </button>}
    {signoutError&&<p className="dd-admin-side-error" role="alert">{t.failed}</p>}
   </div>
  </aside>
  <div className="dd-admin-main">
   <header className="dd-admin-topbar">
    <button type="button" className="dd-admin-menu-trigger" aria-label={open?t.close:t.menu}
     aria-expanded={open} onClick={()=>setOpen(x=>!x)}>
     <span/><span/><span/>
    </button>
    <a className="dd-admin-site-link" href={pathFor("home",locale)} target="_blank" rel="noopener noreferrer">{t.visit} ↗</a>
    <div className="dd-admin-top-spacer"/>
    <span className="dd-admin-top-role">{title}</span>
    <Link href={alternatePath(pathname,locale)} className="dd-admin-lang-link">{t.language}</Link>
   </header>
   <div className="dd-admin-main-content">{children}</div>
  </div>
 </div>;
}
