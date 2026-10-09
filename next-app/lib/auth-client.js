"use client";

import {createClient} from "@supabase/supabase-js";

// Same public project and client-side storage choice used by the approved
// Dear Day login. Never put the Supabase service-role key in browser code.
const PROJECT_URL="https://hpffdmldtdtwcaoemyso.supabase.co";
const PUBLIC_KEY="sb_publishable_10ZXpBIQH2bG-iseG7jpdw_DfmEUT_C";
const clients=new Map();

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
        persistSession:true,
        autoRefreshToken:true,
        detectSessionInUrl:true,
        flowType:"pkce"
      }
    }));
  }
  return clients.get(key);
}
export function safeNext(raw,fallback){
  if(!raw||typeof raw!=="string")return fallback;
  try{
    // Reject protocol-relative and hostile alternate slash syntax.
    if(!raw.startsWith("/")||raw.startsWith("//")||raw.includes("\\"))return fallback;
    const url=new URL(raw,window.location.origin);
    if(url.origin!==window.location.origin)return fallback;
    return url.pathname+url.search+url.hash;
  }catch{return fallback;}
}
