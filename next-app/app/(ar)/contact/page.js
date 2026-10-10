import { publicPageMetadata } from "../../../lib/public-seo";
import "../../contact.css";
import ContactPage from "../../../components/contact-page";
export async function generateMetadata() { return publicPageMetadata({
 title:"تواصل معنا | Dear Day",
 description:"تواصل مع Dear Day لو عندك استفسار عن المناسبات أو الهدايا أو الحجز.",
 robots:{index:false,follow:false}
}, "ar", "/contact"); }
export default function ContactArabicPage(){return <ContactPage locale="ar"/>}
