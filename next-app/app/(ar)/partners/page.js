import { publicPageMetadata } from "../../../lib/public-seo";
import "../../partners.css";
import PartnersPage from "../../../components/partners-page";
export async function generateMetadata() { return publicPageMetadata({
  title:"للشركاء | Dear Day",
  description:"انضم لشبكة Dear Day للشركاء في الهدايا والورد والكيك والأماكن والتجارب.",
  robots:{index:false,follow:false}
}, "ar", "/partners"); }
export default function PartnersArabic(){
  return <PartnersPage locale="ar"/>;
}
