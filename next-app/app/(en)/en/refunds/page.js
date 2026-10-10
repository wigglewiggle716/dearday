import { publicPageMetadata } from "../../../../lib/public-seo";
import "../../../legal.css";
import RefundsPage from "../../../../components/refunds-page";

export async function generateMetadata() { return publicPageMetadata({
  title: "Cancellation & Refund Policy | Dear Day",
  description: "Read Dear Day’s cancellation and refund policy, including item-specific terms, custom orders, refund processing and support.",
  robots: { index: false, follow: false },
}, "en", "/refunds"); }

export default function Page() {
  return <RefundsPage locale="en" />;
}
