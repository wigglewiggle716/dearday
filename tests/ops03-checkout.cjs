const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
async function run(lang){
 const storage=new Map(),elements=new Map(),calls=[];let creations=0,unavailable=false;
 function el(id){if(!elements.has(id))elements.set(id,{value:'',style:{},textContent:'',append(){},before(){},replaceChildren(){},setAttribute(){}});return elements.get(id)}
 const lid='11111111-1111-4111-8111-111111111111';
 storage.set('dearDayCart',JSON.stringify([{id:lid,quantity:2,price:1,name:'Untrusted'}]));
 storage.set('dearDayPlan',JSON.stringify({eventDetails:{eventDate:'2026-11-01',eventTime:'12:00',address:'Fixture'}}));
 el('payerPhone').value='000';
 const quote={items:[{name:'Approved',name_en:'Approved',unit_price:125,quantity:2,line_total:250}],subtotal:250,grand_total:250,quote_token:'server-quote'};
 const s={auth:{getUser:async()=>({data:{user:{id:'customer'}}})},rpc:async(name,args)=>{calls.push(args);if(unavailable)return {error:{message:'INSUFFICIENT_STOCK'}};if(args.p_key){creations++;return {data:{...quote,order_id:'order',expires_at:'2099-01-01'}}}return {data:quote}}};
 const context={document:{documentElement:{lang},readyState:'complete',getElementById:el,createElement:()=>({style:{},append(){},setAttribute(){}})},window:{DEAR_DAY_SUPABASE:{url:'fixture',publishableKey:'fixture'}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},sessionStorage:{},crypto:{randomUUID:()=> 'fixture-key'},Intl,Date,console,mockModule:{createClient:()=>s}};
 const source=fs.readFileSync('approved-pages/dear-day-checkout.js','utf8').replace("import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm')",'Promise.resolve(mockModule)');
 vm.runInNewContext(source,context);
 assert.equal(await context.window.DDCheckout.prepare(),null);
 assert.equal(creations,0,'first click must only show the quote');
 assert.ok(!JSON.stringify(calls[0]).includes('price'));
 assert.ok(el('grandTotal').textContent.includes(lang==='en'?'250':'٢٥٠'));
 assert.equal((await context.window.DDCheckout.prepare()).order_id,'order');
 assert.equal((await context.window.DDCheckout.prepare()).order_id,'order');
 assert.equal(calls.at(-1).p_key,calls.at(-2).p_key,'retry keeps key');
 unavailable=true;storage.delete('ddCheckoutRequest:customer');
 assert.equal(await context.window.DDCheckout.prepare(),null);
 assert.ok(el('ddCheckoutStatus').textContent.length>0);
 console.log('PASS checkout',lang);
}
(async()=>{await run('ar');await run('en');
 for(const p of ['api/paymob/create-intention.js','api/paymob/methods.js']){
  const source=fs.readFileSync(p,'utf8').replace('export default function handler','function handler');const ctx={};vm.runInNewContext(source+';this.handler=handler',ctx);
  let status=200,result;const res={setHeader(){},status(n){status=n;return this},json(v){result=v;return this}};ctx.handler({method:'POST',body:{amount:1}},res);
  if(p.includes('create-intention')){assert.equal(status,503);assert.equal(result.error,'PAYMENTS_NOT_READY')}
  else assert.ok(Object.values(result.methods).every(v=>v===false));
 }console.log('PASS payment gate');
})().catch(e=>{console.error(e);process.exitCode=1});
