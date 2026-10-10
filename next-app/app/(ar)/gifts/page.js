import { publicPageMetadata } from "../../../lib/public-seo";
import "../../gifts.css";
import GiftsPage from "../../../components/gifts-page";

export async function generateMetadata() { return publicPageMetadata({title:"تخصيص الهدايا | Dear Day",robots:{index:false,follow:false}}, "ar", "/gifts"); }

export default async function ArabicGiftsPage({searchParams}){
  const params=await searchParams;
  return <GiftsPage locale="ar" flow={params?.flow==="1"}/>;
}
