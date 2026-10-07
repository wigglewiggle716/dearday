const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
async function cancellations(rows,error=null){
  const elements={loading:{style:{}},cancellationsList:{innerHTML:''}};
  let called='',message='';
  const D={guard:async()=>({supabase:{rpc:async name=>{called=name;return {data:rows,error}}}}),esc:s=>String(s??'').replace(/</g,'&lt;'),day:()=>'',money:n=>String(n),show:(id,text)=>{message=text}};
  vm.runInNewContext(fs.readFileSync('approved-pages/dear-day-partner-cancellations.js','utf8'),{window:{DDPartner:D},document:{getElementById:id=>elements[id]},console:{error(){}}});
  await new Promise(setImmediate);
  assert.equal(called,'partner_list_cancellations');
  assert.equal(elements.loading.style.display,'none');
  if(error)assert.match(message,/تعذر/);
  else if(!rows.length)assert.match(elements.cancellationsList.innerHTML,/لا توجد إلغاءات/);
  else {assert.match(elements.cancellationsList.innerHTML,/تم الإلغاء/);assert.ok(!elements.cancellationsList.innerHTML.includes('<script>'));}
}
async function policySession(remember){
  const localStorage={getItem:()=>remember},sessionStorage={};let captured;
  const source=fs.readFileSync('approved-pages/dear-day-refund-policies.js','utf8').replace('import(SUPABASE_ESM)','Promise.resolve(mockModule)');
  const redirects=[];
  vm.runInNewContext(source,{localStorage,sessionStorage,window:{DEAR_DAY_SUPABASE:{url:'test',publishableKey:'test'}},document:{body:{dataset:{policyPortal:'partner'}},readyState:'complete',getElementById:()=>({style:{}})},location:{replace:p=>redirects.push(p)},mockModule:{createClient:(url,key,options)=>{captured=options.auth.storage;return {auth:{getUser:async()=>({data:{user:null}})}}}},console:{error(e){throw e}}});
  await new Promise(setImmediate);
  assert.equal(captured,remember==='0'?sessionStorage:localStorage);
  assert.deepEqual(redirects,['/Dear-Day-Partner-Login.html']);
}
(async()=>{
  await cancellations([]);
  await cancellations([{order_number:1,item_name:'<script>',item_status:'refunded',reason_text:'<script>'}]);
  await cancellations(null,new Error('fixture'));
  for(const remember of ['0','1',null])await policySession(remember);
  console.log('PASS: cancellations empty/data/error; policy session storage and unauthenticated guard');
})().catch(e=>{console.error(e);process.exitCode=1});
