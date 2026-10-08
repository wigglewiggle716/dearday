"use client";

import Link from "next/link";
import { useState } from "react";
import { CuratedCatalog } from "./live-catalog";
import OccasionDatePicker from "./occasion-date-picker";
import { useRouter } from "next/navigation";
import { pathFor } from "../lib/locales";

const media = "/approved-pages/assets/media/";
const homeMedia = "/approved-pages/assets/home/";

const copy = {
  ar: {
    heading: <>مناسبتك، بكل تفاصيلها،<br/>في مكان واحد</>,
    intro: <>بدل ما ترتّب كل تفصيلة لوحدها، Dear Day بتجمع لك <strong>المكان والتجربة، الهدية، شكولاته و كيك، والورد</strong> في تجربة واحدة تقدر تخصّصها على ذوقك وتراجعها في حجز واحد.</>,
    benefits: ["مكان وتجربة","هدية","شكولاته و كيك","ورد"],
    howTitle: "من فكرة بسيطة ليوم متكامل",
    how: [
      ["اختار مناسبتك","حدّد المناسبة والمنطقة والتاريخ علشان نبدأ من احتياجك الحقيقي."],
      ["كوّن يومك","اجمع المكان والهدية والكيك والورد في خطة واحدة، وعدّل أي تفصيلة براحتك."],
      ["راجع وأكّد","شوف يومك كامل، راجع كل الاختيارات والإجمالي، وبعدها أكمل الحجز."]
    ],
    plan: "ابدأ تنسيق يومك",
    occasionHeading: "اختار مناسبتك",
    occasions:["عيد ميلاد","ذكرى سنوية","Date Night","طلب زواج"],
    area:"المنطقة", chooseArea:"اختر منطقة", cairo:"القاهرة", giza:"الجيزة",
    date:"تاريخ المناسبة", chooseDate:"اختر التاريخ",
    budget:"الميزانية التقريبية", chooseBudget:"اختر ميزانية",
    budgets:[["under-1000","أقل من 1,000"],["1000-2500","1,000–2,500"],["2500-5000","2,500–5,000"],["5000-plus","5,000+"],["unsure","غير محدد"]],
    browse:"عرض الخيارات",
    directTitle:"محتاج حاجة محددة؟", directSubtitle:"لو عارف أنت محتاج إيه ادخل مباشرة على القسم",
    categories:[
      ["هدايا","اختيارات حسب المناسبة والشخص والميزانية"],
      ["شكولاته و كيك","تورت، حلويات وبوكسات"],
      ["ورد","بوكيهات، بوكسات وفازات"],
      ["أماكن وتجارب","أماكن وتجارب لليوم نفسه"]
    ],
    curated:"مختارات من Dear Day جاهزة ليومك",
    curatedNote:"اختيارات من كل قسم تقدر تضيفها للسلة مباشرة.",
    viewAll:"عرض كل",
    previewNote:"معاينة للمنتجات الموجودة بواجهة الموقع القديم؛ المنتجات الحية والسلة لم يتم نقلهما بعد.",
    partners:"شركاء بيكمّلوا يومك",
    partnerInfo:"براندات، محلات وأماكن من الفئات الموجودة حاليًا على Dear Day — وكل ما الشبكة تكبر، الاختيارات قدامك بتكبر معاها.",
    join:"انضم كشريك",
    categoriesShort:["هدايا","شكولاته و كيك","ورد","أماكن وتجارب"],
    view:"تصفح القسم", choose:"اعرض التفاصيل"
  },
  en: {
    heading: <>Your occasion. Every detail.<br/>All in one place.</>,
    intro: <>Instead of juggling every detail separately, Dear Day brings your <strong>venue or experience, gift, cake and sweets, and flowers</strong> into one thoughtful plan you can shape around your style and review in one place.</>,
    benefits:["Venue & Experience","Gift","Chocolate & Cakes","Flowers"],
    howTitle:"From a simple idea to a day that feels complete",
    how:[
      ["Choose the occasion","Tell us what you are celebrating, where and when, so we can start with what fits your day."],
      ["Build your day","Bring the venue, gift, cake and flowers into one plan, then fine-tune every detail your way."],
      ["Review and confirm","See the full plan, review your choices and total, then move forward with confidence."]
    ],
    plan:"Start Planning",
    occasionHeading:"What are you celebrating?",
    occasions:["Birthday","Anniversary","Date Night","Proposal"],
    area:"Area",chooseArea:"Choose an area",cairo:"Cairo",giza:"Giza",
    date:"Occasion date",chooseDate:"Choose a date",
    budget:"Estimated budget",chooseBudget:"Choose a budget",
    budgets:[["under-1000","Under 1,000"],["1000-2500","1,000–2,500"],["2500-5000","2,500–5,000"],["5000-plus","5,000+"],["unsure","Not sure yet"]],
    browse:"Show options",
    directTitle:"Looking for something specific?",directSubtitle:"If you already know what you need, go directly to the section.",
    categories:[
      ["Gifts","By occasion, recipient and budget"],
      ["Chocolate & Cakes","Cakes, desserts and boxes"],
      ["Flowers","Bouquets, boxes and vases"],
      ["Places & Experiences","Places and experiences for your day"]
    ],
    curated:"Dear Day picks ready for your day",
    curatedNote:"Handpicked options from every category, ready to add to your cart.",
    viewAll:"View all",
    previewNote:"Preview of products from the current site. Live catalog and cart have not been migrated yet.",
    partners:"Partners who complete your day",
    partnerInfo:"Brands, shops and places across Dear Day's current categories. As the network grows, your choices grow with it.",
    join:"Become a partner",
    categoriesShort:["Gifts","Chocolate & Cakes","Flowers","Places & Experiences"],
    view:"Browse category",choose:"Explore details"
  }
};
const occasions = [
  { key:"birthday", icon:<><path d="M12 24h40v30H12zM9 36q6 8 12 0q6 8 12 0q6 8 12 0q6 8 10 0M18 24V14m14 10V14m14 10V14M8 54h48M18 9v-3m14 3V6m14 3V6"/></> },
  { key:"anniversary",icon:<path d="M31 46 10 26C-1 10 18 4 27 17 37 2 53 13 45 27L31 46zM39 35q10-15 18-6t-10 26L34 44"/> },
  { key:"date_night", icon:<><path d="M42 11a20 20 0 1 0 11 35A23 23 0 0 1 42 11z"/><path d="m48 16 1.7 3.3L53 21l-3.3 1.7L48 26l-1.7-3.3L43 21l3.3-1.7L48 16z"/></> },
  { key:"proposal",icon:<><circle cx="32" cy="38" r="17"/><path d="m32 21-8-10 8-6 8 6-8 10M24 11h16"/></> }
];
const categoryIds=["gifts","cake","flowers","venues"];
const categoryImages=["occasion-gift.jpg","birthday-cake.jpg","flowers-bouquet.jpg","occasion-venue.jpg"];
const partnerNames=[
  ["The Gift Studio","Gifts"],["Luna Silver","Jewelry"],["Maison DD","Gifts"],["Roses & More","Flowers"],
  ["Bloom & Co.","Flowers"],["Velvet Bakery","Cakes"],["Little Whisk","Cakes"],["Bake & Bloom","Cakes"],
  ["Skyline Rooftop","Venue"],["Maison Garden","Venue"],["Lumière Dining","Dining"],["Candle Room","Experience"]
];
const showcases=[
  [{src:homeMedia+"gift-flowers.png",labelAr:"باقة ورد أنيقة",labelEn:"Elegant bouquet"},
   {src:media+"occasion-gift.jpg",labelAr:"اختيارات هدايا",labelEn:"Gift selection"},
   {src:media+"custom-gift-box.jpg",labelAr:"بوكس هدايا",labelEn:"Gift box"}],
  [{src:homeMedia+"gift-chocolate.png",labelAr:"بوكس شوكولاته",labelEn:"Chocolate gift box"},
   {src:media+"birthday-cake.jpg",labelAr:"تورتة عيد ميلاد",labelEn:"Birthday cake"},
   {src:media+"cake-chocolate-premium.jpg",labelAr:"كيك شوكولاته",labelEn:"Chocolate cake"}],
  [{src:homeMedia+"gift-flowers.png",labelAr:"باقة ورد",labelEn:"Flower bouquet"},
   {src:media+"flowers-bouquet.jpg",labelAr:"بوكيه ورد",labelEn:"Flowers"}],
  [{src:homeMedia+"experience-dinner.png",labelAr:"عشاء على السطح",labelEn:"Rooftop dinner"},
   {src:media+"venue-01.jpg",labelAr:"تجربة عشاء",labelEn:"Dining experience"},
   {src:media+"venue-02.jpg",labelAr:"مكان وتجربة",labelEn:"Venue & experience"}]
];

