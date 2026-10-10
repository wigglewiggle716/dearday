import { publicPageMetadata } from "../../../lib/public-seo";
import "../../home.css";
import "../../cake.css";
import CakePage from "../../../components/cake-page";
export async function generateMetadata() { return publicPageMetadata({title:"شكولاته و كيك | Dear Day",robots:{index:false,follow:false}}, "ar", "/cake"); }
export default async function ArabicCake({searchParams}){
  const params=await searchParams;
  return <CakePage locale="ar" flow={params?.flow==="1"} standalone={params?.standalone==="1"} incoming={typeof params?.dd==="string"?params.dd:null}/>;
}
