import "../../../auth.css";
import AuthPage from "../../../../components/auth-page";
export const metadata={
 title:"Create Account | Dear Day",
 description:"Create your Dear Day account to save your occasion selections.",
 robots:{index:false,follow:false}
};
export default function RegisterEnglish(){return <AuthPage locale="en" page="signup"/>;}
