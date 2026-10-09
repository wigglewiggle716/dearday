// Guest cake-design intake. Anonymous callers cannot read/write private
// support tickets or private reference images directly.
// Restricted to the React migration origins until launch approval.
import { createClient } from "npm:@supabase/supabase-js@2.57.0";

const ORIGINS=new Set([
  "https://dearday-react-migration.vercel.app",
  "https://dearday-react-migration-youssef-portfolio1.vercel.app",
  "http://localhost:3000","http://localhost:3001"
]);
const BUCKET="flower-design-references";
const MAX_BYTES=5*1024*1024;
const MAX_REQUEST=MAX_BYTES+20000;
function headers(origin:string|null){
  return {"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Vary":"Origin",
    ...(origin&&ORIGINS.has(origin)?{
      "Access-Control-Allow-Origin":origin,
      "Access-Control-Allow-Headers":"content-type, authorization, apikey",
      "Access-Control-Allow-Methods":"POST,OPTIONS"
    }:{})};
}
function reply(status:number,body:Record<string,unknown>,origin:string|null){
  return new Response(JSON.stringify(body),{status,headers:headers(origin)});
}
function field(form:FormData,key:string,min:number,max:number){
  const v=form.get(key);
  if(typeof v!=="string")throw new Error("Invalid "+key);
  const s=v.trim();
  if(s.length<min||s.length>max)throw new Error("Invalid "+key);
  return s;
}
async function signature(file:File,mime:string){
  const bytes=new Uint8Array(await file.slice(0,16).arrayBuffer());
  if(mime==="image/jpeg")return bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
  if(mime==="image/png")return [137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n);
  if(mime==="image/webp")return String.fromCharCode(...bytes.slice(0,4))==="RIFF"&&
    String.fromCharCode(...bytes.slice(8,12))==="WEBP";
  return false;
}
async function fingerprint(ip:string,secret:string){
  const raw=ip+"|"+new Date().toISOString().slice(0,10)+"|"+secret;
  const hash=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(raw)));
  return Array.from(hash,b=>b.toString(16).padStart(2,"0")).join("");
}
Deno.serve(async request=>{
  const origin=request.headers.get("origin");
  if(request.method==="OPTIONS")return new Response(null,{status:origin&&ORIGINS.has(origin)?204:403,headers:headers(origin)});
  if(request.method!=="POST")return reply(405,{ok:false,error:"method_not_allowed"},origin);
  if(!origin||!ORIGINS.has(origin))return reply(403,{ok:false,error:"origin_not_allowed"},origin);
  if(!(request.headers.get("content-type")||"").toLowerCase().startsWith("multipart/form-data"))
    return reply(415,{ok:false,error:"multipart_required"},origin);
  if(Number(request.headers.get("content-length")||0)>MAX_REQUEST)
    return reply(413,{ok:false,error:"image_too_large"},origin);
  const url=Deno.env.get("SUPABASE_URL");
  const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!key)return reply(503,{ok:false,error:"service_unavailable"},origin);
  const sb=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  let savedPath:string|null=null;
  try{
    const data=await request.formData();
    if(data.get("websiteExtra"))return reply(400,{ok:false,error:"invalid_input"},origin);
    const name=field(data,"name",2,160);
    const phone=field(data,"phone",6,40);
    const email=field(data,"email",5,254).toLowerCase();
    const notes=String(data.get("notes")||"").trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error("Invalid email");
    if(!/^[\d+()\s-]{6,40}$/.test(phone))throw new Error("Invalid phone");
    if(notes.length>2000)throw new Error("Invalid notes");
    const locale=data.get("locale")==="en"?"en":"ar";
    const image=data.get("image");
    if(!(image instanceof File)||image.size===0||image.size>MAX_BYTES)
      return reply(400,{ok:false,error:"invalid_image"},origin);
    const mime=image.type;
    const ext=({"image/jpeg":"jpg","image/png":"png","image/webp":"webp"} as Record<string,string>)[mime];
    if(!ext||!await signature(image,mime))return reply(400,{ok:false,error:"invalid_image"},origin);
    const ip=request.headers.get("cf-connecting-ip")?.trim()||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||email;
    const hash=await fingerprint(ip,key);
    const limit=await sb.from("support_tickets").select("id",{count:"exact",head:true})
      .eq("submission_fingerprint",hash).gte("created_at",new Date(Date.now()-86400000).toISOString());
    if(limit.error)throw limit.error;
    if((limit.count||0)>=5)return reply(429,{ok:false,error:"rate_limited"},origin);
    const path=new Date().toISOString().slice(0,7)+"/"+crypto.randomUUID()+"."+ext;
    const uploaded=await sb.storage.from(BUCKET).upload(path,await image.arrayBuffer(),{
      contentType:mime,upsert:false,cacheControl:"0"
    });
    if(uploaded.error)throw uploaded.error;
    savedPath=path;
    const message=notes.length?notes:"طلب تصميم ورد مخصص — لم يضف العميل ملاحظات.";
    const record=await sb.from("support_tickets").insert({
      name,email,phone,subject:"طلب تصميم ورد مخصص",message,locale,
      request_kind:"flower_design",reference_image_path:path,
      reference_image_name:image.name.slice(0,240),submission_fingerprint:hash
    }).select("ticket_no").single();
    if(record.error)throw record.error;
    const ref="DD-CS-"+String(record.data.ticket_no).padStart(6,"0");
    return reply(201,{ok:true,ticket_reference:ref},origin);
  }catch(error){
    if(savedPath)await sb.storage.from(BUCKET).remove([savedPath]);
    const msg=error instanceof Error?error.message:String(error);
    const invalid=msg.startsWith("Invalid ");
    if(!invalid)console.error("Flower design request failed:",msg);
    return reply(invalid?400:500,{ok:false,error:invalid?"invalid_input":"submission_failed"},origin);
  }
});
