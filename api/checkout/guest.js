const {createHmac,randomUUID,timingSafeEqual}=require('node:crypto');
const {getSupabaseAdmin}=require('../../lib/supabase-admin');
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function sign(value,secret){return createHmac('sha256',secret).update('dd-guest-v1:'+value).digest('hex')}
function guestCookie(raw,secret){
 const match=String(raw||'').match(/(?:^|;\s*)__Host-ddGuest=([^;]+)/);
 if(match){const [id,until,mac]=match[1].split('.'),v=id+'.'+until,expected=sign(v,secret);
  if(uuid.test(id)&&Number(until)>Date.now()&&/^[a-f0-9]{64}$/.test(mac||'')&&timingSafeEqual(Buffer.from(mac),Buffer.from(expected)))return {id,value:match[1]};}
 const id=randomUUID(),v=id+'.'+(Date.now()+86400000);return {id,value:v+'.'+sign(v,secret)};
}
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'METHOD_NOT_ALLOWED'})}
 const origin=req.headers.origin;
 if(!['https://dear-day.com','https://www.dear-day.com'].includes(origin))return res.status(403).json({error:'INVALID_ORIGIN'});
 if(!String(req.headers['content-type']||'').startsWith('application/json'))return res.status(415).json({error:'INVALID_CONTENT_TYPE'});
 try{
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
  if(!body||JSON.stringify(body).length>16000||!uuid.test(body.p_key||''))return res.status(400).json({error:'INVALID_REQUEST'});
  const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!secret)return res.status(503).json({error:'CHECKOUT_UNAVAILABLE'});
  const s=getSupabaseAdmin(),guest=guestCookie(req.headers.cookie,secret);
  // Vercel overwrites this header; never accept a caller-supplied identity/IP in the body.
  const ip=String(req.headers['x-vercel-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
  const rateKey=sign('rate:'+ip,secret);
  const rate=await s.rpc('allow_guest_checkout_attempt',{p_bucket:rateKey});
  if(rate.error)throw rate.error;
  if(!rate.data)return res.status(429).json({error:'TOO_MANY_REQUESTS'});
  res.setHeader('Set-Cookie','__Host-ddGuest='+guest.value+'; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=86400');
  const {data,error}=await s.rpc('prepare_guest_checkout',{p_guest:guest.id,p_items:body.p_items,p_event:body.p_event,p_key:body.p_key,p_quote_token:body.p_quote_token});
  if(error){const code=String(error.message||'').split(':')[0];const allowed=/^(INVALID_CART|INVALID_EVENT|INVALID_EVENT_DATE|INVALID_QUANTITY|INVALID_LISTING|MISSING_DELIVERY_DETAILS|MISSING_CONTACT_DETAILS|PRICE_CHANGED|ORDER_EXPIRED|IDEMPOTENCY_CONFLICT|INSUFFICIENT_STOCK|LISTING_UNAVAILABLE|PARTNER_UNAVAILABLE|UNAVAILABLE_SLOT|BOOKING_CONFIGURATION_REQUIRED|TOO_MANY_PENDING_ORDERS)$/;
   return res.status(400).json({error:allowed.test(code)?code:'CHECKOUT_UNAVAILABLE'});}
  return res.status(200).json({data});
 }catch{return res.status(503).json({error:'CHECKOUT_UNAVAILABLE'})}
};
module.exports.guestCookie=guestCookie;
