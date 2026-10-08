import "../../how-it-works.css";
import HowItWorksPage from "../../../components/how-it-works-page";

export const metadata={
  title:"كيف نعمل | Dear Day",
  description:"اعرف كيف تساعدك Dear Day على ترتيب مناسبتك من اختيار المناسبة والتاريخ والميزانية، إلى جمع المكان والهدية والكيك والورد، ثم مراجعة يومك وتأكيد الحجز.",
  robots:{index:false,follow:false}
};
export default function HowItWorksArabic(){
  return <HowItWorksPage locale="ar"/>;
}
