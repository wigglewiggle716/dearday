import "../../auth.css";
import AuthPage from "../../../components/auth-page";
export const metadata={
 title:"إنشاء حساب | Dear Day",
 description:"أنشئ حساب Dear Day واحتفظ باختيارات مناسباتك.",
 robots:{index:false,follow:false}
};
export default function RegisterArabic(){return <AuthPage locale="ar" page="signup"/>;}
