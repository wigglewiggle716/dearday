"use client";

import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState} from "react";
import {usePathname} from "next/navigation";
import {authClient,readCurrentAccount,rememberPreference} from "../lib/auth-client";

const SessionContext=createContext(null);
export function AuthSessionProvider({children}){
  const pathname=usePathname();
  const [state,setState]=useState({status:"loading",user:null,role:null,profile:null,error:null});
  const seq=useRef(0);
  const mounted=useRef(true);
  const refresh=useCallback(async()=>{
    const id=++seq.current;
    try{
      const account=await readCurrentAccount(authClient(rememberPreference()));
      if(!mounted.current||id!==seq.current)return;
      setState({status:account.status,user:account.user||null,role:account.role||null,
        profile:account.profile||null,error:null});
    }catch{
      if(mounted.current&&id===seq.current){
        // Never show an authenticated account when its status can't be checked.
        setState({status:"error",user:null,role:null,profile:null,error:"access_unavailable"});
      }
    }
  },[]);
  useEffect(()=>{
    mounted.current=true;
    const client=authClient(rememberPreference());
    void refresh();
    // Schedule Supabase queries outside the onAuthStateChange callback;
    // awaiting another auth operation inside that callback can deadlock.
    const {data}=client.auth.onAuthStateChange(event=>{
      if(["SIGNED_IN","SIGNED_OUT","USER_UPDATED","TOKEN_REFRESHED","MFA_CHALLENGE_VERIFIED"].includes(event)){
        window.setTimeout(()=>{if(mounted.current)void refresh();},0);
      }
    });
    // Another tab signing in/out affects the same persisted session.
    function synchronize(event){
      if(event.key==="ddAuthRemember"||event.key===null||event.key?.endsWith("-auth-token")){
        window.setTimeout(()=>{if(mounted.current)window.location.reload();},0);
      }
    }
    window.addEventListener("storage",synchronize);
    return ()=>{
      mounted.current=false;seq.current++;
      data.subscription.unsubscribe();
      window.removeEventListener("storage",synchronize);
    };
  },[refresh]);
  // Re-check access when a tab resumes and when moving between pages.
  // This catches suspensions and role changes without waiting for a logout.
  useEffect(()=>{
    function recheck(){if(document.visibilityState==="visible")void refresh();}
    document.addEventListener("visibilitychange",recheck);
    return ()=>document.removeEventListener("visibilitychange",recheck);
  },[refresh]);
  useEffect(()=>{void refresh();},[pathname,refresh]);
  const signOut=useCallback(async()=>{
    const client=authClient(rememberPreference());
    const {error}=await client.auth.signOut({scope:"local"});
    if(error)throw error;
    // Clear unused storage tier to avoid a stale session returning.
    window.localStorage.removeItem("sb-hpffdmldtdtwcaoemyso-auth-token");
    window.sessionStorage.removeItem("sb-hpffdmldtdtwcaoemyso-auth-token");
    window.localStorage.removeItem("ddPostAuthNext");
    setState({status:"signed_out",user:null,role:null,profile:null,error:null});
  },[]);
  const context=useMemo(()=>({...state,refresh,signOut}),[state,refresh,signOut]);
  return <SessionContext.Provider value={context}>{children}</SessionContext.Provider>;
}
export function useAuthSession(){
  const context=useContext(SessionContext);
  if(!context)throw new Error("useAuthSession requires AuthSessionProvider");
  return context;
}
