const {createHmac,createHash,timingSafeEqual}=require('node:crypto');
// Exact order from Paymob's Transaction Processed HMAC documentation (2026-06-01).
const fields=['amount_cents','created_at','currency','error_occured','has_parent_transaction','id','integration_id','is_3d_secure','is_auth','is_capture','is_refunded','is_standalone_payment','is_voided','order.id','owner','pending','source_data.pan','source_data.sub_type','source_data.type','success'];
const booleans=new Set(['error_occured','has_parent_transaction','is_3d_secure','is_auth','is_capture','is_refunded','is_standalone_payment','is_voided','pending','success']);
const integers=new Set(['amount_cents','id','integration_id','order.id','owner']);
function signedValues(obj){
 if(!obj||typeof obj!=='object'||Array.isArray(obj))throw Error('INVALID_CALLBACK');
 return fields.map(path=>{
  const value=path.split('.').reduce((x,k)=>x?.[k],obj);
  if(booleans.has(path)){if(typeof value!=='boolean')throw Error('INVALID_CALLBACK');}
  else if(integers.has(path)){if(!Number.isSafeInteger(value)||value<0)throw Error('INVALID_CALLBACK');}
  else if(typeof value!=='string'||value.length>300)throw Error('INVALID_CALLBACK');
  return String(value);
 });
}
function verifyAndNormalize(obj,hmac,secret){
 if(typeof secret!=='string'||!secret||typeof hmac!=='string'||! /^[a-f0-9]{128}$/i.test(hmac))throw Error('INVALID_SIGNATURE');
 const signed=signedValues(obj).join('');
 const expected=createHmac('sha512',secret).update(signed).digest();
 if(!timingSafeEqual(expected,Buffer.from(hmac,'hex')))throw Error('INVALID_SIGNATURE');
 // Ignore unsigned extras, merchant_order_id, refund amounts, is_live and redirect params.
 // Do not store the raw callback or even masked card data.
 const result={fingerprint:createHash('sha256').update(signed).digest('hex'),transaction_id:obj.id,provider_order_id:obj.order.id,amount_cents:obj.amount_cents,currency:obj.currency,integration_id:obj.integration_id,owner_id:obj.owner};
 for(const field of booleans)result[field]=obj[field];
 return result;
}
module.exports={verifyAndNormalize,signedValues};
