// Navigation parity with the original Dear-Day-Admin.html / dear-day-admin-shell.js.
// Keep a visible, permission-scoped link for every legacy admin module.
// Non-migrated modules are explicitly linked to the original site.
export const STAFF_ADMIN_MODULES = [
  {id:"overview",route:"staffPortal",perms:["dashboard.view"],ar:"نظرة عامة",en:"Overview"},
  {id:"orders",route:"staffOrders",perms:["orders.view"],ar:"الطلبات",en:"Orders"},
  {id:"partners",route:"staffPartners",perms:["partners.view","partners.manage"],ar:"الشركاء",en:"Partners"},
  {id:"catalog",route:"staffCatalog",perms:["catalog.view","catalog.manage"],ar:"المنتجات والخدمات",en:"Products & Services"},
  {id:"approvals",route:"staffApprovals",perms:["approvals.review"],ar:"الموافقات",en:"Approvals"},
  {id:"availability",route:"staffAvailability",perms:["availability.view","availability.manage"],ar:"التوفر والمواعيد",en:"Availability & Schedules"},
  {id:"refundPolicies",route:"staffRefundPolicies",perms:["catalog.manage","approvals.review"],ar:"سياسات الإلغاء والاسترداد",en:"Cancellation & Refund Policies"},
  {id:"cancellations",route:"staffCancellations",perms:["orders.manage"],ar:"الإلغاءات والاسترداد",en:"Cancellations & Refunds"},
  {id:"notifications",legacy:"Dear-Day-Notifications.html",ar:"الإشعارات",en:"Notifications"},
  {id:"orderEmails",route:"staffOrderEmails",perms:["orders.manage"],ar:"إشعارات الطلبات",en:"Order Emails"},
  {id:"security",route:"security",ar:"أمان الحساب",en:"Account Security"},
  {id:"customers",route:"staffCustomers",perms:["customers.view"],ar:"العملاء",en:"Customers"},
  {id:"support",route:"staffSupport",perms:["customers.view"],ar:"رسائل العملاء",en:"Customer Messages"},
  {id:"employees",route:"staffPermissions",perms:["employees.view","employees.manage"],ar:"الموظفون والصلاحيات",en:"Staff & Permissions"},
  {id:"finance",route:"staffFinance",perms:["finance.view"],ar:"المالية والتسويات",en:"Finance & Settlements"},
];
export function staffAdminVisibleModules(grants,role){
  const allowed = new Set(grants || []);
  return STAFF_ADMIN_MODULES.filter(item=>
    !item.perms || item.perms.some(permission=>allowed.has(permission))
  ).map(item=>item.id==="overview"?{
    ...item,
    ar:role==="super_admin"||role==="admin"?"نظرة عامة":"بوابة الفريق",
    en:role==="super_admin"||role==="admin"?"Overview":"Staff Workspace"
  }:item);
}
export function isStaffAdminPath(pathname){
  const p=String(pathname||"/").replace(/^\/en(?=\/|$)/,"")||"/";
  return p==="/staff"||p.startsWith("/staff/")||p==="/security"||p==="/staff-permissions";
}
