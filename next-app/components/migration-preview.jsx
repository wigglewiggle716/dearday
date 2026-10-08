import Link from "next/link";
import { dictionaries, pathFor } from "../lib/locales";

export function MigrationLanding({ locale }) {
  const t = dictionaries[locale];
  return (
    <main id="main-content" className="dd-main">
      <section className="dd-hero" aria-labelledby="dd-hero-title">
        <div className="dd-hero-ornament dd-ornament-first" aria-hidden="true">∿</div>
        <div className="dd-hero-content">
          <span className="dd-eyebrow">{t.previewKicker}</span>
          <img className="dd-hero-logo" src="/assets/dear-day-wordmark.svg" alt="Dear Day" width="360" height="209" />
          <h1 id="dd-hero-title">{t.homepageTitle}<span>{t.homepageSubtitle}</span></h1>
          <p>{t.homepageDescription}</p>
          <div className="dd-hero-actions">
            <Link href={pathFor("occasions", locale)} className="dd-primary-button">{t.occasions}</Link>
            <Link href={pathFor("howItWorks", locale)} className="dd-secondary-button">{t.howItWorks}</Link>
          </div>
        </div>
        <div className="dd-hero-ornament dd-ornament-second" aria-hidden="true">✦</div>
      </section>
      <section className="dd-preview-info">
        <p>{t.previewInfo}</p>
      </section>
    </main>
  );
}

export function MigrationPlaceholder({ locale, slug }) {
  const t = dictionaries[locale];
  const title = Object.entries({
    gifts:"gifts", cake:"cake",venues:"venues",flowers:"flowers",occasions:"occasions",
    "how-it-works":"howItWorks", partners:"partners",about:"about",faq:"faq",contact:"contact",
    privacy:"privacy",terms:"terms",refunds:"refunds",auth:"login",cart:"cart"
  }).find(([url]) => url === slug)?.[1];
  return (
    <main id="main-content" className="dd-main dd-placeholder">
      <div className="dd-placeholder-card">
        <p className="dd-eyebrow">{t.previewKicker}</p>
        <h1>{title && t[title] ? t[title] : t.previewSection}</h1>
        <h2>{t.previewSection}</h2>
        <p>{t.previewSectionInfo}</p>
        <Link className="dd-primary-button" href={pathFor("home", locale)}>{t.backHome}</Link>
      </div>
    </main>
  );
}
