"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {authClient,rememberPreference,safeNext,rememberSession,readCurrentAccount,destinationFor} from "../lib/auth-client";
import {pathFor} from "../lib/locales";

const copy={
 ar:{
  loginTitle:"تسجيل الدخول",loginIntro:"سجّل دخولك وكمّل ترتيب مناسباتك واختياراتك مع Dear Day.",
  signupTitle:"أنشئ حسابك",signupIntro:"خلّي تفاصيل مناسباتك واختياراتك كلها في مكان واحد.",
  forgotTitle:"استعادة كلمة المرور",forgotIntro:"اكتب إيميلك وهنبعتلك رابط تختار منه كلمة مرور جديدة.",
  recoverTitle:"كلمة مرور جديدة",recoverIntro:"اكتب كلمة المرور الجديدة لحسابك.",
  email:"البريد الإلكتروني",password:"كلمة المرور",passwordPlaceholder:"اكتب كلمة المرور",
  first:"الاسم الأول",last:"اسم العائلة",phone:"رقم الموبايل",
  confirm:"تأكيد كلمة المرور",passwordHint:"8 أحرف على الأقل",
  remember:"تذكرني",forgot:"نسيت كلمة السر؟",
  login:"تسجيل الدخول",signup:"إنشاء الحساب",reset:"إرسال رابط الاستعادة",
  savePassword:"حفظ كلمة المرور",loading:"جاري التنفيذ…",
  withSocial:"أو كمّل بواسطة",google:"المتابعة باستخدام Google",facebook:"المتابعة باستخدام Facebook",
  apple:"المتابعة باستخدام Apple",newAccount:"لسه معندكش حساب؟",already:"عندك حساب بالفعل؟",
  backLogin:"العودة لتسجيل الدخول",termsIntro:"أوافق على",terms:"الشروط والأحكام",and:"و",privacy:"سياسة الخصوصية",
  show:"إظهار كلمة المرور",hide:"إخفاء كلمة المرور",
  passwordMismatch:"كلمتا المرور مش متطابقتين.",passwordWeak:"لازم كلمة المرور تكون 8 أحرف على الأقل.",
  invalid:"البريد الإلكتروني أو كلمة المرور غير صحيحة.",unconfirmed:"لازم تأكد بريدك الإلكتروني قبل تسجيل الدخول.",
  duplicate:"البريد الإلكتروني مستخدم بالفعل. جرّب تسجّل دخول.",
  providerError:"طريقة تسجيل الدخول دي غير مفعّلة حاليًا أو تعذّر الاتصال بها.",
  authError:"حصلت مشكلة في الاتصال. جرّب مرة تانية.",
  tooMany:"محاولات كتير في وقت قصير. جرّب بعد شوية.",
  resetSent:"لو البريد مسجّل عندنا، هتوصلك رسالة فيها رابط تغيير كلمة المرور.",
  signupConfirm:"طلب إنشاء الحساب اتسجّل. راجع إيميلك لتأكيد الحساب قبل تسجيل الدخول.",
  signupDone:"تم إنشاء حسابك بنجاح.",recoverDone:"تم تغيير كلمة المرور. تقدر تسجّل دخول دلوقتي.",
  loginDone:"تم تسجيل الدخول.",welcome:"أهلًا بيك في Dear Day",
  accountNote:"إنشاء حساب مش مطلوب لإتمام شراء أو حجز.",
  infoConsent:"باستخدام الخدمة، بتوافق على سياسات Dear Day.",
  redirectError:"تعذر إكمال عملية تسجيل الدخول. جرّب من جديد.",
  inactive:"الحساب غير مفعّل أو تم إيقافه. تواصل مع خدمة العملاء.",
  mfaTitle:"التحقق بخطوتين",mfaIntro:"افتح تطبيق المصادقة واكتب الرمز المكوّن من 6 أرقام.",
  mfaLabel:"رمز تطبيق المصادقة",mfaSubmit:"تأكيد ومتابعة الدخول",
  mfaInvalid:"رمز التحقق غير صحيح أو انتهت صلاحيته.",mfaUnavailable:"ماقدرناش نكمل التحقق الثنائي. تواصل مع مسؤول النظام.",
  mfaSignOut:"إلغاء وتسجيل الخروج",profileError:"تعذر تأكيد صلاحية الحساب حاليًا. حاول لاحقًا."
 },
 en:{
  loginTitle:"Log in",loginIntro:"Pick up where you left off and keep planning your occasions with Dear Day.",
  signupTitle:"Create your account",signupIntro:"Keep your occasion details and favourite selections together in one place.",
  forgotTitle:"Reset your password",forgotIntro:"Enter your email and we’ll send you a link to choose a new password.",
  recoverTitle:"Choose a new password",recoverIntro:"Create a new password for your Dear Day account.",
  email:"Email address",password:"Password",passwordPlaceholder:"Enter your password",
  first:"First name",last:"Last name",phone:"Mobile number",
  confirm:"Confirm password",passwordHint:"At least 8 characters",
  remember:"Remember me",forgot:"Forgot password?",
  login:"Log in",signup:"Create account",reset:"Send reset link",
  savePassword:"Save new password",loading:"Please wait…",
  withSocial:"Or continue with",google:"Continue with Google",facebook:"Continue with Facebook",
  apple:"Continue with Apple",newAccount:"New to Dear Day?",already:"Already have an account?",
  backLogin:"Back to login",termsIntro:"I agree to the",terms:"Terms & Conditions",and:"and",privacy:"Privacy Policy",
  show:"Show password",hide:"Hide password",
  passwordMismatch:"Passwords do not match.",passwordWeak:"Use a password with at least 8 characters.",
  invalid:"Incorrect email or password.",unconfirmed:"Please confirm your email before logging in.",
  duplicate:"This email is already registered. Try logging in.",
  providerError:"This sign-in provider may not be enabled or could not be reached.",
  authError:"Unable to complete your request. Please try again.",
  tooMany:"Too many attempts. Please try again later.",
  resetSent:"If an account exists for that email, you'll receive a password reset link.",
  signupConfirm:"Account registration received. Check your email to confirm it before logging in.",
  signupDone:"Your account was created successfully.",recoverDone:"Password updated. You can now log in.",
  loginDone:"You're logged in.",welcome:"Welcome to Dear Day",
  accountNote:"You don't need an account to check out.",
  infoConsent:"By continuing, you agree to Dear Day's policies.",
  redirectError:"We couldn't complete sign-in. Please try again.",
  inactive:"This account is inactive or suspended. Please contact support.",
  mfaTitle:"Two-step verification",mfaIntro:"Enter the six-digit code from your authenticator app.",
  mfaLabel:"Authenticator code",mfaSubmit:"Verify and continue",
  mfaInvalid:"The verification code is incorrect or expired.",mfaUnavailable:"We couldn't complete two-step verification. Please contact your administrator.",
  mfaSignOut:"Cancel and sign out",profileError:"We couldn't confirm account access. Try again later."
 }
};
function authErrorText(error,t){
 const m=String(error?.message||"").toLowerCase();
 if(m.includes("invalid login credentials")||m.includes("invalid credentials"))return t.invalid;
 if(m.includes("email not confirmed"))return t.unconfirmed;
 if(m.includes("already registered")||m.includes("user already"))return t.duplicate;
 if(m.includes("password")&&(m.includes("weak")||m.includes("at least")))return t.passwordWeak;
 if(m.includes("rate")||m.includes("too many"))return t.tooMany;
 if(m.includes("provider")||m.includes("unsupported")||m.includes("oauth"))return t.providerError;
 return t.authError;
}
function ProviderIcon({name}){
 if(name==="google")return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.4 12.25c0-.65-.07-1.32-.18-1.94H12v3.82h5.28a4.5 4.5 0 0 1-2 2.95v2.47h3.22c1.89-1.74 2.9-4.3 2.9-7.3Z"/><path fill="#34A853" d="M12 21.8c2.69 0 4.96-.89 6.61-2.43l-3.23-2.47c-.89.6-2.02.95-3.38.95-2.58 0-4.78-1.75-5.58-4.1H3.1v2.55A9.8 9.8 0 0 0 12 21.8Z"/><path fill="#FBBC05" d="M6.42 13.75A5.84 5.84 0 0 1 6.1 12c0-.61.11-1.21.32-1.75V7.7H3.1A9.78 9.78 0 0 0 2.1 12c0 1.56.37 3.03 1 4.3l3.32-2.55Z"/><path fill="#EA4335" d="M12 6.15c1.45 0 2.75.5 3.77 1.48l2.83-2.83A9.59 9.59 0 0 0 12 2.2 9.8 9.8 0 0 0 3.1 7.7l3.32 2.55c.8-2.35 3-4.1 5.58-4.1Z"/></svg>;
 if(name==="facebook")return <svg viewBox="0 0 24 24" aria-hidden="true"><rect width="20" height="20" x="2" y="2" rx="5" fill="#1877F2"/><path d="M14.8 21v-7h2.4l.4-3h-2.8V9.1c0-.88.27-1.5 1.55-1.5h1.46V5a19.9 19.9 0 0 0-2.13-.11c-2.12 0-3.57 1.3-3.57 3.68V11H9.7v3h2.41v7Z" fill="#fff"/></svg>;
 return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.5 12.2c0-2 1.65-3 1.7-3.03-.93-1.36-2.38-1.55-2.9-1.56-1.22-.13-2.4.73-3.02.73-.6 0-1.54-.71-2.54-.69-1.3.02-2.5.76-3.17 1.88-1.36 2.35-.36 5.81.98 7.73.67.95 1.47 2.04 2.48 2.01 1-.04 1.39-.65 2.61-.65 1.2 0 1.56.65 2.62.63 1.08-.02 1.75-.98 2.39-1.93.78-1.12 1.1-2.21 1.12-2.28-2.5-.96-2.27-3.79-2.27-3.84ZM14.66 6.38c.53-.65.9-1.54.8-2.43-.75.04-1.67.5-2.23 1.15-.5.58-.94 1.5-.83 2.36.84.06 1.7-.44 2.26-1.08Z"/></svg>;
}
function PasswordField({label,name,placeholder,autoComplete,minLength=6,show,hide}){
 const [visible,setVisible]=useState(false);
 return <div className="dd-account-field">
   <label htmlFor={"dd-account-"+name}>{label}</label>
   <div className="dd-account-password-control">
     <input id={"dd-account-"+name} name={name} type={visible?"text":"password"}
       autoComplete={autoComplete} minLength={minLength} required placeholder={placeholder}/>
     <button type="button" className="dd-account-reveal" onClick={()=>setVisible(x=>!x)}
       aria-label={visible?hide:show} aria-pressed={visible}>
       {visible?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 3l18 18M9.7 5.5A10.3 10.3 0 0 1 12 5c5.5 0 9 7 9 7a14.8 14.8 0 0 1-3.3 4.2M6.3 6.5A15 15 0 0 0 3 12s3.5 7 9 7c1.4 0 2.6-.3 3.7-.9"/><path d="M10 10a3 3 0 0 0 4 4"/></svg>
       :<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>}
     </button>
   </div>
 </div>;
}
export default function AuthPage({locale="ar",page="login"}){
 const t=copy[locale]||copy.ar;
 const [mode,setMode]=useState(page);
 const [remember,setRemember]=useState(true);
 const [busy,setBusy]=useState(false);
 const [status,setStatus]=useState(null);
 const loginPath=pathFor("auth",locale);
 const signupPath=pathFor("register",locale);
 const homePath=pathFor("home",locale);
 const [oauthPending,setOauthPending]=useState(false);
 const [mfaFactorId,setMfaFactorId]=useState("");
 const [mfaNext,setMfaNext]=useState(null);
 async function finishSignIn(client, requested){
   const access=await readCurrentAccount(client);
   if(access.status==="mfa_required"){
     const factors=await client.auth.mfa.listFactors();
     if(factors.error)throw factors.error;
     const verified=factors.data?.totp?.find(f=>f.status==="verified");
     if(!verified){setMode("mfa");setStatus({error:true,message:t.mfaUnavailable});return;}
     setMfaFactorId(verified.id);setMfaNext(requested||null);setMode("mfa");setStatus(null);
     return;
   }
   if(access.status==="inactive"){
     await client.auth.signOut();
     setStatus({error:true,message:t.inactive});return;
   }
   if(access.status!=="authenticated"){
     setStatus({error:true,message:t.profileError});return;
   }
   const destination=destinationFor(access.role,locale);
   const path=access.role==="customer"?safeNext(requested,destination):destination;
   window.localStorage.removeItem("ddPostAuthNext");
   window.location.assign(path);
 }
 async function verifyMfa(event){
   event.preventDefault();
   if(busy||!mfaFactorId)return;
   const form=event.currentTarget;if(!form.reportValidity())return;
   const code=String(new FormData(form).get("otp")||"").trim();
   setBusy(true);setStatus(null);
   try{
     const client=authClient(rememberPreference());
     const result=await client.auth.mfa.challengeAndVerify({factorId:mfaFactorId,code});
     if(result.error){setStatus({error:true,message:t.mfaInvalid});return;}
     await finishSignIn(client,mfaNext);
   }catch{setStatus({error:true,message:t.mfaUnavailable});}
   finally{setBusy(false);}
 }
 async function abortMfa(){
   setBusy(true);
   try{await authClient(rememberPreference()).auth.signOut();}
   finally{window.location.assign(loginPath);}
 }

 useEffect(()=>{
   setRemember(rememberPreference());
   const hash=window.location.hash;
   const params=new URLSearchParams(window.location.search);
   if(page==="login"&&hash==="#signup"){
     window.location.replace(signupPath+window.location.search);return;
   }
   const recovery=params.get("mode")==="recover"||hash.includes("type=recovery");
   const forgot=hash==="#forgot"||params.get("mode")==="forgot";
   if(recovery)setMode("recover");
   else if(forgot)setMode("forgot");
   else if(params.get("mode")==="mfa")setMode("mfa");
   if(params.has("error")||params.has("error_code"))
     setStatus({error:true,message:t.providerError});
   let active=true,redirecting=false;
   const client=authClient(rememberPreference());
   function checkAccount(){
     if(!active||redirecting||recovery||forgot)return;
     redirecting=true;
     const storedNext=window.localStorage.getItem("ddPostAuthNext");
     const requested=storedNext||params.get("next");
     void finishSignIn(client,requested).catch(()=>{
       if(active)setStatus({error:true,message:t.redirectError});
     }).finally(()=>{redirecting=false;});
   }
   const {data:sub}=client.auth.onAuthStateChange(event=>{
     if(!active)return;
     if(event==="PASSWORD_RECOVERY"){setMode("recover");return;}
     // Waiting for PKCE/OAuth exchange: only use a verified returned session.
     if(event==="SIGNED_IN"&&!recovery&&!forgot){
       window.setTimeout(()=>{if(active)checkAccount();},0);
     }
   });
   if(!recovery&&!forgot){
     client.auth.getSession().then(({data,error})=>{
       if(active&&data?.session&&!error)checkAccount();
       else if(active&&(params.has("oauth")||params.has("code"))&&error)
         setStatus({error:true,message:t.redirectError});
     }).catch(()=>{if(active)setStatus({error:true,message:t.redirectError});});
   }
   return ()=>{active=false;sub.subscription.unsubscribe();};
 },[page,locale,loginPath,signupPath]);
 function landing(){
   const params=new URLSearchParams(window.location.search);
   return safeNext(params.get("next"),pathFor("account",locale));
 }
 function linkWithNext(path){
   if(typeof window==="undefined")return path;
   const next=new URLSearchParams(window.location.search).get("next");
   const safe=safeNext(next,"");
   return path+(safe?"?next="+encodeURIComponent(safe):"");
 }
 async function submit(event){
   event.preventDefault();
   if(busy)return;
   const form=event.currentTarget;
   if(!form.reportValidity())return;
   const values=new FormData(form);
   setStatus(null);
   setBusy(true);
   try{
     if(mode==="forgot"){
       const supabase=authClient(rememberPreference());
       const email=String(values.get("email")||"").trim();
       const {error}=await supabase.auth.resetPasswordForEmail(email,{
         redirectTo:window.location.origin+loginPath+"?mode=recover"
       });
       if(error)throw error;
       setStatus({error:false,message:t.resetSent});return;
     }
     if(mode==="recover"){
       const pw=String(values.get("password")||"");
       if(pw.length<8){setStatus({error:true,message:t.passwordWeak});return;}
       if(pw!==String(values.get("confirmPassword")||"")){
         setStatus({error:true,message:t.passwordMismatch});return;
       }
       const {error}=await authClient(rememberPreference()).auth.updateUser({password:pw});
       if(error)throw error;
       setStatus({error:false,message:t.recoverDone});
       window.history.replaceState(null,"",loginPath);
       setMode("login");return;
     }
     if(page==="signup"){
       const pw=String(values.get("password")||"");
       if(pw.length<8){setStatus({error:true,message:t.passwordWeak});return;}
       if(pw!==String(values.get("confirmPassword")||"")){
         setStatus({error:true,message:t.passwordMismatch});return;
       }
       const first=String(values.get("firstName")||"").trim();
       const last=String(values.get("lastName")||"").trim();
       const phone=String(values.get("phone")||"").trim();
       const email=String(values.get("email")||"").trim().toLowerCase();
       const supabase=authClient(true);
       const {data,error}=await supabase.auth.signUp({email,password:pw,
         options:{data:{first_name:first,last_name:last,full_name:(first+" "+last).trim(),phone,
           profile_complete:true},emailRedirectTo:window.location.origin+loginPath+"?verified=1"}
       });
       if(error)throw error;
       if(data?.session){
         rememberSession(true);
         await finishSignIn(supabase,landing());
       }else{
         form.reset();
         setStatus({error:false,message:t.signupConfirm});
       }
       return;
     }
     const rememberIt=Boolean(values.get("remember"));
     const client=authClient(rememberIt);
     const {error}=await client.auth.signInWithPassword({
       email:String(values.get("email")||"").trim().toLowerCase(),
       password:String(values.get("password")||"")
     });
     if(error)throw error;
     rememberSession(rememberIt);
     await finishSignIn(client,landing());
   }catch(error){
     setStatus({error:true,message:authErrorText(error,t)});
   }finally{setBusy(false);}
 }
 async function social(provider){
   if(oauthPending||busy)return;
   setStatus(null);setOauthPending(true);
   try{
     window.localStorage.setItem("ddPostAuthNext",landing());
     const client=authClient(true);
     const {error}=await client.auth.signInWithOAuth({
       provider,options:{redirectTo:window.location.origin+loginPath+"?oauth=1"}
     });
     if(error)throw error;
     // OAuth always keeps a persistent browser session after successful return.
     rememberSession(true);
   }catch(error){
     setStatus({error:true,message:authErrorText(error,t)});setOauthPending(false);
   }
 }
 const isSignup=page==="signup";
 const isForgot=mode==="forgot";
 const isRecover=mode==="recover";
 const isMfa=mode==="mfa";
 const title=isMfa?t.mfaTitle:isRecover?t.recoverTitle:isForgot?t.forgotTitle:isSignup?t.signupTitle:t.loginTitle;
 const intro=isMfa?t.mfaIntro:isRecover?t.recoverIntro:isForgot?t.forgotIntro:isSignup?t.signupIntro:t.loginIntro;
 return <main id="main-content" className="dd-account-auth" dir={locale==="ar"?"rtl":"ltr"}>
   <div className="dd-account-auth-orbit" aria-hidden="true"/>
   <section className={"dd-account-shell"+(isSignup?" is-signup":"")} aria-labelledby="dd-account-title">
     <div className="dd-account-card">
       <img src="/assets/dear-day-wordmark.svg" className="dd-account-logo" alt="Dear Day" width="172" height="91"/>
       <h1 id="dd-account-title">{title}</h1>
       <p className="dd-account-intro">{intro}</p>
       {isMfa?<form className="dd-account-form" onSubmit={verifyMfa}>
         <div className="dd-account-field">
           <label htmlFor="dd-mfa-code">{t.mfaLabel}</label>
           <input id="dd-mfa-code" name="otp" inputMode="numeric" autoComplete="one-time-code"
             pattern="[0-9]{6}" minLength={6} maxLength={6} required dir="ltr" autoFocus/>
         </div>
         <button type="submit" className="dd-account-primary" disabled={busy||!mfaFactorId}>
           {busy?t.loading:t.mfaSubmit}
         </button>
         <button type="button" className="dd-account-cancel" disabled={busy} onClick={abortMfa}>{t.mfaSignOut}</button>
       </form>:<form className="dd-account-form" onSubmit={submit} autoComplete="on">
         {isSignup&&<div className="dd-account-two">
           <div className="dd-account-field"><label htmlFor="dd-first">{t.first}</label><input id="dd-first" name="firstName" autoComplete="given-name" required minLength={2} maxLength={100}/></div>
           <div className="dd-account-field"><label htmlFor="dd-last">{t.last}</label><input id="dd-last" name="lastName" autoComplete="family-name" required minLength={2} maxLength={100}/></div>
         </div>}
         {!isRecover&&<div className="dd-account-field">
           <label htmlFor="dd-email">{t.email}</label>
           <input id="dd-email" name="email" type="email" inputMode="email" autoComplete="email" required maxLength={254} placeholder="name@example.com" dir="ltr"/>
         </div>}
         {isSignup&&<div className="dd-account-field">
           <label htmlFor="dd-phone">{t.phone}</label>
           <input id="dd-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required
             pattern="[+0-9() -]{6,40}" minLength={6} maxLength={40} placeholder="01xxxxxxxxx" dir="ltr"/>
         </div>}
         {!isForgot&&<PasswordField name="password" label={isRecover?t.password:t.password} placeholder={isSignup||isRecover?t.passwordHint:t.passwordPlaceholder}
           autoComplete={isSignup||isRecover?"new-password":"current-password"}
           minLength={isSignup||isRecover?8:6} show={t.show} hide={t.hide}/>}
         {(isSignup||isRecover)&&<PasswordField name="confirmPassword" label={t.confirm} placeholder={t.passwordHint}
           autoComplete="new-password" minLength={8} show={t.show} hide={t.hide}/>}
         {!isSignup&&!isForgot&&!isRecover&&<div className="dd-account-aux">
           <label className="dd-account-check"><input name="remember" type="checkbox" checked={remember}
             onChange={e=>setRemember(e.target.checked)}/><span>{t.remember}</span></label>
           <Link href={loginPath+"?mode=forgot"} onClick={()=>{setMode("forgot");setStatus(null);}}>{t.forgot}</Link>
         </div>}
         {isSignup&&<label className="dd-account-consent">
           <input type="checkbox" required name="consent"/>
           <span>{t.termsIntro} <Link href={pathFor("terms",locale)} target="_blank" rel="noopener noreferrer">{t.terms}</Link> {t.and} <Link href={pathFor("privacy",locale)} target="_blank" rel="noopener noreferrer">{t.privacy}</Link>.</span>
         </label>}
         <button className="dd-account-primary" type="submit" disabled={busy||oauthPending}>
           {busy?t.loading:isRecover?t.savePassword:isForgot?t.reset:isSignup?t.signup:t.login}
         </button>
       </form>}
       {status&&<p className={"dd-account-status "+(status.error?"is-error":"is-success")} role={status.error?"alert":"status"} aria-live="polite">{status.message}</p>}
       {!isForgot&&!isRecover&&!isMfa&&<>
         <div className="dd-account-divider"><span>{t.withSocial}</span></div>
         <div className="dd-account-socials" role="group" aria-label={t.withSocial}>
           {["facebook","google","apple"].map(provider=><button key={provider} type="button" onClick={()=>social(provider)}
             disabled={oauthPending||busy} aria-label={t[provider]} title={t[provider]}>
             <ProviderIcon name={provider}/>
           </button>)}
         </div>
       </>}
       {!isMfa&&<div className="dd-account-switch">
         {isSignup?<>{t.already} <Link href={linkWithNext(loginPath)}>{t.login}</Link></>:
         isForgot||isRecover?<Link href={linkWithNext(loginPath)} onClick={()=>{setMode("login");setStatus(null);}}>{t.backLogin}</Link>:
         <>{t.newAccount} <Link href={linkWithNext(signupPath)}>{t.signup}</Link></>}
       </div>}
     </div>
     <p className="dd-account-bottom-note">{t.accountNote}</p>
   </section>
 </main>;
}
