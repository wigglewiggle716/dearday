(function(){
  const SUPABASE_ESM='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';
  const CONFIG_SRC='/approved-pages/dear-day-supabase-config.js?v=20261002-1';
  const isEn=()=>String(document.documentElement.lang||'').toLowerCase().startsWith('en')||document.documentElement.dir==='ltr'||document.body?.dir==='ltr';
  const authPath=()=>isEn()?'/Dear-Day-Auth-en.html':'/Dear-Day-Auth.html';
  const profilePath=()=>isEn()?'/Dear-Day-Complete-Profile-en.html':'/Dear-Day-Complete-Profile.html';
  const text=(ar,en)=>isEn()?en:ar;

  function loadConfig(){
    if(window.DEAR_DAY_SUPABASE)return Promise.resolve(window.DEAR_DAY_SUPABASE);
    return new Promise((resolve,reject)=>{
      const existing=document.querySelector('script[data-dd-supabase-config]');
      if(existing){if(window.DEAR_DAY_SUPABASE){resolve(window.DEAR_DAY_SUPABASE);return;}existing.addEventListener('load',()=>resolve(window.DEAR_DAY_SUPABASE),{once:true});existing.addEventListener('error',reject,{once:true});return;}
      const s=document.createElement('script');s.src=CONFIG_SRC;s.async=true;s.dataset.ddSupabaseConfig='1';s.onload=()=>window.DEAR_DAY_SUPABASE?resolve(window.DEAR_DAY_SUPABASE):reject(new Error('Supabase config unavailable'));s.onerror=reject;(document.head||document.documentElement).appendChild(s);
    });
  }

  function ensureStyle(){
    if(document.getElementById('dd-auth-state-style'))return;
    const s=document.createElement('style');s.id='dd-auth-state-style';s.textContent=`
      .dd-user-chip{min-height:40px;max-width:210px;padding:7px 12px;border-radius:999px;border:1px solid rgba(107,53,64,.28);display:inline-flex;align-items:center;gap:8px;color:#6B3540;background:#FFFDFC;font-size:12px;font-weight:800;white-space:nowrap;overflow:hidden}
      .dd-user-avatar{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;overflow:hidden;background:#F5E4DE;color:#6B3540;font:900 11px/1 Arial,sans-serif;flex:0 0 26px}
      .dd-user-avatar img{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important;mix-blend-mode:normal!important}
      .dd-user-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .dd-logout{min-height:40px;padding:8px 12px;border-radius:999px;border:1px solid rgba(107,53,64,.22);background:transparent;color:#6B3540;font:800 12px/1.2 Tahoma,Arial,sans-serif;cursor:pointer}
      .dd-native-mobile-panel .dd-mobile-user{display:flex!important;align-items:center!important;gap:8px!important;background:#FAF3EA!important;margin-bottom:3px!important;padding:12px 14px!important;border-radius:11px!important;color:#6B3540!important;font:800 14px/1.6 Tahoma,Arial,sans-serif!important}
      .dd-native-mobile-panel button.dd-mobile-logout{display:block!important;width:100%!important;padding:12px 14px!important;border-radius:11px!important;color:#6B3540!important;background:transparent!important;border:0!important;text-align:start!important;font:700 14px/1.6 Tahoma,Arial,sans-serif!important;cursor:pointer!important}
      @media(max-width:1120px){.dd-user-chip{max-width:160px}.dd-user-label{max-width:105px}}
      @media(max-width:860px){header .dd-user-chip,header .dd-logout{display:none!important}}
    `;(document.head||document.documentElement).appendChild(s);
  }

  function profileComplete(user){const m=user?.user_metadata||{};return m.profile_complete===true&&String(m.first_name||'').trim()&&String(m.last_name||'').trim()&&String(m.phone||'').trim()&&String(user?.email||'').trim();}
  function currentRelative(){return location.pathname+location.search+location.hash;}
  function maybeRedirectToProfile(user){
    if(!user||profileComplete(user))return false;
    if(/Dear-Day-Complete-Profile(?:-en)?\.html$/i.test(location.pathname))return false;
    const saved=localStorage.getItem('ddPostAuthNext');
    const next=saved&&saved.startsWith('/')&&!saved.startsWith('//')?saved:currentRelative();
    localStorage.removeItem('ddPostAuthNext');
    location.replace(profilePath()+'?next='+encodeURIComponent(next));
    return true;
  }

  function displayData(user){const meta=user?.user_metadata||{};const name=String(meta.full_name||meta.name||[meta.first_name,meta.last_name].filter(Boolean).join(' ')||'').trim();const email=String(user?.email||'').trim();const avatar=String(meta.avatar_url||meta.picture||'').trim();const label=name||email||text('حسابي','My Account');const initial=(name||email||'D').trim().charAt(0).toUpperCase();return {name,email,avatar,label,initial};}
  function renderAvatar(el,d){if(el.dataset.avatar===d.avatar&&el.dataset.initial===d.initial)return;el.dataset.avatar=d.avatar;el.dataset.initial=d.initial;el.replaceChildren();if(d.avatar){const img=document.createElement('img');img.src=d.avatar;img.alt='';img.referrerPolicy='no-referrer';el.appendChild(img)}else el.textContent=d.initial;}
  function patchDesktop(user,signOut){const header=document.querySelector('header');if(!header)return;const actions=header.querySelector('.dd-global-actions,.auth-actions,.header-actions,.actions');if(!actions)return;if(!user){actions.querySelectorAll('.dd-user-chip,.dd-logout').forEach(el=>el.remove());return;}actions.querySelectorAll('a.dd-auth,a.header-auth').forEach(el=>el.remove());const d=displayData(user),lang=actions.querySelector('.dd-lang,.lang,.lang-link,.dd-language-switch');let chip=actions.querySelector('.dd-user-chip');if(!chip){chip=document.createElement('span');chip.className='dd-user-chip';chip.innerHTML='<span class="dd-user-avatar"></span><span class="dd-user-label"></span>';if(lang)actions.insertBefore(chip,lang);else actions.appendChild(chip);}chip.title=d.email||d.label;chip.querySelector('.dd-user-label').textContent=d.label;renderAvatar(chip.querySelector('.dd-user-avatar'),d);let logout=actions.querySelector('.dd-logout');if(!logout){logout=document.createElement('button');logout.type='button';logout.className='dd-logout';logout.addEventListener('click',signOut);if(lang)actions.insertBefore(logout,lang);else actions.appendChild(logout);}logout.textContent=text('تسجيل الخروج','Log out');}
  function patchMobile(user,signOut){document.querySelectorAll('.dd-native-mobile-panel').forEach(panel=>{if(!user){panel.querySelectorAll('.dd-mobile-user,.dd-mobile-logout').forEach(el=>el.remove());return;}[...panel.querySelectorAll('a')].forEach(a=>{const t=String(a.textContent||'').trim().toLowerCase();if(['log in','login','sign in','create account','create an account','sign up','تسجيل الدخول','إنشاء حساب'].includes(t))a.remove();});const d=displayData(user);let account=panel.querySelector('.dd-mobile-user');if(!account){account=document.createElement('div');account.className='dd-mobile-user';panel.appendChild(account);}account.textContent=(isEn()?'Account: ':'الحساب: ')+d.label;let logout=panel.querySelector('.dd-mobile-logout');if(!logout){logout=document.createElement('button');logout.type='button';logout.className='dd-mobile-logout';logout.addEventListener('click',signOut);panel.appendChild(logout);}logout.textContent=text('تسجيل الخروج','Log out');});}

  async function boot(){
    ensureStyle();const config=await loadConfig();const mod=await import(SUPABASE_ESM);const storage=localStorage.getItem('ddAuthRemember')==='0'?sessionStorage:localStorage;const supabase=mod.createClient(config.url,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage}});let currentUser=null;
    const signOut=async()=>{try{await supabase.auth.signOut()}catch(e){}localStorage.removeItem('ddAuthRemember');sessionStorage.removeItem('ddAuthRemember');location.href=authPath()+'#login';};
    const paint=()=>{patchDesktop(currentUser,signOut);patchMobile(currentUser,signOut)};
    try{const {data}=await supabase.auth.getUser();currentUser=data?.user||null}catch(e){currentUser=null}
    if(maybeRedirectToProfile(currentUser))return;
    paint();
    supabase.auth.onAuthStateChange((_event,session)=>{currentUser=session?.user||null;if(maybeRedirectToProfile(currentUser))return;paint();});
    let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;paint()})});observer.observe(document.documentElement,{subtree:true,childList:true});setTimeout(paint,150);setTimeout(paint,600);setTimeout(paint,1400);window.DearDayAuthState={getUser:()=>currentUser,signOut};
  }
  const start=()=>boot().catch(()=>{});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
