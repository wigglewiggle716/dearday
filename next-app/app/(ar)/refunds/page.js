import { publicPageMetadata } from "../../../lib/public-seo";
import "../../legal.css";
import RefundsPage from "../../../components/refunds-page";

export async function generateMetadata() { return publicPageMetadata({
  title: "سياسة الإلغاء والاسترداد | Dear Day",
  description: "سياسة Dear Day للإلغاء والاسترداد، والسياسات المطبقة على عناصر الطلب، والمنتجات المخصصة، وطرق طلب الدعم.",
  robots: { index: false, follow: false },
}, "ar", "/refunds"); }

export default function Page() {
  return <RefundsPage locale="ar" />;
}
