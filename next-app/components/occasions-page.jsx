import Link from "next/link";
import { pathFor } from "../lib/locales";
import "./occasions-page.css";

// Copy and card order follow the approved Arabic and English Occasions pages.
const mediaRoot = "/approved-pages/assets/";
const entries = [
  {
    key: "birthday", image: "occasion-birthday.jpg",
    ar: { title:"عيد الميلاد", description:"يوم مميز من الهدية والكيك لحد المكان والتفاصيل الصغيرة." },
    en: { title:"Birthday", description:"Make the day special from the gift and cake to the venue and little details." }
  },
  {
    key: "anniversary", image: "occasion-anniversary.jpg",
    ar: { title:"الذكرى السنوية", description:"رتّب تجربة رومانسية متكاملة تناسب قصتكم وذكرياتكم." },
    en: { title:"Anniversary", description:"Build a complete romantic experience around your story and memories." }
  },
  {
    key: "date_night", image: "occasion-date-night.jpg",
    ar: { title:"Date Night", description:"رتّب وقت لشخصين حول مكان أو تجربة، ومعاها الهدية والورد والحلويات لو حابب." },
    en: { title:"Date Night", description:"Plan time for two around a place or experience, with gifts, flowers or sweets if you want them." }
  },
  {
    key: "proposal", image: "occasion-proposal.jpg",
    ar: { title:"طلب الزواج", description:"خطط لمفاجأة شخصية ومميزة من الفكرة وحتى التنفيذ." },
    en: { title:"Proposal", description:"Create a personal surprise from the first idea through execution." }
  }
];
const translations = {
  ar: {
    heading:"كل مناسبة ليها إحساسها الخاص",
    intro:"اختار المناسبة اللي بتحضّر لها، وDear Day هتاخدك خطوة بخطوة من اختيار الخدمات لحد مراجعة اليوم والحجز.",
    section:"اختار مناسبتك",
    sectionIntro:"ابدأ من واحدة من الرحلات الأساسية، وبعدها خصّص كل التفاصيل على ذوقك.",
    tag:"مناسبة", start:"ابدأ التخطيط",
    helpTitle:"مش متأكد تبدأ منين؟",
    helpIntro:"اختار أقرب مناسبة ليومك وإحنا هنساعدك تخصّص كل خطوة بعد كده.",
    helpLink:"شوف كيف نعمل"
  },
  en: {
    eyebrow:"Choose your occasion",
    heading:"Every occasion deserves its own feeling",
    intro:"Choose what you are planning, and Dear Day will guide you step by step from services and products to review and booking.",
    section:"Choose your occasion",
    sectionIntro:"Start with one of the core journeys, then personalize every detail to fit your day.",
    tag:"Occasion", start:"Start planning",
    helpTitle:"Not sure where to start?",
    helpIntro:"Choose the occasion that feels closest to your day and we will help you personalize the rest.",
    helpLink:"See how it works"
  }
};

export function OccasionsPage({ locale="ar" }) {
  const t=translations[locale] || translations.ar;
  return <main id="main-content" className="dd-occasions-page">
    <section className="dd-occasions-hero">
      <div className="dd-occasions-wrap">
        <div className="dd-occasions-hero-box">
          <div className="dd-occasions-hero-copy">
            {t.eyebrow && <div className="dd-occasions-eyebrow">{t.eyebrow}</div>}
            <h1>{t.heading}</h1>
            <p>{t.intro}</p>
          </div>
          <div className="dd-occasions-hero-art" aria-hidden="true">
            <img src={mediaRoot+"media/birthday-hero.jpg"} alt="" />
            <img src={mediaRoot+"media/occasion-tile.jpg"} alt="" />
            <img src={mediaRoot+"media/occasion-gift.jpg"} alt="" />
          </div>
        </div>
      </div>
    </section>
    <section className="dd-occasions-section" aria-labelledby="dd-occasions-section-title">
      <div className="dd-occasions-wrap">
        <div className="dd-occasions-section-heading">
          <h2 id="dd-occasions-section-title">{t.section}</h2>
          <p>{t.sectionIntro}</p>
        </div>
        <div className="dd-occasions-grid">
          {entries.map((entry)=>{
            const copy=entry[locale] || entry.ar;
            return <article key={entry.key} className="dd-occasions-card">
              <img className="dd-occasions-card-image" src={mediaRoot+"sections-20261004/"+entry.image} alt={copy.title} loading="lazy" />
              <div className="dd-occasions-card-content">
                <span className="dd-occasions-tag">{t.tag}</span>
                <h3>{copy.title}</h3>
                <p>{copy.description}</p>
                <Link className="dd-occasions-primary" href={pathFor("birthday",locale)+"?occasion="+encodeURIComponent(entry.key)+"&flow=1"}>{t.start}</Link>
              </div>
            </article>;
          })}
        </div>
        <div className="dd-occasions-help">
          <div><h3>{t.helpTitle}</h3><p>{t.helpIntro}</p></div>
          <Link className="dd-occasions-secondary" href={pathFor("howItWorks",locale)}>{t.helpLink}</Link>
        </div>
      </div>
    </section>
  </main>;
}
