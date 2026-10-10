import { publicPageMetadata } from "../../../lib/public-seo";
import "../../legal.css";
import TermsPage from "../../../components/terms-page";

export async function generateMetadata() { return publicPageMetadata({
  title: "الشروط والأحكام | Dear Day",
  description: "شروط وأحكام استخدام Dear Day: الطلبات والحجوزات والأسعار والدفع والشركاء والإلغاء والاسترداد.",
  robots: { index: false, follow: false },
}, "ar", "/terms"); }

export default function Page() {
  return <TermsPage locale="ar" />;
}
