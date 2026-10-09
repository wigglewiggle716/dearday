'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=(...p)=>fs.readFileSync(path.join(__dirname,'..',...p),'utf8');
const nav=root('next-app','lib','staff-admin-navigation.js');
const admin=root('next-app','components','staff-admin-shell.jsx');
const chrome=root('next-app','components','site-layout-chrome.jsx');
const dashboard=root('next-app','components','staff-workspace.jsx');
const css=root('next-app','app','staff-admin-shell.css');
const dashboardCss=root('next-app','app','staff-workspace.css');
const ar=root('next-app','app','(ar)','layout.js');
const en=root('next-app','app','(en)','layout.js');
// Every legacy Admin sidebar module must survive the redesign.
const sections=['overview','orders','partners','catalog','approvals','availability',
 'refundPolicies','cancellations','notifications','security','customers','employees','finance'];
for(const id of sections)assert.match(nav,new RegExp('id:"'+id+'"'));
for(const id of ['orderEmails','support'])assert.match(nav,new RegExp('id:"'+id+'"'));
for(const route of ['staffPortal','staffOrders','staffPartners','staffCatalog',
 'staffApprovals','staffAvailability','staffRefundPolicies','staffCancellations',
 'staffOrderEmails','security','staffCustomers','staffSupport','staffPermissions'])
 assert.match(nav,new RegExp('route:"'+route+'"'));
assert.match(nav,/Dear-Day-Finance\.html/);
assert.match(nav,/Dear-Day-Notifications\.html/);
assert.match(nav,/perms\.some\(permission=>allowed\.has\(permission\)\)/);
assert.match(nav,/p\.startsWith\("\/staff\/"\)/);
assert.match(nav,/p==="\/security"/);
assert.match(nav,/p==="\/staff-permissions"/);
assert.match(chrome,/isStaffAdminPath\(pathname\)/);
assert.match(chrome,/<StaffAdminShell locale=\{locale\}>/);
assert.match(chrome,/<SiteHeader locale=\{locale\}/);
assert.match(chrome,/<SiteFooter locale=\{locale\}/);
assert.match(ar,/SiteLayoutChrome locale="ar"/);
assert.match(en,/SiteLayoutChrome locale="en"/);
assert.match(admin,/get_my_permissions/);
assert.match(admin,/session\.signOut\(\)/);
assert.match(admin,/rel="noopener noreferrer"/);
assert.match(admin,/aria-current=\{active\?"page":undefined\}/);
assert.match(css,/width:260px/);
assert.match(css,/background:var\(--dd-admin-wine\)/);
assert.match(css,/height:100dvh/);
assert.match(css,/overflow-y:auto/);
assert.match(css,/@media\(max-width:760px\)/);
for(const metric of ['orders','open','customers','partners','pending','unsettled','paidRevenue','cancelled'])assert.match(dashboard,new RegExp('\\["'+metric+'"'));
assert.match(dashboard,/recentApprovals\(client\)/);
assert.match(dashboard,/financialSnapshot\(client\)/);
assert.match(dashboard,/recentSettlements\(client\)/);
assert.match(dashboard,/role==="accountant"/);
assert.match(dashboard,/perms\.has\("finance.view"\)/);
assert.match(dashboardCss,/dd-work-dual-panels/);
assert.doesNotMatch(admin,/SUPABASE_SERVICE_ROLE_KEY|RESEND_API_KEY/);
assert.doesNotMatch(dashboard,/SUPABASE_SERVICE_ROLE_KEY|RESEND_API_KEY/);
console.log('PASS: original admin navigation complete, bilingual private shell and owner/accountant dashboards');
