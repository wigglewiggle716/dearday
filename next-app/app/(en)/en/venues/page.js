import { publicPageMetadata } from "../../../../lib/public-seo";
import "../../../home.css";
import "../../../venues.css";
import VenuesPage from "../../../../components/venues-page";

export async function generateMetadata() { return publicPageMetadata({
  title:"Places & Experiences | Dear Day",
  description:"Explore venues and experiences for your special occasion with Dear Day.",
  robots:{index:false,follow:false}
}, "en", "/venues"); }

export default async function EnglishVenues({searchParams}){
  const q=await searchParams;
  return <VenuesPage locale="en" flow={q?.flow==="1"} standalone={q?.standalone==="1"}
    incoming={typeof q?.dd==="string"?q.dd:null}/>;
}
