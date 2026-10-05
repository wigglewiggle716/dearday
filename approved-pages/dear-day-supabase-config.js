window.DEAR_DAY_SUPABASE = Object.freeze({
  url: 'https://hpffdmldtdtwcaoemyso.supabase.co',
  publishableKey: 'sb_publishable_10ZXpBIQH2bG-iseG7jpdw_DfmEUT_C'
});

/* Keep real Supabase auth active on the clean /auth and /auth-en routes,
   keep the same social sign-in choices available on account creation,
   and never leave an authenticated user sitting on the auth screen. */
(function(){
  const path=String(location.pathname||'/').replace(/\/$/,'')||'/';
  const isAuthPage=/^\/(?:auth(?:-en)?(?:\.html)?|Dear-Day-Auth(?:-en)?\.html)$/i.test(path);
  if(!isAuthPage)return;

  const SUPABASE_ESM='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';
  const STAFF_ROLES=new Set(['super_admin','admin','operations','accountant','partner_manager','customer_support','marketing','content_admin']);
  const ADMIN_ROLES=new Set(['super_admin','admin']);

  function isEnglish(){
    return String(document.documentElement.lang||'').toLowerCase().startsWith('en')||document.documentElement.dir==='ltr'||document.body?.dir==='ltr';
  }

  function accountPath(){return isEnglish()?'/account-en':'/account'}
  function portalPath(role){
    if(ADMIN_ROLES.has(role))return'/Dear-Day-Admin.html';
    if(role==='partner_user')return'/Dear-Day-Partner.html';
    if(STAFF_ROLES.has(role))return'/Dear-Day-Staff.html';
    return accountPath();
  }

  function explicitNext(){
    const next=new URLSearchParams(location.search).get('next');
    return next&&next.startsWith('/')&&!next.startsWith('//')?next:'';
  }

  function isRecoveryFlow(){
    return /(?:^|[#&?])type=recovery(?:&|$)/i.test(location.href);
  }

  function profileComplete(user){
    const m=user?.user_metadata||{};
    return m.profile_complete===true&&String(m.first_name||'').trim()&&String(m.last_name||'').trim()&&String(m.phone||'').trim()&&String(user?.email||'').trim();
  }

  function addSignupSocials(){
    const login=document.getElementById('loginPanel');
    const signup=document.getElementById('signupPanel');
    if(!login||!signup||signup.querySelector('.socials'))return;
    const loginSocials=login.querySelector('.socials');
    if(!loginSocials)return;

    const divider=document.createElement('div');
    divider.className='divider';
    divider.dataset.ddSignupSocials='1';
    divider.innerHTML='<span>'+(isEnglish()?'Or create your account with':'أو أنشئ حسابك بواسطة')+'</span>';

    const socials=loginSocials.cloneNode(true);
    socials.dataset.ddSignupSocials='1';
    socials.setAttribute('aria-label',isEnglish()?'Create an account using a social provider':'إنشاء حساب باستخدام حساب خارجي');
    socials.querySelectorAll('.social-btn').forEach(btn=>{
      const provider=String(btn.dataset.provider||'');
      btn.dataset.ddSignupSocial='1';
      btn.setAttribute('aria-label',isEnglish()?'Create account with '+provider:'إنشاء حساب بواسطة '+provider);
    });

    const switchCopy=signup.querySelector('.switch-copy');
    if(switchCopy){
      signup.insertBefore(divider,switchCopy);
      signup.insertBefore(socials,switchCopy);
    }else{
      signup.appendChild(divider);
      signup.appendChild(socials);
    }
  }

  function loadRealAuth(){
    if(document.querySelector('script[data-dd-auth-real],script[src*="/approved-pages/dear-day-auth.js"]'))return;
    const s=document.createElement('script');
    s.src='/approved-pages/dear-day-auth.js?v=20261005-4';
    s.async=true;
    s.dataset.ddAuthReal='1';
    (document.head||document.documentElement).appendChild(s);
  }

  async function redirectAuthenticatedUser(){
    if(isRecoveryFlow())return;
    try{
      const mod=await import(SUPABASE_ESM);
      const storage=localStorage.getItem('ddAuthRemember')==='0'?sessionStorage:localStorage;
      const supabase=mod.createClient(window.DEAR_DAY_SUPABASE.url,window.DEAR_DAY_SUPABASE.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage}});
      const {data:{session}}=await supabase.auth.getSession();
      const user=session?.user;
      if(!user)return;

      let role='customer';
      const {data:profile}=await supabase.from('profiles').select('role,is_active').eq('id',user.id).maybeSingle();
      if(profile?.is_active===false)return;
      role=profile?.role||'customer';

      if(role==='customer'&&!profileComplete(user))return;

      const next=explicitNext();
      const destination=next||portalPath(role);
      if(destination&&destination!==path)location.replace(destination);
    }catch(e){}
  }

  function init(){
    addSignupSocials();
    loadRealAuth();
    redirectAuthenticatedUser();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
