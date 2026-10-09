// Customer messages: anonymous, validated submission. No login is required.
// This function is the only publicly exposed write path: RLS rejects
// direct anonymous selects/inserts/updates to support_tickets.
import { createClient } from "npm:@supabase/supabase-js@2.57.0";

const ALLOWED_ORIGINS=new Set([
  "https://dear-day.com",
  "https://www.dear-day.com",
  "https://dearday-react-migration.vercel.app",
  "https://dearday-react-migration-youssef-portfolio1.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001"
]);
const MAX_BODY=13000;
const LIMIT=5;
function responseHeaders(origin:string|null){
 return {
  "Content-Type":"application/json; charset=utf-8",
  "Cache-Control":"no-store",
  "Vary":"Origin",
  ...(origin&&ALLOWED_ORIGINS.has(origin)?{
    "Access-Control-Allow-Origin":origin,
    "Access-Control-Allow-Headers":"content-type, authorization, apikey",
    "Access-Control-Allow-Methods":"POST, OPTIONS"
  }:{})
 };
}
function reply(status:number,body:Record<string,unknown>,origin:string|null){
 return new Response(JSON.stringify(body),{status,headers:responseHeaders(origin)});
}
function mandatory(input:Record<string,unknown>,key:string,min:number,max:number){
 const v=input[key];
 if(typeof v!=="string")throw new Error("Invalid "+key);
 const str=v.trim();
 if(str.length<min||str.length>max)throw new Error("Invalid "+key);
 return str;
}
function optional(input:Record<string,unknown>,key:string,max:number){
 const v=input[key];
 if(v===null||v===undefined||v==="")return null;
 if(typeof v!=="string"||v.trim().length>max)throw new Error("Invalid "+key);
 return v.trim()||null;
}
async function dailyFingerprint(value:string,secret:string){
 const text=new TextEncoder().encode(value+"|"+new Date().toISOString().slice(0,10)+"|"+secret);
 const bytes=new Uint8Array(await crypto.subtle.digest("SHA-256",text));
 return Array.from(bytes,x=>x.toString(16).padStart(2,"0")).join("");
}
Deno.serve(async request=>{
 const origin=request.headers.get("origin");
 if(request.method==="OPTIONS")return new Response(null,{
   status:origin&&ALLOWED_ORIGINS.has(origin)?204:403,headers:responseHeaders(origin)
 });
 if(request.method!=="POST")return reply(405,{ok:false,error:"method_not_allowed"},origin);
 if(!origin||!ALLOWED_ORIGINS.has(origin))
   return reply(403,{ok:false,error:"origin_not_allowed"},origin);
 if(!(request.headers.get("content-type")||"").toLowerCase().startsWith("application/json"))
   return reply(415,{ok:false,error:"json_required"},origin);
 if(Number(request.headers.get("content-length")||0)>MAX_BODY)
   return reply(413,{ok:false,error:"payload_too_large"},origin);
 const projectUrl=Deno.env.get("SUPABASE_URL");
 const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!projectUrl||!serviceKey)return reply(503,{ok:false,error:"service_unavailable"},origin);
 const sb=createClient(projectUrl,serviceKey,{
   auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
 });
 try{
  const bodyText=await request.text();
  if(bodyText.length>MAX_BODY)throw new Error("Invalid payload");
  const body=JSON.parse(bodyText);
  if(!body||Array.isArray(body)||typeof body!=="object")
    throw new Error("Invalid payload");
  if(body.websiteExtra) return reply(400,{ok:false,error:"invalid_input"},origin);
  const name=mandatory(body,"name",2,160);
  const email=mandatory(body,"email",5,254).toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error("Invalid email");
  const phone=optional(body,"phone",40);
  if(phone&&!/^[\d+()\s-]{6,40}$/.test(phone))throw new Error("Invalid phone");
  const subject=mandatory(body,"subject",3,200);
  const message=mandatory(body,"message",10,5000);
  const locale=body.locale==="en"?"en":"ar";
  const ip=request.headers.get("cf-connecting-ip")?.trim()||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"";
  const fingerprint=await dailyFingerprint(ip||email,serviceKey);
  const since=new Date(Date.now()-24*60*60*1000).toISOString();
  const check=await sb.from("support_tickets").select("id",{count:"exact",head:true})
    .eq("submission_fingerprint",fingerprint).gte("created_at",since);
  if(check.error)throw check.error;
  if((check.count||0)>=LIMIT)
    return reply(429,{ok:false,error:"rate_limited"},origin);
  const saved=await sb.from("support_tickets")
    .insert({name,email,phone,subject,message,locale,submission_fingerprint:fingerprint})
    .select("ticket_no").single();
  if(saved.error)throw saved.error;
  const ref="DD-CS-"+String(saved.data.ticket_no).padStart(6,"0");
  return reply(201,{ok:true,ticket_reference:ref},origin);
 }catch(err){
  const msg=err instanceof Error?err.message:String(err);
  const invalid=err instanceof SyntaxError||msg.startsWith("Invalid ");
  if(!invalid)console.error("Contact ticket intake failed:",msg);
  return reply(invalid?400:500,{ok:false,error:invalid?"invalid_input":"submission_failed"},origin);
 }
});
