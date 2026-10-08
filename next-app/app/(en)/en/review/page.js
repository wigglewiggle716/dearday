import "../../../review.css";
import ReviewPage from "../../../../components/review-page";
export const metadata={
  title:"Review & Book | Dear Day",description:"Review your occasion details and selected items with Dear Day.",
  robots:{index:false,follow:false}
};
export default async function EnglishReview({searchParams}){
  const q=await searchParams;
  return <ReviewPage locale="en" flow={q?.flow==="1"}/>;
}
