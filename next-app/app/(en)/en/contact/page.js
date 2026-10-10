import { publicPageMetadata } from "../../../../lib/public-seo";
import "../../../contact.css";
import ContactPage from "../../../../components/contact-page";
export async function generateMetadata() { return publicPageMetadata({
 title:"Contact Us | Dear Day",
 description:"Contact Dear Day about gifts, occasions, planning and bookings.",
 robots:{index:false,follow:false}
}, "en", "/contact"); }
export default function ContactEnglishPage(){return <ContactPage locale="en"/>}
