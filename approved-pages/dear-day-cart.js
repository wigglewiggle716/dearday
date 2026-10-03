(function(){
  function ddHasStoredSession(){try{for(const store of [localStorage,sessionStorage]){for(let i=0;i<store.length;i++){const k=String(store.key(i)||'');if(!/^sb-.*-auth-token$/i.test(k))continue;const raw=String(store.getItem(k)||'');if(raw.includes('access_token')&&raw.includes('user'))return true}}}catch(e){}return false}
  if(ddHasStoredSession()){document.documentElement.classList.add('dd-auth-session-hint');const st=document.createElement('style');st.id='dd-auth-session-hint-style';st.textContent='.dd-auth-session-hint header a.dd-auth,.dd-auth-session-hint header a.header-auth,.dd-auth-session-hint header a.auth-link,.dd-auth-session-hint header a[href*=\"Dear-Day-Auth\"]{visibility:hidden!important;pointer-events:none!important}';(document.head||document.documentElement).appendChild(st)}
  const KEY='dearDayCart';

  function ensureNativeMobileNav(){
    if(document.querySelector('script[data-dd-native-mobile-nav]'))return;
    const s=document.createElement('script');
    s.src='/approved-pages/dear-day-mobile-nav.js?v=20261003-7';
    s.defer=true;
    s.setAttribute('data-dd-native-mobile-nav','');
    (document.head||document.documentElement).appendChild(s);
  }
  ensureNativeMobileNav();

  function ensureCustomerAvailability(){
    if(document.querySelector('script[data-dd-customer-availability]'))return;
    const s=document.createElement('script');
    s.src='/approved-pages/dear-day-customer-availability.js?v=20261002-1';
    s.defer=true;
    s.setAttribute('data-dd-customer-availability','');
    (document.head||document.documentElement).appendChild(s);
  }
  ensureCustomerAvailability();

  function ensureCustomerRefundPolicy(){
    if(document.querySelector('script[data-dd-customer-refund]'))return;
    const s=document.createElement('script');
    s.src='/approved-pages/dear-day-customer-refund.js?v=20261002-1';
    s.defer=true;
    s.setAttribute('data-dd-customer-refund','');
    (document.head||document.documentElement).appendChild(s);
  }
  ensureCustomerRefundPolicy();

  function ensureHomeCategories(){
    const p=String(location.pathname||'/');
    if(!(p==='/'||/\/index(?:-en)?\.html$/i.test(p)))return;
    if(document.querySelector('script[data-dd-home-categories]'))return;
    const s=document.createElement('script');
    s.src='/approved-pages/dear-day-home-categories.js?v=20261003-4';
    s.defer=true;
    s.setAttribute('data-dd-home-categories','');
    (document.head||document.documentElement).appendChild(s);
  }
  ensureHomeCategories();

  function ensureLiveCatalog(){
    const p=String(location.pathname||'');
    if(!/\/approved-pages\/Dear-Day-(Gifts|Cake|Flowers)-Approved(?:-en)?\.html$/i.test(p))return;
    if(document.querySelector('script[data-dd-live-catalog]'))return;
    const s=document.createElement('script');
    s.src='/approved-pages/dear-day-live-catalog.js?v=20261003-2';
    s.defer=true;
    s.setAttribute('data-dd-live-catalog','');
    (document.head||document.documentElement).appendChild(s);
  }
  ensureLiveCatalog();

  function isEnglishPage(){
    return String(document.documentElement.lang||'').toLowerCase().startsWith('en')||document.body?.dir==='ltr';
  }
  function cartUrl(){return isEnglishPage()?'/approved-pages/Dear-Day-Cart-en.html':'/approved-pages/Dear-Day-Cart.html';}
  function cartCount(){try{const items=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(items)?items.length:0}catch(e){return 0}}

  function patchEnglishAuthLinks(){
    if(!isEnglishPage())return;
    document.querySelectorAll('a').forEach(a=>{
      const t=String(a.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
      if(t==='log in'||t==='login'||t==='sign in')a.href='/Dear-Day-Auth-en.html#login';
      if(t==='create account'||t==='create an account'||t==='sign up')a.href='/Dear-Day-Auth-en.html#signup';
    });
  }

  function patchGiftLanguageLinks(){
    const path=String(location.pathname||'');
    if(/\/approved-pages\/Dear-Day-Gifts-Approved\.html$/i.test(path)){
      document.querySelectorAll('a.lang-link,a.dd-language-switch').forEach(a=>{
        a.href='/approved-pages/Dear-Day-Gifts-Approved-en.html';
        a.removeAttribute('onclick');
        a.setAttribute('aria-label','English');
        if(!String(a.textContent||'').trim())a.textContent='EN';
      });
    }
    if(isEnglishPage()){
      document.querySelectorAll('a[href]').forEach(a=>{
        const raw=a.getAttribute('href')||'';
        if(raw==='/approved-pages/Dear-Day-Gifts-Approved.html')a.href='/approved-pages/Dear-Day-Gifts-Approved-en.html';
        if(raw==='/approved-pages/Dear-Day-Gifts-Approved.html?standalone=1')a.href='/approved-pages/Dear-Day-Gifts-Approved-en.html?standalone=1';
      });
    }
  }

  function patchLegalFooterLinks(){
    if(isEnglishPage())return;
    document.querySelectorAll('.footer-bottom div').forEach(el=>{
      const t=String(el.textContent||'').replace(/\s+/g,' ').trim();
      if(t==='سياسة الخصوصية · الشروط والأحكام'){
        el.classList.add('dd-legal-links');
        el.innerHTML='<a href="/approved-pages/Dear-Day-Privacy.html">سياسة الخصوصية</a><span aria-hidden="true"> · </span><a href="/approved-pages/Dear-Day-Terms.html">الشروط والأحكام</a>';
      }
    });
  }

  function patchRefundPolicyLink(){
    const english=isEnglishPage();
    document.querySelectorAll('.footer-top>div').forEach(col=>{
      const heading=String(col.querySelector('h4')?.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
      const isSupport=english ? (heading==='customer service'||heading.includes('customer service')) : heading==='خدمة العملاء';
      if(!isSupport)return;
      const href=english?'/approved-pages/Dear-Day-Refunds-en.html':'/approved-pages/Dear-Day-Refunds.html';
      if(col.querySelector(`a[href=\"${href}\"]`))return;
      const link=document.createElement('a');
      link.href=href;
      link.textContent=english?'Cancellation & Refund Policy':'سياسة الإلغاء والاسترداد';
      col.appendChild(link);
    });
  }

  function patchReviewConsent(){
    const path=String(location.pathname||'');
    const isArReview=/\/approved-pages\/Dear-Day-Review\.html$/i.test(path);
    const isEnReview=/\/approved-pages\/Dear-Day-Review-en\.html$/i.test(path);
    if(!isArReview&&!isEnReview)return;
    const payBtn=document.getElementById('payBtn');
    if(!payBtn||document.getElementById('ddBookingConsent')||document.getElementById('bookingConsent')||document.getElementById('bookingConsentCheck'))return;

    const english=isEnReview||isEnglishPage();
    const label=document.createElement('label');
    label.id='ddBookingConsent';
    label.className='dd-booking-consent';
    label.innerHTML=english
      ? '<input id="ddBookingConsentCheck" type="checkbox" required><span>I agree to the <a href="/approved-pages/Dear-Day-Terms.html" target="_blank" rel="noopener">Terms & Conditions</a> and <a href="/approved-pages/Dear-Day-Refunds-en.html" target="_blank" rel="noopener">Cancellation & Refund Policy</a> before continuing to payment.</span>'
      : '<input id="ddBookingConsentCheck" type="checkbox" required><span>أوافق على <a href="/approved-pages/Dear-Day-Terms.html" target="_blank" rel="noopener">الشروط والأحكام</a> و<a href="/approved-pages/Dear-Day-Refunds.html" target="_blank" rel="noopener">سياسة الإلغاء والاسترداد</a> قبل المتابعة للدفع.</span>';
    payBtn.parentNode.insertBefore(label,payBtn);

    const box=label.querySelector('input');
    const original=payBtn.onclick;
    payBtn.disabled=true;
    payBtn.setAttribute('aria-disabled','true');

    function syncConsent(){
      const ok=box.checked;
      payBtn.disabled=!ok;
      payBtn.setAttribute('aria-disabled',ok?'false':'true');
      label.classList.toggle('dd-consent-error',!ok&&label.dataset.touched==='1');
      const warning=document.getElementById('reviewWarning');
      if(ok&&warning){
        const consentText=english?'agree to the terms':'وافق على الشروط';
        if(String(warning.textContent||'').toLowerCase().includes(consentText.toLowerCase()))warning.style.display='none';
      }
    }

    payBtn.onclick=function(e){
      if(!box.checked){
        if(e)e.preventDefault();
        label.dataset.touched='1';
        label.classList.add('dd-consent-error');
        box.focus();
        const warning=document.getElementById('reviewWarning');
        if(warning){
          warning.style.display='block';
          warning.textContent=english
            ? 'Please agree to the Terms & Conditions and Cancellation & Refund Policy before continuing to payment.'
            : 'وافق على الشروط والأحكام وسياسة الإلغاء والاسترداد قبل المتابعة للدفع.';
        }
        return false;
      }
      if(typeof original==='function')return original.call(this,e);
    };

    box.addEventListener('change',()=>{
      label.dataset.touched='1';
      syncConsent();
    });
    syncConsent();
  }

  function patchPage(){
    patchEnglishAuthLinks();
    patchGiftLanguageLinks();
    patchLegalFooterLinks();
    patchRefundPolicyLink();
    patchReviewConsent();
    document.querySelectorAll('.dd-mobile-menu-toggle,.dd-mobile-menu').forEach(el=>el.remove());
    document.querySelectorAll('header').forEach(h=>{h.classList.remove('dd-mobile-menu-open');h.removeAttribute('data-dd-mobile-menu-ready');});
  }

  function ensureStyle(){
    if(document.getElementById('dd-cart-bootstrap-style'))return;
    const style=document.createElement('style');
    style.id='dd-cart-bootstrap-style';
    style.textContent=`
      .dd-mobile-menu-toggle,.dd-mobile-menu{display:none!important}
      #ddFloatingCart{position:fixed!important;left:24px!important;right:auto!important;bottom:24px!important;z-index:2147483000!important;width:58px!important;height:58px!important;border-radius:50%!important;display:flex!important;align-items:center!important;justify-content:center!important;background:#6B3540!important;color:#fff!important;text-decoration:none!important;box-shadow:0 12px 30px rgba(79,18,34,.28)!important;border:2px solid rgba(255,255,255,.92)!important;opacity:1!important;visibility:visible!important;transform:none!important;pointer-events:auto!important}
      #ddFloatingCart svg{width:25px!important;height:25px!important;display:block!important;fill:none!important;stroke:currentColor!important;stroke-width:1.9!important;stroke-linecap:round!important;stroke-linejoin:round!important}
      #ddFloatingCart .dd-float-count{position:absolute!important;top:-6px!important;right:-5px!important;min-width:23px!important;height:23px!important;padding:0 6px!important;border-radius:999px!important;background:#f6d86b!important;color:#6B3540!important;place-items:center!important;font:700 11px/1 Arial,sans-serif!important;border:2px solid #fff!important}
      #ddFloatingCart .dd-float-label{display:none!important}
      #ddBackToTop{position:fixed!important;right:24px!important;left:auto!important;bottom:24px!important;z-index:2147483000!important;width:58px!important;height:58px!important;border-radius:50%!important;border:2px solid rgba(255,255,255,.92)!important;display:grid!important;place-items:center!important;background:#6B3540!important;color:#fff!important;box-shadow:0 12px 30px rgba(79,18,34,.24)!important;cursor:pointer!important;opacity:0!important;visibility:hidden!important;transform:translateY(10px)!important;pointer-events:none!important;transition:opacity .18s ease,transform .18s ease,visibility .18s ease!important;font:700 27px/1 Arial,sans-serif!important}
      #ddBackToTop.dd-top-visible{opacity:1!important;visibility:visible!important;transform:translateY(0)!important;pointer-events:auto!important}
      .dd-booking-consent{display:flex!important;align-items:flex-start!important;gap:9px!important;margin:16px 0 4px!important;padding:12px 13px!important;border:1px solid rgba(107,53,64,.14)!important;border-radius:14px!important;background:#fffaf7!important;color:#756966!important;font-size:11px!important;line-height:1.65!important;cursor:pointer!important}
      .dd-booking-consent input{appearance:none!important;width:17px!important;height:17px!important;min-width:17px!important;margin:1px 0 0!important;border:1px solid rgba(107,53,64,.38)!important;border-radius:5px!important;background:#fff!important;display:grid!important;place-items:center!important}
      .dd-booking-consent input:checked{background:#6B3540!important;border-color:#6B3540!important}
      .dd-booking-consent input:checked:after{content:'✓'!important;color:#fff!important;font-size:11px!important;line-height:1!important}
      .dd-booking-consent a{color:#6B3540!important;font-weight:800!important;text-decoration:underline!important;text-underline-offset:2px!important}
      .dd-booking-consent.dd-consent-error{border-color:#A8583D!important;background:#fff3ed!important}
      .dd-occ-footer{background:#5D0C1D!important}
      .dd-legal-links a{color:inherit!important;text-decoration:none!important}
      .dd-legal-links a:hover{text-decoration:underline!important;text-underline-offset:3px}
      @media(max-width:700px){
        #ddFloatingCart{left:max(14px,env(safe-area-inset-left))!important;bottom:max(18px,env(safe-area-inset-bottom))!important;width:54px!important;height:54px!important}
        #ddBackToTop{right:max(14px,env(safe-area-inset-right))!important;bottom:max(18px,env(safe-area-inset-bottom))!important;width:54px!important;height:54px!important;font-size:24px!important}
      }
    `;
    (document.head||document.documentElement).appendChild(style);
  }

  function updateCart(){
    const link=document.getElementById('ddFloatingCart');if(!link)return;
    link.href=cartUrl();
    const n=cartCount(),count=link.querySelector('.dd-float-count');
    if(count){count.textContent=n;count.style.setProperty('display',n>0?'grid':'none','important');}
  }
  function updateBackToTop(){
    const btn=document.getElementById('ddBackToTop');if(!btn)return;
    const max=Math.max(0,(document.documentElement.scrollHeight||0)-window.innerHeight);
    btn.classList.toggle('dd-top-visible',max>300&&window.scrollY>=max*.5);
  }
  function mountBackToTop(){
    if(!document.body)return;
    let btn=document.getElementById('ddBackToTop');
    if(!btn){
      btn=document.createElement('button');btn.id='ddBackToTop';btn.type='button';
      btn.setAttribute('aria-label',isEnglishPage()?'Back to top':'العودة لأعلى الصفحة');
      btn.textContent='↑';
      btn.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
      document.body.appendChild(btn);
    }
    updateBackToTop();
  }
  function mount(){
    ensureStyle();patchPage();
    if(!document.body)return;
    let link=document.getElementById('ddFloatingCart');
    if(!link){
      link=document.createElement('a');link.id='ddFloatingCart';link.href=cartUrl();link.setAttribute('aria-label','My Cart');
      link.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="20" r="1"></circle><circle cx="19" cy="20" r="1"></circle><path d="M3 4h2l2.5 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6.1"></path></svg><span class="dd-float-count" data-dd-cart-count>0</span><span class="dd-float-label">My Cart</span>';
      document.body.appendChild(link);
    }
    mountBackToTop();updateCart();
  }

  ensureStyle();patchPage();
  if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount,{once:true});
  setTimeout(patchPage,0);setTimeout(patchPage,120);setTimeout(patchPage,500);setTimeout(patchPage,1200);setTimeout(patchReviewConsent,60);
  window.addEventListener('scroll',updateBackToTop,{passive:true});
  window.addEventListener('resize',updateBackToTop,{passive:true});
  window.addEventListener('storage',e=>{if(!e.key||e.key===KEY){mount();updateCart();}});
  window.addEventListener('ddcartchange',()=>{mount();updateCart();});

  const core='/approved-pages/dear-day-cart-core.js?v=20261003-2';
  if(document.readyState==='loading')document.write('<script src="'+core+'"><\/script>');
  else{const script=document.createElement('script');script.src=core;script.async=false;script.onload=patchPage;(document.head||document.documentElement).appendChild(script);}
})();