import "../../gifts.css";
import GiftsPage from "../../../components/gifts-page";

export const metadata={title:"تخصيص الهدايا | Dear Day",robots:{index:false,follow:false}};

export default async function ArabicGiftsPage({searchParams}){
  const params=await searchParams;
  return <GiftsPage locale="ar" flow={params?.flow==="1"}/>;
}
