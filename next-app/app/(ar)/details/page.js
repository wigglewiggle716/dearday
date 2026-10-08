import "../../details.css";
import DetailsPage from "../../../components/details-page";
export const metadata={title:"تفاصيل المناسبة | Dear Day",robots:{index:false,follow:false}};
export default async function ArabicDetails({searchParams}){
  const q=await searchParams;
  return <DetailsPage locale="ar" flow={q?.flow==="1"}/>;
}
