'use strict';
const {getSupabaseAdmin}=require('./supabase-admin.cjs');

const TEMPLATE_ALIAS='dear-day-payment-received-en';
const MAX_BATCH=5;
const EMAIL_ENDPOINT='https://api.resend.com/emails';
function enabled(env=process.env){
 return env.RESEND_ORDER_EMAILS_ENABLED==='true'&&Boolean(env.RESEND_API_KEY);
}
function escapeHtml(input,max=100){
 return String(input??'').slice(0,max).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function buildVariables(row){
 const number=String(row.order_number||'').replace(/\D/g,'').slice(0,20);
 if(!number||!Number.isFinite(Number(row.amount))||Number(row.amount)<0||row.currency!=='EGP')
  throw new Error('INVALID_ORDER_DATA');
 const date=/^\d{4}-\d{2}-\d{2}$/.test(String(row.occasion_date||''))
  ?new Date(row.occasion_date+'T12:00:00Z'):null;
 return {
  CUSTOMER_NAME:escapeHtml(row.customer_name||'there'),
  ORDER_NUMBER:'DD-'+number.padStart(6,'0'),
  TOTAL_AMOUNT:'EGP '+Number(row.amount).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}),
  OCCASION_DATE:date&&!Number.isNaN(date.getTime())
   ?date.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})
   :'To be confirmed'
 };
}
async function dispatchPaidEmails({supabase,fetchImpl,env=process.env,limit=2}={}){
 if(!enabled(env))return {enabled:false,claimed:0,sent:0,failed:0};
 const db=supabase||getSupabaseAdmin();
 const send=fetchImpl||fetch;
 const size=Math.max(1,Math.min(MAX_BATCH,Number(limit)||2));
 const claimed=await db.rpc('claim_order_email_notifications',{p_limit:size});
 if(claimed.error)throw new Error('ORDER_EMAIL_CLAIM_FAILED');
 const batch=claimed.data;
 if(!Array.isArray(batch))throw new Error('INVALID_EMAIL_OUTBOX_RESPONSE');
 const totals={enabled:true,claimed:batch.length,sent:0,failed:0};
 for(const job of batch){
  let ok=false,providerId=null,errorCode='SEND_FAILED';
  try{
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(job.recipient||'')))throw new Error('INVALID_RECIPIENT');
   const payload={
    from:'Dear Day <info@dear-day.com>',
    to:[job.recipient],
    reply_to:'info@dear-day.com',
    template:{id:env.RESEND_ORDER_PAID_TEMPLATE_ID||TEMPLATE_ALIAS,variables:buildVariables(job)}
   };
   const controller=new AbortController();
   const timer=setTimeout(()=>controller.abort(),8000);
   let response;
   try{
    response=await send(EMAIL_ENDPOINT,{method:'POST',headers:{
     Authorization:'Bearer '+env.RESEND_API_KEY,
     'Content-Type':'application/json',
     'Idempotency-Key':'dear-day-paid-'+job.order_id
    },body:JSON.stringify(payload),signal:controller.signal});
   }finally{clearTimeout(timer);}
   if(response.ok){
    const result=await response.json();
    if(!result||typeof result.id!=='string'||!result.id)throw new Error('BAD_PROVIDER_RESPONSE');
    providerId=result.id;ok=true;
   }else{errorCode=response.status===429?'RATE_LIMIT':response.status>=500?'PROVIDER_ERROR':'PROVIDER_REJECTED';}
  }catch(e){
   errorCode=['INVALID_RECIPIENT','INVALID_ORDER_DATA','BAD_PROVIDER_RESPONSE'].includes(e.message)?e.message:
    e.name==='AbortError'?'PROVIDER_TIMEOUT':'PROVIDER_UNAVAILABLE';
  }
  const settled=await db.rpc('settle_order_email_notification',{
   p_id:job.id,p_lease_token:job.lease_token,p_sent:ok,
   p_provider_message_id:providerId,p_error_code:ok?null:errorCode
  });
  if(settled.error||settled.data!==true)throw new Error('ORDER_EMAIL_SETTLEMENT_FAILED');
  if(ok)totals.sent++;else totals.failed++;
 }
 return totals;
}
module.exports={enabled,escapeHtml,buildVariables,dispatchPaidEmails};
