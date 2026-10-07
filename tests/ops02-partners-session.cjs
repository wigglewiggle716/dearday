// Execute the real page boot with isolated browser storage and Supabase boundary mocks.
const vm=require('node:vm');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const source=fs.readFileSync('approved-pages/dear-day-admin-partners.js','utf8').replace('import(SUPABASE_ESM)','Promise.resolve(mockModule)');
async function check(remember){
  const localStorage={getItem:()=>remember},sessionStorage={};
  const expected=remember==='0'?sessionStorage:localStorage;
  const elements=new Map();
  const el=id=>{if(!elements.has(id))elements.set(id,{style:{},dataset:{},value:'',addEventListener(){}});return elements.get(id)};
  const redirects=[];let authenticated=false,permissionChecked=false;
  const context={localStorage,sessionStorage,window:{DEAR_DAY_SUPABASE:{url:'test',publishableKey:'test'}},
    document:{readyState:'complete',getElementById:el,querySelectorAll:()=>[],addEventListener(){}},
    location:{replace:url=>redirects.push(url)},console:{error:e=>{throw e}},setTimeout:()=>0,
    mockModule:{createClient:(url,key,options)=>({auth:{getUser:async()=>{authenticated=options.auth.storage===expected;return {data:{user:authenticated?{id:'fixture',email:'test@example.invalid'}:null}}}},
      from:()=>({select:()=>({eq:()=>({single:async()=>({data:{id:'fixture',role:'accountant',is_active:true}})})})}),
      rpc:async()=>{permissionChecked=true;return {data:[]}}})}};
  vm.runInNewContext(source,context);await new Promise(setImmediate);
  assert.equal(authenticated,true,'must read the active login storage');
  assert.equal(permissionChecked,true,'must reach the permission guard');
  assert.deepEqual(redirects,['/Dear-Day-Staff.html'],'missing permission must still deny access');
}
(async()=>{for(const remember of ['0','1',null])await check(remember);console.log('PASS: temporary, persistent and default sessions; permission denial preserved')})().catch(e=>{console.error(e);process.exitCode=1});
