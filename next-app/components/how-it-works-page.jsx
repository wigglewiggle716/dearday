import Link from "next/link";
import { pathFor } from "../lib/locales";

// Transcribed from the current production how-it-works.html and
// how-it-works-en.html (main SHA 5d97cc458910279646ec10a18ffecaca81a6854d).
// This is informational content, not a new checkout or booking flow.
const pageCopy = {
  ar: {
    eyebrow:"كيف نعمل",
    heroTitle:"من فكرة بسيطة ليوم متكامل.",
    heroDescription:"Dear Day بتجمع كل خطوات المناسبة في تجربة واحدة واضحة: تبدأ من المناسبة واحتياجاتك، تختار التفاصيل اللي تناسبك، تجمعها في سلة واحدة، وبعدها تراجع يومك كامل قبل التأكيد.",
    primaryHero:"ابدأ ترتيب مناسبتك", secondaryHero:"استكشف المناسبات",
    introTitle:"إحنا بنسهّل الرحلة، مش بنزود خطوات عليها.",
    introOpening:"بدل ما تفتح أكتر من مكان وتجمع تفاصيل اليوم بنفسك، ",
    introBold:"Dear Day بتخلي المكان، الهدية، شكولاته و كيك، الورد والتجارب",
    introEnding:" جزء من رحلة واحدة.",
    introSecond:"تقدر تبدأ من المناسبة نفسها، أو تدخل مباشرة على القسم اللي محتاجه. وفي الحالتين، اختياراتك تفضل متجمعة معاك لحد المراجعة النهائية.",
    steps:[
      {number:"01",title:"اختار المناسبة وحدّد الأساسيات",text:"اختار نوع المناسبة، المنطقة، التاريخ والميزانية التقريبية. المعلومات دي بتساعدنا نوجّهك لاختيارات أنسب بدل ما نعرض لك كل شيء بدون سياق.",chips:["نوع المناسبة","المنطقة","التاريخ","الميزانية"]},
      {number:"02",title:"اختار التفاصيل اللي تناسبك",text:"تنقّل بين الأقسام واجمع عناصر اليوم على ذوقك. مش لازم تختار كل حاجة؛ أنت بتحدد إيه المهم لمناسبتك وإيه اللي مش محتاجه.",chips:["أماكن وتجارب","هدايا","شكولاته و كيك","ورد"]},
      {number:"03",title:"أضف اختياراتك إلى My Cart",text:"أي عنصر تختاره يتجمع مع باقي تفاصيل يومك في السلة، وتفضل السلة معاك أثناء تنقلك بين الصفحات. تقدر ترجع، تغيّر اختيار، أو تضيف عنصر جديد قبل ما تكمل.",chips:["سلة موحدة","تعديل الاختيارات","متابعة الإجمالي"]},
      {number:"04",title:"راجع يومك كامل وأكّد الحجز",text:"في صفحة المراجعة تشوف كل اختياراتك وتفاصيل المناسبة والإجمالي في مكان واحد. بعد ما تتأكد إن كل حاجة مناسبة لك، تكمل خطوة تأكيد الحجز والمتابعة.",chips:["مراجعة كاملة","الإجمالي","تأكيد الحجز"]}
    ],
    waysTitle:"ابدأ بالطريقة الأنسب لك.",
    waysIntro:"رحلة Dear Day مرنة: تقدر تبدأ من المناسبة كلها، أو من منتج/خدمة محددة لو أنت عارف بالفعل إيه اللي محتاجه.",
    ways:[
      {number:"01",eyebrow:"الطريقة 01",title:"ابدأ من المناسبة",text:"أفضل اختيار لو عايز ترتّب اليوم من البداية للنهاية وتبني كل التفاصيل حوالين المناسبة والتاريخ والميزانية.",link:"ابدأ تنسيق المناسبة ←",destination:"planner"},
      {number:"02",eyebrow:"الطريقة 02",title:"ابدأ من قسم محدد",text:"لو محتاج هدية، كيك، ورد أو مكان فقط، ادخل مباشرة على القسم وأضف اللي يعجبك للسلة بدون ما تضطر تبدأ الرحلة الكاملة.",link:"استكشف الأقسام ←",destination:"gifts"}
    ],
    alongTheWay:"أثناء رحلتك",guaranteesTitle:"أنت دايمًا شايف الصورة كاملة.",
    guarantees:[
      {icon:"✓",title:"اختياراتك محفوظة",text:"العناصر اللي تضيفها تفضل في السلة أثناء انتقالك بين صفحات Dear Day."},
      {icon:"↺",title:"تقدر تعدّل قبل التأكيد",text:"ارجع لأي قسم وغيّر أو أضف عناصر قبل المراجعة النهائية."},
      {icon:"◎",title:"مراجعة موحدة",text:"تشوف تفاصيل يومك واختياراتك والإجمالي مع بعض قبل ما تكمل الحجز."}
    ],
    ready:"جاهز تبدأ ؟",ctaTitle:"خلّي يومك يتكوّن خطوة بخطوة.",
    ctaDescription:"اختار مناسبتك وابدأ من أول تفصيلة.",cta:"رتّب مناسبتي"
  },
  en: {
    eyebrow:"How It Works",
    heroTitle:"From a simple idea to a complete day.",
    heroDescription:"Dear Day brings the whole occasion journey into one clear experience: start with what you are celebrating, choose the details that fit, keep everything together in one cart, then review the full day before you confirm.",
    primaryHero:"Start Planning",secondaryHero:"Explore Occasions",
    introTitle:"We simplify the journey instead of adding more steps.",
    introOpening:"Instead of jumping between different places and piecing everything together yourself, ",
    introBold:"Dear Day brings venues, gifts, cakes and sweets, flowers and experiences",
    introEnding:" into one connected journey.",
    introSecond:"You can start with the occasion itself or jump straight into a category you already need. Either way, your choices stay together until the final review.",
    steps:[
      {number:"01",title:"Choose the occasion and set the basics",text:"Tell us what you are celebrating, the area, the date and your approximate budget. This helps shape the journey around what actually fits your day instead of showing everything without context.",chips:["Occasion","Area","Date","Budget"]},
      {number:"02",title:"Pick the details that fit you",text:"Move between categories and bring together the parts you want. You do not have to choose everything — the day is built around what matters to your occasion.",chips:["Venues & Experiences","Gifts","Chocolate & Cakes","Flowers"]},
      {number:"03",title:"Add your choices to My Cart",text:"Each item you choose stays with the rest of your day in one cart as you move across Dear Day. You can go back, change a choice or add something new before moving forward.",chips:["One cart","Edit choices","Track the total"]},
      {number:"04",title:"Review the full day and confirm the booking",text:"The review page brings together your selections, occasion details and total in one place. Once everything looks right, you can continue to booking confirmation and follow-up.",chips:["Full review","Total","Booking confirmation"]}
    ],
    waysTitle:"Start in the way that makes sense for you.",
    waysIntro:"Dear Day is flexible: plan the full occasion from the start, or jump into one category when you already know exactly what you need.",
    ways:[
      {number:"01",eyebrow:"Path 01",title:"Start with the occasion",text:"Best when you want to build the full day from the beginning and shape every detail around the occasion, date and budget.",link:"Start planning →",destination:"planner"},
      {number:"02",eyebrow:"Path 02",title:"Start with one category",text:"If you only need a gift, cake, flowers or a place, open that category directly and add what you like without starting the full occasion flow.",link:"Browse categories →",destination:"gifts"}
    ],
    alongTheWay:"Along the way",guaranteesTitle:"You always see the full picture.",
    guarantees:[
      {icon:"✓",title:"Your choices stay with you",text:"Items you add remain in your cart as you move between Dear Day pages."},
      {icon:"↺",title:"Edit before you confirm",text:"Return to any category and change or add items before the final review."},
      {icon:"◎",title:"One final review",text:"See your day details, selections and total together before continuing with the booking."}
    ],
    ready:"Ready to begin?",ctaTitle:"Build the day one detail at a time.",
    ctaDescription:"Choose the occasion and start with the first detail.",cta:"Plan My Occasion"
  }
};

