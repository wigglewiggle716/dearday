'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {
  enabled,validRecipient,dispatchTransactionalEmails
}=require('../lib/transactional-email-dispatch.cjs');

const uuid='12345678-1234-4234-8234-1234567890ab';
const lease='12345678-1234-4234-8234-1234567890ac';
const env={RESEND_TRANSACTIONAL_EMAILS_ENABLED:'true',RESEND_API_KEY:'synthetic-test-key'};
const job={
  id:uuid,lease_token:lease,event_type:'booking_request_received',
  locale:'ar',recipient:'test@example.invalid',
  variables:{CUSTOMER_NAME:'أحمد',ORDER_NUMBER:5}
};
function dbFor(jobs){
  const calls=[];
  return {
    calls,rpc:async(name,args)=>{
      calls.push({name,args});
      if(name==='claim_transactional_email_notifications')return {data:jobs,error:null};
      if(name==='settle_transactional_email_notification')return {data:true,error:null};
      throw new Error('Unexpected RPC: '+name);
    }
  };
}
test('sending is OFF unless explicit feature flag and key',async()=>{
  assert.equal(enabled({}),false);
  assert.equal(enabled({RESEND_TRANSACTIONAL_EMAILS_ENABLED:'true'}),false);
  assert.equal(enabled({RESEND_API_KEY:'value'}),false);
  const db=dbFor([job]);
  let invoked=false;
  const result=await dispatchTransactionalEmails({supabase:db,fetchImpl:async()=>{invoked=true;},env:{}});
  assert.deepEqual(result,{enabled:false,claimed:0,sent:0,failed:0});
  assert.equal(invoked,false);
  assert.equal(db.calls.length,0);
});
test('successful send is idempotent at provider and recorded in database',async()=>{
  const db=dbFor([job]);let request;
  const result=await dispatchTransactionalEmails({supabase:db,env,fetchImpl:async(url,opts)=>{
    request={url,opts};
    return {ok:true,status:200,json:async()=>({id:'provider-test-id'})};
  }});
  assert.equal(result.sent,1);
  assert.equal(request.url,'https://api.resend.com/emails');
  assert.equal(request.opts.headers['Idempotency-Key'],'dear-day-notification-'+uuid);
  const payload=JSON.parse(request.opts.body);
  assert.equal(payload.template.id,'dear-day-booking-received-ar');
  assert.equal(payload.template.variables.ORDER_NUMBER,'DD-000005');
  assert.deepEqual(payload.to,['test@example.invalid']);
  const settled=db.calls.at(-1);
  assert.equal(settled.name,'settle_transactional_email_notification');
  assert.equal(settled.args.p_sent,true);
  assert.equal(settled.args.p_provider_message_id,'provider-test-id');
});
test('invalid recipient never calls provider and permanently fails',async()=>{
  const db=dbFor([{...job,recipient:'not-an-email'}]);let sent=false;
  const result=await dispatchTransactionalEmails({supabase:db,env,fetchImpl:async()=>{sent=true;}});
  assert.equal(sent,false);
  assert.equal(result.failed,1);
  assert.equal(db.calls.at(-1).args.p_error_code,'INVALID_RECIPIENT');
});
test('missing variable never calls provider',async()=>{
  const db=dbFor([{...job,variables:{CUSTOMER_NAME:'A'}}]);let sent=false;
  await dispatchTransactionalEmails({supabase:db,env,fetchImpl:async()=>{sent=true;}});
  assert.equal(sent,false);
  assert.equal(db.calls.at(-1).args.p_error_code,'MISSING_VARIABLE');
});
test('payment events cannot be sent by this dispatcher',async()=>{
  const db=dbFor([{...job,event_type:'payment_received'}]);let sent=false;
  await dispatchTransactionalEmails({supabase:db,env,fetchImpl:async()=>{sent=true;}});
  assert.equal(sent,false);
  assert.equal(db.calls.at(-1).args.p_error_code,'INVALID_EVENT_DATA');
});
test('rate limit is retryable and settlements are recorded',async()=>{
  const db=dbFor([job]);
  const result=await dispatchTransactionalEmails({supabase:db,env,fetchImpl:async()=>({ok:false,status:429})});
  assert.equal(result.failed,1);
  assert.equal(db.calls.at(-1).args.p_error_code,'RATE_LIMIT');
});
test('recipient validation is conservative',()=>{
  assert.equal(validRecipient('good@example.com'),true);
  assert.equal(validRecipient('oops@@example.com'),false);
  assert.equal(validRecipient('no-email'),false);
});
