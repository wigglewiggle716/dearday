import { publicPageMetadata } from "../../../../lib/public-seo";
import "../../../faq.css";
import FaqPage from "../../../../components/faq-page";
export async function generateMetadata() { return publicPageMetadata({
  title:"Frequently Asked Questions | Dear Day",
  description:"Find clear answers about Dear Day, planning, bookings, changes, payments, fulfilment, and support.",
  robots:{index:false,follow:false}
}, "en", "/faq"); }
export default function EnglishFaqPage(){
  return <FaqPage locale="en"/>;
}
