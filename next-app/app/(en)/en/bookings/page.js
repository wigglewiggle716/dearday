import "../../../my-account.css";
import MyAccount from "../../../../components/my-account";
export const metadata={title:"My Bookings | Dear Day",robots:{index:false,follow:false}};
export default function BookingsPage(){return <MyAccount locale="en" initialTab="bookings"/>;}
