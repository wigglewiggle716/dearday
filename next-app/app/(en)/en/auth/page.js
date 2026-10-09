import "../../../auth.css";
import AuthPage from "../../../../components/auth-page";
export const metadata={
 title:"Log In | Dear Day",
 description:"Sign in to your Dear Day account.",
 robots:{index:false,follow:false}
};
export default function LoginEnglish(){return <AuthPage locale="en" page="login"/>;}
