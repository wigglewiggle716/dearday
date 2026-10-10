'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=(name)=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
const dashboard=src('next-app/components/staff-workspace.jsx');
const finance=src('next-app/components/staff-finance.jsx');
const styles=src('next-app/app/staff-workspace.css');
const legacy=src('Dear-Day-Staff.html');
const migration=src('supabase/migrations/20261010_staff_finance_exact_totals.sql');
const nav=src('next-app/lib/staff-admin-navigation.js');
const locale=src('next-app/lib/locales.js');

// Restore the original accountant dashboard affordances and content ordering.
for(const value of ['لوحة المحاسب','فتح المالية والتسويات','الطلبات','الشركاء','أحدث التسويات','أحدث الطلبات'])
 assert.ok(dashboard.includes(value),'Missing original accountant content: '+value);
assert.match(dashboard,/className="dd-work-accountant-actions"/);
assert.match(dashboard,/className="dd-work-accountant-email"/);
assert.match(dashboard,/perms\.has\("orders\.view"\).*pathFor\("staffOrders",locale\)/);
assert.match(dashboard,/perms\.has\("partners\.view"\).*pathFor\("staffPartners",locale\)/);
assert.match(dashboard,/perms\.has\("finance\.view"\).*pathFor\("staffFinance",locale\)/);
assert.ok(dashboard.indexOf('title={t.latestSettlements}')<dashboard.indexOf('title={t.recentOrders}'),'Settlement panel must appear first for accountant');
assert.match(dashboard,/result\.orders\.slice\(0,accountant\?6:8\)/);
assert.match(dashboard,/t\.settlementStatuses\[s\.status\]/);
assert.match(dashboard,/accountant\?" dd-work-accountant"/);

// Exactly four original financial cards with the same semantic order.
const accountantMetrics=dashboard.slice(dashboard.indexOf(']:accountant?['),dashboard.indexOf(']:[',dashboard.indexOf(']:accountant?['))+3);
for(const value of ['"unsettled"','"draft"','"approved"','"paid"'])
 assert.ok(accountantMetrics.includes(value));
assert.match(styles,/\.dd-work-accountant-actions\{/);
assert.match(styles,/\.dd-work-accountant-quick\.primary/);
assert.match(styles,/\.dd-work-accountant-email/);
assert.match(styles,/\.dd-admin-main-content \.dd-work-accountant \.dd-work-metrics/);

// Keep already-migrated operational privileges and separate account roles.
assert.match(dashboard,/role==="super_admin"\|\|role==="admin"/);
assert.match(dashboard,/role==="accountant"/);
assert.match(nav,/id:"finance",route:"staffFinance"/);
assert.ok(locale.includes('["staffFinance", "staff/finance"]')||locale.includes('["staffFinance","staff/finance"]'));
assert.match(finance,/finance_create_settlement/);
assert.match(finance,/finance_update_settlement_status/);
assert.match(finance,/finance\.manage/);

// No monetary totals may be derived from the capped client list.
assert.match(dashboard,/client\.rpc\("staff_finance_exact_totals"\)/);
assert.match(finance,/client\.rpc\("staff_finance_exact_totals"\)/);
assert.match(finance,/data\.totals\?\.unsettled\?\?null/);
assert.doesNotMatch(finance,/data\.usedOverflow\?null:sum\(data\.eligible\)/);
assert.match(finance,/t\.totalsUnavailable/);
assert.match(migration,/private\.has_permission\('finance\.view'\)/);
assert.match(migration,/auth\.jwt\(\)->>'aal'/);
assert.match(migration,/not exists \(/);
assert.match(migration,/grant execute on function public\.staff_finance_exact_totals\(\)/);
assert.match(migration,/revoke all on function public\.staff_finance_exact_totals\(\)/);
assert.match(legacy,/id="accountantDashboard"/);
console.log('PASS: original accountant design, approved operation parity, protected exact finance totals');
