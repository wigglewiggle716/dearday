import "../../legal.css";
import RefundsPage from "../../../components/refunds-page";

export const metadata = {
  title: "سياسة الإلغاء والاسترداد | Dear Day",
  description: "سياسة Dear Day للإلغاء والاسترداد، والسياسات المطبقة على عناصر الطلب، والمنتجات المخصصة، وطرق طلب الدعم.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <RefundsPage locale="ar" />;
}
