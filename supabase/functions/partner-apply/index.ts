// Public partner intake: validate multipart form, private document uploads,
// bounded submissions, and a service-role-only insert.
// verify_jwt:false is intentional: partners are not required to have accounts.
// Do not expose the service key to browsers.
import { createClient } from "npm:@supabase/supabase-js@2.57.0";

const ALLOWED_ORIGINS = new Set([
  "https://dear-day.com",
  "https://www.dear-day.com",
  "https://dearday-react-migration.vercel.app",
  "https://dearday-react-migration-youssef-portfolio1.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001"
]);
const MAX_PROFILE=5*1024*1024;
const MAX_OPTIONAL=3*1024*1024;
const MAX_REQUEST=9*1024*1024;
const BUCKET="partner-applications";
const allowedCategories=new Set([
 "Gifts & Hampers","Flowers & Plants","Cakes & Desserts",
 "Jewelry & Accessories","Restaurants","Venues","Experiences",
 "Decor & Coordination"
]);

function headers(origin:string|null){
 return {
   "Content-Type":"application/json; charset=utf-8",
   "Cache-Control":"no-store",
   "Vary":"Origin",
   ...(origin && ALLOWED_ORIGINS.has(origin)?{
     "Access-Control-Allow-Origin":origin,
     "Access-Control-Allow-Headers":"apikey, content-type, authorization",
     "Access-Control-Allow-Methods":"POST, OPTIONS"
   }: {})
 };
}
function result(code:number,ok:boolean,body:Record<string,unknown>,origin:string|null){
 return new Response(JSON.stringify({ok,...body}),{status:code,headers:headers(origin)});
}
function required(form:FormData,key:string,min:number,max:number){
 const val=form.get(key);
 if(typeof val!=="string")throw new Error("Invalid "+key);
 const text=val.trim();
 if(text.length<min||text.length>max)throw new Error("Invalid "+key);
 return text;
}
function optional(form:FormData,key:string,max:number){
 const raw=form.get(key);
 if(typeof raw!=="string")return null;
 const s=raw.trim();
 if(s.length>max)throw new Error("Invalid "+key);
 return s||null;
}
function website(value:string|null){
 if(!value)return null;
 try{
   const u=new URL(value);
   if(!["http:","https:"].includes(u.protocol))throw new Error();
 }catch{throw new Error("Invalid website URL");}
 return value;
}
async function validatePDF(file:File){
 if(!(file instanceof File)||file.size<10||file.size>MAX_PROFILE)throw new Error("Invalid PDF file size");
 if(!/\.pdf$/i.test(file.name)||!["application/pdf","application/octet-stream",""].includes(file.type))
   throw new Error("Company profile must be a PDF");
 const prefix=new Uint8Array(await file.slice(0,5).arrayBuffer());
 if(String.fromCharCode(...prefix)!=="%PDF-")throw new Error("Invalid PDF document");
 return file;
}
async function validateOptional(file:File|null){
 if(!file||file.size===0)return null;
 if(file.size>MAX_OPTIONAL)throw new Error("Product list is too large");
 const name=file.name||"";
 const ext=name.split(".").at(-1)?.toLowerCase();
 const type=file.type||"";
 const approved:Record<string,string[]>={
  pdf:["application/pdf","application/octet-stream",""],
  csv:["text/csv","text/plain","application/vnd.ms-excel",""],
  xls:["application/vnd.ms-excel","application/octet-stream",""],
  xlsx:["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","application/octet-stream",""]
 };
 if(!ext||!approved[ext]||!approved[ext].includes(type))throw new Error("Invalid product list format");
 if(ext==="pdf"){
   const sig=new Uint8Array(await file.slice(0,5).arrayBuffer());
   if(String.fromCharCode(...sig)!=="%PDF-")throw new Error("Invalid product list PDF");
 }
 if(ext==="xlsx"){
   const sig=new Uint8Array(await file.slice(0,2).arrayBuffer());
   if(String.fromCharCode(...sig)!=="PK")throw new Error("Invalid XLSX document");
 }
 if(ext==="xls"){
   const sig=new Uint8Array(await file.slice(0,4).arrayBuffer());
   if(sig.join(",")!=="208,207,17,224")throw new Error("Invalid XLS document");
 }
 return {file,ext,type:ext==="csv"?"text/csv":
    ext==="xls"?"application/vnd.ms-excel":
    ext==="xlsx"?"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":"application/pdf"};
}
async function fingerprint(ip:string,secret:string){
 const raw=new TextEncoder().encode(ip+"|"+new Date().toISOString().slice(0,10)+"|"+secret);
 const d=await crypto.subtle.digest("SHA-256",raw);
 return [...new Uint8Array(d)].map(n=>n.toString(16).padStart(2,"0")).join("");
}
Deno.serve(async request=>{
 const origin=request.headers.get("origin");
 if(request.method==="OPTIONS")
   return new Response(null,{status:ALLOWED_ORIGINS.has(origin||"")?204:403,
     headers:headers(origin)});
 if(request.method!=="POST")return result(405,false,{error:"method_not_allowed"},origin);
 if(!origin||!ALLOWED_ORIGINS.has(origin))
   return result(403,false,{error:"origin_not_allowed"},origin);
 const size=Number(request.headers.get("content-length")||0);
 if(size>MAX_REQUEST)return result(413,false,{error:"request_too_large"},origin);
 const contentType=request.headers.get("content-type")||"";
 if(!contentType.startsWith("multipart/form-data"))
   return result(415,false,{error:"multipart_required"},origin);
 const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 const projectUrl=Deno.env.get("SUPABASE_URL");
 if(!serviceKey||!projectUrl)return result(503,false,{error:"service_unavailable"},origin);
 const client=createClient(projectUrl,serviceKey,{
   auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
 });
 let uploaded:string[]=[];
 try{
   const form=await request.formData();
   // Honeypot for simple automated traffic.
   if(optional(form,"businessWebsiteExtra",100))
     return result(400,false,{error:"invalid_request"},origin);
   const company_name=required(form,"companyName",2,200);
   const contact_name=required(form,"contactName",2,200);
   const email=required(form,"email",5,254).toLowerCase();
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error("Invalid email");
   const phone=required(form,"phone",6,40);
   if(!/^[\d+()\s-]{6,40}$/.test(phone))throw new Error("Invalid phone");
   const city=required(form,"city",2,100);
   if(!["القاهرة","الجيزة","أخرى","Cairo","Giza","Other"].includes(city))
     throw new Error("Invalid city");
   if(required(form,"country",5,10)!=="Egypt")throw new Error("Invalid country");
   const categories=form.getAll("categories").filter(x=>typeof x==="string")
     .map(x=>String(x).trim());
   if(categories.length>15||categories.some(x=>!allowedCategories.has(x)))
     throw new Error("Invalid categories");
   const other_category=optional(form,"otherCategory",150);
   if(categories.length===0&&!other_category)throw new Error("Choose a category");
   const company_description=required(form,"companyDescription",10,5000);
   const website_url=website(optional(form,"website",400));
   const social_media=optional(form,"socialMedia",400);
   const partnership_model=required(form,"partnershipModel",3,200);
   const current_partnerships=optional(form,"currentPartnerships",3000);
   const yearsRaw=optional(form,"yearsInBusiness",3);
   const years_in_business=yearsRaw===null?null:Number(yearsRaw);
   if(years_in_business!==null&&(!Number.isInteger(years_in_business)||years_in_business<0||years_in_business>150))
     throw new Error("Invalid years");
   const profile=await validatePDF(form.get("companyProfile") as File);
   const product=await validateOptional(form.get("productList") as File|null);
   if(profile.size+(product?.file.size||0)>MAX_REQUEST)
     throw new Error("Files too large");

   const address=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||
     request.headers.get("cf-connecting-ip")?.trim()||"unknown";
   const hash=await fingerprint(address,serviceKey);
   const since=new Date(Date.now()-24*60*60*1000).toISOString();
   const {count,error:limitError}=await client.from("partner_applications")
      .select("id",{count:"exact",head:true})
      .eq("submission_fingerprint",hash)
      .gte("created_at",since);
   if(limitError)throw limitError;
   if((count||0)>=4)return result(429,false,{error:"rate_limited"},origin);

   const id=crypto.randomUUID();
   const profilePath=id+"/company-profile.pdf";
   const {error:profileError}=await client.storage.from(BUCKET)
      .upload(profilePath,profile,{contentType:"application/pdf",upsert:false});
   if(profileError)throw profileError;
   uploaded.push(profilePath);
   let productPath:string|null=null;
   if(product){
     productPath=id+"/product-list."+product.ext;
     const {error:prodError}=await client.storage.from(BUCKET)
       .upload(productPath,product.file,{contentType:product.type,upsert:false});
     if(prodError)throw prodError;
     uploaded.push(productPath);
   }

   const {error}=await client.from("partner_applications").insert({
     id, company_name,contact_name,email,phone,city,country:"Egypt",
     years_in_business,categories,other_category,company_description,
     website:website_url,social_media,partnership_model,current_partnerships,
     company_profile_path:profilePath,company_profile_name:profile.name.slice(0,240),
     product_list_path:productPath,product_list_name:product?.file.name.slice(0,240)||null,
     submission_fingerprint:hash
   });
   if(error)throw error;
   return result(201,true,{application_id:id},origin);
 }catch(err){
   if(uploaded.length)await client.storage.from(BUCKET).remove(uploaded);
   const msg=err instanceof Error?err.message:String(err);
   const bad=/^(Invalid |Choose a category|Company profile must|Product list |Files too large)/.test(msg);
   if(!bad)console.error("Partner application intake failed:",msg);
   return result(bad?400:500,false,
     {error:bad?"invalid_input":"submit_failed"},origin);
 }
});
