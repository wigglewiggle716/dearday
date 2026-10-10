import { publicPageMetadata } from "../../../../lib/public-seo";
import "../../../legal.css";
import PrivacyPage from "../../../../components/privacy-page";

export async function generateMetadata() { return publicPageMetadata({
  title: "Privacy Policy | Dear Day",
  description: "Learn how Dear Day collects, uses, shares and protects personal information, and how to contact us about your privacy rights.",
  robots: { index: false, follow: false },
}, "en", "/privacy"); }

export default function Page() {
  return <PrivacyPage locale="en" />;
}
