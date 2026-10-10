import { publicPageMetadata } from "../../../../lib/public-seo";
import "../../../gifts.css";
import GiftsPage from "../../../../components/gifts-page";

export async function generateMetadata() { return publicPageMetadata({title:"Gifts | Dear Day",robots:{index:false,follow:false}}, "en", "/gifts"); }

export default async function EnglishGiftsPage({searchParams}){
  const params=await searchParams;
  return <GiftsPage locale="en" flow={params?.flow==="1"}/>;
}
