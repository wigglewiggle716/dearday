// Not exposed until sandbox acceptance. Public create-intention remains a hard 503.
async function prepareGuestIntention({db,guestId,orderId,integrationId,ownerId,secretKey,request=fetch}){
 // This implementation is deliberately test-only until a live-release review.
 if(!/^sk_test_/.test(secretKey||'')||!Number.isSafeInteger(integrationId)||integrationId<=0||!Number.isSafeInteger(ownerId)||ownerId<=0)throw Error('PAYMENT_CONFIG_INVALID');
 const {data:a,error}=await db.rpc('reserve_guest_payment',{p_guest:guestId,p_order:orderId,p_integration:integrationId,p_owner:ownerId});
 if(error)throw Error('ORDER_NOT_PAYABLE');
 if(!a.new){if(['ready','failed'].includes(a.state)&&a.client_secret)return {client_secret:a.client_secret};throw Error('PAYMENT_RECONCILIATION_REQUIRED')}
 try{
  const ttl=Math.floor((Date.parse(a.expires_at)-Date.now())/1000);
  if(ttl<60)throw Error('ORDER_EXPIRED');
  const contact=a.contact||{},names=String(contact.name||'').trim().split(/\s+/);
  if(!names[0]||!contact.email||!contact.phone)throw Error('CONTACT_REQUIRED');
  const body={amount:a.amount_cents,currency:a.currency,payment_methods:[integrationId],items:a.items,
   billing_data:{first_name:names[0],last_name:names.slice(1).join(' ')||names[0],phone_number:contact.phone,email:contact.email,street:contact.address,city:a.area||'Cairo',country:'EG',apartment:'NA',floor:'NA',building:'NA',state:a.area||'Cairo'},
   special_reference:a.id,expiration:ttl,notification_url:'https://dear-day.com/api/paymob/webhook',redirection_url:'https://dear-day.com/payment'};
  const response=await request('https://accept.paymob.com/v1/intention/',{method:'POST',headers:{Authorization:'Token '+secretKey,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('PROVIDER_REJECTED');
  const result=await response.json();
  if(!Number.isSafeInteger(result.intention_order_id)||result.intention_order_id<=0||typeof result.id!=='string'||!result.id||typeof result.client_secret!=='string'||!result.client_secret)throw Error('INVALID_PROVIDER_RESPONSE');
  const bound=await db.rpc('bind_payment_intention',{p_attempt:a.id,p_provider_order:result.intention_order_id,p_intention:result.id,p_client_secret:result.client_secret});
  if(bound.error)throw Error('BINDING_FAILED');
  return {client_secret:result.client_secret};
 }catch(e){await db.rpc('mark_payment_unknown',{p_attempt:a.id});throw Error('PAYMENT_RECONCILIATION_REQUIRED')}
}
module.exports={prepareGuestIntention};
