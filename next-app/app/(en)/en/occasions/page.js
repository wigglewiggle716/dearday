import "../../../occasions.css";
import OccasionsPage from "../../../../components/occasions-page";

export const metadata = {
  title: "Occasions | Dear Day",
  description: "Plan a birthday, anniversary, date night or proposal with Dear Day.",
  robots: { index: false, follow: false },
};

export default function EnglishOccasionsRoute() {
  return <OccasionsPage locale="en" />;
}
