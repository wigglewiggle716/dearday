import { publicPageMetadata } from "../../../../lib/public-seo";
import "../../../partners.css";
import PartnersPage from "../../../../components/partners-page";
export async function generateMetadata() { return publicPageMetadata({
  title:"For Partners | Dear Day",
  description:"Explore partnership opportunities with Dear Day for gifts, flowers, cakes, venues and experiences.",
  robots:{index:false,follow:false}
}, "en", "/partners"); }
export default function PartnersEnglish(){
  return <PartnersPage locale="en"/>;
}
