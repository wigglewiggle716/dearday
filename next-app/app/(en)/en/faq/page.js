import "../../../faq.css";
import FaqPage from "../../../../components/faq-page";
export const metadata={
  title:"Frequently Asked Questions | Dear Day",
  description:"Find clear answers about Dear Day, planning, bookings, changes, payments, fulfilment, and support.",
  robots:{index:false,follow:false}
};
export default function EnglishFaqPage(){
  return <FaqPage locale="en"/>;
}
