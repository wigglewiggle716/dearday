import { publicPageMetadata } from "../../../../lib/public-seo";
import "../../../occasions.css";
import OccasionsPage from "../../../../components/occasions-page";

export async function generateMetadata() { return publicPageMetadata({
  title: "Occasions | Dear Day",
  description: "Plan a birthday, anniversary, date night or proposal with Dear Day.",
  robots: { index: false, follow: false },
}, "en", "/occasions"); }

export default function EnglishOccasionsRoute() {
  return <OccasionsPage locale="en" />;
}
