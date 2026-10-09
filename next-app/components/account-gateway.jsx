"use client";

import Link from "next/link";
import {useAuthSession} from "./auth-session-provider";
import {EMPLOYEE_ROLES,destinationFor} from "../lib/auth-client";
import {pathFor} from "../lib/locales";

const roles={
 super_admin:{ar:"المدير العام",en:"Super Admin"},
 admin:{ar:"مدير النظام",en:"Admin"},
 operations:{ar:"فريق التشغيل",en:"Operations"},
 accountant:{ar:"المحاسب",en:"Accountant"},
 partner_manager:{ar:"مسؤول الشركاء",en:"Partner Manager"},
 customer_support:{ar:"خدمة العملاء",en:"Customer Support"},
 marketing:{ar:"التسويق",en:"Marketing"},
 content_admin:{ar:"إدارة المحتوى",en:"Content Admin"},
 partner_user:{ar:"شريك Dear Day",en:"Dear Day Partner"},
 customer:{ar:"عميل",en:"Customer"}
};
const copy={
 ar:{
  welcome:"حسابك في Dear Day",access:"الوصول لبوابة العمل",
  intro:"أهلًا بعودتك! حسابك متصل بنظام Dear Day.",
  accessIntro:"تم التحقق من حسابك ودورك. بوابة الشركاء القديمة ما زالت تتطلب تسجيل دخول منفصل حاليًا.",
  staffIntro:"دي بوابة دخول فريق Dear Day الجديدة على React، وبتعتمد على جلسة حسابك وصلاحياته والتحقق بخطوتين.",
  loading:"جاري التحقق من حسابك…",
  signedOut:"سجّل الدخول علشان تقدر تشوف بيانات حسابك.",
  verify:"أكمل التحقق الثنائي من حسابك قبل المتابعة.",
  disabled:"الحساب موقوف أو غير مكتمل. تواصل مع خدمة العملاء.",
  error:"تعذر التأكد من صلاحية الحساب مؤقتًا. حاول مجددًا.",
  signIn:"تسجيل الدخول",continueMfa:"التحقق بخطوتين",
  name:"الاسم",email:"البريد الإلكتروني",role:"نوع الحساب",
  accountUpcoming:"بيانات الحساب والعناوين والطلبات والحجوزات موجودة دلوقتي في حسابي.",
  securityPage:"تأمين الحساب والتحقق بخطوتين",permissionsPage:"صلاحيات الفريق",setup:"لازم تفعّل التحقق بخطوتين قبل دخول بوابة العمل.",activate:"تفعيل تطبيق المصادقة",
  staffPortal:"فتح لوحة الفريق الجديدة على React",legacyStaff:"فتح أقسام الموظفين على الموقع القديم",partnerPortal:"فتح بوابة الشركاء الحالية",
  separateSession:"الرابط هيفتح الموقع الأساسي، وممكن يطلب تسجيل الدخول مرة تانية. مش بننقل جلسة React أو كلمة المرور بين الدومينين.",
  back:"العودة للرئيسية",logout:"تسجيل الخروج",waiting:"جاري الخروج…",
  logoutError:"تعذر تسجيل الخروج. جرّب مرة تانية.",
  wrongRole:"الصفحة دي مخصصة لنوع حساب مختلف."
 },
 en:{
  welcome:"Your Dear Day Account",access:"Work portal access",
  intro:"Welcome back! Your account is connected to Dear Day.",
  accessIntro:"Your account and role have been verified. The existing partner portal still needs a separate sign-in.",
  staffIntro:"This is the new Dear Day React team workspace, protected by your existing sign-in, permissions and two-step verification.",
  loading:"Checking account access…",
  signedOut:"Sign in to view your account.",
  verify:"Complete two-step verification before continuing.",
  disabled:"This account is suspended or incomplete. Please contact support.",
  error:"Unable to check account access. Please try again.",
  signIn:"Log in",continueMfa:"Two-step verification",
  name:"Name",email:"Email",role:"Account type",
  accountUpcoming:"Your profile, addresses, orders and bookings are now available in My Account.",
  securityPage:"Account security & two-step verification",permissionsPage:"Staff permissions",setup:"Two-step verification is required before opening the work portal.",activate:"Set up your authenticator",
  staffPortal:"Open new React staff workspace",legacyStaff:"Open legacy staff sections",partnerPortal:"Open existing partner portal",
  separateSession:"This opens the existing website, which may ask you to sign in again. React sessions and passwords aren't transferred between domains.",
  back:"Back to homepage",logout:"Log out",waiting:"Signing out…",
  logoutError:"Couldn't log out. Try again.",
  wrongRole:"This page is intended for a different account role."
 }
};
export default function AccountGateway({locale="ar",kind="customer"}){
 const t=copy[locale]||copy.ar;
 const session=useAuthSession();
 const isEmployee=EMPLOYEE_ROLES.has(session.role);
 const isWorkUser=isEmployee||session.role==="partner_user";
 const accessAllowed=session.status==="authenticated"&&(kind==="work"?isWorkUser:session.role==="customer");
 const home=pathFor("home",locale);
 const login=pathFor("auth",locale);
 const myTarget=destinationFor(session.role,locale);
 const staffUrl=isEmployee?"https://dear-day.com/Dear-Day-Staff-Login.html":"https://dear-day.com/Dear-Day-Partner.html";
 return <main id="main-content" className="dd-account-auth dd-account-hub" dir={locale==="ar"?"rtl":"ltr"}>
   <section className="dd-account-shell" aria-labelledby="dd-gateway-title">
     <div className="dd-account-card">
       <img src="/assets/dear-day-wordmark.svg" className="dd-account-logo" width="164" height="75" alt="Dear Day"/>
       <h1 id="dd-gateway-title">{kind==="work"?t.access:t.welcome}</h1>
       {session.status==="loading"?<p className="dd-account-intro" role="status">{t.loading}</p>:
        session.status==="signed_out"?<div className="dd-gateway-message">
          <p>{t.signedOut}</p>
          <Link href={login+"?next="+encodeURIComponent(kind==="work"?pathFor("access",locale):pathFor("account",locale))} className="dd-gateway-primary">{t.signIn}</Link>
        </div>:
        session.status==="mfa_setup_required"?<div className="dd-gateway-message"><p>{t.setup}</p><Link href={pathFor("security",locale)} className="dd-gateway-primary">{t.activate}</Link></div>:
        session.status==="mfa_required"?<div className="dd-gateway-message">
          <p>{t.verify}</p><Link href={login+"?mode=mfa"} className="dd-gateway-primary">{t.continueMfa}</Link>
        </div>:
        session.status==="inactive"?<p className="dd-account-status is-error" role="alert">{t.disabled}</p>:
        session.status==="error"?<p className="dd-account-status is-error" role="alert">{t.error}</p>:
        !accessAllowed?<div className="dd-gateway-message">
          <p>{t.wrongRole}</p><Link className="dd-gateway-primary" href={myTarget}>{locale==="ar"?"الانتقال لحسابك":"Go to your account"}</Link>
        </div>:
        <>
          <p className="dd-account-intro">{kind==="work"?(isEmployee?t.staffIntro:t.accessIntro):t.intro}</p>
          <div className="dd-gateway-identity">
            <div><small>{t.name}</small><strong>{session.profile?.full_name||"—"}</strong></div>
            <div><small>{t.email}</small><strong dir="ltr">{session.user?.email||"—"}</strong></div>
            <div><small>{t.role}</small><strong>{roles[session.role]?.[locale]||session.role}</strong></div>
          </div>
          {kind==="work"?<>
            {isEmployee&&<div className="dd-gateway-work-links">
              <Link className="dd-gateway-primary" href={pathFor("security",locale)}>{t.securityPage}</Link>
              <Link className="dd-gateway-secondary" href={pathFor("staffPermissions",locale)}>{t.permissionsPage}</Link>
            </div>}
            {isEmployee&&<Link className="dd-gateway-primary" href={pathFor("staffPortal",locale)}>{t.staffPortal}</Link>}
            <a className="dd-gateway-secondary" href={staffUrl} target="_blank" rel="noopener noreferrer">
              {isEmployee?t.legacyStaff:t.partnerPortal}
            </a>
            <p className="dd-gateway-notice">{t.separateSession}</p>
          </>:<p className="dd-gateway-notice">{t.accountUpcoming}</p>}
        </>
       }
       <div className="dd-account-switch"><Link href={home}>{t.back}</Link></div>
     </div>
   </section>
 </main>;
}
