import "../../payment.css";
import PaymentPage from "../../../components/payment-page";
export const metadata={
  title:"الدفع | Dear Day",
  description:"راجع بيانات التواصل والفاتورة وملخص مناسبة Dear Day قبل تفعيل الدفع.",
  robots:{index:false,follow:false}
};
export default async function ArabicPayment({searchParams}){
  const query=await searchParams;
  return <PaymentPage locale="ar" flow={query?.flow==="1"}
    hasReturnParams={Boolean(query?.success!==undefined||query?.payment_status!==undefined||query?.txn_response_code!==undefined)}/>;
}
