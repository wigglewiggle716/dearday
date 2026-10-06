(function(){
  function ddHasStoredSession(){try{for(const store of [localStorage,sessionStorage]){for(let i=0;i<store.length;i++){const k=String(store.key(i)||'');if(!/^sb-.*-auth-token$/i.test(k))continue;const raw=String(store.getItem(k)||'');if(raw.includes('access_token')&&raw.includes('user'))return true}}}catch(e){}return false}
  if(ddHasStoredSession()){document.documentElement.classList.add('dd-auth-session-hint');const st=document.createElement('style');st.id='dd-auth-session-hint-style';st.textContent='.dd-auth-session-hint header a.dd-auth,.dd-auth-session-hint header a.header-auth,.dd-auth-session-hint header a.auth-link,.dd-auth-session-hint header a[href*=\"Dear-Day-Auth\"]{visibility:hidden!important;pointer-events:none!important}';(document.head||document.documentElement).appendChild(st)}
  const KEY='dearDayCart';

  function ensureBrandedFormControls(){
    const p=String(location.pathname||'/');
    if(p==='/'||/\/index(?:-en)?\.html$/i.test(p))return;
    if(!document.querySelector('link[data-dd-form-controls]')){
      const l=document.createElement('link');
      l.rel='stylesheet';
      l.href='/approved-pages/assets/dear-day-form-controls.css?v=20261004-2';
      l.setAttribute('data-dd-form-controls','');
      (document.head||document.documentElement).appendChild(l);
    }
    if(!document.querySelector('script[data-dd-form-controls]')){
      const s=document.createElement('script');
      s.src='/approved-pages/dear-day-form-controls.js?v=20261004-2';
      s.defer=true;
      s.setAttribute('data-dd-form-controls','');
      (document.head||document.documentElement).appendChild(s);
    }
  }
  ensureBrandedFormControls();

  function ensureNativeMobileNav(){
    if(document.querySelector('script[data-dd-native-mobile-nav]'))return;
    const s=document.createElement('script');
    s.src='/approved-pages/dear-day-mobile-nav.js?v=20261006-static1';
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
    s.src='/approved-pages/dear-day-home-categories.js?v=20261006-ops01';
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
    s.src='/approved-pages/dear-day-live-catalog.js?v=20261006-ops01';
    s.defer=true;
    s.setAttribute('data-dd-live-catalog','');
    (document.head||document.documentElement).appendChild(s);
  }
  ensureLiveCatalog();

  function isEnglishPage(){
    return String(document.documentElement.lang||'').toLowerCase().startsWith('en')||document.body?.dir==='ltr';
  }
  function cartUrl(){return isEnglishPage()?'/cart-en':'/cart';}
  function cartCount(){try{const items=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(items)?items.length:0}catch(e){return 0}}

  function patchEnglishAuthLinks(){
    if(!isEnglishPage())return;
    document.querySelectorAll('a').forEach(a=>{
      const t=String(a.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
      if(t==='log in'||t==='login'||t==='sign in')a.href='/auth-en#login';
      if(t==='create account'||t==='create an account'||t==='sign up')a.href='/auth-en#signup';
    });
  }

  function patchGiftLanguageLinks(){
    const path=String(location.pathname||'');
    if(/\/approved-pages\/Dear-Day-Gifts-Approved\.html$/i.test(path)){
      document.querySelectorAll('a.lang-link,a.dd-language-switch').forEach(a=>{
        a.href='/gifts-en';
        a.removeAttribute('onclick');
        a.setAttribute('aria-label','English');
        if(!String(a.textContent||'').trim())a.textContent='EN';
      });
    }
    if(isEnglishPage()){
      document.querySelectorAll('a[href]').forEach(a=>{
        const raw=a.getAttribute('href')||'';
        if(raw==='/gifts')a.href='/gifts-en';
        if(raw==='/gifts')a.href='/gifts-en';
      });
    }
  }

  function normalizeLegalFooter(){
    const path=String(location.pathname||'');
    const legal=/\/approved-pages\/Dear-Day-(Privacy|Terms|Refunds|Data-Deletion)(?:-en)?\.html$/i.test(path);
    if(!legal)return;
    const english=isEnglishPage();
    document.querySelectorAll('footer,.dd-occ-footer').forEach(footer=>{
      footer.classList.add('dd-occ-footer','dd-unified-legal-footer');
      footer.innerHTML=`<div class="dd-footer-wrap">
        <div class="footer-top">
          <div class="footer-brand"><a class="footer-logo" href="${english?'/en':'/'}"><img src="/approved-pages/assets/dear-day-wordmark.svg" alt="Dear Day"></a><p class="footer-note">${english?'Every detail, one place.':'كل تفصيلة في مكان واحد.'}</p></div>
          <div><h4>${english?'Dear Day Services':'خدمات Dear Day'}</h4><a href="${english?'/gifts-en':'/gifts'}">${english?'Gifts':'الهدايا'}</a><a href="${english?'/cake-en':'/cake'}">${english?'Cake & Sweets':'كيك وحلويات'}</a><a href="${english?'/flowers-en':'/flowers'}">${english?'Flowers':'الورد'}</a><a href="${english?'/venues-en':'/venues'}">${english?'Places & Experiences':'أماكن وتجارب'}</a></div>
          <div><h4>${english?'Customer Care':'خدمة العملاء'}</h4><a href="${english?'/faq-en':'/faq'}">${english?'FAQs':'الأسئلة الشائعة'}</a><a href="${english?'/contact-en':'/contact'}">${english?'Contact Us':'تواصل معنا'}</a><a href="${english?'/refunds-en':'/refunds'}">${english?'Cancellation & Refund Policy':'سياسة الإلغاء والاسترداد'}</a><a href="${english?'/delete-account-en':'/delete-account'}">${english?'Account & Data Deletion':'حذف الحساب والبيانات'}</a></div>
          <div><h4>${english?'Legal':'القانوني'}</h4><a href="${english?'/privacy-en':'/privacy'}">${english?'Privacy Policy':'سياسة الخصوصية'}</a><a href="${english?'/terms-en':'/terms'}">${english?'Terms & Conditions':'الشروط والأحكام'}</a></div>
        </div>
        <div class="dd-payment-footer"><h4>${english?'Payment Methods':'وسائل الدفع'}</h4><div class="dd-payment-icons" aria-label="${english?'Accepted payment methods':'وسائل الدفع المقبولة'}"><span class="dd-pay-card dd-pay-visa" aria-label="Visa">VISA</span><span class="dd-pay-card dd-pay-master" aria-label="Mastercard"><i></i><b></b></span><span class="dd-pay-card dd-pay-apple" aria-label="Apple Pay"><span class="dd-apple">●</span><strong>Pay</strong></span><span class="dd-pay-card dd-pay-google" aria-label="Google Pay"><strong>G</strong><span>Pay</span></span><span class="dd-pay-card dd-pay-wallet" aria-label="Wallet"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.5h14a2 2 0 0 1 2 2v8H4a2 2 0 0 1-2-2v-11A2 2 0 0 1 4 2.5h12v3H4a1 1 0 0 0 0 2z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="16.5" cy="12.5" r="1" fill="currentColor"/></svg></span></div></div>
        <div class="footer-bottom"><span>© 2026 Dear Day</span><span class="dd-legal-links"><a href="${english?'/privacy-en':'/privacy'}">${english?'Privacy Policy':'سياسة الخصوصية'}</a><span aria-hidden="true"> · </span><a href="${english?'/terms-en':'/terms'}">${english?'Terms & Conditions':'الشروط والأحكام'}</a></span></div>
      </div>`;
    });
  }

  function patchLegalFooterLinks(){
    const english=isEnglishPage();
    document.querySelectorAll('footer,.dd-occ-footer').forEach(footer=>{
      footer.querySelectorAll('a').forEach(a=>{
        const t=String(a.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
        if(english&&t==='privacy policy')a.href='/privacy-en';
        if(english&&(t==='terms & conditions'||t==='terms and conditions'))a.href='/terms-en';
        if(!english&&t==='سياسة الخصوصية')a.href='/privacy';
        if(!english&&t==='الشروط والأحكام')a.href='/terms';
      });
      footer.querySelectorAll('.footer-bottom div,.footer-bottom span').forEach(el=>{
        const t=String(el.textContent||'').replace(/\s+/g,' ').trim();
        if(english&&/^Privacy Policy\s*[·|•-]\s*Terms & Conditions$/i.test(t)){
el.classList.add('dd-legal-links');el.innerHTML='<a href="/privacy-en">Privacy Policy</a><span aria-hidden="true"> · </span><a href="/terms-en">Terms & Conditions</a>';
        }
        if(!english&&t==='سياسة الخصوصية · الشروط والأحكام'){
el.classList.add('dd-legal-links');el.innerHTML='<a href="/privacy">سياسة الخصوصية</a><span aria-hidden="true"> · </span><a href="/terms">الشروط والأحكام</a>';
        }
      });
    });
  }

  function patchLegalLanguageSwitch(){
    const p=String(location.pathname||'');
    const map={
      '/privacy':['/privacy-en','EN','English'],
      '/privacy-en':['/privacy','AR','العربية'],
      '/terms':['/terms-en','EN','English'],
      '/terms-en':['/terms','AR','العربية']
    };
    const item=map[p];if(!item)return;
    const host=document.querySelector('.auth-actions')||document.querySelector('header');if(!host||host.querySelector('[data-dd-legal-lang],.dd-lang'))return;
    const a=document.createElement('a');a.href=item[0];a.textContent=item[1];a.setAttribute('aria-label',item[2]);a.setAttribute('data-dd-legal-lang','');a.className='lang-link';
    host.appendChild(a);
  }

  function patchRefundPolicyLink(){
    const english=isEnglishPage();
    document.querySelectorAll('.footer-top>div').forEach(col=>{
      const heading=String(col.querySelector('h4')?.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
      const isSupport=english ? (heading==='customer service'||heading.includes('customer service')||heading==='customer care'||heading.includes('customer care')) : heading==='خدمة العملاء';
      if(!isSupport)return;
      const href=english?'/refunds-en':'/refunds';
      if(col.querySelector(`a[href=\"${href}\"]`))return;
      const link=document.createElement('a');
      link.href=href;
      link.textContent=english?'Cancellation & Refund Policy':'سياسة الإلغاء والاسترداد';
      col.appendChild(link);
    });
  }

  function patchAccountDeletionLink(){
    const english=isEnglishPage();
    document.querySelectorAll('.footer-top>div').forEach(col=>{
      const heading=String(col.querySelector('h4')?.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
      const isSupport=english ? (heading==='customer service'||heading.includes('customer service')||heading==='customer care'||heading.includes('customer care')) : heading==='خدمة العملاء';
      if(!isSupport)return;
      const href=english?'/delete-account-en':'/delete-account';
      if(col.querySelector(`a[href=\"${href}\"]`))return;
      const link=document.createElement('a');
      link.href=href;
      link.textContent=english?'Account & Data Deletion':'حذف الحساب والبيانات';
      col.appendChild(link);
    });
  }

  function patchSocialFooter(){
    const english=isEnglishPage();
    const icons={
      facebook:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.7 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5H17V4c-.3 0-1.5-.1-2.7-.1-2.7 0-4.5 1.6-4.5 4.6V10H7.2v3h2.6v8h3.9z"/></svg>',
      instagram:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.4" cy="6.8" r="1.05" fill="currentColor"/></svg>',
      x:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5.1 4h3.4l4.2 5.6L17.5 4h1.4l-5.6 6.6L19.2 20h-3.4l-4.6-6.1L6 20H4.6l5.9-7.1L5.1 4zm2.2 1.1 9 13.8h1.8L9.1 5.1H7.3z"/></svg>',
      youtube:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21 8.2c-.2-1.4-1.1-2.4-2.4-2.6C16.7 5.3 14.8 5.2 12 5.2s-4.7.1-6.6.4C4.1 5.8 3.2 6.8 3 8.2c-.2 1-.3 2.2-.3 3.8s.1 2.8.3 3.8c.2 1.4 1.1 2.4 2.4 2.6 1.9.3 3.8.4 6.6.4s4.7-.1 6.6-.4c1.3-.2 2.2-1.2 2.4-2.6.2-1 .3-2.2.3-3.8s-.1-2.8-.3-3.8zM10.1 15.5v-7l5.6 3.5-5.6 3.5z"/></svg>',
      snapchat:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3.2c-3 0-5 2.2-5 5.4 0 1.7.2 3.1-.3 4.1-.4.8-1.1 1.3-2.2 1.7-.8.2-1 1.2-.2 1.7.9.5 1.8.5 2.4 1.6.7 1.3 1.6 2.1 3.1 2.1.7 0 1.3-.2 2.2-.2s1.5.2 2.2.2c1.5 0 2.4-.8 3.1-2.1.6-1.1 1.5-1.1 2.4-1.6.8-.5.6-1.5-.2-1.7-1.1-.4-1.8-.9-2.2-1.7-.5-1-.3-2.4-.3-4.1 0-3.2-2-5.4-5-5.4z"/></svg>',
      linkedin:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.2 8.2H3.3V21h2.9V8.2zM4.8 3A1.8 1.8 0 1 0 4.8 6.6 1.8 1.8 0 0 0 4.8 3zM20.7 13.6c0-3.9-2.1-5.7-4.8-5.7-2.2 0-3.2 1.2-3.8 2.1V8.2H9.2V21h2.9v-6.4c0-1.7.3-3.3 2.4-3.3 2 0 2.1 1.9 2.1 3.4V21h2.9v-7.4z"/></svg>'
    };
    const platforms=[['facebook','Facebook'],['instagram','Instagram'],['x','X'],['youtube','YouTube'],['snapchat','Snapchat'],['linkedin','LinkedIn']];
    document.querySelectorAll('footer,.dd-occ-footer').forEach(footer=>{
      footer.querySelectorAll('.dd-social-footer,.footer-social').forEach(el=>el.remove());
      const host=footer.querySelector('.footer-top')||footer.querySelector('.wrap')||footer;
      if(!host)return;
      const social=document.createElement('div');
      social.className='dd-social-footer';
      social.innerHTML=`<h4>${english?'Social Media':'وسائل التواصل الاجتماعي'}</h4><div class="dd-social-icons" aria-label="${english?'Dear Day social media':'وسائل التواصل الاجتماعي الخاصة بـ Dear Day'}">${platforms.map(([key,label])=>`<a href="#" data-dd-social="${key}" aria-label="${label}" title="${label}">${icons[key]}</a>`).join('')}</div>`;
      host.appendChild(social);
      social.querySelectorAll('a[data-dd-social]').forEach(a=>a.addEventListener('click',e=>e.preventDefault()));
    });
  }

  function patchMobileFooterAccordion(){
    const mobile=window.matchMedia('(max-width: 620px)');
    document.querySelectorAll('footer,.dd-occ-footer').forEach(footer=>{
      const top=footer.querySelector('.footer-top');
      if(!top)return;
      [...top.children].forEach(col=>{
        if(!(col instanceof HTMLElement))return;
        if(col.classList.contains('dd-social-footer')||col.classList.contains('footer-brand')||col.querySelector('.footer-logo'))return;
        const heading=[...col.children].find(el=>el.tagName==='H4');
        if(!heading)return;
        col.classList.add('dd-mobile-footer-accordion');
        if(heading.dataset.ddAccordionReady==='1')return;
        heading.dataset.ddAccordionReady='1';
        heading.setAttribute('role','button');
        heading.setAttribute('tabindex','0');
        heading.setAttribute('aria-expanded','false');
        const toggle=()=>{
          if(!mobile.matches)return;
          const open=col.classList.toggle('dd-open');
          heading.setAttribute('aria-expanded',open?'true':'false');
        };
        heading.addEventListener('click',toggle);
        heading.addEventListener('keydown',e=>{
          if(!mobile.matches)return;
          if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}
        });
      });
    });
  }

  function patchHomePlannerSelects(){
    const p=String(location.pathname||'/');
    if(!(p==='/'||/\/index(?:-en)?\.html$/i.test(p)))return;
    const english=isEnglishPage();
    const closeAll=(except)=>document.querySelectorAll('.dd-home-select-shell.dd-open').forEach(shell=>{if(shell!==except){shell.classList.remove('dd-open');shell.querySelector('.dd-home-select-trigger')?.setAttribute('aria-expanded','false')}});

    ['area','budget'].forEach(id=>{
      const select=document.getElementById(id);
      if(!select||select.dataset.ddHomeSelectReady==='1')return;
      select.dataset.ddHomeSelectReady='1';
      select.setAttribute('data-dd-native-select','');
      select.classList.add('dd-home-select-native');

      const shell=document.createElement('span');
      shell.className='dd-home-select-shell';
      const trigger=document.createElement('button');
      trigger.type='button';
      trigger.className='dd-home-select-trigger';
      trigger.setAttribute('aria-haspopup','listbox');
      trigger.setAttribute('aria-expanded','false');
      trigger.setAttribute('aria-label',select.getAttribute('aria-label')||select.closest('label')?.textContent?.trim()||id);
      const value=document.createElement('span');
      value.className='dd-home-select-value';
      const chev=document.createElement('span');
      chev.className='dd-home-select-chevron';
      chev.setAttribute('aria-hidden','true');
      const menu=document.createElement('span');
      menu.className='dd-home-select-menu';
      menu.setAttribute('role','listbox');

      select.parentNode.insertBefore(shell,select);
      shell.appendChild(select);
      shell.appendChild(trigger);
      trigger.appendChild(value);
      trigger.appendChild(chev);
      shell.appendChild(menu);

      function sync(){
        const current=select.options[select.selectedIndex]||select.options[0];
        value.textContent=current?current.textContent.trim():'';
        trigger.disabled=!!select.disabled;
        menu.innerHTML='';
        [...select.options].forEach((opt,index)=>{
          const button=document.createElement('button');
          button.type='button';
          button.className='dd-home-select-option';
          button.textContent=opt.textContent.trim();
          button.disabled=!!opt.disabled;
          button.setAttribute('role','option');
          button.setAttribute('aria-selected',String(index===select.selectedIndex));
          button.addEventListener('click',()=>{
            if(button.disabled)return;
            select.selectedIndex=index;
            select.dispatchEvent(new Event('input',{bubbles:true}));
            select.dispatchEvent(new Event('change',{bubbles:true}));
            sync();
            shell.classList.remove('dd-open');
            trigger.setAttribute('aria-expanded','false');
            trigger.focus();
          });
          menu.appendChild(button);
        });
      }

      trigger.addEventListener('click',()=>{
        if(trigger.disabled)return;
        const open=!shell.classList.contains('dd-open');
        closeAll(open?shell:null);
        shell.classList.toggle('dd-open',open);
        trigger.setAttribute('aria-expanded',String(open));
      });
      trigger.addEventListener('keydown',e=>{
        if(e.key==='Escape'){
          shell.classList.remove('dd-open');
          trigger.setAttribute('aria-expanded','false');
        }
      });
      select.addEventListener('change',sync);
      sync();
    });

    if(document.documentElement.dataset.ddHomeSelectOutsideReady!=='1'){
      document.documentElement.dataset.ddHomeSelectOutsideReady='1';
      document.addEventListener('click',e=>{
        if(e.target.closest('.dd-home-select-shell'))return;
        closeAll(null);
      });
      document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAll(null)});
    }
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
      ? '<input id="ddBookingConsentCheck" type="checkbox" required><span>I agree to the <a href="/terms-en" target="_blank" rel="noopener">Terms & Conditions</a> and <a href="/refunds-en" target="_blank" rel="noopener">Cancellation & Refund Policy</a> before continuing to payment.</span>'
      : '<input id="ddBookingConsentCheck" type="checkbox" required><span>أوافق على <a href="/terms" target="_blank" rel="noopener">الشروط والأحكام</a> و<a href="/refunds" target="_blank" rel="noopener">سياسة الإلغاء والاسترداد</a> قبل المتابعة للدفع.</span>';
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
    patchAccountDeletionLink();
    patchSocialFooter();
    patchMobileFooterAccordion();
    patchHomePlannerSelects();
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
      .dd-unified-legal-footer{background:#5D0C1D!important;color:#f8e8eb!important;padding:52px 0 24px!important}
      .dd-unified-legal-footer .dd-footer-wrap{width:min(1180px,calc(100% - 40px))!important;margin:auto!important}
      .dd-unified-legal-footer .footer-top{display:grid!important;grid-template-columns:1.2fr repeat(3,1fr)!important;gap:40px!important}
      .dd-unified-legal-footer .footer-logo img{width:170px!important;filter:brightness(0) invert(1)!important}
      .dd-unified-legal-footer .footer-note{color:#efd9de!important;line-height:1.8!important;font-size:14px!important;max-width:330px!important;margin-top:12px!important}
      .dd-unified-legal-footer .footer-top h4,.dd-unified-legal-footer .dd-payment-footer h4{margin:0 0 16px!important;color:#fff!important;font-size:14px!important}
      .dd-unified-legal-footer .footer-top a{display:block!important;color:#efd9de!important;margin:10px 0!important;font-size:14px!important;text-decoration:none!important}
      .dd-payment-footer{grid-column:1/-1!important;width:100%!important;margin-top:24px!important;padding-top:22px!important;border-top:1px solid rgba(255,255,255,.16)!important}
      .dd-payment-icons{display:flex!important;gap:10px!important;flex-wrap:wrap!important;align-items:center!important}
      .dd-pay-card{width:74px!important;height:44px!important;border-radius:10px!important;background:#fff!important;color:#6B3540!important;display:flex!important;align-items:center!important;justify-content:center!important;position:relative!important;font-family:Arial,sans-serif!important;font-weight:800!important;box-shadow:0 2px 0 rgba(0,0,0,.03)!important}
      .dd-pay-visa{color:#1a2c83!important;font-size:18px!important;font-style:italic!important}
      .dd-pay-master i,.dd-pay-master b{width:20px!important;height:20px!important;border-radius:50%!important;position:absolute!important;top:12px!important}.dd-pay-master i{left:21px!important;background:#e6392f!important}.dd-pay-master b{left:33px!important;background:#f79e1b!important;opacity:.92!important}
      .dd-pay-apple{gap:4px!important;color:#111!important}.dd-pay-apple .dd-apple{font-size:18px!important;line-height:1!important}.dd-pay-apple strong{font-size:14px!important}
      .dd-pay-google{gap:4px!important;color:#111!important}.dd-pay-google strong{font-size:18px!important}.dd-pay-google span{font-size:14px!important;font-weight:700!important}
      .dd-pay-wallet svg{width:25px!important;height:25px!important}
      .dd-unified-legal-footer .footer-bottom{border-top:1px solid rgba(255,255,255,.25)!important;margin-top:34px!important;padding-top:20px!important;display:flex!important;justify-content:space-between!important;gap:20px!important;flex-wrap:wrap!important;color:#dcc2c8!important;font-size:13px!important}
      @media(max-width:980px){.dd-unified-legal-footer .footer-top{grid-template-columns:repeat(2,1fr)!important}}
      @media(max-width:620px){.dd-unified-legal-footer .dd-footer-wrap{width:min(100% - 24px,1180px)!important}.dd-unified-legal-footer .footer-top{grid-template-columns:1fr!important}.dd-pay-card{width:70px!important;height:42px!important}}
      .dd-legal-links a{color:inherit!important;text-decoration:none!important}
      .dd-legal-links a:hover{text-decoration:underline!important;text-underline-offset:3px}
      .dd-social-footer{grid-column:1/-1!important;width:100%!important;margin-top:24px!important;padding-top:22px!important;border-top:1px solid rgba(255,255,255,.16)!important}
      .dd-social-footer h4{margin:0 0 13px!important;color:#fff!important;font-size:14px!important;font-weight:800!important}
      .dd-social-icons{display:flex!important;align-items:center!important;gap:9px!important;flex-wrap:wrap!important}
      .dd-social-icons a{width:38px!important;height:38px!important;margin:0!important;padding:0!important;border:1px solid rgba(255,255,255,.30)!important;border-radius:50%!important;display:grid!important;place-items:center!important;color:#fff!important;background:rgba(255,255,255,.06)!important;text-decoration:none!important;transition:background .18s ease,border-color .18s ease,transform .18s ease!important;cursor:default!important}
      .dd-social-icons a:hover{background:rgba(255,255,255,.14)!important;border-color:rgba(255,255,255,.55)!important;transform:translateY(-2px)!important}
      .dd-social-icons svg{width:20px!important;height:20px!important;display:block!important;overflow:visible!important}
      .dd-social-icons a[data-dd-social="facebook"] svg{width:19px!important;height:19px!important}
      @media(max-width:620px){
        .footer-top>div.dd-mobile-footer-accordion{width:100%!important;border-bottom:1px solid rgba(255,255,255,.28)!important;padding:0!important;margin:0!important}
        .footer-top>div.dd-mobile-footer-accordion>h4{margin:0!important;padding:18px 2px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:16px!important;color:#fff!important;font-size:16px!important;font-weight:800!important;line-height:1.35!important;cursor:pointer!important;user-select:none!important;-webkit-tap-highlight-color:transparent!important}
        .footer-top>div.dd-mobile-footer-accordion>h4:after{content:''!important;display:block!important;flex:0 0 auto!important;width:9px!important;height:9px!important;border-right:2px solid currentColor!important;border-bottom:2px solid currentColor!important;transform:rotate(45deg)!important;transition:transform .2s ease!important;margin-inline:5px 3px!important}
        .footer-top>div.dd-mobile-footer-accordion.dd-open>h4:after{transform:rotate(225deg)!important}
        .footer-top>div.dd-mobile-footer-accordion:not(.dd-open)>:not(h4){display:none!important}
        .footer-top>div.dd-mobile-footer-accordion.dd-open>a{display:block!important;margin:0!important;padding:9px 2px!important;color:#efd9de!important;font-size:14px!important}
        .footer-top>div.dd-mobile-footer-accordion.dd-open>:last-child{margin-bottom:14px!important}
        .footer-top>div.dd-mobile-footer-accordion>h4:focus-visible{outline:2px solid rgba(255,255,255,.75)!important;outline-offset:3px!important;border-radius:4px!important}
      }

      /* Compact footer scale: reduce whitespace while keeping readable AR/EN links. */
      .dd-occ-footer{padding-top:28px!important;padding-bottom:16px!important}
      .dd-occ-footer .footer-top{column-gap:28px!important;row-gap:14px!important;align-items:start!important}
      .dd-occ-footer .footer-logo img{width:145px!important}
      .dd-occ-footer .footer-note{font-size:12px!important;line-height:1.65!important;max-width:285px!important;margin-top:10px!important}
      .dd-occ-footer .footer-top h4,.dd-occ-footer .dd-social-footer h4,.dd-occ-footer .dd-payment-footer h4{font-size:12.5px!important;margin-bottom:8px!important}
      .dd-occ-footer .footer-top a{font-size:12px!important;line-height:1.6!important;min-height:24px!important;margin:3px 0!important}
      /* Size only the links beneath the three footer section headings. */
      .dd-occ-footer .footer-top>div:not(.footer-brand):not(.dd-social-footer)>a{font-size:14px!important}
      .dd-occ-footer .dd-social-footer,.dd-occ-footer .dd-payment-footer{display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:10px 16px!important;margin-top:0!important;padding-top:12px!important}
      .dd-occ-footer .dd-social-icons{gap:8px!important}
      .dd-occ-footer .dd-social-icons a{width:33px!important;height:33px!important}
      .dd-occ-footer .dd-social-icons svg{width:17px!important;height:17px!important}
      .dd-occ-footer .dd-social-icons a[data-dd-social="facebook"] svg{width:16px!important;height:16px!important}
      .dd-occ-footer .dd-social-icons a[data-dd-social="x"] svg{width:16px!important;height:16px!important}
      .dd-occ-footer .dd-social-icons a[data-dd-social="youtube"] svg,.dd-occ-footer .dd-social-icons a[data-dd-social="snapchat"] svg{width:18px!important;height:18px!important}
      .dd-occ-footer .dd-payment-icons{gap:8px!important}
      .dd-occ-footer .dd-pay-card{width:64px!important;height:38px!important;border-radius:9px!important}
      .dd-occ-footer .dd-pay-visa{font-size:16px!important}
      .dd-occ-footer .dd-pay-master i,.dd-occ-footer .dd-pay-master b{width:17px!important;height:17px!important;top:10px!important}
      .dd-occ-footer .dd-pay-master i{left:18px!important}.dd-occ-footer .dd-pay-master b{left:28px!important}
      .dd-occ-footer .dd-pay-apple .dd-apple{font-size:16px!important}.dd-occ-footer .dd-pay-apple strong{font-size:12px!important}
      .dd-occ-footer .dd-pay-google strong{font-size:16px!important}.dd-occ-footer .dd-pay-google span{font-size:12px!important}
      .dd-occ-footer .dd-pay-wallet svg{width:22px!important;height:22px!important}
      .dd-occ-footer .footer-bottom{margin-top:14px!important;padding-top:10px!important;gap:8px!important;font-size:11.5px!important}
      .dd-occ-footer .footer-logo{margin:0!important}
      .dd-occ-footer .footer-logo img{display:block!important;height:auto!important;max-width:100%!important}
      .dd-occ-footer .footer-note{margin-bottom:0!important}
      .dd-occ-footer .footer-top>div{min-width:0!important}
      .dd-occ-footer .dd-social-footer h4,.dd-occ-footer .dd-payment-footer h4{margin:0!important}
      .dd-occ-footer .dd-social-icons a{display:flex!important;align-items:center!important;justify-content:center!important;flex:0 0 33px!important;box-sizing:border-box!important;margin:0!important;padding:0!important;min-height:0!important;line-height:1!important}
      .dd-occ-footer .dd-social-icons a svg{display:block!important;flex:none!important;margin:0!important}
      .dd-occ-footer .dd-payment-footer{margin-top:12px!important}
      @media(max-width:620px){
        .dd-occ-footer .footer-top{row-gap:0!important}
        .dd-occ-footer .dd-social-footer{border-top-color:transparent!important}
        .dd-occ-footer .footer-brand{margin-bottom:12px!important}
        .dd-occ-footer .footer-top>div.dd-mobile-footer-accordion>h4{margin:0!important}
        .dd-occ-footer .dd-social-footer,.dd-occ-footer .dd-payment-footer{gap:8px!important}
        .dd-occ-footer .dd-social-footer h4,.dd-occ-footer .dd-payment-footer h4{flex-basis:100%!important}
        .dd-occ-footer .dd-payment-icons{gap:6px!important;width:100%!important}
        .dd-occ-footer .dd-pay-card{flex:1 1 0!important;min-width:0!important;max-width:60px!important}
        .dd-occ-footer .dd-pay-master i{left:calc(50% - 14px)!important}.dd-occ-footer .dd-pay-master b{left:calc(50% - 4px)!important}

        .dd-occ-footer{padding-top:22px!important;padding-bottom:16px!important}
        .dd-occ-footer .dd-footer-wrap{width:calc(100% - 36px)!important}
        .dd-occ-footer .footer-logo img{width:130px!important}
        .dd-occ-footer .footer-note{font-size:11.5px!important;max-width:255px!important;margin-top:8px!important}
        .footer-top>div.dd-mobile-footer-accordion>h4{padding:12px 2px!important;min-height:44px!important;font-size:14px!important;gap:12px!important}
        .footer-top>div.dd-mobile-footer-accordion.dd-open>a{padding:7px 2px!important;font-size:12px!important}
        .footer-top>div.dd-mobile-footer-accordion.dd-open>:last-child{margin-bottom:10px!important}
        .dd-occ-footer .dd-social-footer,.dd-occ-footer .dd-payment-footer{margin-top:12px!important;padding-top:12px!important}
        .dd-occ-footer .dd-social-icons a{width:32px!important;height:32px!important;flex-basis:32px!important}
        .dd-occ-footer .dd-pay-card{width:60px!important;height:36px!important}
        .dd-occ-footer .footer-bottom{margin-top:12px!important;padding-top:10px!important;font-size:11px!important}
      }

      /* Home planner selects: scoped branding without touching the planner grid/layout */
      #occasions .filters .dd-home-select-shell{position:relative!important;display:block!important;width:100%!important;min-width:0!important;margin-top:0!important}
      #occasions .filters .dd-home-select-native{position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important;clip:rect(0 0 0 0)!important;clip-path:inset(50%)!important;overflow:hidden!important;white-space:nowrap!important}
      #occasions .filters .dd-home-select-trigger{width:100%!important;height:52px!important;min-height:52px!important;border:1px solid rgba(107,53,64,.18)!important;border-radius:12px!important;background:rgba(255,253,252,.58)!important;color:#6B3540!important;padding:0 15px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;font:700 14px/1.35 inherit!important;text-align:start!important;box-shadow:0 5px 14px rgba(76,31,36,.025)!important;cursor:pointer!important;transition:border-color .18s ease,box-shadow .18s ease,background .18s ease!important}
      #occasions .filters .dd-home-select-trigger:hover{border-color:rgba(168,88,61,.55)!important;background:#fffdfb!important}
      #occasions .filters .dd-home-select-shell.dd-open .dd-home-select-trigger,#occasions .filters .dd-home-select-trigger:focus-visible{border-color:#A8583D!important;box-shadow:0 0 0 3px rgba(168,88,61,.10),0 8px 22px rgba(76,31,36,.06)!important;outline:none!important;background:#fff!important}
      #occasions .filters .dd-home-select-value{min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
      #occasions .filters .dd-home-select-chevron{position:relative!important;width:18px!important;height:18px!important;flex:0 0 18px!important;color:#A8583D!important;transition:transform .18s ease!important}
      #occasions .filters .dd-home-select-chevron:before,#occasions .filters .dd-home-select-chevron:after{content:''!important;position:absolute!important;top:8px!important;width:7px!important;height:1.5px!important;background:currentColor!important;border-radius:2px!important}
      #occasions .filters .dd-home-select-chevron:before{left:2px!important;transform:rotate(42deg)!important}
      #occasions .filters .dd-home-select-chevron:after{right:2px!important;transform:rotate(-42deg)!important}
      #occasions .filters .dd-home-select-shell.dd-open .dd-home-select-chevron{transform:rotate(180deg)!important}
      #occasions .filters .dd-home-select-menu{position:absolute!important;z-index:2147482500!important;top:calc(100% + 7px)!important;inset-inline:0!important;display:none!important;max-height:min(310px,46vh)!important;overflow:auto!important;padding:7px!important;background:#fffdfc!important;border:1px solid rgba(107,53,64,.16)!important;border-radius:15px!important;box-shadow:0 18px 45px rgba(76,31,36,.16)!important;scrollbar-width:thin!important;scrollbar-color:rgba(107,53,64,.28) transparent!important}
      #occasions .filters .dd-home-select-shell.dd-open .dd-home-select-menu{display:grid!important;gap:3px!important}
      #occasions .filters .dd-home-select-option{width:100%!important;min-height:42px!important;border:0!important;border-radius:10px!important;background:transparent!important;color:#4A3638!important;padding:8px 11px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;text-align:start!important;font:600 13px/1.45 inherit!important;cursor:pointer!important}
      #occasions .filters .dd-home-select-option:hover,#occasions .filters .dd-home-select-option:focus-visible{background:#F8EBE6!important;color:#6B3540!important;outline:none!important}
      #occasions .filters .dd-home-select-option[aria-selected="true"]{background:#6B3540!important;color:#fff!important;font-weight:800!important}
      #occasions .filters .dd-home-select-option[aria-selected="true"]:after{content:'✓'!important;font:800 11px/1 Arial,sans-serif!important}
      #occasions .filters .dd-home-select-option:disabled{opacity:.45!important;cursor:not-allowed!important}
      @media(max-width:700px){#occasions .filters .dd-home-select-trigger{height:50px!important;min-height:50px!important}#occasions .filters .dd-home-select-menu{max-height:42svh!important}.dd-home-select-option{min-height:44px!important}}

      .dd-social-icons a[data-dd-social="x"] svg{width:18px!important;height:18px!important}
      .dd-social-icons a[data-dd-social="youtube"] svg{width:21px!important;height:21px!important}
      .dd-social-icons a[data-dd-social="snapchat"] svg{width:21px!important;height:21px!important}
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

  const core='/approved-pages/dear-day-cart-core.js?v=20261004-5';
  if(document.readyState==='loading')document.write('<script src="'+core+'"><\/script>');
  else{const script=document.createElement('script');script.src=core;script.async=false;script.onload=patchPage;(document.head||document.documentElement).appendChild(script);}
})();
