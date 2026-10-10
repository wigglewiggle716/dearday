/** @type {import('next').NextConfig} */
// These redirects take effect only on the React Vercel project.
// Preserve old HTML bookmarks after a separately approved apex-domain cutover.
const legacyRedirects = [
  {
    "source": "/index.html",
    "destination": "/",
    "permanent": true
  },
  {
    "source": "/index-en.html",
    "destination": "/en",
    "permanent": true
  },
  {
    "source": "/about.html",
    "destination": "/about",
    "permanent": true
  },
  {
    "source": "/about-en.html",
    "destination": "/en/about",
    "permanent": true
  },
  {
    "source": "/birthday.html",
    "destination": "/birthday",
    "permanent": true
  },
  {
    "source": "/birthday-en.html",
    "destination": "/en/birthday",
    "permanent": true
  },
  {
    "source": "/cake.html",
    "destination": "/cake",
    "permanent": true
  },
  {
    "source": "/cake-en.html",
    "destination": "/en/cake",
    "permanent": true
  },
  {
    "source": "/cart.html",
    "destination": "/cart",
    "permanent": true
  },
  {
    "source": "/cart-en.html",
    "destination": "/en/cart",
    "permanent": true
  },
  {
    "source": "/contact.html",
    "destination": "/contact",
    "permanent": true
  },
  {
    "source": "/contact-en.html",
    "destination": "/en/contact",
    "permanent": true
  },
  {
    "source": "/faq.html",
    "destination": "/faq",
    "permanent": true
  },
  {
    "source": "/faq-en.html",
    "destination": "/en/faq",
    "permanent": true
  },
  {
    "source": "/flowers.html",
    "destination": "/flowers",
    "permanent": true
  },
  {
    "source": "/flowers-en.html",
    "destination": "/en/flowers",
    "permanent": true
  },
  {
    "source": "/gifts.html",
    "destination": "/gifts",
    "permanent": true
  },
  {
    "source": "/gifts-en.html",
    "destination": "/en/gifts",
    "permanent": true
  },
  {
    "source": "/how-it-works.html",
    "destination": "/how-it-works",
    "permanent": true
  },
  {
    "source": "/how-it-works-en.html",
    "destination": "/en/how-it-works",
    "permanent": true
  },
  {
    "source": "/occasions.html",
    "destination": "/occasions",
    "permanent": true
  },
  {
    "source": "/occasions-en.html",
    "destination": "/en/occasions",
    "permanent": true
  },
  {
    "source": "/partners.html",
    "destination": "/partners",
    "permanent": true
  },
  {
    "source": "/partners-en.html",
    "destination": "/en/partners",
    "permanent": true
  },
  {
    "source": "/payment.html",
    "destination": "/payment",
    "permanent": true
  },
  {
    "source": "/payment-en.html",
    "destination": "/en/payment",
    "permanent": true
  },
  {
    "source": "/privacy.html",
    "destination": "/privacy",
    "permanent": true
  },
  {
    "source": "/privacy-en.html",
    "destination": "/en/privacy",
    "permanent": true
  },
  {
    "source": "/refunds.html",
    "destination": "/refunds",
    "permanent": true
  },
  {
    "source": "/refunds-en.html",
    "destination": "/en/refunds",
    "permanent": true
  },
  {
    "source": "/review.html",
    "destination": "/review",
    "permanent": true
  },
  {
    "source": "/review-en.html",
    "destination": "/en/review",
    "permanent": true
  },
  {
    "source": "/terms.html",
    "destination": "/terms",
    "permanent": true
  },
  {
    "source": "/terms-en.html",
    "destination": "/en/terms",
    "permanent": true
  },
  {
    "source": "/venues.html",
    "destination": "/venues",
    "permanent": true
  },
  {
    "source": "/venues-en.html",
    "destination": "/en/venues",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Account.html",
    "destination": "/account",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Account-en.html",
    "destination": "/en/account",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Auth.html",
    "destination": "/auth",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Auth-en.html",
    "destination": "/en/auth",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Bookings.html",
    "destination": "/bookings",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Bookings-en.html",
    "destination": "/en/bookings",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Complete-Profile.html",
    "destination": "/account",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Complete-Profile-en.html",
    "destination": "/en/account",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Privacy.html",
    "destination": "/privacy",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Privacy-en.html",
    "destination": "/en/privacy",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Terms.html",
    "destination": "/terms",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Terms-en.html",
    "destination": "/en/terms",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Admin-Approvals.html",
    "destination": "/staff/approvals",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Admin-Availability.html",
    "destination": "/staff/availability",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Admin-Cancellations.html",
    "destination": "/staff/cancellations",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Admin-Customers.html",
    "destination": "/staff/customers",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Admin-Employees.html",
    "destination": "/staff-permissions",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Admin-Orders.html",
    "destination": "/staff/orders",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Admin-Partners.html",
    "destination": "/staff/partners",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Admin-Products.html",
    "destination": "/staff/catalog",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Admin-Refund-Policies.html",
    "destination": "/staff/refund-policies",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Admin-Support.html",
    "destination": "/staff/support",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Admin.html",
    "destination": "/staff",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Finance.html",
    "destination": "/staff/finance",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Notifications.html",
    "destination": "/notifications",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Partner-Availability.html",
    "destination": "/partner/availability",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Partner-Cancellations.html",
    "destination": "/partner/cancellations",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Partner-Orders.html",
    "destination": "/partner/orders",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Partner-Products.html",
    "destination": "/partner/products",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Partner-Refund-Policies.html",
    "destination": "/partner/refund-policies",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Partner.html",
    "destination": "/partner",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Security.html",
    "destination": "/security",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Staff.html",
    "destination": "/staff",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Staff-Login.html",
    "destination": "/auth",
    "permanent": true
  },
  {
    "source": "/Dear-Day-Partner-Login.html",
    "destination": "/auth",
    "permanent": true
  }
];

const nextConfig = {
  poweredByHeader: false,
  async redirects() {
    return legacyRedirects;
  },
};

export default nextConfig;
