"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { alternatePath, dictionaries, pathFor } from "../lib/locales";
import { useAuthSession } from "./auth-session-provider";
import { destinationFor } from "../lib/auth-client";

const exploreIds = ["gifts", "cake", "venues", "flowers"];
const primaryIds = ["home", "occasions", "howItWorks", "partners"];

export default function SiteHeader({ locale }) {
  const t = dictionaries[locale];
  const pathname = usePathname();
  const isCheckout = pathname === pathFor("payment",locale);
  const session = useAuthSession();
  const [accountOpen,setAccountOpen] = useState(false);
  const [signoutError,setSignoutError] = useState(false);
  const [signoutBusy,setSignoutBusy] = useState(false);
  const accountRef=useRef(null);
  const userLabel=session.profile?.full_name?.trim()||session.user?.email||"";
  const accountHref=destinationFor(session.role,locale);
  async function logout(){
    if(signoutBusy)return;
    setSignoutBusy(true);setSignoutError(false);
    try{await session.signOut();window.location.assign(pathFor("home",locale));}
    catch{setSignoutError(true);setSignoutBusy(false);}
  }
  const [mobileOpen, setMobileOpen] = useState(false);
  const exploreRef = useRef(null);
  const mobileExploreRef = useRef(null);
  const activeExplore = exploreIds.some((id) => pathname === pathFor(id, locale));

  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
    if (exploreRef.current) exploreRef.current.open = false;
    if (mobileExploreRef.current) mobileExploreRef.current.open = false;
  }, [pathname]);

  useEffect(() => {
    function outside(event) {
      if (exploreRef.current && !exploreRef.current.contains(event.target)) exploreRef.current.open = false;
    }
    function escape(event) {
      if (event.key === "Escape") {
        if (exploreRef.current) exploreRef.current.open = false;
        if (mobileExploreRef.current) mobileExploreRef.current.open = false;
        setAccountOpen(false);
        setMobileOpen(false);
      }
    }
    function outsideAccount(event){
      if(accountRef.current&&!accountRef.current.contains(event.target))setAccountOpen(false);
    }
    document.addEventListener("pointerdown", outsideAccount);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outsideAccount);
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  function changeLanguage(event) {
    const search = window.location.search || "";
    const hash = window.location.hash || "";
    if (!search && !hash) return;
    event.preventDefault();
    window.location.assign(alternatePath(pathname, locale) + search + hash);
  }

  function AccountControls({mobile=false}){
    if(session.status==="loading")return <span className="dd-session-loading" aria-label={locale==="ar"?"جاري تحميل الحساب":"Loading account"}/>;
    if(session.status==="mfa_required")
      return <Link className="dd-auth-link dd-signup" href={pathFor("auth",locale)+"?mode=mfa"}>
        {locale==="ar"?"تأكيد الأمان":"Verify sign-in"}
      </Link>;
    if(session.status!=="authenticated")
      return <>
        <Link href={pathFor("auth",locale)} className="dd-auth-link">{t.login}</Link>
        <Link href={pathFor("register",locale)} className="dd-auth-link dd-signup">{t.signup}</Link>
      </>;
    const linkText=locale==="ar"?(session.role==="customer"?"حسابي":"بوابة الحساب"):(session.role==="customer"?"My Account":"Account Access");
    if(mobile)return <div className="dd-mobile-account">
      <strong title={userLabel}>{userLabel}</strong>
      <Link href={accountHref}>{linkText}</Link>
      {session.role==="customer"&&<Link href={pathFor("bookings",locale)}>{locale==="ar"?"حجوزاتي":"My Bookings"}</Link>}
      <button type="button" disabled={signoutBusy} onClick={logout}>
        {signoutBusy?(locale==="ar"?"جاري الخروج…":"Signing out…"):(locale==="ar"?"تسجيل الخروج":"Log out")}
      </button>
      {signoutError&&<small role="alert">{locale==="ar"?"تعذر تسجيل الخروج.":"Couldn't log out."}</small>}
    </div>;
    return <div className="dd-account-nav" ref={accountRef}>
      <button type="button" className="dd-account-trigger" aria-haspopup="menu"
        aria-expanded={accountOpen} aria-label={locale==="ar"?"فتح قائمة حسابي":"Open account menu"}
        onClick={()=>setAccountOpen(x=>!x)}>
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="8" r="4"/><path d="M4.5 21c.8-4.2 3.2-6.5 7.5-6.5s6.7 2.3 7.5 6.5"/>
        </svg>
      </button>
      {accountOpen&&<div className="dd-account-menu" role="menu">
        <div className="dd-account-menu-head" title={userLabel}>{userLabel}</div>
        <Link href={accountHref} role="menuitem" onClick={()=>setAccountOpen(false)}>{linkText}</Link>
        {session.role==="customer"&&<Link href={pathFor("bookings",locale)} role="menuitem"
          onClick={()=>setAccountOpen(false)}>{locale==="ar"?"حجوزاتي":"My Bookings"}</Link>}
        <button type="button" role="menuitem" disabled={signoutBusy} onClick={logout}>
          {signoutBusy?(locale==="ar"?"جاري الخروج…":"Signing out…"):(locale==="ar"?"تسجيل الخروج":"Log out")}
        </button>
        {signoutError&&<span role="alert">{locale==="ar"?"تعذر تسجيل الخروج.":"Couldn't log out."}</span>}
      </div>}
    </div>;
  }

  function NavLinks({ mobile = false }) {
    return (
      <>
        <Link className={"dd-nav-link" + (pathname === pathFor("home", locale) ? " is-active" : "")} href={pathFor("home", locale)}>{t.home}</Link>
        <details className={"dd-explore" + (activeExplore ? " is-active" : "") + (mobile ? " dd-explore-mobile" : "")} ref={mobile ? mobileExploreRef : exploreRef}
          onPointerEnter={event=>{
            if (!mobile && window.matchMedia("(hover:hover) and (pointer:fine) and (min-width:981px)").matches)
              event.currentTarget.open = true;
          }}
          onPointerLeave={event=>{
            if (!mobile && window.matchMedia("(hover:hover) and (pointer:fine) and (min-width:981px)").matches)
              event.currentTarget.open = false;
          }}>
          <summary aria-label={t.explore}>{t.explore}<span className="dd-chevron" aria-hidden="true">⌄</span></summary>
          <div className="dd-explore-menu">
            {exploreIds.map((id) => (
              <Link href={pathFor(id, locale)} key={id} className={pathname === pathFor(id, locale) ? "is-active" : ""}>{t[id]}</Link>
            ))}
          </div>
        </details>
        {primaryIds.slice(1).map((id) => {
          const href = pathFor(id, locale);
          const className = "dd-nav-link" + (pathname === href ? " is-active" : "");
          // Full page navigation for the dedicated Occasions route.
          // Avoid relying on an RSC client transition for this key link.
          return id === "occasions"
            ? <a key={id} href={href} className={className}>{t[id]}</a>
            : <Link key={id} className={className} href={href}>{t[id]}</Link>;
        })}
      </>
    );
  }

  return (
    <>
      <a className="dd-skip-link" href="#main-content">{t.skipToContent}</a>
      <header className="dd-header">
        <Link href={pathFor("home", locale)} className="dd-header-brand" aria-label={locale === "ar" ? "Dear Day — الرئيسية" : "Dear Day — Home"}>
          <img src="/assets/dear-day-wordmark.svg" alt="Dear Day" width="182" height="106" />
        </Link>
        <nav aria-label={t.navigation} className="dd-desktop-nav"><NavLinks /></nav>
        <div className="dd-header-actions">
          {!isCheckout&&<AccountControls/>}
          <Link href={alternatePath(pathname, locale)} onClick={changeLanguage} className="dd-language" aria-label={t.languageLabel} hrefLang={locale === "ar" ? "en" : "ar"}>{t.language}</Link>
        </div>
        <button
          className="dd-mobile-toggle"
          type="button"
          aria-label={mobileOpen ? t.closeMenu : t.openMenu}
          aria-expanded={mobileOpen}
          aria-controls="dd-mobile-navigation"
          onClick={() => setMobileOpen((open) => !open)}
        >
          <span/><span/><span/>
        </button>
      </header>
      <nav id="dd-mobile-navigation" aria-label={t.navigation} className={"dd-mobile-navigation" + (mobileOpen ? " is-open" : "")} hidden={!mobileOpen}>
        <NavLinks mobile />
        <div className="dd-mobile-actions">
          {!isCheckout&&<AccountControls mobile/>}
          <Link href={alternatePath(pathname, locale)} onClick={changeLanguage} className="dd-language">{t.language}</Link>
        </div>
      </nav>
    </>
  );
}
