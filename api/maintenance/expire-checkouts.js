const {timingSafeEqual}=require('node:crypto');
const {getSupabaseAdmin}=require('../../lib/supabase-admin');
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'METHOD_NOT_ALLOWED'})}
 const secret=process.env.CHECKOUT_MAINTENANCE_SECRET,provided=String(req.headers.authorization||'');
 if(!secret)return res.status(503).json({error:'NOT_CONFIGURED'});
 const expected='Bearer '+secret;
 if(Buffer.byteLength(provided)!==Buffer.byteLength(expected)||!timingSafeEqual(Buffer.from(provided),Buffer.from(expected)))return res.status(401).json({error:'UNAUTHORIZED'});
 try{const {data,error}=await getSupabaseAdmin().rpc('expire_checkout_orders',{p_limit:100});if(error)throw error;return res.status(200).json({expired:data})}
 catch{return res.status(503).json({error:'RETRY_REQUIRED'})}
};
