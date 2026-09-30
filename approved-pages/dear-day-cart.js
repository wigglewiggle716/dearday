(function(){
  const KEY='dearDayCart';

  function isEnglishPage(){
    return String(document.documentElement.lang||'').toLowerCase().startsWith('en')||document.body?.dir==='ltr';
  }
  function cartUrl(){
    return isEnglishPage()?'/approved-pages/Dear-Day-Cart-en.html':'/approved-pages/Dear-Day-Cart.html';
  }
  function cartCount(){
    try{
      const items=JSON.parse(localStorage.getItem(KEY)||'[]');
      return Array.isArray(items)?items.length:0;
    }catch(e){return 0}
  }

  function patchEnglishAuthLinks(){
    if(!isEnglishPage())return;
    document.querySelectorAll('a').forEach(a=>{
      const text=String(a.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
      if(text==='log in'||text==='login'||text==='sign in')a.href='/Dear-Day-Auth-en.html#login';
      if(text==='create account'||text==='create an account'||text==='sign up')a.href='/Dear-Day-Auth-en.html#signup';
    });
  }

  function patchGiftLanguageLinks(){
    const path=String(location.pathname||'');
    const isArabicGifts=/\/approved-pages\/Dear-Day-Gifts-Approved\.html$/i.test(path);
    if(isArabicGifts){
      document.querySelectorAll('a.lang-link,a.dd-language-switch').forEach(a=>{
        a.href='/approved-pages/Dear-Day-Gifts-Approved-en.html';
        a.removeAttribute('onclick');
        a.setAttribute('aria-label','English');
        if(String(a.textContent||'').trim()==='')a.textContent='EN';
      });
    }
    if(isEnglishPage()){
      document.querySelectorAll('a[href]').forEach(a=>{
        const raw=a.getAttribute('href')||'';
        if(raw==='/approved-pages/Dear-Day-Gifts-Approved.html')a.setAttribute('href','/approved-pages/Dear-Day-Gifts-Approved-en.html');
        if(raw==='/approved-pages/Dear-Day-Gifts-Approved.html?standalone=1')a.setAttribute('href','/approved-pages/Dear-Day-Gifts-Approved-en.html?standalone=1');
      });
    }
  }

  function patchLegalFooterLinks(){
    if(isEnglishPage())return;
    document.querySelectorAll('.footer-bottom div').forEach(el=>{
      const text=String(el.textContent||'').replace(/\s+/g,' ').trim();
      if(text!=='سياسة الخصوصية · الشروط والأحكام')return;
      el.classList.add('dd-legal-links');
      el.innerHTML='<a href="/approved-pages/Dear-Day-Privacy.html">سياسة الخصوصية</a><span aria-hidden="true"> · </span><a href="/approved-pages/Dear-Day-Terms.html">الشروط والأحكام</a>';
    });
  }

  function patchRefundPolicyLink(){
    if(isEnglishPage())return;
    document.querySelectorAll('.footer-top>div').forEach(col=>{
      const heading=String(col.querySelector('h4')?.textContent||'').replace(/\s+/g,' ').trim();
      if(heading!=='خدمة العملاء')return;
      if(col.querySelector('a[href="/approved-pages/Dear-Day-Refunds.html"]'))return;
      const link=document.createElement('a');
      link.href='/approved-pages/Dear-Day-Refunds.html';
      link.textContent='سياسة الإلغاء والاسترداد';
      col.appendChild(link);
    });
  }

  function patchReviewConsent(){
    if(isEnglishPage())return;
    if(!/\/approved-pages\/Dear-Day-Review\.html$/i.test(String(location.pathname||'')))return;
    const payBtn=document.getElementById('payBtn');
    if(!payBtn||document.getElementById('ddBookingConsent'))return;
    const label=document.createElement('label');
    label.id='ddBookingConsent';
    label.className='dd-booking-consent';
    label.innerHTML='<input id="ddBookingConsentCheck" type="checkbox"><span>بالمتابعة للدفع، أوافق على <a href="/approved-pages/Dear-Day-Terms.html" target="_blank" rel="noopener">الشروط والأحكام</a> و<a href="/approved-pages/Dear-Day-Refunds.html" target="_blank" rel="noopener">سياسة الإلغاء والاسترداد</a> الخاصة بالحجز.</span>';
    payBtn.parentNode.insertBefore(label,payBtn);
    const box=label.querySelector('input');
    const original=payBtn.onclick;
    payBtn.onclick=function(e){
      if(!box.checked){
        e.preventDefault();
        label.classList.add('dd-consent-error');
        box.focus();
        const warning=document.getElementById('reviewWarning');
        if(warning){warning.style.display='block';warning.textContent='وافق على الشروط وسياسة الإلغاء والاسترداد قبل المتابعة للدفع.';}
        return;
      }
      label.classList.remove('dd-consent-error');
      if(typeof original==='function')return original.call(this,e);
    };
    box.addEventListener('change',()=>{
      label.classList.toggle('dd-consent-error',!box.checked);
      if(box.checked){
        const warning=document.getElementById('reviewWarning');
        if(warning&&warning.textContent.includes('وافق على الشروط'))warning.style.display='none';
      }
    });
  }

  function isAuthPage(){
    return /\/Dear-Day-Auth(?:-en)?\.html$/i.test(String(location.pathname||''));
  }

  function mountAuthMenu(){
    if(!isAuthPage())return;
    const header=document.querySelector('.auth-header');
    const nav=header?.querySelector('.auth-nav');
    const actions=header?.querySelector('.auth-actions');
    if(!header||!nav||!actions)return;
    let btn=header.querySelector('.dd-auth-menu-toggle');
    if(!btn){
      btn=document.createElement('button');
      btn.type='button';
      btn.className='dd-auth-menu-toggle';
      btn.setAttribute('aria-expanded','false');
      btn.setAttribute('aria-label',isEnglishPage()?'Open navigation menu':'فتح قائمة التنقل');
      btn.innerHTML='<span></span><span></span><span></span>';
      actions.appendChild(btn);
      btn.addEventListener('click',e=>{
        e.stopPropagation();
        const open=!header.classList.contains('dd-auth-menu-open');
        header.classList.toggle('dd-auth-menu-open',open);
        btn.setAttribute('aria-expanded',String(open));
        btn.setAttribute('aria-label',open?(isEnglishPage()?'Close navigation menu':'إغلاق قائمة التنقل'):(isEnglishPage()?'Open navigation menu':'فتح قائمة التنقل'));
      });
      nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
        header.classList.remove('dd-auth-menu-open');
        btn.setAttribute('aria-expanded','false');
      }));
      document.addEventListener('click',e=>{
        if(!header.contains(e.target)){
          header.classList.remove('dd-auth-menu-open');
          btn.setAttribute('aria-expanded','false');
        }
      });
      window.addEventListener('resize',()=>{
        if(window.innerWidth>1120){
          header.classList.remove('dd-auth-menu-open');
          btn.setAttribute('aria-expanded','false');
        }
      },{passive:true});
    }
  }

  function patchBilingualLinks(){
    patchEnglishAuthLinks();
    patchGiftLanguageLinks();
    patchLegalFooterLinks();
    patchRefundPolicyLink();
    patchReviewConsent();
    mountAuthMenu();
  }

  function ensureStyle(){
    if(document.getElementById('dd-cart-bootstrap-style'))return;
    const style=document.createElement('style');
    style.id='dd-cart-bootstrap-style';
    style.textContent=`
      #ddFloatingCart{
        position:fixed!important;left:24px!important;right:auto!important;bottom:24px!important;z-index:2147483000!important;
        width:58px!important;height:58px!important;border-radius:50%!important;
        display:flex!important;align-items:center!important;justify-content:center!important;
        background:#6B3540!important;color:#fff!important;text-decoration:none!important;
        box-shadow:0 12px 30px rgba(79,18,34,.28)!important;
        border:2px solid rgba(255,255,255,.92)!important;
        opacity:1!important;visibility:visible!important;transform:none!important;
        pointer-events:auto!important;
      }
      #ddFloatingCart svg{width:25px!important;height:25px!important;display:block!important;fill:none!important;stroke:currentColor!important;stroke-width:1.9!important;stroke-linecap:round!important;stroke-linejoin:round!important}
      #ddFloatingCart .dd-float-count{
        position:absolute!important;top:-6px!important;right:-5px!important;min-width:23px!important;height:23px!important;padding:0 6px!important;
        border-radius:999px!important;background:#f6d86b!important;color:#6B3540!important;
        place-items:center!important;font:700 11px/1 Arial,sans-serif!important;border:2px solid #fff!important;
      }
      #ddFloatingCart .dd-float-label{display:none!important}
      #ddBackToTop{
        position:fixed!important;right:24px!important;left:auto!important;bottom:24px!important;z-index:2147483000!important;
        width:58px!important;height:58px!important;border-radius:50%!important;border:2px solid rgba(255,255,255,.92)!important;
        display:grid!important;place-items:center!important;background:#6B3540!important;color:#fff!important;
        box-shadow:0 12px 30px rgba(79,18,34,.24)!important;cursor:pointer!important;
        opacity:0!important;visibility:hidden!important;transform:translateY(10px)!important;pointer-events:none!important;
        transition:opacity .18s ease,transform .18s ease,visibility .18s ease!important;font:700 27px/1 Arial,sans-serif!important;
      }
      #ddBackToTop.dd-top-visible{opacity:1!important;visibility:visible!important;transform:translateY(0)!important;pointer-events:auto!important}
      #ddBackToTop:focus-visible{outline:3px solid #A8583D!important;outline-offset:3px!important}
      .dd-booking-consent{display:flex!important;align-items:flex-start!important;gap:9px!important;margin:16px 0 4px!important;padding:12px 13px!important;border:1px solid rgba(107,53,64,.14)!important;border-radius:14px!important;background:#fffaf7!important;color:#756966!important;font-size:11px!important;line-height:1.65!important;cursor:pointer!important}
      .dd-booking-consent input{appearance:none!important;width:17px!important;height:17px!important;min-width:17px!important;margin:1px 0 0!important;border:1px solid rgba(107,53,64,.38)!important;border-radius:5px!important;background:#fff!important;display:grid!important;place-items:center!important}
      .dd-booking-consent input:checked{background:#6B3540!important;border-color:#6B3540!important}.dd-booking-consent input:checked:after{content:'✓'!important;color:#fff!important;font-size:11px!important;line-height:1!important}
      .dd-booking-consent a{color:#6B3540!important;font-weight:800!important;text-decoration:underline!important;text-underline-offset:2px!important}.dd-booking-consent.dd-consent-error{border-color:#A8583D!important;background:#fff3ed!important}
      .dd-auth-menu-toggle{display:none;border:1px solid rgba(107,53,64,.24);background:#fffaf7;width:40px;height:40px;border-radius:12px;padding:0;align-items:center;justify-content:center;flex-direction:column;gap:4px;color:#6B3540}
      .dd-auth-menu-toggle span{display:block;width:18px;height:2px;border-radius:2px;background:currentColor;transition:transform .18s ease,opacity .18s ease}
      .dd-auth-menu-open .dd-auth-menu-toggle span:nth-child(1){transform:translateY(6px) rotate(45deg)}
      .dd-auth-menu-open .dd-auth-menu-toggle span:nth-child(2){opacity:0}
      .dd-auth-menu-open .dd-auth-menu-toggle span:nth-child(3){transform:translateY(-6px) rotate(-45deg)}
      .dd-occ-footer{background:#5D0C1D!important}
      .dd-legal-links a{color:inherit!important;text-decoration:none!important}
      .dd-legal-links a:hover{text-decoration:underline!important;text-underline-offset:3px}
      @media(max-width:1120px){
        .auth-header{grid-template-columns:auto 1fr!important;min-height:72px!important;padding:8px 14px!important;position:sticky!important}
        .auth-header .auth-brand img{width:128px!important;height:52px!important}
        .auth-header .auth-actions{justify-content:flex-end!important;gap:8px!important}
        .auth-header .header-auth{display:none!important}
        .auth-header .dd-auth-menu-toggle{display:flex!important}
        .auth-header .auth-nav{display:none!important;position:absolute!important;top:calc(100% + 1px)!important;left:14px!important;right:14px!important;z-index:80!important;background:#FFFDFC!important;border:1px solid rgba(107,53,64,.14)!important;border-radius:18px!important;box-shadow:0 18px 42px rgba(78,32,39,.12)!important;padding:10px!important;white-space:normal!important;gap:2px!important}
        .auth-header.dd-auth-menu-open .auth-nav{display:flex!important;flex-direction:column!important;align-items:stretch!important}
        .auth-header .auth-nav a{display:block!important;width:100%!important;padding:12px 14px!important;border-radius:11px!important;text-align:start!important}
        .auth-header .auth-nav a:hover{background:#F6E7E1!important}
        .auth-header .auth-nav a:after{display:none!important}
      }
      @media(max-width:700px){
        #ddFloatingCart{left:max(14px,env(safe-area-inset-left))!important;bottom:max(18px,env(safe-area-inset-bottom))!important;width:54px!important;height:54px!important}
        #ddBackToTop{right:max(14px,env(safe-area-inset-right))!important;bottom:max(18px,env(safe-area-inset-bottom))!important;width:54px!important;height:54px!important;font-size:24px!important}
      }
    `;
    (document.head||document.documentElement).appendChild(style);
  }

  function update(){
    const link=document.getElementById('ddFloatingCart');
    if(!link)return;
    link.href=cartUrl();
    link.classList.add('dd-cart-visible');
    link.setAttribute('aria-hidden','false');
    link.tabIndex=0;
    const n=cartCount();
    const count=link.querySelector('.dd-float-count');
    if(count){
      count.textContent=n;
      count.style.setProperty('display',n>0?'grid':'none','important');
    }
  }

  function updateBackToTop(){
    const btn=document.getElementById('ddBackToTop');
    if(!btn)return;
    const doc=document.documentElement;
    const maxScroll=Math.max(0,(doc.scrollHeight||0)-window.innerHeight);
    const threshold=maxScroll*.5;
    btn.classList.toggle('dd-top-visible',maxScroll>300&&window.scrollY>=threshold);
  }

  function mountBackToTop(){
    if(!document.body)return null;
    let btn=document.getElementById('ddBackToTop');
    if(!btn){
      btn=document.createElement('button');
      btn.id='ddBackToTop';
      btn.type='button';
      btn.setAttribute('aria-label',isEnglishPage()?'Back to top':'العودة لأعلى الصفحة');
      btn.textContent='↑';
      btn.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
      document.body.appendChild(btn);
    }
    updateBackToTop();
    return btn;
  }

  function mount(){
    ensureStyle();
    patchBilingualLinks();
    if(!document.body)return null;
    let link=document.getElementById('ddFloatingCart');
    if(!link){
      link=document.createElement('a');
      link.id='ddFloatingCart';
      link.className='dd-cart-visible';
      link.href=cartUrl();
      link.setAttribute('aria-label','My Cart');
      link.innerHTML=`
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="20" r="1"></circle><circle cx="19" cy="20" r="1"></circle><path d="M3 4h2l2.5 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6.1"></path></svg>
        <span class="dd-float-count" data-dd-cart-count>0</span>
        <span class="dd-float-label">My Cart</span>`;
      document.body.appendChild(link);
    }
    mountBackToTop();
    update();
    return link;
  }

  ensureStyle();
  patchBilingualLinks();
  if(document.body)mount();
  else document.addEventListener('DOMContentLoaded',()=>{mount();patchBilingualLinks()},{once:true});
  setTimeout(()=>{patchBilingualLinks();mountBackToTop();updateBackToTop();mountAuthMenu()},0);
  setTimeout(patchReviewConsent,60);
  window.addEventListener('scroll',updateBackToTop,{passive:true});
  window.addEventListener('resize',updateBackToTop,{passive:true});
  window.addEventListener('storage',function(e){if(!e.key||e.key===KEY){mount();update();}});
  window.addEventListener('ddcartchange',function(){mount();update();});

  const core='/approved-pages/dear-day-cart-core.js?v=20260930-5';
  if(document.readyState==='loading'){
    document.write('<script src="'+core+'"></script>');
  }else{
    const script=document.createElement('script');
    script.src=core;
    script.async=false;
    script.onload=patchBilingualLinks;
    (document.head||document.documentElement).appendChild(script);
  }
})();