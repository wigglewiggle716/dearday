import { NextResponse } from "next/server";
import verify from "../../../../lib/paymob-webhook.cjs";
import admin from "../../../../lib/supabase-admin.cjs";
import mailer from "../../../../lib/order-email-dispatch.cjs";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const json=(body,status)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});
export async function POST(request){
 if(!process.env.PAYMOB_HMAC_SECRET)return json({error:"WEBHOOK_NOT_CONFIGURED"},503);
 const contentType=request.headers.get("content-type")||"";
 if(!contentType.startsWith("application/json"))return json({error:"INVALID_CONTENT_TYPE"},415);
 let normalized;
 try{
  const raw=await request.text();
  if(Buffer.byteLength(raw)>65536)return json({error:"PAYLOAD_TOO_LARGE"},413);
  const body=JSON.parse(raw);
  if(body?.type!=="TRANSACTION")return json({error:"UNSUPPORTED_CALLBACK"},400);
  const signature=new URL(request.url).searchParams.get("hmac");
  normalized=verify.verifyAndNormalize(body.obj,signature,process.env.PAYMOB_HMAC_SECRET);
 }catch{return json({error:"INVALID_CALLBACK"},401);}
 try{
  const {data,error}=await admin.getSupabaseAdmin().rpc("process_paymob_event",{p_event:normalized});
  if(error)return json({error:"CALLBACK_RETRY_REQUIRED"},503);
  if(data?.outcome==="paid"&&data?.duplicate!==true){
   try{await mailer.dispatchPaidEmails({limit:2});}catch{/* Outbox persists for protected retry worker. */}
  }
  return json({received:true},200);
 }catch{return json({error:"CALLBACK_RETRY_REQUIRED"},503);}
}
