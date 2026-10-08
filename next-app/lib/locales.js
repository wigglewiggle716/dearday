export const sections = [
  ["home", ""],
  ["gifts", "gifts"],
  ["cake", "cake"],
  ["venues", "venues"],
  ["flowers", "flowers"],
  ["occasions", "occasions"],
  ["howItWorks", "how-it-works"],
  ["partners", "partners"],
  ["about", "about"],
  ["faq", "faq"],
  ["contact", "contact"],
  ["privacy", "privacy"],
  ["terms", "terms"],
  ["refunds", "refunds"],
  ["auth", "auth"],
  ["cart", "cart"],
];

export const dictionaries = {
  ar: {
    home: "الرئيسية",
    explore: "اكتشف",
    gifts: "هدايا",
    cake: "شكولاته و كيك",
    venues: "أماكن وتجارب",
    flowers: "ورد",
    occasions: "المناسبات",
    howItWorks: "كيف نعمل",
    partners: "للشركاء",
    about: "من نحن",
    faq: "الأسئلة المتكررة",
    contact: "تواصل معنا",
    privacy: "سياسة الخصوصية",
    terms: "الشروط والأحكام",
    refunds: "سياسة الإلغاء والاسترداد",
    login: "تسجيل الدخول",
    signup: "إنشاء حساب",
    language: "EN",
    languageLabel: "Switch to English",
    openMenu: "افتح القائمة",
    closeMenu: "أغلق القائمة",
    navigation: "التنقل الرئيسي",
    servicesTitle: "خدمات Dear Day",
    aboutTitle: "عن Dear Day",
    supportTitle: "خدمة العملاء",
    footerNote: "مناسبات متفكّر فيها بعناية، متنسّقة في مكان واحد — من أول الفكرة لآخر تفصيلة.",
    homepageTitle: "مناسبتك بكل تفاصيلها،",
    homepageSubtitle: "في مكان واحد",
    homepageDescription: "من أول الفكرة لآخر تفصيلة، Dear Day بتجمع اختيارات المناسبة في تجربة بسيطة ومتناسقة.",
    previewKicker: "نسخة تجريبية — التحويل إلى React",
    previewInfo: "بننقل تجربة Dear Day جزء بجزء. دي معاينة للهوية والـHeader والـFooter، مش متجر جاهز للطلب.",
    previewSection: "القسم ده لسه قيد النقل",
    previewSectionInfo: "المحتوى الأصلي محفوظ على الموقع الحالي. هننقل القسم بعد مراجعة تصميمه ووظائفه واعتماده.",
    backHome: "العودة للرئيسية",
    copyright: "© 2026 Dear Day",
    previewBadge: "Preview فقط",
    skipToContent: "انتقل للمحتوى"
  },
  en: {
    home: "Home",
    explore: "Explore",
    gifts: "Gifts",
    cake: "Chocolate & Cakes",
    venues: "Places & Experiences",
    flowers: "Flowers",
    occasions: "Occasions",
    howItWorks: "How It Works",
    partners: "For Partners",
    about: "About Us",
    faq: "FAQs",
    contact: "Contact Us",
    privacy: "Privacy Policy",
    terms: "Terms & Conditions",
    refunds: "Cancellation & Refunds",
    login: "Log In",
    signup: "Create Account",
    language: "AR",
    languageLabel: "الانتقال إلى العربية",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    navigation: "Main navigation",
    servicesTitle: "Dear Day Services",
    aboutTitle: "About Dear Day",
    supportTitle: "Customer Care",
    footerNote: "Thoughtfully planned occasions, coordinated in one place — from the first idea to the final detail.",
    homepageTitle: "Every detail of your day,",
    homepageSubtitle: "in one place",
    homepageDescription: "From the first idea to the final detail, Dear Day brings your occasion choices together in one thoughtful experience.",
    previewKicker: "Preview — migrating to React",
    previewInfo: "Dear Day is moving one section at a time. This preview covers the identity, header and footer — ordering is not available here yet.",
    previewSection: "This section is being migrated",
    previewSectionInfo: "The current content is safely retained on the existing website. This section will move after its design and functionality are reviewed.",
    backHome: "Back to home",
    copyright: "© 2026 Dear Day",
    previewBadge: "Preview only",
    skipToContent: "Skip to content"
  },
};

const slugs = Object.fromEntries(sections);

export function pathFor(id, locale) {
  const prefix = locale === "en" ? "/en" : "";
  const slug = slugs[id] || "";
  return slug ? prefix + "/" + slug : prefix || "/";
}

export function alternatePath(pathname, locale) {
  const to = locale === "ar" ? "en" : "ar";
  const segments = (pathname || "/").split("/").filter(Boolean);
  const stripped = segments[0] === "en" ? segments.slice(1) : segments;
  const base = stripped.length ? "/" + stripped.join("/") : "";
  return to === "en" ? "/en" + base : base || "/";
}
