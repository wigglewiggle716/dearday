import "../globals.css";
import SiteHeader from "../../components/site-header";
import SiteFooter from "../../components/site-footer";
import { CartProvider } from "../../components/cart-provider";
import { CatalogProvider } from "../../components/live-catalog";

export const metadata = {
  title: "Dear Day — مناسبتك بكل تفاصيلها",
  description: "Dear Day — تنظيم المناسبات والهدايا والتجارب، معاينة نسخة React الجديدة.",
  robots: { index: false, follow: false },
};

export default function ArabicLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <CatalogProvider>
          <CartProvider locale="ar">
            <SiteHeader locale="ar" />
        {children}
            <SiteFooter locale="ar" />
          </CartProvider>
        </CatalogProvider>
      </body>
    </html>
  );
}
