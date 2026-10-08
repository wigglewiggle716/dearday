import "../../review.css";
import ReviewPage from "../../../components/review-page";
export const metadata={
  title:"مراجعة وحجز | Dear Day",description:"راجع تفاصيل المناسبة والاختيارات قبل الدفع مع Dear Day.",
  robots:{index:false,follow:false}
};
export default async function ArabicReview({searchParams}){
  const q=await searchParams;
  return <ReviewPage locale="ar" flow={q?.flow==="1"}/>;
}
