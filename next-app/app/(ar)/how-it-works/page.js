import { publicPageMetadata } from "../../../lib/public-seo";
import "../../how-it-works.css";
import HowItWorksPage from "../../../components/how-it-works-page";

export async function generateMetadata() { return publicPageMetadata({
  title:"كيف نعمل | Dear Day",
  description:"اعرف كيف تساعدك Dear Day على ترتيب مناسبتك من اختيار المناسبة والتاريخ والميزانية، إلى جمع المكان والهدية والكيك والورد، ثم مراجعة يومك وتأكيد الحجز.",
  robots:{index:false,follow:false}
}, "ar", "/how-it-works"); }
export default function HowItWorksArabic(){
  return <HowItWorksPage locale="ar"/>;
}
