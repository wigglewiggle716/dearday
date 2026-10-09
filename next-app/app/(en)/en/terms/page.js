import "../../../legal.css";
import TermsPage from "../../../../components/terms-page";

export const metadata = {
  title: "Terms & Conditions | Dear Day",
  description: "Read the Dear Day terms covering platform use, orders, bookings, prices, payments, partners, cancellations and refunds.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <TermsPage locale="en" />;
}