export default function HowItWorksPage({locale="ar"}){
  const t=pageCopy[locale]||pageCopy.ar;
  const plannerHref=pathFor("home",locale)+"#occasions";
  const occasionsHref=pathFor("occasions",locale);
  const giftsHref=pathFor("gifts",locale);
  return <main id="main-content" className="dd-how-works" dir={locale==="ar"?"rtl":"ltr"}>
    <section className="dd-how-hero" aria-labelledby="dd-how-hero-title">
      <div className="dd-how-wrap">
        <div className="dd-how-hero-inner">
          <span className="dd-how-eyebrow">{t.eyebrow}</span>
          <h1 id="dd-how-hero-title">{t.heroTitle}</h1>
          <p>{t.heroDescription}</p>
          <div className="dd-how-hero-actions">
            <Link className="dd-how-primary" href={plannerHref}>{t.primaryHero}</Link>
            <Link className="dd-how-secondary" href={occasionsHref}>{t.secondaryHero}</Link>
          </div>
        </div>
      </div>
    </section>

    <section className="dd-how-intro" aria-labelledby="dd-how-intro-title">
      <div className="dd-how-wrap dd-how-intro-grid">
        <h2 id="dd-how-intro-title">{t.introTitle}</h2>
        <div className="dd-how-intro-copy">
          <p>{t.introOpening}<strong>{t.introBold}</strong>{t.introEnding}</p>
          <p>{t.introSecond}</p>
        </div>
      </div>
    </section>

    <section className="dd-how-journey" aria-label={locale==="ar"?"خطوات ترتيب المناسبة":"Occasion planning steps"}>
      <div className="dd-how-wrap">
        <div className="dd-how-steps">
          {t.steps.map((step)=><article className="dd-how-step" key={step.number}>
            <div className="dd-how-step-number">{step.number}</div>
            <div className="dd-how-step-body">
              <h3>{step.title}</h3>
              <p>{step.text}</p>
              <div className="dd-how-chips">
                {step.chips.map(chip=><span key={chip}>{chip}</span>)}
              </div>
            </div>
          </article>)}
        </div>
      </div>
    </section>

    <section className="dd-how-start-ways" aria-labelledby="dd-how-start-title">
      <div className="dd-how-wrap">
        <div className="dd-how-section-head">
          <h2 id="dd-how-start-title">{t.waysTitle}</h2>
          <p>{t.waysIntro}</p>
        </div>
        <div className="dd-how-way-grid">
          {t.ways.map(way=><article className="dd-how-way" key={way.number}>
            <small>{way.eyebrow}</small>
            <h3>{way.title}</h3>
            <p>{way.text}</p>
            <Link href={way.destination==="planner"?plannerHref:giftsHref}>{way.link}</Link>
            <div className="dd-how-way-index" aria-hidden="true">{way.number}</div>
          </article>)}
        </div>
      </div>
    </section>

    <section className="dd-how-guarantees" aria-labelledby="dd-how-guarantees-title">
      <div className="dd-how-wrap">
        <div className="dd-how-section-head">
          <span>{t.alongTheWay}</span>
          <h2 id="dd-how-guarantees-title">{t.guaranteesTitle}</h2>
        </div>
        <div className="dd-how-guarantee-grid">
          {t.guarantees.map(g=><article className="dd-how-guarantee" key={g.title}>
            <div className="dd-how-guarantee-icon" aria-hidden="true">{g.icon}</div>
            <h3>{g.title}</h3><p>{g.text}</p>
          </article>)}
        </div>
      </div>
    </section>

    <section className="dd-how-cta" aria-labelledby="dd-how-cta-title">
      <div className="dd-how-wrap">
        <div className="dd-how-cta-box">
          <div>
            <span>{t.ready}</span>
            <h2 id="dd-how-cta-title">{t.ctaTitle}</h2>
            <p>{t.ctaDescription}</p>
          </div>
          <Link className="dd-how-primary" href={plannerHref}>{t.cta}</Link>
        </div>
      </div>
    </section>
  </main>;
}
