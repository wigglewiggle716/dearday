"use client";

import {createClient} from "@supabase/supabase-js";

// Only the public, browser-safe Supabase key. Auth and RLS are enforced
// by the same Supabase project used by the existing Dear Day site.
const PROJECT_ID="hpffdmldtdtwcaoemyso";
const PROJECT_URL="https://"+PROJECT_ID+".supabase.co";
const PUBLIC_KEY="sb_publishable_10ZXpBIQH2bG-iseG7jpdw_DfmEUT_C";
const STORAGE_KEY="sb-"+PROJECT_ID+"-auth-token";
const clients=new Map();
export const EMPLOYEE_ROLES=new Set([
  "super_admin","admin","operations","accountant","partner_manager",
  "customer_support","marketing","content_admin"
]);

export function rememberPreference(){
  if(typeof window==="undefined")return true;
  return window.localStorage.getItem("ddAuthRemember")!=="0";
}
export function authClient(remember=rememberPreference()){
  if(typeof window==="undefined")throw new Error("Auth is client-side only");
  const key=remember?"local":"session";
  if(!clients.has(key)){
    clients.set(key,createClient(PROJECT_URL,PUBLIC_KEY,{
      auth:{
        storage:remember?window.localStorage:window.sessionStorage,
        persistSession:true,autoRefreshToken:true,
        detectSessionInUrl:true,flowType:"pkce"
      }
    }));
  }
  return clients.get(key);
}
// Set only after successful password login. Prevent a previous session in
// the other storage tier from resurfacing when "Remember me" is toggled.
export function rememberSession(remember){
  const other=remember?window.sessionStorage:window.localStorage;
  other.removeItem(STORAGE_KEY);
  window.localStorage.setItem("ddAuthRemember",remember?"1":"0");
}
export function safeNext(raw,fallback){
  if(!raw||typeof raw!=="string")return fallback;
  try{
    if(!raw.startsWith("/")||raw.startsWith("//")||raw.includes("\\"))return fallback;
    const url=new URL(raw,window.location.origin);
    if(url.origin!==window.location.origin)return fallback;
    // Don't return an authenticated user to the registration/login routes.
    if(/^\/(?:en\/)?(?:auth|register)(?:\/|$)/.test(url.pathname))return fallback;
    return url.pathname+url.search+url.hash;
  }catch{return fallback;}
}
export function destinationFor(role,locale="ar"){
  const prefix=locale==="en"?"/en":"";
  if(role==="customer")return prefix+"/account";
  if(EMPLOYEE_ROLES.has(role))return prefix+"/staff";
  if(role==="partner_user")return prefix+"/partner";
  return prefix+"/access";
}
// Always verify the auth user, AAL and active role in Supabase. Never trust
// role values from localStorage, OAuth metadata or query parameters.
export async function readCurrentAccount(client){
  const result=await client.auth.getUser();
  if(result.error){
    // Expired/revoked refresh tokens should be treated as signed-out users.
    const message=String(result.error.message||"").toLowerCase();
    if(message.includes("session")||message.includes("jwt")||message.includes("refresh token"))
      return {status:"signed_out"};
    throw result.error;
  }
  const user=result.data?.user;
  if(!user)return {status:"signed_out"};
  const assurance=await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if(assurance.error)throw assurance.error;
  if(assurance.data?.nextLevel==="aal2"&&assurance.data?.currentLevel!=="aal2"){
    return {status:"mfa_required",user};
  }
  const profile=await client.from("profiles")
    .select("id,role,is_active,full_name,phone").eq("id",user.id).maybeSingle();
  if(profile.error)throw profile.error;
  if(!profile.data||profile.data.is_active!==true){
    return {status:"inactive",user};
  }
  const role=String(profile.data.role||"");
  if(!role||!["customer","partner_user",...EMPLOYEE_ROLES].includes(role)){
    return {status:"inactive",user};
  }
  // Staff with no enrolled factor must finish MFA onboarding before any
  // protected staff application access. Enrolled AAL1 staff are challenged
  // above; new AAL1 staff are routed only to authenticator enrollment.
  if(EMPLOYEE_ROLES.has(role)&&assurance.data?.currentLevel!=="aal2"){
    return {status:"mfa_setup_required",user,role,profile:profile.data};
  }
  return {status:"authenticated",user,role,profile:profile.data};
}
