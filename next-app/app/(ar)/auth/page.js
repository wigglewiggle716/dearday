import "../../auth.css";
import AuthPage from "../../../components/auth-page";
export const metadata={
 title:"تسجيل الدخول | Dear Day",
 description:"سجل دخولك إلى Dear Day لمتابعة مناسباتك.",
 robots:{index:false,follow:false}
};
export default function LoginArabic(){return <AuthPage locale="ar" page="login"/>;}
