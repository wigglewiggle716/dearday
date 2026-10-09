"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {useAuthSession} from "./auth-session-provider";
import {authClient,EMPLOYEE_ROLES,rememberPreference} from "../lib/auth-client";
import {pathFor} from "../lib/locales";

const texts={
 ar:{
 title:"أمان حساب الفريق",intro:"فعّل التحقق بخطوتين باستخدام تطبيق مصادقة.",
 signin:"تسجيل الدخول",mfa:"أكمل التحقق الثنائي",restricted:"الصفحة مخصصة لموظفي Dear Day النشطين.",
 loading:"جاري تحميل إعدادات الأمان…",error:"تعذر تحميل إعدادات الأمان. حاول مجددًا.",
 enabled:"التحقق بخطوتين مفعّل",disabled:"التحقق بخطوتين لم يتم تفعيله",
 factors:"تطبيقات المصادقة المؤكدة",enroll:"تفعيل تطبيق مصادقة",backup:"إضافة تطبيق احتياطي",
 recommendation:"بننصح بإضافة تطبيق احتياطي على جهاز منفصل لاستعادة الوصول لو فقدت جهازك الأساسي.",
 scan:"امسح QR بتطبيق Google Authenticator أو Microsoft Authenticator، وبعدها اكتب الرمز.",
 manual:"إدخال مفتاح الإعداد يدويًا",secret:"المفتاح سري جدًا. متشاركوش مع أي حد.",
 code:"رمز المصادقة المكوّن من 6 أرقام",confirm:"تأكيد التطبيق",cancel:"إلغاء",busy:"جاري التنفيذ…",
 success:"تم تأكيد التطبيق بنجاح. احفظ نسخة احتياطية مستقلة.",
 invalid:"رمز غير صحيح أو منتهي الصلاحية. تأكد من توقيت جهازك.",
 recovery:"لو فقدت كل التطبيقات",recoverText:"استخدم التطبيق الاحتياطي المؤكد، أو تواصل مع مسؤول النظام عبر قناة مستقلة للتحقق من هويتك. استعادة كلمة المرور لا تلغي MFA، ومفيش أكواد استرداد تلقائية.",
 staged:"إلزام كل الموظفين بالـMFA خطوة منفصلة بعد التأكد من إعداد التطبيقات ومسار الاستعادة.",
 back:"العودة لبوابة الحساب",perms:"صلاحياتي",retry:"إعادة المحاولة"
 },
 en:{
 title:"Staff account security",intro:"Enable authenticator-based two-step verification.",
 signin:"Log in",mfa:"Complete two-step verification",restricted:"This page is restricted to active Dear Day staff.",
 loading:"Loading security settings…",error:"Unable to load security settings. Try again.",
 enabled:"Two-step verification enabled",disabled:"Two-step verification not enabled",
 factors:"Verified authenticators",enroll:"Set up authenticator",backup:"Add backup authenticator",
 recommendation:"Add a backup authenticator on a separate device so you can regain access if you lose your primary device.",
 scan:"Scan this QR code with Google Authenticator or Microsoft Authenticator, then enter its code.",
 manual:"Enter setup key manually",secret:"Keep this setup key private. Never share it.",
 code:"Six-digit authenticator code",confirm:"Verify authenticator",cancel:"Cancel",busy:"Working…",
 success:"Authenticator verified. Keep an independent backup.",
 invalid:"Incorrect or expired code. Check your device clock.",
 recovery:"Lost your authenticators?",recoverText:"Use a verified backup authenticator, or contact an authorized administrator through an independent identity-verification channel. Password resets never bypass MFA; no automatic recovery codes are issued.",
 staged:"Universal staff MFA enforcement is a separate step after enrollment and recovery are tested.",
 back:"Back to account access",perms:"My permissions",retry:"Try again"
 }
};
export default function StaffSecurity({locale="ar"}){
 const t=texts[locale]||texts.ar,session=useAuthSession();
 const staff=session.status==="authenticated"&&EMPLOYEE_ROLES.has(session.role);
 const client=useMemo(()=>typeof window==="undefined"?null:authClient(rememberPreference()),[]);
 const [factors,setFactors]=useState([]),[pending,setPending]=useState(null),[code,setCode]=useState("");
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 const load=useCallback(async()=>{
  if(!staff||!client)return;
  setLoading(true);
  try{
   const {data,error}=await client.auth.mfa.listFactors();
   if(error)throw error;
   setFactors((data?.totp||[]).filter(x=>x.status==="verified"));
  }catch{setNotice(t.error);}finally{setLoading(false);}
 },[staff,client,t.error]);
 useEffect(()=>{if(staff)void load();},[staff,load]);
 async function enroll(){
  if(!staff||!client||busy||pending)return;
  setBusy(true);setNotice("");
  try{
   const old=await client.auth.mfa.listFactors();
   if(old.error)throw old.error;
   // Only cleanup unfinished enrollment attempts created by this new React flow.
   for(const factor of old.data?.all||[]){
    if(factor.factor_type==="totp"&&factor.status==="unverified"&&factor.friendly_name?.startsWith("Dear Day React ")){
     const result=await client.auth.mfa.unenroll({factorId:factor.id});if(result.error)throw result.error;
    }
   }
   const result=await client.auth.mfa.enroll({factorType:"totp",friendlyName:"Dear Day React "+new Date().toISOString(),issuer:"Dear Day"});
   if(result.error)throw result.error;
   const raw=String(result.data?.totp?.qr_code||"");
   setPending({id:result.data.id,qr:raw.startsWith("data:image/")?raw:"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(raw),secret:result.data.totp.secret});
  }catch{setNotice(t.error);}finally{setBusy(false);}
 }
 async function cancel(){
  if(!pending||busy)return;
  setBusy(true);setNotice("");
  try{
   const {error}=await client.auth.mfa.unenroll({factorId:pending.id});
   if(error)throw error;
   setPending(null);setCode("");await load();
  }catch{setNotice(t.error);}finally{setBusy(false);}
 }
 async function verify(event){
  event.preventDefault();
  if(!pending||busy||!/^\d{6}$/.test(code))return;
  setBusy(true);setNotice("");
  try{
   const {error}=await client.auth.mfa.challengeAndVerify({factorId:pending.id,code});
   if(error){setNotice(t.invalid);setCode("");return;}
   setPending(null);setCode("");
   await session.refresh();await load();setNotice(t.success);
  }catch{setNotice(t.error);}finally{setBusy(false);}
 }
 const login=pathFor("auth",locale);
 return <main id="main-content" className="dd-staff-security" dir={locale==="ar"?"rtl":"ltr"}>
  <section className="dd-security-card">
   <img src="/assets/dear-day-wordmark.svg" alt="Dear Day" width="150" height="74"/>
   <h1>{t.title}</h1><p className="dd-security-muted">{t.intro}</p>
   {!staff?<div className="dd-security-guard"><p>{session.status==="loading"?t.loading:session.status==="mfa_required"?t.mfa:t.restricted}</p>
    {session.status!=="loading"&&<Link className="dd-security-primary" href={login+(session.status==="mfa_required"?"?mode=mfa":"")}>{session.status==="mfa_required"?t.mfa:t.signin}</Link>}
   </div>:loading?<p role="status">{t.loading}</p>:<>
    <div className="dd-security-state"><span className={factors.length?"dd-security-dot active":"dd-security-dot"}/>
     <strong>{factors.length?t.enabled:t.disabled}</strong>
    </div>
    <p className="dd-security-muted">{factors.length?t.factors+": "+factors.length:t.recommendation}</p>
    {factors.length>0&&<div className="dd-security-factors">{factors.map((x,i)=><div key={x.id}>
     <span aria-hidden="true">✓</span><span>{t.factors+" "+(i+1)}</span>
    </div>)}</div>}
    {!pending?<button type="button" className="dd-security-primary" disabled={busy} onClick={enroll}>{busy?t.busy:factors.length?t.backup:t.enroll}</button>:
     <div className="dd-security-enrollment">
      <p>{t.scan}</p><img src={pending.qr} width="210" height="210" alt="Authenticator setup QR"/>
      <details><summary>{t.manual}</summary><code dir="ltr">{pending.secret}</code></details>
      <p className="dd-security-warning">{t.secret}</p>
      <form onSubmit={verify}><label htmlFor="staff-totp">{t.code}</label>
       <input id="staff-totp" required minLength={6} maxLength={6} pattern="[0-9]{6}" inputMode="numeric"
        autoComplete="one-time-code" dir="ltr" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))}/>
       <div className="dd-security-actions">
        <button type="submit" className="dd-security-primary" disabled={busy||code.length!==6}>{busy?t.busy:t.confirm}</button>
        <button type="button" className="dd-security-secondary" disabled={busy} onClick={cancel}>{t.cancel}</button>
       </div>
      </form>
     </div>}
    {notice&&<p role="status" className="dd-security-feedback">{notice}</p>}
    <p className="dd-security-muted">{t.staged}</p>
   </>}
   <details className="dd-security-recovery"><summary>{t.recovery}</summary><p>{t.recoverText}</p></details>
   <nav className="dd-security-links"><Link href={pathFor("access",locale)}>{t.back}</Link>{staff&&<Link href={pathFor("staffPermissions",locale)}>{t.perms}</Link>}</nav>
  </section>
 </main>;
}