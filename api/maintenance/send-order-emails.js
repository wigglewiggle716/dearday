'use strict';
const {timingSafeEqual}=require('node:crypto');
const {dispatchPaidEmails}=require('../../lib/order-email-dispatch');

function sameSecret(a,b){
 const x=Buffer.from(String(a||'')),y=Buffer.from(String(b||''));
 return x.length>0&&x.length===y.length&&timingSafeEqual(x,y);
}
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'METHOD_NOT_ALLOWED'});}
 const secret=process.env.ORDER_EMAIL_DISPATCH_SECRET;
 if(!secret||!sameSecret(req.headers.authorization,'Bearer '+secret))
  return res.status(401).json({error:'UNAUTHORIZED'});
 try{
  const outcome=await dispatchPaidEmails({limit:3});
  return res.status(200).json(outcome);
 }catch{
  return res.status(503).json({error:'DISPATCH_RETRY_REQUIRED'});
 }
};
module.exports.sameSecret=sameSecret;
