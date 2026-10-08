import "../../../how-it-works.css";
import HowItWorksPage from "../../../../components/how-it-works-page";

export const metadata={
  title:"How It Works | Dear Day",
  description:"See how Dear Day helps you plan an occasion from choosing the date, area and budget to bringing together the venue, gift, cake, flowers and final booking review.",
  robots:{index:false,follow:false}
};
export default function HowItWorksEnglish(){
  return <HowItWorksPage locale="en"/>;
}
