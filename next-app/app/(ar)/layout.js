import "../globals.css";
import SiteHeader from "../../components/site-header";
import SiteFooter from "../../components/site-footer";

export const metadata = {
  title: "Dear Day — مناسبتك بكل تفاصيلها",
  description: "Dear Day — تنظيم المناسبات والهدايا والتجارب، معاينة نسخة React الجديدة.",
  robots: { index: false, follow: false },
};

export default function ArabicLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <SiteHeader locale="ar" />
        {children}
        <SiteFooter locale="ar" />
      </body>
    </html>
  );
}
