window.DEAR_DAY_SUPABASE = Object.freeze({
  url: 'https://hpffdmldtdtwcaoemyso.supabase.co',
  publishableKey: 'sb_publishable_10ZXpBIQH2bG-iseG7jpdw_DfmEUT_C'
});

/* Keep real Supabase auth active on the clean /auth and /auth-en routes,
   and keep the same social sign-in choices available on account creation. */
(function(){
  const path=String(location.pathname||'/').replace(/\/$/,'')||'/';
  const isAuthPage=/^\/(?:auth(?:-en)?(?:\.html)?|Dear-Day-Auth(?:-en)?\.html)$/i.test(path);
  if(!isAuthPage)return;

  function isEnglish(){
    return String(document.documentElement.lang||'').toLowerCase().startsWith('en')||document.documentElement.dir==='ltr'||document.body?.dir==='ltr';
  }

  function addSignupSocials(){
    const login=document.getElementById('loginPanel');
    const signup=document.getElementById('signupPanel');
    if(!login||!signup||signup.querySelector('.socials'))return;
    const loginSocials=login.querySelector('.socials');
    if(!loginSocials)return;

    const divider=document.createElement('div');
    divider.className='divider';
    divider.innerHTML='<span>'+(isEnglish()?'Or create your account with':'أو أنشئ حسابك بواسطة')+'</span>';

    const socials=loginSocials.cloneNode(true);
    socials.setAttribute('aria-label',isEnglish()?'Create an account using a social provider':'إنشاء حساب باستخدام حساب خارجي');
    socials.querySelectorAll('.social-btn').forEach(btn=>{
      const provider=String(btn.dataset.provider||'');
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
    s.src='/approved-pages/dear-day-auth.js?v=20261005-1';
    s.async=true;
    s.dataset.ddAuthReal='1';
    (document.head||document.documentElement).appendChild(s);
  }

  function init(){
    addSignupSocials();
    loadRealAuth();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
