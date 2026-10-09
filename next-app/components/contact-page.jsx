import ContactForm from "./contact-form";
// All published contact details, links and information cards remain intact.
// Source: contact.html / contact-en.html at main 5d97cc458910279646ec10a18ffecaca81a6854d.
// Only the former browser-only localStorage form has been replaced.
function ContactArabic(){
 return (
<main id="main-content" className="dd-contact-page" dir="rtl">
<section className="contact-hero"><div className="wrap"><span className="eyebrow">Contact Dear Day</span><h1>تواصل معنا</h1><p>عندك سؤال، طلب خاص، أو محتاج مساعدة في ترتيب مناسبتك؟ ابعت لنا رسالة أو كلمنا بالطريقة الأنسب ليك.</p></div></section>
<section className="contact-section"><div className="wrap contact-grid">
<aside className="info-panel"><h2>إحنا هنا علشان نساعدك</h2><div className="contact-list">
<div className="contact-item"><div className="contact-icon">☎</div><div><strong>رقم خدمة العملاء</strong><a href="tel:+201000000000">+20 100 000 0000</a></div></div>
<div className="contact-item"><div className="contact-icon">✉</div><div><strong>البريد الإلكتروني</strong><a href="mailto:support@dearday.eg">support@dearday.eg</a></div></div>
<div className="contact-item"><div className="contact-icon">⌖</div><div><strong>العنوان</strong><span>القاهرة الجديدة، القاهرة، مصر</span></div></div>
</div><div className="quick-actions"><a className="quick-btn call" href="tel:+201000000000">☎ اتصل بنا</a><a className="quick-btn whatsapp" href="https://wa.me/201000000000" target="_blank" rel="noopener" aria-label="تواصل معنا عبر WhatsApp"><svg className="wa-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2a9.84 9.84 0 0 0-8.42 14.92L2 22l5.23-1.58A9.96 9.96 0 1 0 12.04 2Zm0 17.94a8.13 8.13 0 0 1-4.14-1.14l-.3-.18-3.1.94.98-3.02-.2-.31A8.05 8.05 0 1 1 12.04 19.94Zm4.42-6.03c-.24-.12-1.43-.7-1.65-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.51.1.46-.07 1.43-.58 1.63-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z"/></svg><span>WhatsApp</span></a></div></aside>
<ContactForm locale="ar"/>
</div></section>
</main>
 );
}
function ContactEnglish(){
 return (
<main id="main-content" className="dd-contact-page" dir="ltr">
<section className="contact-hero"><div className="wrap"><span className="eyebrow">Contact Dear Day</span><h1>Contact Us</h1><p>Have a question, a special request, or need a hand planning your occasion? Send us a message or reach us through the channel that works best for you.</p></div></section>
<section className="contact-section"><div className="wrap contact-grid">
<aside className="info-panel"><h2>We’re here to help.</h2><div className="contact-list">
<div className="contact-item"><div className="contact-icon">☎</div><div><strong>Customer Care</strong><a href="tel:+201000000000">+20 100 000 0000</a></div></div>
<div className="contact-item"><div className="contact-icon">✉</div><div><strong>Email</strong><a href="mailto:support@dearday.eg">support@dearday.eg</a></div></div>
<div className="contact-item"><div className="contact-icon">⌖</div><div><strong>Address</strong><span>New Cairo, Cairo, Egypt</span></div></div>
</div><div className="quick-actions"><a className="quick-btn call" href="tel:+201000000000">☎ Call Us</a><a className="quick-btn whatsapp" href="https://wa.me/201000000000" target="_blank" rel="noopener" aria-label="Contact us on WhatsApp"><svg className="wa-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2a9.84 9.84 0 0 0-8.42 14.92L2 22l5.23-1.58A9.96 9.96 0 1 0 12.04 2Zm0 17.94a8.13 8.13 0 0 1-4.14-1.14l-.3-.18-3.1.94.98-3.02-.2-.31A8.05 8.05 0 1 1 12.04 19.94Zm4.42-6.03c-.24-.12-1.43-.7-1.65-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.51.1.46-.07 1.43-.58 1.63-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z"/></svg><span>WhatsApp</span></a></div></aside>
<ContactForm locale="en"/>
</div></section>
</main>
 );
}
export default function ContactPage({locale="ar"}){
 return locale==="en"?<ContactEnglish/>:<ContactArabic/>;
}
