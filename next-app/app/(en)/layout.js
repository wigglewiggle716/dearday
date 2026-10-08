import "../globals.css";
import SiteHeader from "../../components/site-header";
import SiteFooter from "../../components/site-footer";

export const metadata = {
  title: "Dear Day — Every Detail of Your Occasion",
  description: "Dear Day — thoughtful occasion planning and gifting, React migration preview.",
  robots: { index: false, follow: false },
};

export default function EnglishLayout({ children }) {
  return (
    <html lang="en" dir="ltr">
      <body>
        <SiteHeader locale="en" />
        {children}
        <SiteFooter locale="en" />
      </body>
    </html>
  );
}
