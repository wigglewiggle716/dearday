import { publicPageMetadata } from "../../../../lib/public-seo";
import "../../../home.css";
import "../../../cake.css";
import CakePage from "../../../../components/cake-page";
export async function generateMetadata() { return publicPageMetadata({title:"Chocolate & Cakes | Dear Day",robots:{index:false,follow:false}}, "en", "/cake"); }
export default async function EnglishCake({searchParams}){
  const params=await searchParams;
  return <CakePage locale="en" flow={params?.flow==="1"} standalone={params?.standalone==="1"} incoming={typeof params?.dd==="string"?params.dd:null}/>;
}
