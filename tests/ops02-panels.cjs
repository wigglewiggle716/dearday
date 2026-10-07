// Browser UI regression checks with a mocked backend; SQL tests enforce real permissions.
// Run with Playwright available: node tests/ops02-panels.cjs
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const tables = {
  partners: [{ id: 'p1', name_ar: 'شريك تجريبي', slug: 'fixture', status: 'active', commission_rate: 10 }],
  partner_directory: [{ id: 'p1', name_ar: 'شريك تجريبي', status: 'active' }],
  categories: [{ id: 'c1', name_ar: 'هدايا', slug: 'gifts', is_active: true }],
  listings: [{ id: 'l1', partner_id: 'p1', category_id: 'c1', kind: 'product', published_version_id: 'v1', is_available: true }],
  listing_versions: [{ id: 'v1', listing_id: 'l1', name_ar: 'منتج تجريبي', status: 'published', price: 10, media: [] }],
  refund_policies: [{ id: 'r1', title: 'سياسة تجريبية', scope: 'partner', partner_id: 'p1', status: 'pending_review', rules: { mode: 'manual' } }]
};
async function panel(browser, pageFile, script, role, permissions, check) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const mock = `export function createClient(){
    const profile={id:'fixture-user',role:${JSON.stringify(role)},is_active:true};
    const tables=${JSON.stringify(tables)};
    return {auth:{mfa:{getAuthenticatorAssuranceLevel:async()=>({data:{currentLevel:'aal1',nextLevel:'aal1'}})},getUser:async()=>({data:{user:{id:'fixture-user',email:'fixture@example.test'}}}),signOut:async()=>({})},
      rpc:async()=>({data:${JSON.stringify(permissions.map(permission_code=>({permission_code})))},error:null}),
      from(table){const q=new Proxy({}, {get(_,key){
        if(key==='then')return resolve=>resolve({data:table==='profiles'?profile:(tables[table]||[]),error:null});
        return ()=>q;
      }});return q;}};
  }`;
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.hostname === 'cdn.jsdelivr.net') return route.fulfill({contentType:'text/javascript',body:mock});
    if (url.pathname.endsWith('dear-day-supabase-config.js')) return route.fulfill({contentType:'text/javascript',body:"window.DEAR_DAY_SUPABASE={url:'https://fixture.invalid',publishableKey:'fixture'}"});
    const local = path.join(root, url.pathname);
    if (url.pathname === '/'+pageFile) {
      const html = fs.readFileSync(local,'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
      return route.fulfill({contentType:'text/html',body:html.replace('</body>',`<script src='/approved-pages/dear-day-supabase-config.js'></script><script src='/approved-pages/${script}'></script><script src='/approved-pages/dear-day-admin-shell.js'></script></body>`)});
    }
    if(fs.existsSync(local)&&fs.statSync(local).isFile()) return route.fulfill({path:local});
    return route.fulfill({body:''});
  });
  await page.goto('http://dearday.test/'+pageFile);
  await page.waitForFunction(()=>document.getElementById('loading')?.style.display==='none');
  await check(page);
  assert.deepEqual(errors,[],pageFile+' / '+role);
  console.log('PASS', pageFile, role);
  await page.close();
}
(async()=>{
  const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']}:{} )});
  try {
    await panel(browser,'Dear-Day-Admin-Products.html','dear-day-admin-products.js','content_admin',['catalog.view','catalog.manage'],async p=>{
      assert.equal(await p.locator('#addBtn').isVisible(),true);
      await p.locator('#body [data-act="edit"]').click();
      assert.equal(await p.locator('#versionStatus').inputValue(),'draft');
      assert.equal(await p.locator('#versionStatus option[value="published"]').isDisabled(),true);
      assert.equal(await p.locator('[data-act="archive"]').isVisible(),false);
    });
    await panel(browser,'Dear-Day-Admin-Products.html','dear-day-admin-products.js','marketing',['catalog.view'],async p=>{
      assert.equal(await p.locator('#addBtn').isVisible(),false);
      assert.equal(await p.locator('[data-act="edit"]').isVisible(),false);
    });
    await panel(browser,'Dear-Day-Admin-Partners.html','dear-day-admin-partners.js','accountant',['partners.view','finance.view'],async p=>{
      assert.equal(await p.locator('#addPartnerBtn').isVisible(),false);
      assert.equal(await p.locator('[data-action="edit"]').isVisible(),false);
      await p.locator('[data-action="view"]').click();
      assert.equal(await p.locator('#detailEditBtn').isVisible(),false);
    });
    for(const [role,permissions,canEdit,canReview] of [
      ['content_admin',['catalog.manage'],true,false],
      ['partner_manager',['approvals.review'],false,true]
    ]) await panel(browser,'Dear-Day-Admin-Refund-Policies.html','dear-day-refund-policies.js',role,permissions,async p=>{
      assert.equal(await p.locator('#addBtn').isVisible(),canEdit);
      assert.equal(await p.locator('[data-decision="approved"]').count(),canReview?1:0);
    });
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
