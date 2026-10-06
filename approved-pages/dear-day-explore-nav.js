(function(){
  'use strict';
  const VERSION='20261006-2';
  const PATH=String(location.pathname||'/');
  const EN=String(document.documentElement.lang||'').toLowerCase().startsWith('en')||document.documentElement.dir==='ltr'||document.body?.dir==='ltr'||/-en(?:\.html)?$/i.test(PATH)||PATH==='/en';
  const labels=EN?{
    home:'Home',explore:'Explore',occasions:'Occasions',how:'How It Works',partners:'For Partners',gifts:'Gifts',cake:'Cake & Sweets',venues:'Places & Experiences',flowers:'Flowers',login:'Log In',signup:'Create Account',open:'Open Explore menu'
  }:{
    home:'الرئيسية',explore:'اكتشف',occasions:'المناسبات',how:'كيف نعمل',partners:'للشركاء',gifts:'هدايا',cake:'كيك وحلويات',venues:'أماكن وتجارب',flowers:'ورد',login:'تسجيل الدخول',signup:'إنشاء حساب',open:'فتح قائمة اكتشف'
  };
  const urls=EN?{
    home:'/en',occasions:'/occasions-en',how:'/how-it-works-en',partners:'/partners-en',gifts:'/gifts-en',cake:'/cake-en',venues:'/venues-en',flowers:'/flowers-en',login:'/auth-en#login',signup:'/auth-en#signup'
  }:{
    home:'/',occasions:'/occasions',how:'/how-it-works',partners:'/partners',gifts:'/gifts',cake:'/cake',venues:'/venues',flowers:'/flowers',login:'/auth#login',signup:'/auth#signup'
  };
  const categoryPaths=EN?['/gifts-en','/cake-en','/venues-en','/flowers-en']:['/gifts','/cake','/venues','/flowers'];
  const clean=p=>(p||'/').replace(/\/$/,'')||'/';
  const current=clean(PATH);
  const isCategory=categoryPaths.includes(current);

  function ensureStyle(){
    if(document.getElementById('dd-explore-nav-style'))return;
    const s=document.createElement('style');
    s.id='dd-explore-nav-style';
    s.textContent=`
      .dd-explore-nav{position:relative!important;display:flex!important;align-items:stretch!important;align-self:stretch!important}
      .dd-explore-trigger{appearance:none!important;-webkit-appearance:none!important;border:0!important;background:transparent!important;color:inherit!important;font:inherit!important;font-weight:inherit!important;line-height:inherit!important;cursor:pointer!important;display:inline-flex!important;align-items:center!important;gap:6px!important;padding:14px 2px!important;position:relative!important;white-space:nowrap!important}
      .dd-explore-trigger .dd-chevron{font-size:11px!important;line-height:1!important;transition:transform .18s ease!important;margin-top:1px!important}
      .dd-explore-nav:hover>.dd-explore-trigger,.dd-explore-nav:focus-within>.dd-explore-trigger,.dd-explore-nav.dd-open>.dd-explore-trigger,.dd-explore-nav.dd-active>.dd-explore-trigger{color:#A8583D!important}
      .dd-explore-nav.dd-open>.dd-explore-trigger .dd-chevron,.dd-explore-nav:hover>.dd-explore-trigger .dd-chevron,.dd-explore-nav:focus-within>.dd-explore-trigger .dd-chevron{transform:rotate(180deg)!important}
      .dd-explore-trigger:after{content:""!important;position:absolute!important;inset-inline:0!important;bottom:4px!important;height:2px!important;border-radius:2px!important;background:#A8583D!important;transform:scaleX(0)!important;opacity:0!important;transition:transform .18s ease,opacity .18s ease!important}
      .dd-explore-nav:hover>.dd-explore-trigger:after,.dd-explore-nav:focus-within>.dd-explore-trigger:after,.dd-explore-nav.dd-open>.dd-explore-trigger:after,.dd-explore-nav.dd-active>.dd-explore-trigger:after{transform:scaleX(1)!important;opacity:1!important}
      .dd-explore-menu{position:absolute!important;top:calc(100% - 2px)!important;left:50%!important;transform:translate(-50%,10px)!important;min-width:225px!important;padding:8px!important;margin:0!important;background:#FFFDFC!important;border:1px solid rgba(107,53,64,.16)!important;border-radius:16px!important;box-shadow:0 18px 45px rgba(78,32,39,.14)!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;z-index:2147483000!important;transition:opacity .16s ease,transform .16s ease,visibility .16s ease!important}
      .dd-explore-nav:hover>.dd-explore-menu,.dd-explore-nav:focus-within>.dd-explore-menu,.dd-explore-nav.dd-open>.dd-explore-menu{opacity:1!important;visibility:visible!important;pointer-events:auto!important;transform:translate(-50%,0)!important}
      .dd-explore-menu a{display:flex!important;align-items:center!important;width:100%!important;min-height:42px!important;padding:10px 12px!important;margin:0!important;border-radius:10px!important;border:0!important;background:transparent!important;color:#6B3540!important;text-decoration:none!important;font:700 13px/1.5 'Noto Sans Arabic',Tahoma,Arial,sans-serif!important;box-shadow:none!important;text-align:start!important}
      html[lang^="en"] .dd-explore-menu a{font-family:Arial,Helvetica,sans-serif!important}
      .dd-explore-menu a:hover,.dd-explore-menu a:focus-visible{background:#F6E7E1!important;color:#6B3540!important}
      .dd-explore-menu a:before,.dd-explore-menu a:after{content:none!important;display:none!important}
      .dd-explore-mobile-row{display:block!important;width:100%!important}
      .dd-mobile-explore-trigger{appearance:none!important;-webkit-appearance:none!important;width:100%!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;padding:12px 14px!important;border:0!important;border-radius:11px!important;background:transparent!important;color:#6B3540!important;font:700 14px/1.6 'Noto Sans Arabic',Tahoma,Arial,sans-serif!important;text-align:start!important;cursor:pointer!important}
      html[lang^="en"] .dd-mobile-explore-trigger{font-family:Arial,Helvetica,sans-serif!important}
      .dd-mobile-explore-trigger:hover,.dd-mobile-explore-trigger:focus-visible,.dd-explore-mobile-row.dd-open>.dd-mobile-explore-trigger{background:#F6E7E1!important}
      .dd-mobile-explore-trigger .dd-chevron{transition:transform .18s ease!important;font-size:12px!important}
      .dd-explore-mobile-row.dd-open>.dd-mobile-explore-trigger .dd-chevron{transform:rotate(180deg)!important}
      .dd-mobile-explore-list{display:none!important;padding:3px 8px 8px!important}
      .dd-explore-mobile-row.dd-open>.dd-mobile-explore-list{display:block!important}
      .dd-native-mobile-panel .dd-mobile-explore-list a,.dd-explore-fallback-panel .dd-mobile-explore-list a{padding-inline-start:26px!important;font-weight:600!important;background:#FBF4F0!important;margin:4px 0!important}
      .dd-explore-fallback-btn{display:none!important;width:42px!important;height:42px!important;border:1px solid rgba(107,53,64,.25)!important;border-radius:12px!important;background:#FFFDFC!important;color:#6B3540!important;padding:0!important;align-items:center!important;justify-content:center!important;flex-direction:column!important;gap:4px!important;flex:0 0 auto!important}
      .dd-explore-fallback-btn span{display:block!important;width:19px!important;height:2px!important;border-radius:2px!important;background:currentColor!important}
      .dd-explore-fallback-panel{display:none;position:absolute;top:calc(100% + 1px);left:12px;right:12px;z-index:2147483000;background:#FFFDFC;border:1px solid rgba(107,53,64,.16);border-radius:18px;box-shadow:0 18px 45px rgba(78,32,39,.14);padding:10px}
      .dd-explore-fallback-panel>a{display:block!important;width:100%!important;padding:12px 14px!important;border-radius:11px!important;color:#6B3540!important;background:transparent!important;border:0!important;text-decoration:none!important;font:700 14px/1.6 'Noto Sans Arabic',Tahoma,Arial,sans-serif!important;text-align:start!important}
      html[lang^="en"] .dd-explore-fallback-panel>a{font-family:Arial,Helvetica,sans-serif!important}
      .dd-explore-fallback-panel>a:hover{background:#F6E7E1!important}
      @media(max-width:900px){
        header.dd-explore-fallback-ready{position:sticky!important;top:0!important;overflow:visible!important;z-index:2147482000!important}
        header.dd-explore-fallback-ready .dd-explore-fallback-btn{display:flex!important}
        header.dd-explore-fallback-ready.dd-explore-fallback-open .dd-explore-fallback-panel{display:block!important}
      }
    `;
    (document.head||document.documentElement).appendChild(s);
  }

  function navFor(header){
    return header.querySelector('.home-nav,.dd-global-nav,.dd-en-nav,.auth-nav,nav');
  }
  function actionsFor(header){
    return header.querySelector('.auth-actions,.dd-global-actions,.dd-en-actions,.header-actions,.actions');
  }
  function activeFor(key){
    if(key==='home')return current==='/'||current==='/en'||/\/index(?:-en)?\.html$/i.test(current);
    if(key==='occasions')return current==='/occasions'||current==='/occasions-en'||current==='/birthday'||current==='/birthday-en';
    if(key==='how')return current==='/how-it-works'||current==='/how-it-works-en';
    if(key==='partners')return current==='/partners'||current==='/partners-en';
    return false;
  }
  function topLink(label,href,active){
    const a=document.createElement('a');a.href=href;a.textContent=label;if(active)a.className='active';return a;
  }
  function makeExplore(desktop=true){
    const wrap=document.createElement('div');wrap.className='dd-explore-nav'+(isCategory?' dd-active':'');
    const btn=document.createElement('button');btn.type='button';btn.className='dd-explore-trigger';btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-haspopup','true');btn.setAttribute('aria-label',labels.open);btn.innerHTML=`<span>${labels.explore}</span><span class="dd-chevron" aria-hidden="true">⌄</span>`;
    const menu=document.createElement('div');menu.className='dd-explore-menu';menu.setAttribute('role','menu');
    [[labels.gifts,urls.gifts],[labels.cake,urls.cake],[labels.venues,urls.venues],[labels.flowers,urls.flowers]].forEach(([label,href])=>{const a=document.createElement('a');a.href=href;a.textContent=label;a.setAttribute('role','menuitem');menu.appendChild(a)});
    wrap.append(btn,menu);
    btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const open=!wrap.classList.contains('dd-open');document.querySelectorAll('.dd-explore-nav.dd-open').forEach(el=>{if(el!==wrap){el.classList.remove('dd-open');el.querySelector('.dd-explore-trigger')?.setAttribute('aria-expanded','false')}});wrap.classList.toggle('dd-open',open);btn.setAttribute('aria-expanded',String(open))});
    wrap.addEventListener('mouseleave',()=>{if(matchMedia('(hover:hover)').matches){wrap.classList.remove('dd-open');btn.setAttribute('aria-expanded','false')}});
    return wrap;
  }
  function patchDesktop(header){
    const nav=navFor(header);if(!nav)return;
    if(nav.dataset.ddExploreVersion===VERSION&&nav.querySelector('.dd-explore-nav'))return;
    const nodes=[
      topLink(labels.home,urls.home,activeFor('home')),
      makeExplore(),
      topLink(labels.occasions,urls.occasions,activeFor('occasions')),
      topLink(labels.how,urls.how,activeFor('how')),
      topLink(labels.partners,urls.partners,activeFor('partners'))
    ];
    nav.replaceChildren(...nodes);
    nav.dataset.ddExploreVersion=VERSION;
    nav.setAttribute('aria-label',EN?'Main navigation':'التنقل الرئيسي');
  }
  function mobileExploreRow(){
    const row=document.createElement('div');row.className='dd-explore-mobile-row';
    const btn=document.createElement('button');btn.type='button';btn.className='dd-mobile-explore-trigger';btn.setAttribute('aria-expanded','false');btn.innerHTML=`<span>${labels.explore}</span><span class="dd-chevron" aria-hidden="true">⌄</span>`;
    const list=document.createElement('div');list.className='dd-mobile-explore-list';
    [[labels.gifts,urls.gifts],[labels.cake,urls.cake],[labels.venues,urls.venues],[labels.flowers,urls.flowers]].forEach(([label,href])=>{const a=document.createElement('a');a.href=href;a.textContent=label;list.appendChild(a)});
    btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const open=!row.classList.contains('dd-open');row.classList.toggle('dd-open',open);btn.setAttribute('aria-expanded',String(open))});
    row.append(btn,list);return row;
  }
  function mobileBaseItems(){return [
    [labels.home,urls.home],
    [labels.occasions,urls.occasions],
    [labels.how,urls.how],
    [labels.partners,urls.partners],
    [labels.login,urls.login],
    [labels.signup,urls.signup]
  ]}
  function fillMobilePanel(panel){
    if(!panel||panel.dataset.ddExploreVersion===VERSION)return;
    const frag=document.createDocumentFragment();
    const home=document.createElement('a');home.href=urls.home;home.textContent=labels.home;frag.appendChild(home);
    frag.appendChild(mobileExploreRow());
    mobileBaseItems().slice(1).forEach(([label,href])=>{const a=document.createElement('a');a.href=href;a.textContent=label;frag.appendChild(a)});
    panel.replaceChildren(frag);panel.dataset.ddExploreVersion=VERSION;
  }
  function patchNativeMobile(header){
    const panel=header.querySelector('.dd-native-mobile-panel');
    if(panel)fillMobilePanel(panel);
  }
  function ensureFallbackMobile(header){
    if(header.querySelector('.dd-native-menu-btn,.dd-native-mobile-panel'))return;
    const actions=actionsFor(header);if(!actions)return;
    header.classList.add('dd-explore-fallback-ready');
    let btn=header.querySelector('.dd-explore-fallback-btn');
    let panel=header.querySelector('.dd-explore-fallback-panel');
    if(!btn){btn=document.createElement('button');btn.type='button';btn.className='dd-explore-fallback-btn';btn.setAttribute('aria-label',EN?'Open menu':'فتح القائمة');btn.setAttribute('aria-expanded','false');btn.innerHTML='<span></span><span></span><span></span>';actions.insertBefore(btn,actions.firstChild)}
    if(!panel){panel=document.createElement('div');panel.className='dd-explore-fallback-panel';header.appendChild(panel)}
    fillMobilePanel(panel);
    if(btn.dataset.ddBound!=='1'){btn.dataset.ddBound='1';btn.addEventListener('click',e=>{e.stopPropagation();const open=!header.classList.contains('dd-explore-fallback-open');header.classList.toggle('dd-explore-fallback-open',open);btn.setAttribute('aria-expanded',String(open))})}
  }
  function scan(){
    ensureStyle();
    document.querySelectorAll('header').forEach(header=>{patchDesktop(header);patchNativeMobile(header)});
    setTimeout(()=>document.querySelectorAll('header').forEach(header=>{patchNativeMobile(header);ensureFallbackMobile(header)}),350);
  }
  document.addEventListener('click',e=>{
    document.querySelectorAll('.dd-explore-nav.dd-open').forEach(w=>{if(!w.contains(e.target)){w.classList.remove('dd-open');w.querySelector('.dd-explore-trigger')?.setAttribute('aria-expanded','false')}});
    document.querySelectorAll('header.dd-explore-fallback-open').forEach(h=>{if(!h.contains(e.target)){h.classList.remove('dd-explore-fallback-open');h.querySelector('.dd-explore-fallback-btn')?.setAttribute('aria-expanded','false')}});
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelectorAll('.dd-explore-nav.dd-open').forEach(w=>{w.classList.remove('dd-open');w.querySelector('.dd-explore-trigger')?.setAttribute('aria-expanded','false')});document.querySelectorAll('.dd-explore-mobile-row.dd-open').forEach(r=>{r.classList.remove('dd-open');r.querySelector('button')?.setAttribute('aria-expanded','false')})}});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan,{once:true});else scan();
  let queued=false;const obs=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;scan()})});obs.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(scan,100);setTimeout(scan,700);setTimeout(scan,1600);
})();
