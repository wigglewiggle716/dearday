import "../../legal.css";
import "../../delete-account.css";
import DeleteAccountPage from "../../../components/delete-account-page";
export const metadata = { title: "حذف الحساب والبيانات | Dear Day", description: "تعليمات طلب حذف حساب Dear Day والبيانات الشخصية المرتبطة به.", robots: { index: false, follow: false } };
export default function Page() { return <DeleteAccountPage locale="ar" />; }
