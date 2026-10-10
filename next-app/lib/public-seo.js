import { headers } from "next/headers";

// Preview and Vercel deployment URLs must never be indexed. Only the owner domain
// becomes indexable when the approved production domain is attached to React.
export async function isPublicHost() {
  const hostname = ((await headers()).get("host") || "").toLowerCase().split(":")[0];
  return hostname === "dear-day.com" || hostname === "www.dear-day.com";
}

export async function publicPageMetadata(existing, locale, path) {
  const live = await isPublicHost();
  const arabic = path;
  const english = path === "/" ? "/en" : "/en" + path;
  const canonical = locale === "en" ? english : arabic;
  return {
    ...existing,
    metadataBase: new URL("https://dear-day.com"),
    robots: live ? { index: true, follow: true } : { index: false, follow: false },
    alternates: live ? { canonical, languages: { "ar-EG": arabic, en: english } } : undefined,
    openGraph: live ? {
      title: existing.title,
      description: existing.description,
      url: "https://dear-day.com" + canonical,
      siteName: "Dear Day",
      locale: locale === "en" ? "en_US" : "ar_EG",
      type: "website",
    } : undefined,
  };
}
