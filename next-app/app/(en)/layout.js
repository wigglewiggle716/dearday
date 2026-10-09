import "../globals.css";
import SiteLayoutChrome from "../../components/site-layout-chrome";
import "../staff-admin-shell.css";
import { AuthSessionProvider } from "../../components/auth-session-provider";
import { CatalogProvider, CatalogCartProvider } from "../../components/live-catalog";

export const metadata = {
  title: "Dear Day — Every Detail of Your Occasion",
  description: "Dear Day — thoughtful occasion planning and gifting, React migration preview.",
  robots: { index: false, follow: false },
};

export default function EnglishLayout({ children }) {
  return (
    <html lang="en" dir="ltr">
      <body>
        <AuthSessionProvider>
        <CatalogProvider>
          <CatalogCartProvider locale="en">
            <SiteLayoutChrome locale="en">
        {children}
            </SiteLayoutChrome>
          </CatalogCartProvider>
        </CatalogProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
