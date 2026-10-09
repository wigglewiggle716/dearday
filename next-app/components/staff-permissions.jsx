"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {authClient,EMPLOYEE_ROLES,rememberPreference} from "../lib/auth-client";
import {useAuthSession} from "./auth-session-provider";
import {pathFor} from "../lib/locales";

const roles=["super_admin","admin","operations","accountant","partner_manager","customer_support","marketing","content_admin"];
const words={
 ar:{
 title:"صلاحيات الفريق",intro:"الصلاحيات الفعلية جاية من Supabase، وبتتراجع على السيرفر في كل عملية.",
 login:"تسجيل الدخول",verify:"إكمال التحقق بخطوتين",restricted:"الصفحة لموظفي Dear Day النشطين.",
 loading:"جاري تحميل الصلاحيات…",failed:"تعذر تحميل الصلاحيات. جرّب مرة تانية.",
 own:"صلاحياتي الحالية",none:"مفيش صلاحيات إدارية متاحة لهذا الحساب.",
 roster:"حسابات الموظفين",noRoster:"مفيش صلاحية لعرض بيانات باقي الموظفين.",
 name:"الاسم",email:"الإيميل",role:"الدور",state:"حالة الحساب",active:"نشط",inactive:"موقوف",
 edit:"تعديل صلاحيات الموظف",changes:"حفظ الدور وحالة الحساب",close:"إغلاق",
 overrides:"الاستثناءات الفردية",inherit:"حسب الدور",allow:"سماح",deny:"منع",
 inherited:"صلاحية الدور",saving:"جاري الحفظ…",done:"تم تحديث الصلاحيات.",
 confirm:"تأكيد تعديل صلاحيات هذا الموظف؟ التعديل بيأثر على حساب حقيقي في Supabase.",
 actionWarn:"تأكيد تغيير الصلاحية المحددة لهذا الموظف؟",
 prevented:"تغيير صلاحيات حسابك أنت من الشاشة دي غير متاح.",
 failedAction:"فشل تعديل الصلاحيات. قد تكون تغييرات أخرى محفوظة؛ حدّث القائمة وراجع الحالة.",
 superOnly:"تعديل الأدوار والاستثناءات متاح للـSuper Admin فقط. باقي الحسابات للعرض حسب الصلاحيات.",
 mfaLink:"إعدادات التحقق بخطوتين",back:"بوابة الحساب",reload:"تحديث القائمة",
 noEmployees:"مفيش موظفين مسجلين.",notActive:"الحساب مش مصرح له بالدخول.",
 serverWarning:"السيرفر بيتحقق من دور وصلاحيات المُنفِّذ قبل تنفيذ أي تغيير. تغيير الحسابات الحالية يحتاج تأكيد منك.",
 yes:"نعم",valueChanged:"تم تحديث صلاحية الموظف."
 },
 en:{
 title:"Staff permissions",intro:"Effective permissions come from Supabase and are enforced server-side for each action.",
 login:"Log in",verify:"Complete two-step verification",restricted:"Restricted to active Dear Day staff.",
 loading:"Loading permissions…",failed:"Couldn't load staff permissions. Try again.",
 own:"My effective permissions",none:"No administrative permissions are assigned to this account.",
 roster:"Employees",noRoster:"You do not have permission to see the employee directory.",
 name:"Name",email:"Email",role:"Role",state:"Account state",active:"Active",inactive:"Suspended",
 edit:"Edit employee access",changes:"Save role and account state",close:"Close",
 overrides:"Individual permission overrides",inherit:"Inherit from role",allow:"Allow",deny:"Deny",
 inherited:"Default for role",saving:"Saving…",done:"Permissions updated.",
 confirm:"Confirm this employee's role or account status change? It affects a live Supabase account.",
 actionWarn:"Confirm changing this employee's specific permission?",
 prevented:"You can't change your own permissions from this screen.",
 failedAction:"Couldn't update access. Other changes may have succeeded; reload and review the current state.",
 superOnly:"Only Super Admin can edit staff roles and overrides. Other staff have read-only access as permitted.",
 mfaLink:"Two-step verification",back:"Account access",reload:"Reload",
 noEmployees:"There are no registered employees.",notActive:"This account is not authorized.",
 serverWarning:"Server-side authorization is checked before every change. Live account changes require your confirmation.",
 yes:"Yes",valueChanged:"Employee permission updated."
 }
};
function category(code){return String(code||"").split(".")[0];}
function uniq(xs){return [...new Set(xs)];}
export default function StaffPermissions({locale="ar"}){
 const t=words[locale]||words.ar,session=useAuthSession();
 const staff=session.status==="authenticated"&&EMPLOYEE_ROLES.has(session.role);
 const client=useMemo(()=>typeof window==="undefined"?null:authClient(rememberPreference()),[]);
 const [loading,setLoading]=useState(true),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [mine,setMine]=useState([]),[employees,setEmployees]=useState([]),[available,setAvailable]=useState([]);
 const [defaults,setDefaults]=useState([]),[overrides,setOverrides]=useState([]);
 const [selected,setSelected]=useState(null),[role,setRole]=useState(""),[active,setActive]=useState(true),[busy,setBusy]=useState(false);
 const canView=mine.includes("employees.view")||mine.includes("employees.manage");
 const canManage=session.role==="super_admin"&&mine.includes("employees.manage");
 const refresh=useCallback(async()=>{
  if(!staff||!client)return;
  setLoading(true);setError("");
  try{
   const own=await client.rpc("get_my_permissions");
   if(own.error)throw own.error;
   const perms=(own.data||[]).map(row=>row.permission_code);
   setMine(perms);
   if(perms.includes("employees.view")||perms.includes("employees.manage")){
    const [people,all,rolePermissions,over]=await Promise.all([
     client.rpc("employee_list"),
     client.from("permissions").select("code,description").order("code"),
     client.from("role_permissions").select("role,permission_code"),
     client.from("employee_permission_overrides").select("user_id,permission_code,is_granted")
    ]);
    if(people.error||all.error||rolePermissions.error||over.error)throw people.error||all.error||rolePermissions.error||over.error;
    setEmployees(people.data||[]);
    setAvailable(all.data||[]);
    setDefaults(rolePermissions.data||[]);
    setOverrides(over.data||[]);
   }else{setEmployees([]);setAvailable([]);setDefaults([]);setOverrides([]);}
  }catch{setError(t.failed);}finally{setLoading(false);}
 },[staff,client,t.failed]);
 useEffect(()=>{if(staff)void refresh();},[staff,refresh]);
 function select(employee){
  if(!canManage||employee.id===session.user.id)return;
  setSelected(employee);setRole(employee.role);setActive(employee.is_active);setError("");setNotice("");
 }
 function inherited(r,permission){return r==="super_admin"||defaults.some(x=>x.role===r&&x.permission_code===permission);}
 function currentOverride(id,permission){
  const current=overrides.find(x=>x.user_id===id&&x.permission_code===permission);
  return current?String(current.is_granted):"";
 }
 async function saveAccess(){
  if(!selected||busy||!canManage||selected.id===session.user.id)return;
  if(!window.confirm(t.confirm))return;
  setBusy(true);setError("");setNotice("");
  try{
   const result=await client.rpc("employee_update_access",{
    p_user_id:selected.id,p_role:role,p_is_active:Boolean(active)
   });
   if(result.error)throw result.error;
   setSelected(null);await refresh();setNotice(t.done);await session.refresh();
  }catch{setError(t.failedAction);}finally{setBusy(false);}
 }
 async function setOverride(permission,raw){
  if(!selected||busy||!canManage||selected.id===session.user.id)return;
  const before=currentOverride(selected.id,permission);
  if(before===raw)return;
  if(!window.confirm(t.actionWarn))return;
  setBusy(true);setError("");setNotice("");
  try{
   const next=raw===""?null:raw==="true";
   const result=await client.rpc("employee_set_permission_override",{
    p_user_id:selected.id,p_permission_code:permission,p_is_granted:next
   });
   if(result.error)throw result.error;
   setOverrides(old=>[
    ...old.filter(x=>!(x.user_id===selected.id&&x.permission_code===permission)),
    ...(raw===""?[]:[{user_id:selected.id,permission_code:permission,is_granted:next}])
   ]);
   setNotice(t.valueChanged);
  }catch{setError(t.failedAction);}finally{setBusy(false);}
 }
 const tab={className:"dd-security-primary"},security=pathFor("security",locale);
 const grouped=uniq(available.map(x=>category(x.code)));
 return <main className="dd-staff-security dd-staff-permissions" dir={locale==="ar"?"rtl":"ltr"} id="main-content">
  <section className="dd-security-card dd-permissions-card">
   <h1>{t.title}</h1><p className="dd-security-muted">{t.intro}</p>
   {!staff?<div className="dd-security-guard">
    <p>{session.status==="mfa_required"?t.verify:session.status==="loading"?t.loading:t.restricted}</p>
    {session.status!=="loading"&&<Link className="dd-security-primary" href={pathFor("auth",locale)+(session.status==="mfa_required"?"?mode=mfa":"")}>{session.status==="mfa_required"?t.verify:t.login}</Link>}
   </div>:loading?<p role="status">{t.loading}</p>:error&&!mine.length?<div>
    <p role="alert">{error}</p><button className="dd-security-secondary" type="button" onClick={refresh}>{t.reload}</button>
   </div>:<>
    <section className="dd-permissions-section">
     <h2>{t.own}</h2>
     {mine.length?<div className="dd-permission-tags">{mine.map(x=><span key={x}>{x}</span>)}</div>:<p>{t.none}</p>}
    </section>
    <section className="dd-permissions-section">
     <div className="dd-permissions-top"><h2>{t.roster}</h2>{canView&&<button type="button" className="dd-security-secondary" onClick={refresh}>{t.reload}</button>}</div>
     {!canView?<p>{t.noRoster}</p>:!employees.length?<p>{t.noEmployees}</p>:
      <div className="dd-employee-list">{employees.map(emp=><article key={emp.id} className="dd-employee">
       <div className="dd-employee-main"><strong>{emp.full_name||emp.email}</strong><small dir="ltr">{emp.email}</small>
        <span>{emp.role} · {emp.is_active?t.active:t.inactive}</span></div>
       {canManage&&emp.id!==session.user.id&&<button type="button" className="dd-security-secondary" onClick={()=>select(emp)}>{t.edit}</button>}
      </article>)}</div>}
    </section>
    <p className="dd-security-muted">{t.superOnly}</p>
    {canManage&&<p className="dd-security-muted">{t.serverWarning}</p>}
   </>}
   {notice&&<p className="dd-security-feedback" role="status">{notice}</p>}
   {error&&mine.length>0&&<p className="dd-security-feedback" role="alert">{error}</p>}
   {selected&&canManage&&<section className="dd-employee-edit" aria-labelledby="dd-employee-editor">
    <div className="dd-permissions-top"><h2 id="dd-employee-editor">{t.edit}</h2>
      <button className="dd-security-secondary" type="button" onClick={()=>setSelected(null)} disabled={busy}>{t.close}</button>
    </div>
    <p>{selected.full_name||selected.email}</p>
    <div className="dd-employee-fields">
     <label>{t.role}<select value={role} onChange={e=>setRole(e.target.value)} disabled={busy}>{roles.map(r=><option value={r} key={r}>{r}</option>)}</select></label>
     <label>{t.state}<select value={String(active)} onChange={e=>setActive(e.target.value==="true")} disabled={busy}>
      <option value="true">{t.active}</option><option value="false">{t.inactive}</option></select></label>
    </div>
    <button type="button" className="dd-security-primary" disabled={busy||(!roles.includes(role))} onClick={saveAccess}>{busy?t.saving:t.changes}</button>
    <h3>{t.overrides}</h3>
    {grouped.map(group=><div className="dd-override-group" key={group}>
     <h4>{group}</h4>
     {available.filter(x=>category(x.code)===group).map(perm=><div className="dd-override-item" key={perm.code}>
      <div><strong>{perm.code}</strong><small>{perm.description||""}</small>
       <span>{t.inherited}: {inherited(role,perm.code)?t.allow:t.deny}</span></div>
      <select disabled={busy||role==="super_admin"} value={currentOverride(selected.id,perm.code)}
       aria-label={perm.code} onChange={e=>void setOverride(perm.code,e.target.value)}>
       <option value="">{t.inherit}</option><option value="true">{t.allow}</option><option value="false">{t.deny}</option>
      </select>
     </div>)}
    </div>)}
   </section>}
   <nav className="dd-security-links"><Link href={pathFor("access",locale)}>{t.back}</Link><Link href={security}>{t.mfaLink}</Link></nav>
  </section>
 </main>;
}
