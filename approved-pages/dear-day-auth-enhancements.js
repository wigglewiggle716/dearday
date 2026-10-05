(function(){
  const SUPABASE_ESM='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';
  const CONFIG_SRC='/approved-pages/dear-day-supabase-config.js?v=20261002-1';
  const isEn=()=>String(document.documentElement.lang||'').toLowerCase().startsWith('en')||document.documentElement.dir==='ltr';
  const home=()=>isEn()?'/en':'/';
  const authPath=()=>isEn()?'/auth-en':'/auth';
  const msg=(ar,en)=>isEn()?en:ar;
  const initialHref=location.href;

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

  function nextAfterAuth(){
    const stored=localStorage.getItem('ddAuthNext');
    localStorage.removeItem('ddAuthNext');
    if(stored&&stored.startsWith('/')&&!stored.startsWith('//'))return stored;
    return home();
  }

  function ensureSignupSocials(){
    const signup=document.getElementById('signupPanel');
    const login=document.getElementById('loginPanel');
    if(!signup||!login||signup.querySelector('[data-dd-signup-socials]'))return;
    const source=login.querySelector('.socials');if(!source)return;
    const divider=document.createElement('div');divider.className='divider';divider.dataset.ddSignupSocials='1';
    divider.innerHTML='<span>'+msg('أو أنشئ حسابك بواسطة','Or create your account with')+'</span>';
    const socials=source.cloneNode(true);socials.dataset.ddSignupSocials='1';socials.setAttribute('aria-label',msg('إنشاء حساب باستخدام حساب اجتماعي','Create an account using a social provider'));
    socials.querySelectorAll('.social-btn').forEach(btn=>btn.dataset.ddSignupSocial='1');
    const switchCopy=signup.querySelector('.switch-copy');
    if(switchCopy){signup.insertBefore(divider,switchCopy);signup.insertBefore(socials,switchCopy)}else signup.append(divider,socials);
  }

  async function boot(){
    ensureSignupSocials();
    const config=await loadConfig();
    const mod=await import(SUPABASE_ESM);
    localStorage.setItem('ddAuthRemember','1');
    const supabase=mod.createClient(config.url,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:localStorage}});

    document.querySelectorAll('[data-dd-signup-social="1"]').forEach(btn=>{
      if(btn.dataset.ddEnhBound==='1')return;btn.dataset.ddEnhBound='1';
      btn.addEventListener('click',async e=>{
        e.preventDefault();e.stopImmediatePropagation();
        const provider=String(btn.dataset.provider||'').toLowerCase();
        if(!['google','facebook','apple'].includes(provider))return;
        localStorage.setItem('ddAuthRemember','1');localStorage.setItem('ddAuthNext',home());
        const status=document.getElementById('signupStatus');if(status){status.textContent=msg('جاري فتح تسجيل الدخول…','Opening sign in…');status.style.color='#6B3540'}
        try{
          const {error}=await supabase.auth.signInWithOAuth({provider,options:{redirectTo:location.origin+authPath()}});
          if(error)throw error;
        }catch(err){if(status){status.textContent=msg('تعذر بدء تسجيل الدخول بهذه الطريقة.','Could not start social sign in.');status.style.color='#A8583D'}}
      },true);
    });

    const hasCode=new URL(initialHref).searchParams.has('code');
    const hasImplicit=/[#&](?:access_token|refresh_token)=/i.test(initialHref);
    let {data:{session}}=await supabase.auth.getSession();
    if(!session&&hasCode){
      const code=new URL(initialHref).searchParams.get('code');
      if(code){
        const result=await supabase.auth.exchangeCodeForSession(code);
        if(!result.error)session=result.data.session||null;
      }
    }
    if(session&&(hasCode||hasImplicit)){
      history.replaceState(null,'',authPath());
      location.replace(nextAfterAuth());
      return;
    }

    supabase.auth.onAuthStateChange((event,newSession)=>{
      if(event==='SIGNED_IN'&&newSession&&(hasCode||hasImplicit))location.replace(nextAfterAuth());
    });
  }

  const start=()=>boot().catch(()=>{});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();