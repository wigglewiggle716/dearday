// Deterministic browser regression only; this does not authenticate real accounts.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
async function setup(browser,{role='super_admin',enrolled=false,aal='aal1',mobile=false}={}){
 const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname==='cdn.jsdelivr.net')return route.fulfill({contentType:'text/javascript',body:`
  const factors=${JSON.stringify(enrolled?[{id:'primary',status:'verified',factor_type:'totp',friendly_name:'Primary'}]:[])};let current='${aal}';
  export function createClient(){return {auth:{
    getUser:async()=>({data:{user:{id:'fixture'}}}),signOut:async()=>({error:null}),
    mfa:{listFactors:async()=>({data:{totp:factors,all:factors}}),
      getAuthenticatorAssuranceLevel:async()=>({data:{currentLevel:current,nextLevel:factors.some(x=>x.status==='verified')?'aal2':'aal1'}}),
      enroll:async()=>{const id='factor-'+factors.length;factors.push({id,status:'unverified',factor_type:'totp',friendly_name:'Dear Day fixture'});return{data:{id,totp:{qr_code:'<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><rect width="220" height="220" fill="white"/></svg>',secret:'SYNTHETIC-NOT-A-REAL-SEED'}}}},
      unenroll:async({factorId})=>{const i=factors.findIndex(x=>x.id===factorId);if(i>=0)factors.splice(i,1);return{}},
      challengeAndVerify:async({factorId,code})=>{if(code!=='123456')return{error:{message:'invalid code'}};factors.find(x=>x.id===factorId).status='verified';current='aal2';return{}}
    }},from(){const q=new Proxy({}, {get(_,key){if(key==='then')return resolve=>resolve({data:{role:'${role}',is_active:true}});return()=>q}});return q}}}
  `});
  if(u.pathname.endsWith('dear-day-supabase-config.js'))return route.fulfill({contentType:'text/javascript',body:"window.DEAR_DAY_SUPABASE={url:'https://fixture.invalid',publishableKey:'fixture'}"});
  const file=path.join(root,u.pathname);
  if(fs.existsSync(file)&&fs.statSync(file).isFile())return route.fulfill({path:file});
  return route.fulfill({contentType:'text/html',body:'<p>Fixture destination</p>'});
 });
 await page.goto('http://dearday.test/Dear-Day-Security.html?next=%2FDear-Day-Finance.html');
 await page.waitForFunction(()=>!document.getElementById('intro').textContent.includes('جاري'));
 return{page,errors};
}
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']}:{} )});
 try{
  const{page,errors}=await setup(browser,{mobile:true});
  await page.locator('#enroll').click();assert.equal(await page.locator('#qr').isVisible(),true);
  await page.locator('#code').fill('000000');await page.locator('#verifyButton').click();
  assert.match(await page.locator('#status').innerText(),/تعذر/);assert.equal(await page.locator('#enabled').isVisible(),false);
  await page.locator('#code').fill('123456');await page.locator('#verifyButton').click();
  await page.locator('#enabled').waitFor({state:'visible'});assert.equal(await page.locator('#secret').textContent(),'');assert.equal(await page.locator('#qr').getAttribute('src'),null);
  await page.locator('#backup').click();await page.locator('#cancel').click();await page.locator('#enabled').waitFor({state:'visible'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:'/tmp/dearday-mfa-mobile.png',fullPage:true});assert.deepEqual(errors,[]);await page.close();
  console.log('PASS MFA enrollment, invalid code, secret cleanup, backup cancellation, mobile layout');
  const challenge=await setup(browser,{enrolled:true});
  assert.equal(await challenge.page.locator('#setup').isVisible(),false);assert.equal(await challenge.page.locator('#enabled').isVisible(),false);
  await challenge.page.locator('#code').fill('123456');await challenge.page.locator('#verifyButton').click();await challenge.page.waitForURL('**/Dear-Day-Finance.html');assert.deepEqual(challenge.errors,[]);await challenge.page.close();
  console.log('PASS MFA sign-in challenge and safe return');
  const denied=await setup(browser,{role:'customer'});assert.equal(await denied.page.locator('#setup').isVisible(),false);assert.equal(await denied.page.locator('#verify').isVisible(),false);await denied.page.close();
  console.log('PASS customer blocked from staff setup');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
