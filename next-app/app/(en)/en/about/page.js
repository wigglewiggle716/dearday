import { publicPageMetadata } from "../../../../lib/public-seo";
import "../../../about.css";
import AboutPage from "../../../../components/about-page";
export async function generateMetadata() { return publicPageMetadata({
  title:"About Us | Dear Day",
  description:"Meet Dear Day — our story, mission, vision, and the values behind a more thoughtful way to plan meaningful occasions.",
  robots:{index:false,follow:false}
}, "en", "/about"); }
export default function EnglishAboutPage(){
  return <AboutPage locale="en"/>;
}
