import './globals.css';

export const metadata = {
  title: 'Dear Day — React Migration',
  description: 'Isolated Next.js migration workspace for Dear Day.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
