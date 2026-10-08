"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { dictionaries, pathFor } from "../lib/locales";

const socials = [
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "x", label: "X" },
  { id: "youtube", label: "YouTube" },
  { id: "snapchat", label: "Snapchat" },
  { id: "linkedin", label: "LinkedIn" },
];

function SocialIcon({ id }) {
  if (id === "x") return <span className="dd-social-letter dd-social-x" aria-hidden="true">𝕏</span>;
  if (id === "linkedin") return <span className="dd-social-letter" aria-hidden="true">in</span>;
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      {id === "facebook" && <path fill="currentColor" stroke="none" d="M14.3 20v-7h2.4l.4-3h-2.8V8.4c0-1 .35-1.5 1.5-1.5h1.5V4.1c-.5-.1-1.4-.1-2.2-.1-2.7 0-4.4 1.6-4.4 4.5V10H8v3h2.7v7h3.6Z" />}
      {id === "instagram" && <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".9" fill="currentColor" stroke="none" /></>}
      {id === "youtube" && <><rect x="2.5" y="5.5" width="19" height="13" rx="4.2" /><path d="m10 9 5.6 3-5.6 3z" fill="currentColor" stroke="none" /></>}
      {id === "snapchat" && <path d="M12 3.1c-2.8 0-4.8 2.1-4.8 5.1v3.6c-.5.4-1.1.5-1.7.1-.4-.2-.9-.1-1.1.3-.2.5.1.9.6 1.1.9.3 1.6.5 2 1.3.6 1.2 1.3 1.7 2.8 1.9.1.6.5 1 1 1h2.4c.5 0 .9-.4 1-1 1.5-.2 2.2-.7 2.8-1.9.4-.8 1.1-1 2-1.3.5-.2.8-.6.6-1.1-.2-.4-.7-.5-1.1-.3-.6.4-1.2.3-1.7-.1V8.2c0-3-2-5.1-4.8-5.1Z" />}
    </svg>
  );
}

function PaymentBrand({ id }) {
  if (id === "visa") return <span className="dd-pay-brand dd-pay-visa" role="img" aria-label="Visa">VISA</span>;
  if (id === "mastercard") return (
    <span className="dd-pay-brand dd-pay-mastercard" role="img" aria-label="Mastercard">
      <svg viewBox="0 0 50 30" width="46" height="27" aria-hidden="true"><circle cx="19" cy="15" r="12" fill="#eb001b"/><circle cx="31" cy="15" r="12" fill="#f79e1b"/><path d="M25 5.5a12 12 0 0 0 0 19A12 12 0 0 0 25 5.5Z" fill="#ff5f00"/></svg>
    </span>
  );
  if (id === "apple") return (
    <span className="dd-pay-brand dd-pay-text" role="img" aria-label="Apple Pay">
      <svg viewBox="0 0 20 24" width="15" height="19" fill="currentColor" aria-hidden="true">
        <path d="M14.3 4.4c.9-1 1.5-2.4 1.4-3.8-1.3.1-2.8.9-3.7 1.9-.9.9-1.6 2.4-1.4 3.7 1.5.1 2.8-.7 3.7-1.8ZM17.6 17.7c-.5 1.2-.8 1.7-1.5 2.8-.9 1.2-2.1 2.7-3.5 2.7-1.2 0-1.6-.8-3.5-.8s-2.4.8-3.6.8c-1.3.1-2.3-1.3-3.2-2.6C.6 18.1-.6 13.4 1.7 9.8c1.1-1.8 3-2.9 5-2.9 1.5 0 2.7.8 3.5.8.7 0 2.2-1 4- .9 1.6.1 3.1.9 4.1 2.2-3.6 2-3.1 6.8-.7 8.7Z"/>
      </svg>Pay
    </span>
  );
  if (id === "google") return (
    <span className="dd-pay-brand dd-pay-text" role="img" aria-label="Google Pay"><strong className="dd-pay-google-g">G</strong> Pay</span>
  );
  return (
    <span className="dd-pay-brand" role="img" aria-label="Bank card">
      <svg viewBox="0 0 32 24" width="27" height="22" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="2" y="3" width="28" height="18" rx="3"/><path d="M2 9h28M6 16h10"/></svg>
    </span>
  );
}

function BackToTop({ label }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const check = () => setVisible(window.scrollY > 400);
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);
  if (!visible) return null;
  return (
    <button
      className="dd-back-to-top"
      type="button"
      aria-label={label}
      title={label}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 10 6-6 6 6M12 4v16"/></svg>
    </button>
  );
}


function FooterGroup({ title, ids, t, locale }) {
  const [expanded, setExpanded] = useState(true);
  const id = useId();

  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const onChange = () => setExpanded(!media.matches);
    onChange();
    if (media.addEventListener) {
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    }
    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  return (
    <div className="dd-footer-group">
      <h2>
        <button type="button" className="dd-footer-section-toggle" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(v => !v)}>
          <span>{title}</span>
          <svg className={expanded ? "dd-footer-chevron is-open" : "dd-footer-chevron"} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>
      </h2>
      <div id={id} className="dd-footer-submenu" hidden={!expanded}>
        {ids.map((item) => <Link href={pathFor(item, locale)} key={item}>{t[item]}</Link>)}
      </div>
    </div>
  );
}

export default function SiteFooter({ locale }) {
  const t = dictionaries[locale];
  const groups = [
    { title: t.planYourDay, ids: ["home", "occasions", "gifts", "cake", "flowers", "venues"] },
    { title: t.aboutTitle, ids: ["about", "howItWorks", "partners"] },
    { title: t.supportTitle, ids: ["faq", "contact", "refunds", "deleteAccount"] },
  ];

  function brandClick(event) {
    if (typeof window !== "undefined" && window.location.pathname === pathFor("home", locale)) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <>
      <footer className="dd-footer">
        <div className="dd-footer-inner">
          <div className="dd-footer-top">
            <div className="dd-footer-brand">
              <Link href={pathFor("home", locale)} onClick={brandClick} aria-label={t.home}>
                <img src="/assets/dear-day-wordmark.svg" alt="Dear Day" width="170" height="99" />
              </Link>
              <p>{t.footerNote}</p>
            </div>
            {groups.map(group => <FooterGroup key={group.title} title={group.title} ids={group.ids} t={t} locale={locale}/>)}
          </div>

          <div className="dd-footer-strip dd-footer-socials" aria-label={t.socialTitle}>
            <strong>{t.socialTitle}</strong>
            <div className="dd-social-list">
              {socials.map(({ id, label }) => (
                <span className="dd-social-icon" key={id} role="img" aria-label={label} title={label}>
                  <SocialIcon id={id} />
                </span>
              ))}
            </div>
          </div>

          <div className="dd-footer-strip dd-footer-payments" aria-label={t.paymentTitle}>
            <strong>{t.paymentTitle}</strong>
            <div className="dd-pay-list" title={t.paymentDisplayNote}>
              {["visa", "mastercard", "apple", "google", "card"].map(id => <PaymentBrand id={id} key={id}/>)}
            </div>
          </div>

          <div className="dd-footer-bottom">
            <span>{t.copyright}</span>
            <div className="dd-footer-legal">
              <Link href={pathFor("privacy", locale)}>{t.privacy}</Link>
              <span aria-hidden="true">·</span>
              <Link href={pathFor("terms", locale)}>{t.terms}</Link>
            </div>
          </div>
        </div>
      </footer>
      <BackToTop label={t.backToTop} />
    </>
  );
}
