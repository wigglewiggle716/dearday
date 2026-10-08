import "../../faq.css";
import FaqPage from "../../../components/faq-page";
export const metadata={
  title:"الأسئلة المتكررة | Dear Day",
  description:"إجابات واضحة عن Dear Day، الحجز، التعديل، الدفع، التنفيذ، والحسابات.",
  robots:{index:false,follow:false}
};
export default function ArabicFaqPage(){
  return <FaqPage locale="ar"/>;
}
