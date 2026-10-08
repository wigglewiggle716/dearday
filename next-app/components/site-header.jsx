"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { alternatePath, dictionaries, pathFor } from "../lib/locales";

const exploreIds = ["gifts", "cake", "venues", "flowers"];
const primaryIds = ["home", "occasions", "howItWorks", "partners"];

export default function SiteHeader({ locale }) {
  const t = dictionaries[locale];
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const exploreRef = useRef(null);
  const mobileExploreRef = useRef(null);
  const activeExplore = exploreIds.some((id) => pathname === pathFor(id, locale));

  useEffect(() => {
    setMobileOpen(false);
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
        setMobileOpen(false);
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
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

  function NavLinks({ mobile = false }) {
    return (
      <>
        <Link className={"dd-nav-link" + (pathname === pathFor("home", locale) ? " is-active" : "")} href={pathFor("home", locale)}>{t.home}</Link>
        <details className={"dd-explore" + (activeExplore ? " is-active" : "") + (mobile ? " dd-explore-mobile" : "")} ref={mobile ? mobileExploreRef : exploreRef}>
          <summary aria-label={t.explore}>{t.explore}<span className="dd-chevron" aria-hidden="true">⌄</span></summary>
          <div className="dd-explore-menu">
            {exploreIds.map((id) => (
              <Link href={pathFor(id, locale)} key={id} className={pathname === pathFor(id, locale) ? "is-active" : ""}>{t[id]}</Link>
            ))}
          </div>
        </details>
        {primaryIds.slice(1).map((id) => (
          <Link key={id} className={"dd-nav-link" + (pathname === pathFor(id, locale) ? " is-active" : "")} href={pathFor(id, locale)}>{t[id]}</Link>
        ))}
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
          <Link href={pathFor("auth", locale) + "#login"} className="dd-auth-link">{t.login}</Link>
          <Link href={pathFor("auth", locale) + "#signup"} className="dd-auth-link dd-signup">{t.signup}</Link>
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
          <Link href={pathFor("auth", locale) + "#login"} className="dd-auth-link">{t.login}</Link>
          <Link href={pathFor("auth", locale) + "#signup"} className="dd-auth-link dd-signup">{t.signup}</Link>
          <Link href={alternatePath(pathname, locale)} onClick={changeLanguage} className="dd-language">{t.language}</Link>
        </div>
      </nav>
    </>
  );
}
