import Link from "next/link";
import { pathFor } from "../lib/locales";

const picks=[
  {
    "key": "birthday",
    "image": "occasion-birthday.jpg",
    "ar": "عيد الميلاد",
    "en": "Birthday",
    "arDesc": "يوم مميز من الهدية والكيك لحد المكان والتفاصيل الصغيرة.",
    "enDesc": "Make the day special from the gift and cake to the venue and little details."
  },
  {
    "key": "anniversary",
    "image": "occasion-anniversary.jpg",
    "ar": "الذكرى السنوية",
    "en": "Anniversary",
    "arDesc": "رتّب تجربة رومانسية متكاملة تناسب قصتكم وذكرياتكم.",
    "enDesc": "Build a complete romantic experience around your story and memories."
  },
  {
    "key": "date_night",
    "image": "occasion-date-night.jpg",
    "ar": "Date Night",
    "en": "Date Night",
    "arDesc": "رتّب وقت لشخصين حول مكان أو تجربة، ومعاها الهدية والورد والحلويات لو حابب.",
    "enDesc": "Plan time for two around a place or experience, with gifts, flowers or sweets if you want them."
  },
  {
    "key": "proposal",
    "image": "occasion-proposal.jpg",
    "ar": "طلب الزواج",
    "en": "Proposal",
    "arDesc": "خطط لمفاجأة شخصية ومميزة من الفكرة وحتى التنفيذ.",
    "enDesc": "Create a personal surprise from the first idea through execution."
  }
];

const content={
  ar:{
    heading:"كل مناسبة ليها إحساسها الخاص",
    intro:"اختار المناسبة اللي بتحضّر لها، وDear Day هتاخدك خطوة بخطوة من اختيار الخدمات لحد مراجعة اليوم والحجز.",
    title:"اختار مناسبتك",
    sub:"ابدأ من واحدة من الرحلات الأساسية، وبعدها خصّص كل التفاصيل على ذوقك.",
    tag:"مناسبة",
    start:"ابدأ التخطيط",
    helpTitle:"مش متأكد تبدأ منين؟",
    helpText:"اختار أقرب مناسبة ليومك وإحنا هنساعدك تخصّص كل خطوة بعد كده.",
    helpLink:"شوف كيف نعمل"
  },
  en:{
    eyebrow:"Choose your occasion",
    heading:"Every occasion deserves its own feeling",
    intro:"Choose what you are planning, and Dear Day will guide you step by step from services and products to review and booking.",
    title:"Choose your occasion",
    sub:"Start with one of the core journeys, then personalize every detail to fit your day.",
    tag:"Occasion",
    start:"Start planning",
    helpTitle:"Not sure where to start?",
    helpText:"Choose the occasion that feels closest to your day and we will help you personalize the rest.",
    helpLink:"See how it works"
  }
};

const media="/approved-pages/assets/media/";
const sections="/approved-pages/assets/sections-20261004/";

export default function OccasionsPage({locale="ar"}) {
  const t=content[locale];
  return <main id="main-content" className="dd-occasions-page" dir={locale==="ar"?"rtl":"ltr"}>
    <section className="dd-occasions-hero">
      <div className="dd-occasions-wrap">
        <div className="dd-occasions-hero-box">
          <div className="dd-occasions-hero-copy">
            {t.eyebrow&&<div className="dd-occasions-eyebrow">{t.eyebrow}</div>}
            <h1>{t.heading}</h1>
            <p>{t.intro}</p>
          </div>
          <div className="dd-occasions-hero-art" aria-hidden="true">
            <img src={media+"birthday-hero.jpg"} alt="" />
            <img src={media+"occasion-tile.jpg"} alt="" />
            <img src={media+"occasion-gift.jpg"} alt="" />
          </div>
        </div>
      </div>
    </section>
    <section className="dd-occasions-section" aria-labelledby="dd-occasions-title">
      <div className="dd-occasions-wrap">
        <div className="dd-occasions-section-head">
          <h2 id="dd-occasions-title">{t.title}</h2>
          <p>{t.sub}</p>
        </div>
        <div className="dd-occasions-grid">
          {picks.map(item=><article className="dd-occasions-card" key={item.key}>
            <img className="dd-occasions-card-media" src={sections+item.image}
              alt={locale==="ar"?item.ar:item.en} loading="lazy"/>
            <div className="dd-occasions-card-content">
              <span className="dd-occasions-tag">{t.tag}</span>
              <h3>{locale==="ar"?item.ar:item.en}</h3>
              <p>{locale==="ar"?item.arDesc:item.enDesc}</p>
              <Link className="dd-occasions-start" href={pathFor("birthday",locale)+"?occasion="+encodeURIComponent(item.key)+"&flow=1"}>{t.start}</Link>
            </div>
          </article>)}
        </div>
        <aside className="dd-occasions-help">
          <div><h3>{t.helpTitle}</h3><p>{t.helpText}</p></div>
          <Link href={pathFor("howItWorks",locale)}>{t.helpLink}</Link>
        </aside>
      </div>
    </section>
  </main>;
}
