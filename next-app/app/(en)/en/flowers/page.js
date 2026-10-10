import { publicPageMetadata } from "../../../../lib/public-seo";
import "../../../home.css";
import "../../../flowers.css";
import FlowersPage from "../../../../components/flowers-page";

export async function generateMetadata() { return publicPageMetadata({title:"Flowers | Dear Day",robots:{index:false,follow:false}}, "en", "/flowers"); }

export default async function FlowersEnglish({searchParams}){
  const q=await searchParams;
  return <FlowersPage locale="en" flow={q?.flow==="1"}/>;
}
