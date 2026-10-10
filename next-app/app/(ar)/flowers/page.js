import { publicPageMetadata } from "../../../lib/public-seo";
import "../../home.css";
import "../../flowers.css";
import FlowersPage from "../../../components/flowers-page";

export async function generateMetadata() { return publicPageMetadata({title:"الورد | Dear Day",robots:{index:false,follow:false}}, "ar", "/flowers"); }

export default async function FlowersArabic({searchParams}){
  const q=await searchParams;
  return <FlowersPage locale="ar" flow={q?.flow==="1"}/>;
}
