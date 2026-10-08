import "../../../details.css";
import DetailsPage from "../../../../components/details-page";
export const metadata={title:"Occasion Details | Dear Day",robots:{index:false,follow:false}};
export default async function EnglishDetails({searchParams}){
  const q=await searchParams;
  return <DetailsPage locale="en" flow={q?.flow==="1"}/>;
}
