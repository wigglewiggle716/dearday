import "../../../legal.css";
import RefundsPage from "../../../../components/refunds-page";

export const metadata = {
  title: "Cancellation & Refund Policy | Dear Day",
  description: "Read Dear Day’s cancellation and refund policy, including item-specific terms, custom orders, refund processing and support.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <RefundsPage locale="en" />;
}
