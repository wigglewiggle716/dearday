import "../../legal.css";
import PrivacyPage from "../../../components/privacy-page";

export const metadata = {
  title: "سياسة الخصوصية | Dear Day",
  description: "سياسة خصوصية Dear Day: كيف نجمع البيانات الشخصية ونستخدمها ونحميها، وحقوقك وطرق التواصل بشأنها.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PrivacyPage locale="ar" />;
}
