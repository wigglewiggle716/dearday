import "../../my-account.css";
import MyAccount from "../../../components/my-account";
export const metadata={title:"حسابي | Dear Day",robots:{index:false,follow:false}};
export default function AccountPage(){return <MyAccount locale="ar" initialTab="profile"/>;}
