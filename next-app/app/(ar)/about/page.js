import { publicPageMetadata } from "../../../lib/public-seo";
import "../../about.css";
import AboutPage from "../../../components/about-page";
export async function generateMetadata() { return publicPageMetadata({
  title:"من نحن | Dear Day",
  description:"تعرّف على Dear Day، مهمتنا ورؤيتنا والقيم التي توجهنا في تنسيق المناسبات المهمة بعناية وفي مكان واحد.",
  robots:{index:false,follow:false}
}, "ar", "/about"); }
export default function ArabicAboutPage(){
  return <AboutPage locale="ar"/>;
}
