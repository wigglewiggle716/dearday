import Link from "next/link";
import { pathFor } from "../lib/locales";

// Original bilingual FAQ text, sequence and layout sourced from faq.html and
// faq-en.html on production main 5d97cc458910279646ec10a18ffecaca81a6854d.
// The unfinished WhatsApp number is intentionally not copied into this site.
// Native <details name="dd-faq-single-open"> supports keyboard and exclusive open.
function ArabicFaq(){
  return (
<main id="main-content" className="dd-faq-page" dir="rtl">
<section className="faq-hero"><div className="wrap"><div className="hero-inner"><span className="eyebrow">Frequently asked questions</span><h1>الأسئلة المتكررة</h1><p>كل اللي ممكن تحتاج تعرفه قبل ما تبدأ ترتيب مناسبتك — من طريقة عمل Dear Day، للحجز والتعديل والدفع وتنفيذ اليوم.</p></div></div></section>
<section className="faq-shell"><div className="wrap faq-layout">
<div className="faq-content">
<section className="faq-group" id="about"><div className="group-head"><h2>عن Dear Day</h2></div><div className="accordion">
<details name="dd-faq-single-open"><summary><span className="q-num">01</span><span>ما هي Dear Day؟</span><span className="q-plus" aria-hidden="true"></span></summary><div className="answer"><p>Dear Day هي منصة لتخطيط وتنسيق المناسبات المهمة في مكان واحد. تقدر تبدأ بالمناسبة والميزانية والمنطقة، وبعدها تجمع تفاصيل اليوم من هدايا، شكولاته و كيك، أماكن وتجارب، وورد أو إضافات مناسبة.</p></div></details>
<details name="dd-faq-single-open"><summary><span className="q-num">02</span><span>هل Dear Day متجر هدايا فقط؟</span><span className="q-plus" aria-hidden="true"></span></summary><div className="answer"><p>لا. الفكرة الأساسية هي تنسيق اليوم ككل، لكن تقدر كمان تدخل مباشرة على قسم معين وتختار عنصر واحد فقط لو ده اللي محتاجه.</p></div></details>
<details name="dd-faq-single-open"><summary><span className="q-num">03</span><span>الخدمة متاحة فين حاليًا؟</span><span className="q-plus" aria-hidden="true"></span></summary><div className="answer"><p>الانطلاقة الحالية مركزة على القاهرة والجيزة. الخيارات اللي بتظهر لك بتتغير حسب المنطقة وتوفر الشركاء والخدمات فيها.</p></div></details>
<details name="dd-faq-single-open"><summary><span className="q-num">04</span><span>هل لازم أحدد مناسبة من البداية؟</span><span className="q-plus" aria-hidden="true"></span></summary><div className="answer"><p>مش لازم. تقدر تبدأ من المناسبة لو عايز Dear Day تبني لك التجربة حول اليوم كله، أو تبدأ مباشرة من هدية أو كيك أو مكان وتجربة وتكمل باقي التفاصيل بعدين.</p></div></details>
</div></section>
<section className="faq-group" id="booking"><div className="group-head"><h2>الحجز والتعديل</h2></div><div className="accordion">
<details name="dd-faq-single-open"><summary><span className="q-num">05</span><span>إزاي أبدأ ترتيب مناسبتي؟</span><span className="q-plus" aria-hidden="true"></span></summary><div className="answer"><p>اختار نوع المناسبة أو القسم اللي عايز تبدأ منه، وبعدها حدد المنطقة والتاريخ والميزانية لو كانوا معروفين. هنستخدم الاختيارات دي علشان نعرض لك اقتراحات أنسب.</p></div></details>
<details name="dd-faq-single-open"><summary><span className="q-num">06</span><span>هل أقدر أضيف أكثر من عنصر لنفس المناسبة؟</span><span className="q-plus" aria-hidden="true"></span></summary><div className="answer"><p>نعم. تقدر تجمع أكثر من اختيار في السلة — مثل مكان، هدية، كيك أو تجربة — وتراجعهم كلهم قبل تأكيد الحجز.</p></div></details>
<details name="dd-faq-single-open"><summary><span className="q-num">07</span><span>هل أقدر أعدل اختياراتي قبل الحجز؟</span><span className="q-plus" aria-hidden="true"></span></summary><div className="answer"><p>نعم، تقدر تضيف أو تشيل اختياراتك قبل تأكيد الحجز. بعد التأكيد، إمكانية التعديل بتعتمد على حالة الطلب وسياسة الشريك المسؤول عن العنصر.</p></div></details>
<details name="dd-faq-single-open"><summary><span className="q-num">08</span><span>هل لازم أعمل حساب علشان أستخدم Dear Day؟</span><span className="q-plus" aria-hidden="true"></span></summary><div className="answer"><p>تقدر تتصفح وتكوّن اختياراتك من غير حساب. تسجيل الدخول بيكون مفيد لحفظ الحجوزات والرجوع لها ومتابعة تفاصيلها بسهولة.</p></div></details>
</div></section>
<section className="faq-group" id="payment"><div className="group-head"><h2>الدفع</h2></div><div className="accordion">
<details name="dd-faq-single-open"><summary><span className="q-num">09</span><span>إيه طرق الدفع المتاحة؟</span><span className="q-plus" aria-hidden="true"></span></summary><div className="answer"><p>طرق الدفع المتاحة بتظهر لك بوضوح في خطوة الدفع حسب نوع الحجز والخدمة. الدفع الإلكتروني بيتم من خلال مزود دفع آمن.</p></div></details>
<details name="dd-faq-single-open"><summary><span className="q-num">10</span><span>هل الأسعار اللي بشوفها نهائية؟</span><span className="q-plus" aria-hidden="true"></span></summary><div className="answer"><p>بنوضح سعر كل عنصر قبل إضافته للسلة، وأي رسوم إضافية مرتبطة بالتوصيل أو الخدمة بتظهر قبل تأكيد الدفع.</p></div></details>
<details name="dd-faq-single-open"><summary><span className="q-num">11</span><span>إزاي بيتم الاسترداد لو ألغيت؟</span><span className="q-plus" aria-hidden="true"></span></summary><div className="answer"><p>الاسترداد بيعتمد على توقيت الإلغاء، حالة التجهيز، وسياسة الشريك وطريقة الدفع المستخدمة. التفاصيل النهائية بتكون واضحة قبل تأكيد الحجز وفي سياسة الإلغاء والاسترداد.</p></div></details>
</div></section>
<section className="faq-group" id="delivery"><div className="group-head"><h2>التنفيذ والدعم</h2></div><div className="accordion">
<details name="dd-faq-single-open"><summary><span className="q-num">12</span><span>هل أقدر أحدد يوم المناسبة ووقت التنفيذ؟</span><span className="q-plus" aria-hidden="true"></span></summary><div className="answer"><p>تقدر تحدد التاريخ من بداية الرحلة. خيارات الوقت أو الفترات المتاحة بتظهر حسب نوع الخدمة والشريك المختار.</p></div></details>
<details name="dd-faq-single-open"><summary><span className="q-num">13</span><span>هل كل العناصر بتوصل في نفس الوقت؟</span><span className="q-plus" aria-hidden="true"></span></summary><div className="answer"><p>مش بالضرورة. بعض العناصر ممكن يكون لها تجهيز أو توصيل مختلف، لكن Dear Day بتجمع لك تفاصيل اليوم في مراجعة واحدة علشان تكون الصورة واضحة قبل التأكيد.</p></div></details>
<details name="dd-faq-single-open"><summary><span className="q-num">14</span><span>إزاي أعرف حالة حجزي؟</span><span className="q-plus" aria-hidden="true"></span></summary><div className="answer"><p>بعد تأكيد الحجز، تفاصيل الحجز والتحديثات المرتبطة به بتكون متاحة من حسابك وحجوزاتك، بالإضافة لأي تحديثات مهمة مرتبطة بالتنفيذ.</p></div></details>
<details name="dd-faq-single-open"><summary><span className="q-num">15</span><span>ماذا أفعل لو عندي طلب خاص أو سؤال مش موجود هنا؟</span><span className="q-plus" aria-hidden="true"></span></summary><div className="answer"><p>لو عندك طلب خاص أو محتاج مساعدة في اختيار الأنسب، تقدر تتواصل مع خدمة العملاء، وهنساعدك في توضيح الخيارات المتاحة حسب المناسبة والمنطقة والميزانية.</p></div></details>
</div></section>
<div className="faq-help"><div><h2>لسه عندك سؤال؟</h2><p>لو إجابة سؤالك مش موجودة هنا، تواصل مع فريق Dear Day من صفحة تواصل معنا وهنساعدك.</p></div><Link className="help-btn" href={pathFor("contact","ar")}>تواصل معنا</Link></div>
</div></div></section>
</main>
  );
}
function EnglishFaq(){
  return (
<main id="main-content" className="dd-faq-page" dir="ltr">
<section className="faq-hero"><div className="wrap"><div className="hero-inner"><span className="eyebrow">Frequently asked questions</span><h1>Frequently Asked Questions</h1><p>Everything you may want to know before planning with Dear Day — from how the platform works to bookings, changes, payments, fulfilment, and support.</p></div></div></section>
<section className="faq-shell"><div className="wrap faq-layout"><div className="faq-content">
<section className="faq-group" id="about"><div className="group-head"><h2>About Dear Day</h2></div><div className="accordion">
<details name="dd-faq-single-open"><summary><span className="q-num">01</span><span>What is Dear Day?</span><span className="q-plus" aria-hidden="true"></span></summary><div className="answer"><p>Dear Day is a platform for planning meaningful occasions in one place. Start with the occasion, area, date, and budget, then bring together the details you need — gifts, cakes and sweets, venues and experiences, flowers, and other thoughtful additions.</p></div></details>
<details name="dd-faq-single-open"><summary><span className="q-num">02</span><span>Is Dear Day just a gift shop?</span><span className="q-plus" aria-hidden="true"></span></summary><div className="answer"><p>No. Dear Day is designed to help you plan the occasion as a whole. You can still go straight to a single category and choose just one item if that is all you need.</p></div></details>
<details name="dd-faq-single-open"><summary><span className="q-num">03</span><span>Where is Dear Day currently available?</span><span className="q-plus" aria-hidden="true"></span></summary><div className="answer"><p>Our initial launch is focused on Cairo and Giza. The options you see can vary by area based on partner coverage and service availability.</p></div></details>
<details name="dd-faq-single-open"><summary><span className="q-num">04</span><span>Do I have to choose an occasion first?</span><span className="q-plus" aria-hidden="true"></span></summary><div className="answer"><p>Not necessarily. You can start with an occasion if you want Dear Day to shape the full experience around the day, or begin directly with a gift, cake, venue, or experience and complete the rest later.</p></div></details>
</div></section>
<section className="faq-group" id="booking"><div className="group-head"><h2>Booking & Changes</h2></div><div className="accordion">
<details name="dd-faq-single-open"><summary><span className="q-num">05</span><span>How do I start planning my occasion?</span><span className="q-plus" aria-hidden="true"></span></summary><div className="answer"><p>Choose the occasion or category you want to start with, then add your area, date, and approximate budget when you know them. We use those details to show you more relevant options.</p></div></details>
<details name="dd-faq-single-open"><summary><span className="q-num">06</span><span>Can I add more than one item to the same occasion?</span><span className="q-plus" aria-hidden="true"></span></summary><div className="answer"><p>Yes. You can combine several choices in your cart — such as a venue, gift, cake, or experience — and review everything together before confirming.</p></div></details>
<details name="dd-faq-single-open"><summary><span className="q-num">07</span><span>Can I change my selections before booking?</span><span className="q-plus" aria-hidden="true"></span></summary><div className="answer"><p>Yes. You can add or remove selections before confirming your booking. After confirmation, whether something can be changed depends on the booking status and the relevant partner's policy.</p></div></details>
<details name="dd-faq-single-open"><summary><span className="q-num">08</span><span>Do I need an account to use Dear Day?</span><span className="q-plus" aria-hidden="true"></span></summary><div className="answer"><p>You can browse and build your selections without an account. Signing in becomes useful for saving bookings, returning to them later, and following their details more easily.</p></div></details>
</div></section>
<section className="faq-group" id="payment"><div className="group-head"><h2>Payment</h2></div><div className="accordion">
<details name="dd-faq-single-open"><summary><span className="q-num">09</span><span>Which payment methods are available?</span><span className="q-plus" aria-hidden="true"></span></summary><div className="answer"><p>The payment methods available to your booking will be shown clearly at checkout. Online payments are processed through a secure payment provider.</p></div></details>
<details name="dd-faq-single-open"><summary><span className="q-num">10</span><span>Are the prices I see final?</span><span className="q-plus" aria-hidden="true"></span></summary><div className="answer"><p>We show the price of each item before you add it to your cart. Any additional delivery or service fees that apply will be shown before you confirm payment.</p></div></details>
<details name="dd-faq-single-open"><summary><span className="q-num">11</span><span>How do refunds work if I cancel?</span><span className="q-plus" aria-hidden="true"></span></summary><div className="answer"><p>Refund eligibility depends on when you cancel, how far fulfilment has progressed, the partner's policy, and the payment method used. The applicable terms will be shown before confirmation and in the cancellation and refund policy.</p></div></details>
</div></section>
<section className="faq-group" id="delivery"><div className="group-head"><h2>Fulfilment & Support</h2></div><div className="accordion">
<details name="dd-faq-single-open"><summary><span className="q-num">12</span><span>Can I choose the occasion date and fulfilment time?</span><span className="q-plus" aria-hidden="true"></span></summary><div className="answer"><p>You can choose the occasion date from the start of the planning flow. Available times or time windows will depend on the service and partner you select.</p></div></details>
<details name="dd-faq-single-open"><summary><span className="q-num">13</span><span>Will every item arrive at the same time?</span><span className="q-plus" aria-hidden="true"></span></summary><div className="answer"><p>Not always. Different items may have different preparation or delivery schedules, but Dear Day brings the day's details together in one review so you can see the full plan before confirming.</p></div></details>
<details name="dd-faq-single-open"><summary><span className="q-num">14</span><span>How can I check my booking status?</span><span className="q-plus" aria-hidden="true"></span></summary><div className="answer"><p>After confirmation, your booking details and relevant updates will be available through your account and bookings, along with important fulfilment updates.</p></div></details>
<details name="dd-faq-single-open"><summary><span className="q-num">15</span><span>What if I have a special request or a question that is not listed here?</span><span className="q-plus" aria-hidden="true"></span></summary><div className="answer"><p>If you have a special request or need help choosing what fits best, contact our customer care team and we will help clarify the available options for your occasion, area, and budget.</p></div></details>
</div></section>
<div className="faq-help"><div><h2>Still have a question?</h2><p>If you could not find the answer you need, contact the Dear Day team through our Contact Us page and we will be happy to help.</p></div><Link className="help-btn" href={pathFor("contact","en")}>Contact Us</Link></div>
</div></div></section>
</main>
  );
}
export default function FaqPage({locale="ar"}){
  return locale==="en"?<EnglishFaq/>:<ArabicFaq/>;
}
