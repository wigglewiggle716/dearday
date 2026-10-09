import "../globals.css";
import SiteLayoutChrome from "../../components/site-layout-chrome";
import "../staff-admin-shell.css";
import { AuthSessionProvider } from "../../components/auth-session-provider";
import { CatalogProvider, CatalogCartProvider } from "../../components/live-catalog";

export const metadata = {
  title: "Dear Day — مناسبتك بكل تفاصيلها",
  description: "Dear Day — تنظيم المناسبات والهدايا والتجارب، معاينة نسخة React الجديدة.",
  robots: { index: false, follow: false },
};

export default function ArabicLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <AuthSessionProvider>
        <CatalogProvider>
          <CatalogCartProvider locale="ar">
            <SiteLayoutChrome locale="ar">
        {children}
            </SiteLayoutChrome>
          </CatalogCartProvider>
        </CatalogProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
