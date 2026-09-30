(function(){
  const BP=1120;
  function isEn(){return String(document.documentElement.lang||'').toLowerCase().startsWith('en')||document.documentElement.dir==='ltr'||document.body?.dir==='ltr'}
  function ensureStyle(){
    if(document.getElementById('dd-native-mobile-nav-style'))return;
    const s=document.createElement('style');s.id='dd-native-mobile-nav-style';s.textContent=`
      .dd-native-menu-btn{display:none!important;width:42px;height:42px;border:1px solid rgba(107,53,64,.25);border-radius:12px;background:#FFFDFC;color:#6B3540;padding:0;align-items:center;justify-content:center;flex-direction:column;gap:4px;flex:0 0 auto}
      .dd-native-menu-btn span{display:block;width:19px;height:2px;border-radius:2px;background:currentColor;transition:.18s ease}
      .dd-native-menu-open .dd-native-menu-btn span:nth-child(1){transform:translateY(6px) rotate(45deg)}
      .dd-native-menu-open .dd-native-menu-btn span:nth-child(2){opacity:0}
      .dd-native-menu-open .dd-native-menu-btn span:nth-child(3){transform:translateY(-6px) rotate(-45deg)}
      .dd-native-mobile-panel{display:none;position:absolute;top:calc(100% + 1px);left:12px;right:12px;z-index:2147483000;background:#FFFDFC;border:1px solid rgba(107,53,64,.16);border-radius:18px;box-shadow:0 18px 45px rgba(78,32,39,.14);padding:10px}
      .dd-native-mobile-panel a{display:block!important;width:100%!important;padding:12px 14px!important;border-radius:11px!important;color:#6B3540!important;background:transparent!important;border:0!important;box-shadow:none!important;text-decoration:none!important;font:700 14px/1.6 Tahoma,Arial,sans-serif!important;text-align:start!important}
      .dd-native-mobile-panel a:hover{background:#F6E7E1!important}
      @media(max-width:${BP}px){
        header.dd-native-mobile-ready{position:sticky!important;top:0!important;z-index:2147482000!important;overflow:visible!important;min-height:72px!important;height:auto!important;display:grid!important;grid-template-columns:auto 1fr!important;align-items:center!important;gap:10px!important;padding:8px 14px!important;width:100%!important;max-width:100%!important}
        header.dd-native-mobile-ready .home-nav,header.dd-native-mobile-ready .auth-nav,header.dd-native-mobile-ready .dd-global-nav,header.dd-native-mobile-ready>nav{display:none!important}
        header.dd-native-mobile-ready .auth-actions,header.dd-native-mobile-ready .dd-global-actions,header.dd-native-mobile-ready .header-actions,header.dd-native-mobile-ready .actions{margin-inline-start:auto!important;display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:8px!important;min-width:0!important}
        header.dd-native-mobile-ready .auth-actions>a:not(.lang-link):not(.dd-language-switch):not(.lang),header.dd-native-mobile-ready .dd-global-actions>a:not(.dd-lang),header.dd-native-mobile-ready .header-auth,header.dd-native-mobile-ready .dd-mobile-plan{display:none!important}
        header.dd-native-mobile-ready .lang-link,header.dd-native-mobile-ready .dd-language-switch,header.dd-native-mobile-ready .lang,header.dd-native-mobile-ready .dd-lang{display:grid!important;place-items:center!important;width:38px!important;height:38px!important;min-width:38px!important;padding:0!important;border-radius:50%!important}
        header.dd-native-mobile-ready .dd-native-menu-btn{display:flex!important}
        header.dd-native-mobile-ready.dd-native-menu-open .dd-native-mobile-panel{display:block!important}
        header.dd-native-mobile-ready .brand img,header.dd-native-mobile-ready .auth-brand img,header.dd-native-mobile-ready .dd-global-brand img,header.dd-native-mobile-ready .wordmark{width:116px!important;height:48px!important;max-width:116px!important;object-fit:contain!important}
      }
    `;document.head.appendChild(s);
  }
  function menuItems(){
    return isEn()?[
      ['Home','/index-en.html'],
      ['Occasions','/approved-pages/Dear-Day-Occasions-Approved-en.html'],
      ['Gifts','/approved-pages/Dear-Day-Gifts-Approved-en.html?standalone=1'],
      ['Cake & Sweets','/approved-pages/Dear-Day-Cake-Approved-en.html?standalone=1'],
      ['Places & Experiences','/approved-pages/Dear-Day-Venues-Approved-en.html?standalone=1'],
      ['For Partners','/approved-pages/Dear-Day-Partners-en.html'],
      ['Log In','/Dear-Day-Auth-en.html#login'],
      ['Create Account','/Dear-Day-Auth-en.html#signup']
    ]:[
      ['الرئيسية','/'],
      ['المناسبات','/approved-pages/Dear-Day-Occasions-Approved.html'],
      ['الهدايا','/approved-pages/Dear-Day-Gifts-Approved.html?standalone=1'],
      ['الكيك والحلويات','/approved-pages/Dear-Day-Cake-Approved.html?standalone=1'],
      ['الأماكن والتجارب','/approved-pages/Dear-Day-Venues-Approved.html?standalone=1'],
      ['للشركاء','/approved-pages/Dear-Day-Partners.html'],
      ['تسجيل الدخول','/Dear-Day-Auth.html#login'],
      ['إنشاء حساب','/Dear-Day-Auth.html#signup']
    ];
  }
  function getParts(header){
    const actions=header.querySelector('.dd-global-actions,.auth-actions,.header-actions,.actions');
    return {actions};
  }
  function patchBrand(header){
    const home=isEn()?'/index-en.html':'/';
    const brand=header.querySelector('.dd-global-brand,.brand,.auth-brand,a.logo');
    if(brand&&brand.tagName==='A')brand.setAttribute('href',home);
    const img=header.querySelector('img[alt*="Dear Day" i],.wordmark');
    const imgLink=img?.closest('a');if(imgLink)imgLink.setAttribute('href',home);
  }
  function mount(header){
    if(!header)return;patchBrand(header);
    const {actions}=getParts(header);if(!actions)return;
    header.querySelectorAll('.dd-native-menu-btn,.dd-native-mobile-panel').forEach(el=>el.remove());
    header.classList.add('dd-native-mobile-ready');
    const btn=document.createElement('button');btn.type='button';btn.className='dd-native-menu-btn';btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-label',isEn()?'Open menu':'فتح القائمة');btn.innerHTML='<span></span><span></span><span></span>';actions.appendChild(btn);
    const panel=document.createElement('div');panel.className='dd-native-mobile-panel';
    menuItems().forEach(([label,href])=>{const a=document.createElement('a');a.href=href;a.textContent=label;panel.appendChild(a)});
    header.appendChild(panel);
    function close(){header.classList.remove('dd-native-menu-open');btn.setAttribute('aria-expanded','false')}
    btn.addEventListener('click',e=>{e.stopPropagation();const open=!header.classList.contains('dd-native-menu-open');header.classList.toggle('dd-native-menu-open',open);btn.setAttribute('aria-expanded',String(open))});
    panel.addEventListener('click',e=>{if(e.target.closest('a'))close()});
    if(!header.dataset.ddNativeOutsideBound){header.dataset.ddNativeOutsideBound='1';document.addEventListener('click',e=>{if(!header.contains(e.target))close()})}
  }
  function scan(){ensureStyle();document.querySelectorAll('header').forEach(mount)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan,{once:true});else scan();
  let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;scan()})});observer.observe(document.documentElement,{subtree:true,childList:true});
  setTimeout(scan,100);setTimeout(scan,500);setTimeout(scan,1200);
})();