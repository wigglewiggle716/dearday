import { publicPageMetadata } from "../../../../lib/public-seo";
import "../../../legal.css";
import TermsPage from "../../../../components/terms-page";

export async function generateMetadata() { return publicPageMetadata({
  title: "Terms & Conditions | Dear Day",
  description: "Read the Dear Day terms covering platform use, orders, bookings, prices, payments, partners, cancellations and refunds.",
  robots: { index: false, follow: false },
}, "en", "/terms"); }

export default function Page() {
  return <TermsPage locale="en" />;
}
