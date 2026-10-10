import { publicPageMetadata } from "../../../lib/public-seo";
import "../../occasions.css";
import OccasionsPage from "../../../components/occasions-page";

export async function generateMetadata() { return publicPageMetadata({
  title: "المناسبات | Dear Day",
  description: "خطط لعيد ميلاد أو ذكرى سنوية أو Date Night أو طلب زواج مع Dear Day.",
  robots: { index: false, follow: false },
}, "ar", "/occasions"); }

export default function ArabicOccasionsRoute() {
  return <OccasionsPage locale="ar" />;
}
