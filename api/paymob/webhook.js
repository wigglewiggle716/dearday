const {verifyAndNormalize}=require('../../lib/paymob-webhook');
const {getSupabaseAdmin}=require('../../lib/supabase-admin');
const {dispatchPaidEmails}=require('../../lib/order-email-dispatch');
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'METHOD_NOT_ALLOWED'});}
 if(!process.env.PAYMOB_HMAC_SECRET)return res.status(503).json({error:'WEBHOOK_NOT_CONFIGURED'});
 let event;
 try{
  if(!String(req.headers['content-type']||'').startsWith('application/json'))return res.status(415).json({error:'INVALID_CONTENT_TYPE'});
  if(JSON.stringify(req.body||'').length>65536)return res.status(413).json({error:'PAYLOAD_TOO_LARGE'});
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
  if(body?.type!=='TRANSACTION')return res.status(400).json({error:'UNSUPPORTED_CALLBACK'});
  event=verifyAndNormalize(body.obj,req.query?.hmac,process.env.PAYMOB_HMAC_SECRET);
 }catch{return res.status(401).json({error:'INVALID_CALLBACK'});}
 try{
  const {data,error}=await getSupabaseAdmin().rpc('process_paymob_event',{p_event:event});
  if(error)return res.status(503).json({error:'CALLBACK_RETRY_REQUIRED'});
  // The DB trigger queues exactly once after a verified paid transition.
  // Delivery is best effort here; the private outbox retains failed/unsent work.
  if(data?.outcome==='paid'&&data?.duplicate!==true){
   try{await dispatchPaidEmails({limit:2});}catch{/* Retry via protected worker; never undo a paid order. */}
  }
  return res.status(200).json({received:true});
 }catch{return res.status(503).json({error:'CALLBACK_RETRY_REQUIRED'});}
};
