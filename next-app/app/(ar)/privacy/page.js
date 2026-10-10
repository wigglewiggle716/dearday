import { publicPageMetadata } from "../../../lib/public-seo";
import "../../legal.css";
import PrivacyPage from "../../../components/privacy-page";

export async function generateMetadata() { return publicPageMetadata({
  title: "سياسة الخصوصية | Dear Day",
  description: "سياسة خصوصية Dear Day: كيف نجمع البيانات الشخصية ونستخدمها ونحميها، وحقوقك وطرق التواصل بشأنها.",
  robots: { index: false, follow: false },
}, "ar", "/privacy"); }

export default function Page() {
  return <PrivacyPage locale="ar" />;
}
