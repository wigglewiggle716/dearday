import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import mailer from "../../../../lib/order-email-dispatch.cjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validSecret(value,expected){
 const a=Buffer.from(value||"");
 const b=Buffer.from(expected?"Bearer "+expected:"");
 return Boolean(expected)&&a.length===b.length&&timingSafeEqual(a,b);
}
export async function POST(request){
 if(!validSecret(request.headers.get("authorization"),process.env.ORDER_EMAIL_DISPATCH_SECRET)){
  return NextResponse.json({error:"UNAUTHORIZED"},{status:401,headers:{"Cache-Control":"no-store"}});
 }
 try{
  const stats=await mailer.dispatchPaidEmails({limit:3});
  return NextResponse.json(stats,{headers:{"Cache-Control":"no-store"}});
 }catch{
  return NextResponse.json({error:"DISPATCH_RETRY_REQUIRED"},{status:503,headers:{"Cache-Control":"no-store"}});
 }
}
