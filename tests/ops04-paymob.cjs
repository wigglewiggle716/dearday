const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),vm=require('node:vm');
const {signedValues,verifyAndNormalize}=require('../lib/paymob-webhook');
const {prepareGuestIntention}=require('../lib/paymob-intention');
const fixture={amount_cents:100000,created_at:'2024-06-13T11:33:44.592345',currency:'EGP',error_occured:false,has_parent_transaction:false,id:192036465,integration_id:4097558,is_3d_secure:true,is_auth:false,is_capture:false,is_refunded:false,is_standalone_payment:true,is_voided:false,order:{id:217503754},owner:302852,pending:false,source_data:{pan:'2346',sub_type:'MasterCard',type:'card'},success:true};
// Independent official concatenated example locks field order, not just implementation symmetry.
const expected='1000002024-06-13T11:33:44.592345EGPfalsefalse1920364654097558truefalsefalsefalsetruefalse217503754302852false2346MasterCardcardtrue';
assert.equal(signedValues(fixture).join(''),expected);
const secret='test-fixture-secret',hmac=crypto.createHmac('sha512',secret).update(expected).digest('hex');
const event=verifyAndNormalize(fixture,hmac,secret);assert.equal(event.amount_cents,100000);assert.ok(!JSON.stringify(event).includes('2346'));
for(const [key,value] of [['amount_cents',1],['currency','USD'],['success',false],['owner',1],['integration_id',1]])assert.throws(()=>verifyAndNormalize({...fixture,[key]:value},hmac,secret));
assert.throws(()=>verifyAndNormalize(fixture,'0'.repeat(128),secret));assert.throws(()=>verifyAndNormalize({...fixture,success:'true'},hmac,secret));
assert.deepEqual(verifyAndNormalize({...fixture,is_live:true,refunded_amount_cents:99999,extras:{order_id:'attacker'}},hmac,secret),event);
async function handlerTests(){
 let calls=0,dbFail=false;const ctx={module:{exports:{}},process:{env:{PAYMOB_HMAC_SECRET:secret}},require:n=>n.includes('paymob-webhook')?{verifyAndNormalize}:{getSupabaseAdmin:()=>({rpc:async()=>{calls++;return {error:dbFail?{}:null}}})}};
 vm.runInNewContext(fs.readFileSync('api/paymob/webhook.js','utf8'),ctx);
 async function run(overrides={}){let status=200,body;await ctx.module.exports({method:'POST',headers:{'content-type':'application/json'},query:{hmac},body:{type:'TRANSACTION',obj:fixture},...overrides},{setHeader(){},status(n){status=n;return this},json(v){body=v}});return status}
 assert.equal(await run({method:'GET'}),405);assert.equal(calls,0);
 assert.equal(await run({query:{hmac:'bad'}}),401);assert.equal(calls,0);
 assert.equal(await run(),200);dbFail=true;assert.equal(await run(),503);
}
async function intentionTests(){
 let posts=0,binds=0,unknown=0,ready=false;let sent;
 const db={rpc:async(name,args)=>{
  if(name==='reserve_guest_payment'){assert.equal(args.p_guest,'guest');return {data:{id:'attempt',new:!ready,state:ready?'ready':'creating',client_secret:ready?'saved-secret':null,amount_cents:25100,currency:'EGP',expires_at:new Date(Date.now()+600000).toISOString(),items:[{name:'Trusted',amount:25100,quantity:1}],contact:{name:'Guest Name',email:'test@example.invalid',phone:'000',address:'Fixture'},area:'Giza'}}}
  if(name==='bind_payment_intention'){binds++;return {data:true}}
  if(name==='mark_payment_unknown'){unknown++;return {data:null}}
 }};
 const args={db,guestId:'guest',orderId:'order',integrationId:100,ownerId:200,secretKey:'sk_test_fixture',request:async(url,opts)=>{posts++;sent=JSON.parse(opts.body);return {ok:true,json:async()=>({id:'pi_test_fixture',intention_order_id:1,client_secret:'secret'})}}};
 await prepareGuestIntention(args);assert.equal(sent.amount,25100);assert.equal(sent.special_reference,'attempt');assert.equal(binds,1);
 ready=true;assert.equal((await prepareGuestIntention(args)).client_secret,'saved-secret');assert.equal(posts,1);
 await assert.rejects(prepareGuestIntention({...args,secretKey:'sk_live_forbidden'}));assert.equal(posts,1);
 ready=false;await assert.rejects(prepareGuestIntention({...args,request:async()=>{throw Error('timeout')}}));assert.equal(unknown,1);
}
(async()=>{await handlerTests();await intentionTests();console.log('PASS HMAC field order/tamper, webhook retry, trusted intention amount, reuse, live gate and timeout ambiguity')})().catch(e=>{console.error(e);process.exitCode=1});
