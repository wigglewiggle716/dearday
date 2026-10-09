import "../../legal.css";
import TermsPage from "../../../components/terms-page";

export const metadata = {
  title: "الشروط والأحكام | Dear Day",
  description: "شروط وأحكام استخدام Dear Day: الطلبات والحجوزات والأسعار والدفع والشركاء والإلغاء والاسترداد.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <TermsPage locale="ar" />;
}
