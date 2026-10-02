(function(){
  const SUPABASE_ESM='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';
  const CONFIG_SRC='/approved-pages/dear-day-supabase-config.js?v=20261002-1';
  const isEn=()=>String(document.documentElement.lang||'').toLowerCase().startsWith('en')||document.documentElement.dir==='ltr';
  const home=()=>isEn()?'/index-en.html':'/';
  const authPath=()=>isEn()?'/Dear-Day-Auth-en.html':'/Dear-Day-Auth.html';
  const text=(ar,en)=>isEn()?en:ar;
  const safeNext=()=>{const n=new URLSearchParams(location.search).get('next');return n&&n.startsWith('/')&&!n.startsWith('//')&&!/Dear-Day-Complete-Profile/i.test(n)?n:home()};

  function loadConfig(){
    if(window.DEAR_DAY_SUPABASE)return Promise.resolve(window.DEAR_DAY_SUPABASE);
    return new Promise((resolve,reject)=>{
      const existing=document.querySelector('script[data-dd-supabase-config]');
      if(existing){existing.addEventListener('load',()=>resolve(window.DEAR_DAY_SUPABASE),{once:true});existing.addEventListener('error',reject,{once:true});return;}
      const s=document.createElement('script');s.src=CONFIG_SRC;s.async=true;s.dataset.ddSupabaseConfig='1';
      s.onload=()=>window.DEAR_DAY_SUPABASE?resolve(window.DEAR_DAY_SUPABASE):reject(new Error('Supabase config unavailable'));
      s.onerror=reject;(document.head||document.documentElement).appendChild(s);
    });
  }

  function splitName(meta){
    let first=String(meta?.first_name||meta?.given_name||'').trim();
    let last=String(meta?.last_name||meta?.family_name||'').trim();
    if(first||last)return {first,last};
    const full=String(meta?.full_name||meta?.name||'').trim().split(/\s+/).filter(Boolean);
    if(!full.length)return {first:'',last:''};
    return {first:full[0]||'',last:full.slice(1).join(' ')};
  }

  function setStatus(message,error){
    const el=document.getElementById('profileStatus');if(!el)return;
    el.textContent=message||'';el.style.color=error?'#A8583D':'#6B3540';
  }

  async function boot(){
    const config=await loadConfig();
    const mod=await import(SUPABASE_ESM);
    const storage=localStorage.getItem('ddAuthRemember')==='0'?sessionStorage:localStorage;
    const supabase=mod.createClient(config.url,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage}});
    const {data,error}=await supabase.auth.getUser();
    if(error||!data?.user){location.replace(authPath()+'#login');return;}
    const user=data.user,meta=user.user_metadata||{},name=splitName(meta);
    const first=document.getElementById('profileFirstName');
    const last=document.getElementById('profileLastName');
    const phone=document.getElementById('profilePhone');
    const email=document.getElementById('profileEmail');
    const birth=document.getElementById('profileBirthDate');
    const area=document.getElementById('profileArea');
    if(first)first.value=name.first;
    if(last)last.value=name.last;
    if(phone)phone.value=String(meta.phone||meta.phone_number||'');
    if(email)email.value=String(user.email||'');
    if(birth)birth.value=String(meta.birth_date||'');
    if(area)area.value=String(meta.area||'');

    const form=document.getElementById('completeProfileForm');
    form?.addEventListener('submit',async e=>{
      e.preventDefault();setStatus('');
      if(!form.checkValidity()){form.reportValidity();return;}
      const button=form.querySelector('button[type="submit"]');if(button){button.disabled=true;button.setAttribute('aria-busy','true');}
      try{
        const firstName=first.value.trim(),lastName=last.value.trim(),mobile=phone.value.trim();
        const payload={
          first_name:firstName,
          last_name:lastName,
          full_name:[firstName,lastName].filter(Boolean).join(' '),
          phone:mobile,
          birth_date:birth?.value||'',
          area:area?.value.trim()||'',
          profile_complete:true
        };
        const {error:updateError}=await supabase.auth.updateUser({data:payload});
        if(updateError)throw updateError;
        setStatus(text('تم حفظ بياناتك بنجاح.','Your details were saved successfully.'));
        setTimeout(()=>location.replace(safeNext()),350);
      }catch(err){
        setStatus(text('تعذر حفظ البيانات. حاول مرة أخرى.','Could not save your details. Please try again.'),true);
      }finally{if(button){button.disabled=false;button.removeAttribute('aria-busy');}}
    });
  }

  const start=()=>boot().catch(()=>setStatus(text('تعذر تحميل بيانات الحساب حاليًا.','Could not load your account details right now.'),true));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
