import "../../../my-account.css";
import MyAccount from "../../../../components/my-account";
export const metadata={title:"My Account | Dear Day",robots:{index:false,follow:false}};
export default function AccountPage(){return <MyAccount locale="en" initialTab="profile"/>;}
