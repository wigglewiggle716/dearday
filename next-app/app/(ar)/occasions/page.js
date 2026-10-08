import "../../occasions.css";
import OccasionsPage from "../../../components/occasions-page";

export const metadata = {
  title: "المناسبات | Dear Day",
  description: "خطط لعيد ميلاد أو ذكرى سنوية أو Date Night أو طلب زواج مع Dear Day.",
  robots: { index: false, follow: false },
};

export default function ArabicOccasionsRoute() {
  return <OccasionsPage locale="ar" />;
}
