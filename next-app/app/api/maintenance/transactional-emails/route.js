import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import dispatcher from "../../../../lib/transactional-email-dispatch.cjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(header,secret){
  const expected=Buffer.from(secret?"Bearer "+secret:"");
  const actual=Buffer.from(header||"");
  return Boolean(secret) && expected.length===actual.length && timingSafeEqual(expected,actual);
}
export async function POST(request){
  if(!authorized(request.headers.get("authorization"),process.env.TRANSACTIONAL_EMAIL_DISPATCH_SECRET)){
    return NextResponse.json({error:"UNAUTHORIZED"},{status:401,headers:{"Cache-Control":"no-store"}});
  }
  if(!dispatcher.enabled()){
    return NextResponse.json({enabled:false,claimed:0,sent:0,failed:0},{headers:{"Cache-Control":"no-store"}});
  }
  try{
    const result=await dispatcher.dispatchTransactionalEmails({limit:3});
    return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
  }catch{
    return NextResponse.json({error:"DISPATCH_RETRY_REQUIRED"},{status:503,headers:{"Cache-Control":"no-store"}});
  }
}
