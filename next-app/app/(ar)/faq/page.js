import { publicPageMetadata } from "../../../lib/public-seo";
import "../../faq.css";
import FaqPage from "../../../components/faq-page";
export async function generateMetadata() { return publicPageMetadata({
  title:"الأسئلة المتكررة | Dear Day",
  description:"إجابات واضحة عن Dear Day، الحجز، التعديل، الدفع، التنفيذ، والحسابات.",
  robots:{index:false,follow:false}
}, "ar", "/faq"); }
export default function ArabicFaqPage(){
  return <FaqPage locale="ar"/>;
}
