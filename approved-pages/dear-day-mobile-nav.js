(function(){
  const BP=900;
  if(!window.matchMedia('(max-width:'+BP+'px)').matches)return;
  function ensureAuthState(){
    if(document.querySelector('script[data-dd-auth-state]'))return;
    const s=document.createElement('script');s.src='/approved-pages/dear-day-auth-state.js?v=20261003-7';s.async=true;s.dataset.ddAuthState='1';(document.head||document.documentElement).appendChild(s);
  }
  function ensureAuthEnhancements(){
    if(document.querySelector('script[data-dd-auth-enhancements]'))return;
    const s=document.createElement('script');s.src='/approved-pages/dear-day-auth-enhancements.js?v=20261002-1';s.async=true;s.dataset.ddAuthEnhancements='1';(document.head||document.documentElement).appendChild(s);
  }
  function ensureAuth(){
    if(!/\/Dear-Day-Auth(?:-en)?\.html$/i.test(String(location.pathname||'')))return;
    const existing=document.querySelector('script[data-dd-auth-real]');
    if(existing){ensureAuthEnhancements();return;}
    const s=document.createElement('script');s.src='/approved-pages/dear-day-auth.js?v=20261002-2';s.async=true;s.dataset.ddAuthReal='1';s.onload=ensureAuthEnhancements;(document.head||document.documentElement).appendChild(s);
  }
  ensureAuthState();
  ensureAuth();
  function isEn(){return String(document.documentElement.lang||'').toLowerCase().startsWith('en')||document.documentElement.dir==='ltr'||document.body?.dir==='ltr'}
  function ensureStyle(){
    if(document.getElementById('dd-native-mobile-nav-style'))return;
    const s=document.createElement('style');s.id='dd-native-mobile-nav-style';s.textContent=`
      header .dd-mobile-menu-toggle,header .dd-mobile-menu,header .menu,header .menu-btn,header .burger,header .hamburger,header [class*="burger"],header [class*="hamburger"]{display:none!important}
      @media(min-width:${BP+1}px){
        html[lang^="en"] header.dd-en-unified-header{min-height:92px!important;height:auto!important;background:rgba(250,243,234,.96)!important;border-bottom:1px solid rgba(107,53,64,.18)!important;position:sticky!important;top:0!important;z-index:100!important;backdrop-filter:blur(14px)!important;font-family:Arial,Helvetica,sans-serif!important}
        html[lang^="en"] header.dd-en-unified-header.dd-en-direct-header{display:grid!important;grid-template-columns:minmax(230px,auto) 1fr minmax(300px,auto)!important;align-items:center!important;gap:28px!important;padding:12px clamp(30px,6vw,96px)!important}
        html[lang^="en"] header.dd-en-unified-header .dd-en-header-inner{width:100%!important;max-width:none!important;margin:0!important;display:grid!important;grid-template-columns:minmax(230px,auto) 1fr minmax(300px,auto)!important;align-items:center!important;gap:28px!important;padding:12px clamp(30px,6vw,96px)!important}
        html[lang^="en"] header.dd-en-unified-header .dd-en-brand{display:flex!important;align-items:center!important;justify-content:flex-start!important;min-width:0!important}
        html[lang^="en"] header.dd-en-unified-header .dd-en-brand img,html[lang^="en"] header.dd-en-unified-header .dd-en-brand .wordmark{width:182px!important;height:68px!important;max-width:182px!important;object-fit:contain!important;mix-blend-mode:multiply!important}
        html[lang^="en"] header.dd-en-unified-header .dd-en-nav{display:flex!important;align-items:center!important;justify-content:center!important;gap:38px!important;font:700 14px/1.4 Arial,Helvetica,sans-serif!important;white-space:nowrap!important}
        html[lang^="en"] header.dd-en-unified-header .dd-en-nav>a{position:relative!important;padding:14px 2px!important;border:0!important;box-shadow:none!important;text-decoration:none!important;background:none!important;color:#6B3540!important}
        html[lang^="en"] header.dd-en-unified-header .dd-en-nav>a:after{content:""!important;position:absolute!important;inset-inline:0!important;bottom:4px!important;height:2px!important;background:#A8583D!important;border-radius:2px!important;transform:scaleX(0)!important;opacity:0!important;transition:transform .18s ease,opacity .18s ease!important}
        html[lang^="en"] header.dd-en-unified-header .dd-en-nav>a:hover,html[lang^="en"] header.dd-en-unified-header .dd-en-nav>a.active{color:#A8583D!important}
        html[lang^="en"] header.dd-en-unified-header .dd-en-nav>a:hover:after,html[lang^="en"] header.dd-en-unified-header .dd-en-nav>a.active:after{transform:scaleX(1)!important;opacity:1!important}
        html[lang^="en"] header.dd-en-unified-header .dd-en-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:11px!important;white-space:nowrap!important}
        html[lang^="en"] header.dd-en-unified-header .dd-en-actions>a.auth-link{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:42px!important;padding:8px 18px!important;border-radius:999px!important;border:1px solid rgba(107,53,64,.32)!important;background:transparent!important;color:#6B3540!important;font:800 13px/1.4 Arial,Helvetica,sans-serif!important;box-shadow:none!important}
        html[lang^="en"] header.dd-en-unified-header .dd-en-actions>a.auth-link.signup{background:#6B3540!important;border-color:#6B3540!important;color:#FFFDFC!important}
        html[lang^="en"] header.dd-en-unified-header .dd-en-actions>a.lang-link{display:grid!important;place-items:center!important;min-width:42px!important;width:42px!important;height:42px!important;padding:0!important;border-radius:50%!important;border:1px solid rgba(107,53,64,.24)!important;background:transparent!important;color:#6B3540!important;font:900 12px/1 Arial,Helvetica,sans-serif!important}
      }
      @media(max-width:${BP}px){
        header .dd-global-actions button.dd-native-menu-btn ~ button,
        header .auth-actions button.dd-native-menu-btn ~ button,
        header .header-actions button.dd-native-menu-btn ~ button,
        header .actions button.dd-native-menu-btn ~ button{display:none!important}
        header .dd-global-actions button + button,
        header .auth-actions button + button,
        header .header-actions button + button,
        header .actions button + button{display:none!important}
      }
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
      ['Home','/en'],['Occasions','/occasions-en'],['How It Works','/how-it-works-en'],['Gifts','/gifts-en'],['Cake & Sweets','/cake-en'],['Flowers','/flowers-en'],['Places & Experiences','/venues-en'],['For Partners','/partners-en'],['Log In','/auth-en#login'],['Create Account','/auth-en#signup']
    ]:[
      ['الرئيسية','/'],['المناسبات','/occasions'],['كيف نعمل','/how-it-works'],['الهدايا','/gifts'],['الكيك والحلويات','/cake'],['الورد','/flowers'],['الأماكن والتجارب','/venues'],['للشركاء','/partners'],['تسجيل الدخول','/auth#login'],['إنشاء حساب','/auth#signup']
    ];
  }
  function getActions(header){return header.querySelector('.dd-global-actions,.auth-actions,.header-actions,.actions')}
  function patchBrand(header){
    const home=isEn()?'/en':'/';
    const direct=header.querySelector('.dd-global-brand,.brand,.auth-brand,a.logo');if(direct&&direct.tagName==='A')direct.href=home;
    const img=header.querySelector('img[alt*="Dear Day" i],.wordmark');const link=img?.closest('a');if(link)link.href=home;
  }
  function patchFooterFlowers(){
    const english=isEn();
    const href=english?'/flowers-en':'/flowers';
    document.querySelectorAll('footer .footer-top>div').forEach(col=>{
      const heading=String(col.querySelector('h4')?.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
      const isServices=english?heading.includes('dear day services'):(heading.includes('خدمات')&&heading.includes('dear day'));
      if(!isServices||col.querySelector('a[href*="Dear-Day-Flowers-Approved"]'))return;
      const link=document.createElement('a');link.href=href;link.textContent=english?'Flowers':'الورد';
      const cake=[...col.querySelectorAll('a')].find(a=>/Dear-Day-Cake-Approved/i.test(String(a.getAttribute('href')||'')));
      if(cake)cake.insertAdjacentElement('afterend',link);else col.appendChild(link);
    });
  }
  function patchFooterDataDeletion(){
    const english=isEn();
    const href=english?'/delete-account-en':'/delete-account';
    document.querySelectorAll('footer .footer-top>div').forEach(col=>{
      const heading=String(col.querySelector('h4')?.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
      const isSupport=english?heading.includes('customer service'):heading==='خدمة العملاء';
      if(!isSupport||col.querySelector('a[href*="Dear-Day-Data-Deletion"]'))return;
      const link=document.createElement('a');link.href=href;link.textContent=english?'Account & Data Deletion':'حذف الحساب والبيانات';
      col.appendChild(link);
    });
  }
  function patchHowItWorksLinks(){
    const english=isEn();
    const href=english?'/how-it-works-en':'/how-it-works';
    document.querySelectorAll('header a,footer a').forEach(a=>{
      const text=String(a.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
      if(english&&text==='how it works')a.href=href;
      if(!english&&(text==='كيف نعمل'||text==='كيف تعمل')){
        a.href=href;
        if(a.closest('header'))a.textContent='كيف نعمل';
      }
    });
  }
  function normalizeEnglishHeader(){
    if(!isEn())return;
    document.querySelectorAll('header').forEach(header=>{
      const actions=getActions(header);
      const nav=header.querySelector('.home-nav,.navlinks,.dd-global-nav,.auth-nav,nav');
      const brand=header.querySelector('.dd-global-brand,.brand,.auth-brand,a.logo');
      if(!actions||!nav||!brand)return;
      header.classList.add('dd-en-unified-header');
      const inner=[...header.children].find(el=>el!==brand&&el.contains?.(brand)&&el.contains?.(nav)&&el.contains?.(actions));
      if(inner){inner.classList.add('dd-en-header-inner');header.classList.remove('dd-en-direct-header')}else{header.classList.add('dd-en-direct-header')}
      brand.classList.add('dd-en-brand');nav.classList.add('dd-en-nav');actions.classList.add('dd-en-actions');
      [...actions.querySelectorAll(':scope>a')].forEach(a=>{
        const text=String(a.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
        if(text==='log in'||text==='login'||text==='sign in')a.classList.add('auth-link');
        if(text==='create account'||text==='create an account'||text==='sign up'){a.classList.add('auth-link','signup')}
        if(text==='ar'||a.classList.contains('lang-link')||a.classList.contains('dd-language-switch')||a.classList.contains('dd-lang'))a.classList.add('lang-link');
      });
    });
  }
  function forceEnglishHowItWorksHeader(){
    if(!/\/approved-pages\/Dear-Day-How-It-Works-en\.html$/i.test(String(location.pathname||'')))return;
    if(document.documentElement.lang!=='en')document.documentElement.lang='en';
    if(document.documentElement.dir!=='ltr')document.documentElement.dir='ltr';
    if(document.body&&document.body.dir!=='ltr')document.body.dir='ltr';
    const header=document.querySelector('header');if(!header)return;if(header.querySelector('.dd-static-explore'))return;
    const brand=header.querySelector('.brand,.dd-global-brand,.auth-brand,a.logo');
    if(brand&&brand.tagName==='A'&&brand.getAttribute('href')!=='/en'){brand.href='/en';brand.setAttribute('aria-label','Dear Day — Home')}
    const nav=header.querySelector('.home-nav,.dd-global-nav,.auth-nav,nav');
    const desiredNav=[['Home','/en'],['Occasions','/occasions-en'],['How It Works','/how-it-works-en'],['For Partners','/partners-en'],['Plan My Occasion','/en#occasions']];
    if(nav&&!nav.querySelector('.dd-explore-nav')){
      const current=[...nav.querySelectorAll(':scope>a')].map(a=>[String(a.textContent||'').trim(),a.getAttribute('href')||'']);
      const correct=current.length===desiredNav.length&&desiredNav.every((x,i)=>current[i]?.[0]===x[0]&&current[i]?.[1]===x[1]);
      if(!correct){nav.setAttribute('aria-label','Main navigation');nav.innerHTML=desiredNav.map((x,i)=>`<a${i===2?' class="active"':''} href="${x[1]}">${x[0]}</a>`).join('')}
    }
    const actions=getActions(header);
    if(actions){
      const links=[...actions.querySelectorAll(':scope>a')];
      const wanted=[['Log In','/auth-en#login'],['Create Account','/auth-en#signup'],['AR','/how-it-works']];
      const correct=links.length===3&&wanted.every((x,i)=>String(links[i]?.textContent||'').trim()===x[0]&&(links[i]?.getAttribute('href')||'')===x[1]);
      if(!correct){
        links.forEach(a=>a.remove());
        const login=document.createElement('a');login.href=wanted[0][1];login.textContent=wanted[0][0];actions.appendChild(login);
        const signup=document.createElement('a');signup.href=wanted[1][1];signup.className='signup';signup.textContent=wanted[1][0];actions.appendChild(signup);
        const lang=document.createElement('a');lang.href=wanted[2][1];lang.className='lang-link';lang.setAttribute('aria-label','العربية');lang.textContent=wanted[2][0];actions.appendChild(lang);
      }
    }
  }
  function isLegacyMenuButton(el){
    if(!(el instanceof Element)||el.classList.contains('dd-native-menu-btn'))return false;
    if(el.matches('.dd-mobile-menu-toggle,.menu,.menu-btn,.burger,.hamburger,[class*="burger"],[class*="hamburger"]'))return true;
    if(el.tagName==='BUTTON'){
      const aria=String(el.getAttribute('aria-label')||'').toLowerCase();const title=String(el.getAttribute('title')||'').toLowerCase();const txt=String(el.textContent||'').trim();
      return aria.includes('menu')||aria.includes('navigation')||aria.includes('قائمة')||title.includes('menu')||title.includes('navigation')||txt==='☰'||txt==='≡';
    }
    return false;
  }
  function removeLegacy(header){
    header.querySelectorAll('.dd-mobile-menu-toggle,.dd-mobile-menu,.menu,.menu-btn,.burger,.hamburger,[class*="burger"],[class*="hamburger"]').forEach(el=>{if(!el.classList.contains('dd-native-menu-btn'))el.remove()});
    header.querySelectorAll('button').forEach(btn=>{if(isLegacyMenuButton(btn))btn.remove()});
    const actions=getActions(header);if(actions){const menuButtons=[...actions.querySelectorAll('button')].filter(btn=>btn.classList.contains('dd-native-menu-btn')||isLegacyMenuButton(btn));menuButtons.slice(1).forEach(btn=>btn.remove())}
    header.classList.remove('dd-mobile-menu-open');header.removeAttribute('data-dd-mobile-menu-ready');
  }
  function mount(header){
    if(!header)return;removeLegacy(header);patchBrand(header);
    const actions=getActions(header);if(!actions)return;
    header.classList.add('dd-native-mobile-ready');
    let btn=header.querySelector('.dd-native-menu-btn');let panel=header.querySelector('.dd-native-mobile-panel');
    if(!btn){btn=document.createElement('button');btn.type='button';btn.className='dd-native-menu-btn';btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-label',isEn()?'Open menu':'فتح القائمة');btn.innerHTML='<span></span><span></span><span></span>';actions.insertBefore(btn,actions.firstChild)}
    if(!panel){panel=document.createElement('div');panel.className='dd-native-mobile-panel';menuItems().forEach(([label,href])=>{const a=document.createElement('a');a.href=href;a.textContent=label;panel.appendChild(a)});header.appendChild(panel)}
    if(btn.dataset.ddBound!=='1'){btn.dataset.ddBound='1';btn.addEventListener('click',e=>{e.stopPropagation();const open=!header.classList.contains('dd-native-menu-open');header.classList.toggle('dd-native-menu-open',open);btn.setAttribute('aria-expanded',String(open))})}
    if(panel.dataset.ddBound!=='1'){panel.dataset.ddBound='1';panel.addEventListener('click',e=>{if(e.target.closest('a')){header.classList.remove('dd-native-menu-open');btn.setAttribute('aria-expanded','false')}})}
  }
  function patchEnglishHomeOccasionFlow(){
    if(!isEn()||!/\/index-en\.html$/i.test(String(location.pathname||'')))return;
    const form=document.querySelector('#occasions .filters');
    if(!form||form.dataset.ddEnglishFlow==='1')return;
    form.dataset.ddEnglishFlow='1';
    form.addEventListener('submit',function(e){
      const selected=document.querySelector('#occasions [data-occasion][aria-pressed="true"]');
      if(!selected)return;
      e.preventDefault();e.stopImmediatePropagation();
      const raw=selected.dataset.occasion||'';
      const map={'عيد ميلاد':'birthday','ذكرى سنوية':'anniversary','Date Night':'date_night','طلب زواج':'proposal'};
      const key=map[raw]||'birthday';
      const area=document.getElementById('area')?.value||'';
      const date=document.getElementById('date')?.value||'';
      const budgetKey=document.getElementById('budget')?.value||'';
      const feedback=document.getElementById('feedback');
      if(!date){if(feedback)feedback.textContent='Choose the occasion date first.';return}
      if(!budgetKey){if(feedback)feedback.textContent='Choose an approximate budget or select “Not sure yet”.';return}
      const labels={birthday:'Birthday',anniversary:'Anniversary',date_night:'Date Night',proposal:'Marriage Proposal'};
      const budgetLabels={'under-1000':'Under EGP 1,000','1000-2500':'EGP 1,000–2,500','2500-5000':'EGP 2,500–5,000','5000-plus':'EGP 5,000+','unsure':'Not sure yet'};
      const plan={occasion:key,occasionKey:key,occasionLabel:labels[key],occasionLabelEn:labels[key],area,date,budgetKey,budget:budgetKey,budgetLabel:budgetLabels[budgetKey]||'',services:[],servicesEn:[],products:[]};
      try{localStorage.setItem('dearDayPlan',JSON.stringify(plan))}catch(err){}
      const params=new URLSearchParams({occasion:key,flow:'1',area,date,budget:budgetKey,dd:JSON.stringify(plan)});
      location.href='/birthday-en?'+params.toString();
    },true);
  }
  function scan(){ensureStyle();const hasStatic=!!document.querySelector('header .dd-static-explore');if(!hasStatic)forceEnglishHowItWorksHeader();document.querySelectorAll('header').forEach(mount);patchFooterFlowers();patchFooterDataDeletion();patchHowItWorksLinks();if(!hasStatic)forceEnglishHowItWorksHeader();normalizeEnglishHeader();patchEnglishHomeOccasionFlow()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan,{once:true});else scan();
  document.addEventListener('click',e=>{document.querySelectorAll('header.dd-native-mobile-ready').forEach(header=>{if(!header.contains(e.target)){header.classList.remove('dd-native-menu-open');header.querySelector('.dd-native-menu-btn')?.setAttribute('aria-expanded','false')}})});
  let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;scan()})});observer.observe(document.documentElement,{subtree:true,childList:true});
  setTimeout(scan,100);setTimeout(scan,500);setTimeout(scan,1200);
})();