function Planner({ locale, t }) {
  const router=useRouter();
  const [occasion,setOccasion]=useState("");
  const [area,setArea]=useState("");
  const [date,setDate]=useState("");
  const [budget,setBudget]=useState("");
  const ready=Boolean(occasion&&area&&date&&budget);
  function submit(event) {
    event.preventDefault();
    if(!ready)return;
    const selection={occasionKey:occasion,area,date,budget,budgetKey:budget};
    try {localStorage.setItem("dearDayPlan",JSON.stringify(selection));}catch{}
    router.push(pathFor("occasions",locale));
  }
  return (
    <section className="dd-home-container dd-occasion-planner" id="occasions" aria-labelledby="dd-planner-title">
      <h2 id="dd-planner-title">{t.occasionHeading}</h2>
      <div className="dd-home-occasions" role="group" aria-label={t.occasionHeading}>
        {occasions.map((x,i)=><button type="button" key={x.key} aria-pressed={occasion===x.key} onClick={()=>setOccasion(x.key)} className="dd-home-occasion">
          <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" aria-hidden="true">{x.icon}</svg>
          <span>{t.occasions[i]}</span>
        </button>)}
      </div>
      <form className="dd-home-filters" onSubmit={submit}>
        <label className="dd-home-branded-select-field">{t.area}
          <span className="dd-home-branded-select-control">
            <select value={area} onChange={e=>setArea(e.target.value)} required>
              <option value="">{t.chooseArea}</option><option value="القاهرة">{t.cairo}</option><option value="الجيزة">{t.giza}</option>
            </select>
            <span className="dd-home-branded-select-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 21s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/>
              </svg><span>⌄</span>
            </span>
          </span>
        </label>
        <OccasionDatePicker locale={locale} value={date} onChange={setDate} label={t.date} placeholder={t.chooseDate}/>
        <label className="dd-home-branded-select-field">{t.budget}
          <span className="dd-home-branded-select-control">
            <select value={budget} onChange={e=>setBudget(e.target.value)} required>
              <option value="">{t.chooseBudget}</option>
              {t.budgets.map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select>
            <span className="dd-home-branded-select-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7.5h18M3 12h18M3 16.5h12"/><path d="M17.5 14.5v5m-2.5-2.5h5"/>
              </svg><span>⌄</span>
            </span>
          </span>
        </label>
        <button className="dd-home-submit" type="submit" disabled={!ready}>{t.browse}</button>
      </form>
    </section>
  );
}

function DirectCategories({locale,t}) {
  return <section className="dd-home-direct" id="direct-categories">
    <div className="dd-home-container">
      <header><h2>{t.directTitle}</h2><p>{t.directSubtitle}</p></header>
      <div className="dd-home-direct-grid">
        {categoryIds.map((id,i)=><Link key={id} className="dd-home-category" href={pathFor(id,locale)}>
          <img src={media+categoryImages[i]} alt={t.categories[i][0]} loading="lazy"/>
          <div><strong>{t.categories[i][0]}</strong><small>{t.categories[i][1]}</small></div>
        </Link>)}
      </div>
    </div>
  </section>;
}

function Partners({locale,t}) {
  return <section className="dd-home-partners" id="partners">
    <div className="dd-home-container">
      <div className="dd-home-partner-heading"><div><h2>{t.partners}</h2><p>{t.partnerInfo}</p></div>
        <Link href={pathFor("partners",locale)}>{t.join}</Link>
      </div>
    </div>
    <div className="dd-home-partner-marquee" aria-label={t.partners}>
      <div className="dd-home-partner-track">
        {[0,1].map(copyNo=><div className="dd-home-partner-set" key={copyNo} aria-hidden={copyNo===1}>
          {partnerNames.map(([name,kind])=><div className="dd-home-partner-card" key={name}><strong>{name}</strong><span>{kind}</span></div>)}
        </div>)}
      </div>
    </div>
  </section>;
}

export default function HomeContent({locale}) {
  const t=copy[locale];
  return <main id="main-content" className="dd-main dd-home" dir={locale==="ar"?"rtl":"ltr"}>
    <section className="dd-home-hero" aria-labelledby="dd-home-intro">
      <img className="dd-home-ornament dd-home-loop" src={homeMedia+"hero-loop.png"} alt="" aria-hidden="true"/>
      <img className="dd-home-ornament dd-home-swoosh" src={homeMedia+"hero-swoosh.png"} alt="" aria-hidden="true"/>
      <div className="dd-home-hero-content">
        <img className="dd-home-hero-logo" src="/assets/dear-day-wordmark.svg" alt="Dear Day" width="430" height="250" />
        <h1 id="dd-home-intro">{t.heading}</h1>
        <p>{t.intro}</p>
        <div className="dd-home-benefits">{t.benefits.map((x,i)=><span key={x}>{i>0&&<i aria-hidden="true">+</i>}{x}</span>)}</div>
        <div className="dd-home-how">
          <h2>{t.howTitle}</h2>
          <div className="dd-home-how-grid">{t.how.map(([title,desc],i)=><div key={title} className="dd-home-how-step"><b>{String(i+1).padStart(2,"0")}</b><strong>{title}</strong><span>{desc}</span></div>)}</div>
        </div>
        <a href="#occasions" className="dd-home-primary">{t.plan}</a>
      </div>
    </section>
    <Planner locale={locale} t={t}/>
    <DirectCategories locale={locale} t={t}/>
    <CuratedCatalog locale={locale} t={t}/>
    <Partners locale={locale} t={t}/>
  </main>;
}
