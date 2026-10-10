import { isPublicHost } from "../lib/public-seo";

export default async function robots() {
  if (!await isPublicHost()) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{
      userAgent: "*",
      allow: "/",
      disallow: [
        "/auth", "/register", "/account", "/bookings", "/notifications",
        "/access", "/security", "/staff", "/staff-permissions", "/partner/",
        "/cart", "/details", "/review", "/payment", "/delete-account",
        "/en/auth", "/en/register", "/en/account", "/en/bookings", "/en/notifications",
        "/en/access", "/en/security", "/en/staff", "/en/staff-permissions",
        "/en/partner/", "/en/cart", "/en/details", "/en/review", "/en/payment",
        "/en/delete-account",
      ],
    }],
    sitemap: "https://dear-day.com/sitemap.xml",
  };
}
