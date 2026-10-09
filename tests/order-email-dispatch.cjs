'use strict';
const assert=require('node:assert/strict');
const {enabled,escapeHtml,buildVariables,dispatchPaidEmails}=require('../lib/order-email-dispatch');
const ENV={RESEND_ORDER_EMAILS_ENABLED:'true',RESEND_API_KEY:'re_mock',RESEND_ORDER_PAID_TEMPLATE_ID:'dear-day-payment-received-en'};
const job={id:'a0000000-0000-4000-8000-000000000001',lease_token:'b0000000-0000-4000-8000-000000000001',order_id:'c0000000-0000-4000-8000-000000000001',recipient:'customer@example.com',customer_name:'Amy & <script>',order_number:42,amount:'1234.50',currency:'EGP',occasion_date:'2026-11-01'};
function database(queue){
 const calls=[];
 return {calls,rpc:async(name,args)=>{
  calls.push({name,args});
  if(name==='claim_order_email_notifications')return {data:queue.splice(0,args.p_limit),error:null};
  if(name==='settle_order_email_notification')return {data:true,error:null};
  throw new Error('Unexpected RPC: '+name);
 }};
}
(async()=>{
 assert.equal(enabled({}),false);
 assert.equal(escapeHtml('A & <b>'), 'A &amp; &lt;b&gt;');
 assert.deepEqual(buildVariables(job),{
  CUSTOMER_NAME:'Amy &amp; &lt;script&gt;',
  ORDER_NUMBER:'DD-000042',
  TOTAL_AMOUNT:'EGP 1,234.50',
  OCCASION_DATE:'1 November 2026'
 });
 assert.throws(()=>buildVariables({...job,currency:'USD'}),/INVALID_ORDER_DATA/);
 const dormant=await dispatchPaidEmails({env:{},supabase:{rpc:()=>{throw Error('should not run')}},fetchImpl:()=>{throw Error('should not run')}});
 assert.deepEqual(dormant,{enabled:false,claimed:0,sent:0,failed:0});
 let sent=0,headers,body;
 const db=database([job]);
 const success=await dispatchPaidEmails({env:ENV,supabase:db,fetchImpl:async(_,opts)=>{
  sent++;headers=opts.headers;body=JSON.parse(opts.body);return {ok:true,json:async()=>({id:'resend-123'})};
 }});
 assert.deepEqual(success,{enabled:true,claimed:1,sent:1,failed:0});
 assert.equal(sent,1);assert.equal(body.to[0],job.recipient);
 assert.equal(body.template.id,ENV.RESEND_ORDER_PAID_TEMPLATE_ID);
 assert.equal(body.template.variables.ORDER_NUMBER,'DD-000042');
 assert.equal(headers['Idempotency-Key'],'dear-day-paid-'+job.order_id);
 assert.equal(db.calls[1].args.p_sent,true);
 assert.equal(db.calls[1].args.p_provider_message_id,'resend-123');
 const noDuplicate=await dispatchPaidEmails({env:ENV,supabase:db,fetchImpl:()=>{throw Error('duplicate')}});
 assert.equal(noDuplicate.claimed,0);
 const faildb=database([job]);
 const failed=await dispatchPaidEmails({env:ENV,supabase:faildb,fetchImpl:async()=>({ok:false,status:429})});
 assert.equal(failed.failed,1);assert.equal(faildb.calls[1].args.p_sent,false);
 assert.equal(faildb.calls[1].args.p_error_code,'RATE_LIMIT');
 const rejected=await dispatchPaidEmails({env:ENV,supabase:database([{...job,recipient:'not-an-email'}]),fetchImpl:()=>{throw Error('invalid recipient must not send')}});
 assert.equal(rejected.failed,1);
 console.log('PASS paid email guard, safe variables, exact recipient, idempotency, settlement, retries');
})().catch(e=>{console.error(e);process.exitCode=1});
