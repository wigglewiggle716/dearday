import "../home.css";
import HomeContent from "../../components/home-content";
import { publicPageMetadata } from "../../lib/public-seo";

export async function generateMetadata() {
  return publicPageMetadata({
    title: "Dear Day — مناسبتك بكل تفاصيلها",
    description: "نظّم مناسبتك مع Dear Day واختار الهدايا والورد والكيك والأماكن والتجارب المناسبة، في القاهرة والجيزة.",
  }, "ar", "/");
}

export default function Home() { return <HomeContent locale="ar"/>; }
