import "../../venues.css";
import VenuesPage from "../../../components/venues-page";

export const metadata={
  title:"أماكن وتجارب | Dear Day",
  description:"استكشف الأماكن والتجارب وخطط لمناسبتك مع Dear Day.",
  robots:{index:false,follow:false}
};

export default async function ArabicVenues({searchParams}){
  const q=await searchParams;
  return <VenuesPage locale="ar" flow={q?.flow==="1"} standalone={q?.standalone==="1"}
    incoming={typeof q?.dd==="string"?q.dd:null}/>;
}
