import "../../../gifts.css";
import GiftsPage from "../../../../components/gifts-page";

export const metadata={title:"Gifts | Dear Day",robots:{index:false,follow:false}};

export default async function EnglishGiftsPage({searchParams}){
  const params=await searchParams;
  return <GiftsPage locale="en" flow={params?.flow==="1"}/>;
}
