import "../../../payment.css";
import PaymentPage from "../../../../components/payment-page";
export const metadata={
  title:"Payment | Dear Day",
  description:"Preview your Dear Day billing details and payment summary.",
  robots:{index:false,follow:false}
};
export default async function EnglishPayment({searchParams}){
  const query=await searchParams;
  return <PaymentPage locale="en" flow={query?.flow==="1"}
    hasReturnParams={Boolean(query?.success!==undefined||query?.payment_status!==undefined||query?.txn_response_code!==undefined)}/>;
}
