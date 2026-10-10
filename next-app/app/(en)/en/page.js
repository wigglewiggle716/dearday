import "../../home.css";
import HomeContent from "../../../components/home-content";
import { publicPageMetadata } from "../../../lib/public-seo";

export async function generateMetadata() {
  return publicPageMetadata({
    title: "Dear Day — Every Detail of Your Occasion",
    description: "Plan meaningful occasions with Dear Day and discover gifts, flowers, cakes, venues and experiences across Cairo and Giza.",
  }, "en", "/");
}

export default function EnglishHome() { return <HomeContent locale="en"/>; }
