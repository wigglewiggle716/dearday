import "../../home.css";
import "../../flowers.css";
import FlowersPage from "../../../components/flowers-page";

export const metadata={title:"الورد | Dear Day",robots:{index:false,follow:false}};

export default async function FlowersArabic({searchParams}){
  const q=await searchParams;
  return <FlowersPage locale="ar" flow={q?.flow==="1"}/>;
}
