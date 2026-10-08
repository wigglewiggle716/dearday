import Link from "next/link";
import { dictionaries, pathFor } from "../lib/locales";

export default function SiteFooter({ locale }) {
  const t = dictionaries[locale];
  const groups = [
    { title: t.servicesTitle, ids: ["occasions", "gifts", "cake", "venues", "flowers"] },
    { title: t.aboutTitle, ids: ["about", "howItWorks", "partners"] },
    { title: t.supportTitle, ids: ["faq", "contact", "refunds"] },
  ];
  return (
    <footer className="dd-footer">
      <div className="dd-footer-inner">
        <div className="dd-footer-top">
          <div className="dd-footer-brand">
            <Link href={pathFor("home", locale)} aria-label={t.home}>
              <img src="/assets/dear-day-wordmark.svg" alt="Dear Day" width="157" height="91" />
            </Link>
            <p>{t.footerNote}</p>
          </div>
          {groups.map((group) => (
            <div className="dd-footer-group" key={group.title}>
              <h2>{group.title}</h2>
              {group.ids.map((id) => <Link href={pathFor(id, locale)} key={id}>{t[id]}</Link>)}
            </div>
          ))}
        </div>
        <div className="dd-footer-bottom">
          <span>{t.copyright}</span>
          <div className="dd-footer-legal">
            <Link href={pathFor("privacy", locale)}>{t.privacy}</Link>
            <span aria-hidden="true">·</span>
            <Link href={pathFor("terms", locale)}>{t.terms}</Link>
          </div>
          <span className="dd-footer-preview">{t.previewBadge}</span>
        </div>
      </div>
    </footer>
  );
}
