const publicRoutes = [
  "/", "/occasions", "/gifts", "/cake", "/flowers", "/venues",
  "/about", "/how-it-works", "/partners", "/faq", "/contact",
  "/privacy", "/terms", "/refunds",
];

export default function sitemap() {
  return publicRoutes.flatMap((path) => {
    const ar = "https://dear-day.com" + path;
    const en = "https://dear-day.com" + (path === "/" ? "/en" : "/en" + path);
    return [
      { url: ar, changeFrequency: "weekly", priority: path === "/" ? 1 : 0.7, alternates: { languages: { "ar-EG": ar, en } } },
      { url: en, changeFrequency: "weekly", priority: path === "/" ? 1 : 0.7, alternates: { languages: { "ar-EG": ar, en } } },
    ];
  });
}
