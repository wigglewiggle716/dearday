'use strict';
// STAGED: no schedule or live event handlers. Must be explicitly enabled.
const {getSupabaseAdmin}=require('./supabase-admin.cjs');
const {prepareTemplate}=require('./notification-email-registry.cjs');
const API='https://api.resend.com/emails';
const MAX_BATCH=5;
function enabled(env=process.env){
  return env.RESEND_TRANSACTIONAL_EMAILS_ENABLED==='true' &&
    Boolean(env.RESEND_API_KEY);
}
function validRecipient(email){
  return typeof email==='string' && email.length<=254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function failureCode(error){
  if(error && error.name==='AbortError')return 'PROVIDER_TIMEOUT';
  const msg=error instanceof Error?error.message:String(error||'');
  if(msg==='INVALID_RECIPIENT')return 'INVALID_RECIPIENT';
  if(msg==='BAD_PROVIDER_RESPONSE')return 'BAD_PROVIDER_RESPONSE';
  if(/^MISSING_EMAIL_VARIABLE/.test(msg))return 'MISSING_VARIABLE';
  if(/EMAIL_VARIABLE_TOO_LONG|INVALID_ORDER_NUMBER|UNKNOWN_EMAIL_EVENT|INVALID_EMAIL_LOCALE|INVALID_EMAIL_VARIABLES|EVENT_DEFERRED/.test(msg))return 'INVALID_EVENT_DATA';
  return 'PROVIDER_UNAVAILABLE';
}
async function dispatchTransactionalEmails({supabase,fetchImpl,env=process.env,limit=3}={}){
  if(!enabled(env))return {enabled:false,claimed:0,sent:0,failed:0};
  const db=supabase||getSupabaseAdmin(),post=fetchImpl||fetch;
  const size=Math.max(1,Math.min(MAX_BATCH,Number(limit)||3));
  const claim=await db.rpc('claim_transactional_email_notifications',{p_limit:size});
  if(claim.error)throw new Error('TRANSACTIONAL_EMAIL_CLAIM_FAILED');
  if(!Array.isArray(claim.data))throw new Error('TRANSACTIONAL_EMAIL_INVALID_CLAIM');
  const totals={enabled:true,claimed:claim.data.length,sent:0,failed:0};
  for(const job of claim.data){
    let sent=false,providerId=null,errCode='SEND_FAILED';
    try{
      if(!validRecipient(job.recipient))throw new Error('INVALID_RECIPIENT');
      if(typeof job.id!=='string' || !/^[a-f0-9-]{36}$/i.test(job.id))throw new Error('INVALID_EVENT_DATA');
      const message=prepareTemplate({
        event:job.event_type,locale:job.locale,variables:job.variables
      });
      const payload={
        from:'Dear Day <info@dear-day.com>',
        to:[job.recipient],
        reply_to:'info@dear-day.com',
        template:message.template
      };
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),8000);
      let response;
      try{
        response=await post(API,{
          method:'POST',
          headers:{
            Authorization:'Bearer '+env.RESEND_API_KEY,
            'Content-Type':'application/json',
            'Idempotency-Key':'dear-day-notification-'+job.id
          },
          body:JSON.stringify(payload),signal:controller.signal
        });
      }finally{clearTimeout(timer);}
      if(response.ok){
        const result=await response.json();
        if(!result || typeof result.id!=='string' || !result.id)throw new Error('BAD_PROVIDER_RESPONSE');
        sent=true;
        providerId=result.id;
      }else{
        errCode=response.status===429?'RATE_LIMIT':
          response.status>=500?'PROVIDER_ERROR':'PROVIDER_REJECTED';
      }
    }catch(error){errCode=failureCode(error);}
    const settled=await db.rpc('settle_transactional_email_notification',{
      p_id:job.id,p_lease_token:job.lease_token,p_sent:sent,
      p_provider_message_id:providerId,p_error_code:sent?null:errCode
    });
    if(settled.error || settled.data!==true){
      throw new Error('TRANSACTIONAL_EMAIL_SETTLEMENT_FAILED');
    }
    if(sent)totals.sent++;else totals.failed++;
  }
  return totals;
}
module.exports={enabled,validRecipient,failureCode,dispatchTransactionalEmails};
