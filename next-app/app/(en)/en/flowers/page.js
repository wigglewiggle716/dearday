import "../../../home.css";
import "../../../flowers.css";
import FlowersPage from "../../../../components/flowers-page";

export const metadata={title:"Flowers | Dear Day",robots:{index:false,follow:false}};

export default async function FlowersEnglish({searchParams}){
  const q=await searchParams;
  return <FlowersPage locale="en" flow={q?.flow==="1"}/>;
}
