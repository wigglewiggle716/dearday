(function(){
  const KEY='dearDayCart';
  function price(v){
    if(typeof v==='number') return Number.isFinite(v)?v:0;
    const n=Number(String(v||'').replace(/[^0-9.]/g,''));
    return Number.isFinite(n)?n:0;
  }
  function read(){
    try{
      const x=JSON.parse(localStorage.getItem(KEY)||'[]');
      return Array.isArray(x)?x:[];
    }catch(e){return []}
  }
  function safeImage(v){
    const s=String(v||'');
    return s && !s.startsWith('data:image') ? s : '';
  }
  function normalize(type,item,context){
    item=item||{}; context=context||{};
    const id=String(item.id||item.name||item.ar||Date.now());
    return {
      key:type+':'+id,
      type:type,
      id:id,
      name:item.name||item.ar||item.title||'عنصر',
      ar:item.ar||'',
      vendor:item.vendor||'',
      price:price(item.price),
      area:item.area||'',
      people:item.people||'',
      meta:item.meta||item.flavor||'',
      image:safeImage(item.img||item.image),
      occasionKey:context.occasionKey||'',
      occasion:context.occasion||context.occasionLabel||'',
      addedAt:Date.now()
    };
  }
  function write(items){
    try{localStorage.setItem(KEY,JSON.stringify(items||[]))}catch(e){}
    paint();
    window.dispatchEvent(new CustomEvent('ddcartchange',{detail:{count:(items||[]).length}}));
    return items||[];
  }
  function syncType(type,items,context){
    const keep=read().filter(x=>x.type!==type);
    const add=(Array.isArray(items)?items:[]).filter(Boolean).map(x=>normalize(type,x,context));
    return write(keep.concat(add));
  }
  function upsert(type,item,context){
    const n=normalize(type,item,context);
    const a=read().filter(x=>x.key!==n.key);
    a.push(n); return write(a);
  }
  function remove(key){
    return write(read().filter(x=>x.key!==key));
  }
  function clear(){ return write([]); }
  function count(){return read().length}
  function total(){return read().reduce((s,x)=>s+price(x.price),0)}
  function removeHeaderCart(){
    document.querySelectorAll('.dd-cart-link').forEach(el=>el.remove());
  }

  function ensureGlobalHeaderStyle(){
    if(document.getElementById('dd-global-header-style'))return;
    const style=document.createElement('style');
    style.id='dd-global-header-style';
    style.textContent=`
      .dd-global-header{
        box-sizing:border-box!important;min-height:88px!important;height:auto!important;
        display:grid!important;grid-template-columns:minmax(190px,auto) 1fr minmax(300px,auto)!important;
        align-items:center!important;gap:26px!important;padding:10px clamp(24px,5vw,82px)!important;
        background:rgba(250,243,234,.97)!important;border-bottom:1px solid rgba(107,53,64,.14)!important;
        position:sticky!important;top:0!important;z-index:999!important;backdrop-filter:blur(14px)!important;
        width:100%!important;font-family:Tahoma,Arial,sans-serif!important
      }
      .dd-global-header *{box-sizing:border-box}
      .dd-global-header a{text-decoration:none!important}
      .dd-global-header .dd-global-brand{display:flex!important;align-items:center!important;justify-content:flex-start!important;min-width:0!important}
      .dd-global-header .dd-global-brand img{width:168px!important;height:62px!important;object-fit:contain!important;display:block!important;mix-blend-mode:multiply!important}
      .dd-global-header .dd-global-brand-text{font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;color:#6B3540}
      .dd-global-header .dd-global-nav{display:flex!important;align-items:center!important;justify-content:center!important;gap:28px!important;white-space:nowrap!important}
      .dd-global-header .dd-global-nav>a{position:relative;color:#3B292B!important;font-size:13px!important;font-weight:800!important;padding:12px 1px!important;transition:.18s ease}
      .dd-global-header .dd-global-nav>a:hover,.dd-global-header .dd-global-nav>a.dd-active{color:#A8583D!important}
      .dd-global-header .dd-global-nav>a.dd-active:not(.dd-plan-cta):after{content:"";position:absolute;inset-inline:0;bottom:3px;height:2px;background:#A8583D;border-radius:2px}
      .dd-global-header .dd-plan-cta{padding:12px 1px!important;border-radius:0!important;background:transparent!important;color:#A8583D!important;border:0!important}
      .dd-global-header .dd-plan-cta:after{content:"";position:absolute;inset-inline:0;bottom:3px;height:2px;background:#A8583D;border-radius:2px}
      .dd-global-header .dd-plan-cta:hover{background:transparent!important;border-color:transparent!important;color:#A8583D!important;transform:none!important}
      .dd-global-header .dd-global-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:8px!important;white-space:nowrap!important}
      .dd-global-header .dd-auth{min-height:40px!important;padding:8px 14px!important;border-radius:999px!important;border:1px solid rgba(107,53,64,.32)!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;font-size:12px!important;font-weight:800!important;color:#6B3540!important;background:transparent!important}
      .dd-global-header .dd-auth:hover{color:#6B3540!important;border-color:#A8583D!important;background:transparent!important}
      .dd-global-header .dd-auth.dd-signup{background:#6B3540!important;border-color:#6B3540!important;color:#fff!important}
      .dd-global-header .dd-lang{min-width:40px!important;width:40px!important;height:40px!important;border-radius:50%!important;border:1px solid rgba(107,53,64,.22)!important;display:grid!important;place-items:center!important;font-size:11px!important;font-weight:900!important;color:#6B3540!important;background:#FAF3EA!important}
      .dd-global-header .dd-mobile-plan{display:none!important}
      @media(max-width:1120px){
        .dd-global-header{grid-template-columns:auto 1fr auto!important;padding-inline:20px!important;gap:16px!important}
        .dd-global-header .dd-global-brand img{width:148px!important}
        .dd-global-header .dd-global-nav{gap:17px!important}
        .dd-global-header .dd-global-nav>a{font-size:12px!important}
        .dd-global-header .dd-auth{padding-inline:10px!important}
      }
      @media(max-width:860px){
        .dd-global-header{min-height:72px!important;grid-template-columns:auto 1fr!important;padding:8px 14px!important}
        .dd-global-header .dd-global-brand img{width:128px!important;height:52px!important}
        .dd-global-header .dd-global-nav{display:none!important}
        .dd-global-header .dd-global-actions{justify-content:flex-end!important}
        .dd-global-header .dd-auth{display:none!important}
        .dd-global-header .dd-mobile-plan{display:inline-flex!important;align-items:center!important;justify-content:center!important;padding:8px 12px!important;border-radius:999px!important;background:#6B3540!important;color:#fff!important;font-size:11px!important;font-weight:900!important}
        .dd-global-header .dd-lang{width:36px!important;height:36px!important;min-width:36px!important}
      }
    `;
    document.head.appendChild(style);
  }
  function homePath(){
    const p=String(location.pathname||'/').replace(/\/+$/,'')||'/';
    return p==='/'||/\/index\.html$/i.test(p);
  }
  function normalizeText(v){
    return String(v||'').replace(/\s+/g,' ').trim();
  }
  function assignHomeAnchor(id,terms){
    if(!homePath())return false;
    if(document.getElementById(id))return true;
    const nodes=[...document.querySelectorAll('section,[data-section],main>div,footer h2,footer h3,footer h4,footer a')];
    const found=nodes.find(el=>{
      const t=normalizeText(el.textContent);
      return terms.some(term=>t.includes(term));
    });
    if(!found)return false;
    const target=found.matches('h2,h3,h4,a')?(found.closest('section,div,footer')||found):found;
    if(!target.id)target.id=id;
    return true;
  }
  function homeHref(id,fallback){
    return homePath()&&document.getElementById(id)?'#'+id:'/#'+id;
  }
  function normalizeGlobalHeader(){
    const header=document.querySelector('header');
    if(!header||header.dataset.ddGlobalNav==='1')return header;
    ensureGlobalHeaderStyle();

    assignHomeAnchor('ddOccasionsStart',['اختار مناسبتك','اختار المناسبة','رتّب مناسبتك','رتب مناسبتك']);
    assignHomeAnchor('ddHowItWorks',['كيف نعمل','كيف تعمل']);
    assignHomeAnchor('ddPartners',['للشركاء','الشركاء']);

    const oldLogo=header.querySelector('img');
    const logoSrc=oldLogo?oldLogo.getAttribute('src'):'';
    const oldLogin=[...header.querySelectorAll('a')].find(a=>normalizeText(a.textContent).includes('تسجيل الدخول'));
    const oldSignup=[...header.querySelectorAll('a')].find(a=>normalizeText(a.textContent).includes('إنشاء حساب'));
    const oldLang=header.querySelector('.lang-link,[aria-label="English"]');

    const loginHref=oldLogin?.getAttribute('href')||'#';
    const signupHref=oldSignup?.getAttribute('href')||'#';
    const langHref=(oldLang?.getAttribute('href')&&oldLang.getAttribute('href')!=='#')?oldLang.getAttribute('href'):'#';

    const isHome=homePath();
    const path=String(location.pathname||'');
    const occasionActive=/Dear-Day-(Occasions|Birthday)-Approved\.html/i.test(path);
    const homeActive=isHome?' dd-active':'';
    const occActive=occasionActive?' dd-active':'';

    const howHref=homeHref('ddHowItWorks','/');
    const partnersHref=homeHref('ddPartners','/');
    const planHref=isHome&&document.getElementById('ddOccasionsStart')?'#ddOccasionsStart':'/approved-pages/Dear-Day-Occasions-Approved.html';

    header.className='dd-global-header';
    header.dataset.ddGlobalNav='1';
    header.innerHTML=`
      <a class="dd-global-brand" href="/" aria-label="Dear Day — الرئيسية">
        ${logoSrc?'<img src="'+logoSrc+'" alt="Dear Day">':'<span class="dd-global-brand-text">Dear Day</span>'}
      </a>
      <nav class="dd-global-nav" aria-label="التنقل الرئيسي">
        <a class="${homeActive.trim()}" href="/">الرئيسية</a>
        <a class="${occActive.trim()}" href="/approved-pages/Dear-Day-Occasions-Approved.html">المناسبات</a>
        <a href="${howHref}">كيف تعمل</a>
        <a href="${partnersHref}">للشركاء</a>
        <a class="dd-plan-cta" href="${planHref}">رتّب مناسبتي</a>
      </nav>
      <div class="dd-global-actions">
        <a class="dd-mobile-plan" href="${planHref}">رتّب مناسبتي</a>
        <a class="dd-auth" href="${loginHref}">تسجيل الدخول</a>
        <a class="dd-auth dd-signup" href="${signupHref}">إنشاء حساب</a>
        <a class="dd-lang" href="${langHref}" aria-label="English">EN</a>
      </div>
    `;

    if(loginHref==='#')header.querySelector('.dd-auth:not(.dd-signup)')?.addEventListener('click',e=>e.preventDefault());
    if(signupHref==='#')header.querySelector('.dd-signup')?.addEventListener('click',e=>e.preventDefault());
    if(langHref==='#')header.querySelector('.dd-lang')?.addEventListener('click',e=>e.preventDefault());

    const brand=header.querySelector('.dd-global-brand');
    if(isHome&&brand){
      brand.addEventListener('click',e=>{e.preventDefault();history.replaceState(null,'',location.pathname+location.search);window.scrollTo({top:0,behavior:'smooth'});});
    }

    if(isHome&&location.hash){
      requestAnimationFrame(()=>{
        const target=document.querySelector(location.hash);
        if(target)target.scrollIntoView({behavior:'smooth',block:'start'});
      });
    }
    return header;
  }

  function ensurePaymentLogoStyle(){
    if(document.getElementById('dd-payment-logo-style'))return;
    const style=document.createElement('style');
    style.id='dd-payment-logo-style';
    style.textContent=`
      .payments.dd-payment-logos{display:flex!important;align-items:center!important;gap:8px!important;flex-wrap:wrap!important}
      .payments.dd-payment-logos .dd-pay-logo{
        width:54px;height:34px;padding:6px 8px;border-radius:8px;background:#fff;
        display:inline-flex;align-items:center;justify-content:center;
        border:1px solid rgba(255,255,255,.28);box-shadow:0 2px 7px rgba(0,0,0,.08)
      }
      .payments.dd-payment-logos .dd-pay-logo svg{
        display:block;max-width:100%;max-height:22px;width:auto;height:22px
      }
      .payments.dd-payment-logos .dd-pay-logo.dd-wallet svg{max-height:19px}
      @media(max-width:680px){
        .payments.dd-payment-logos{gap:6px!important}
        .payments.dd-payment-logos .dd-pay-logo{width:48px;height:32px;padding:6px}
      }
    `;
    document.head.appendChild(style);
  }
  function normalizePaymentLogos(){
    const payments=document.querySelector('.payments');
    if(!payments||payments.dataset.ddPaymentLogos==='1')return;
    ensurePaymentLogoStyle();
    payments.dataset.ddPaymentLogos='1';
    payments.classList.add('dd-payment-logos');
    payments.innerHTML=`
      <span class="dd-pay-logo" title="Visa" aria-label="Visa">
        <svg viewBox="0 0 576 512" role="img" aria-hidden="true" style="fill:#1A1F71"><path d="M470.1 231.3s7.6 37.2 9.3 45H446c3.3-8.9 16-43.5 16-43.5-.2.3 3.3-9.1 5.3-14.9l2.8 13.4zM576 80v352c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V80c0-26.5 21.5-48 48-48h480c26.5 0 48 21.5 48 48zM152.5 331.2L215.7 176h-42.5l-39.3 106-4.3-21.5-14-71.4c-2.3-9.9-9.4-12.7-18.2-13.1H32.7l-.7 3.1c15.8 4 29.9 9.8 42.2 17.1l35.8 135h42.5zm94.4.2L272.1 176h-40.2l-25.1 155.4h40.1zm139.9-50.8c.2-17.7-10.6-31.2-33.7-42.3-14.1-7.1-22.7-11.9-22.7-19.2.2-6.6 7.3-13.4 23.1-13.4 13.1-.3 22.7 2.8 29.9 5.9l3.6 1.7 5.5-33.6c-7.9-3.1-20.5-6.6-36-6.6-39.7 0-67.6 21.2-67.8 51.4-.3 22.3 20 34.7 35.2 42.2 15.5 7.6 20.8 12.6 20.8 19.3-.2 10.4-12.6 15.2-24.1 15.2-16 0-24.6-2.5-37.7-8.3l-5.3-2.5-5.6 34.9c9.4 4.3 26.8 8.1 44.8 8.3 42.2.1 69.7-20.8 70-53zM528 331.4L495.6 176h-31.1c-9.6 0-16.9 2.8-21 12.9l-59.7 142.5H426s6.9-19.2 8.4-23.3H486c1.2 5.5 4.8 23.3 4.8 23.3H528z"/></svg>
      </span>
      <span class="dd-pay-logo" title="Mastercard" aria-label="Mastercard">
        <svg viewBox="0 0 86 54" role="img" aria-hidden="true">
          <circle cx="32" cy="27" r="20" fill="#EB001B"></circle>
          <circle cx="54" cy="27" r="20" fill="#F79E1B"></circle>
          <path d="M43 11.5a20 20 0 0 1 0 31 20 20 0 0 1 0-31z" fill="#FF5F00"></path>
        </svg>
      </span>
      <span class="dd-pay-logo" title="Apple Pay" aria-label="Apple Pay">
        <svg viewBox="0 0 640 512" role="img" aria-hidden="true" style="fill:#000"><path d="M116.9 158.5c-7.5 8.9-19.5 15.9-31.5 14.9-1.5-12 4.4-24.8 11.3-32.6 7.5-9.1 20.6-15.6 31.3-16.1 1.2 12.4-3.7 24.7-11.1 33.8m10.9 17.2c-17.4-1-32.3 9.9-40.5 9.9-8.4 0-21-9.4-34.8-9.1-17.9.3-34.5 10.4-43.6 26.5-18.8 32.3-4.9 80 13.3 106.3 8.9 13 19.5 27.3 33.5 26.8 13.3-.5 18.5-8.6 34.5-8.6 16.1 0 20.8 8.6 34.8 8.4 14.5-.3 23.6-13 32.5-26 10.1-14.8 14.3-29.1 14.5-29.9-.3-.3-28-10.9-28.3-42.9-.3-26.8 21.9-39.5 22.9-40.3-12.5-18.6-32-20.6-38.8-21.1m100.4-36.2v194.9h30.3v-66.6h41.9c38.3 0 65.1-26.3 65.1-64.3s-26.4-64-64.1-64h-73.2zm30.3 25.5h34.9c26.3 0 41.3 14 41.3 38.6s-15 38.8-41.4 38.8h-34.8V165zm162.2 170.9c19 0 36.6-9.6 44.6-24.9h.6v23.4h28v-97c0-28.1-22.5-46.3-57.1-46.3-32.1 0-55.9 18.4-56.8 43.6h27.3c2.3-12 13.4-19.9 28.6-19.9 18.5 0 28.9 8.6 28.9 24.5v10.8l-37.8 2.3c-35.1 2.1-54.1 16.5-54.1 41.5.1 25.2 19.7 42 47.8 42zm8.2-23.1c-16.1 0-26.4-7.8-26.4-19.6 0-12.3 9.9-19.4 28.8-20.5l33.6-2.1v11c0 18.2-15.5 31.2-36 31.2zm102.5 74.6c29.5 0 43.4-11.3 55.5-45.4L640 193h-30.8l-35.6 115.1h-.6L537.4 193h-31.6L557 334.9l-2.8 8.6c-4.6 14.6-12.1 20.3-25.5 20.3-2.4 0-7-.3-8.9-.5v23.4c1.8.4 9.3.7 11.6.7z"/></svg>
      </span>
      <span class="dd-pay-logo" title="Google Pay" aria-label="Google Pay">
        <svg viewBox="0 0 640 512" role="img" aria-hidden="true" style="fill:#202124"><path d="M105.72 215v41.25h57.1a49.66 49.66 0 0 1-21.14 32.6c-9.54 6.55-21.72 10.28-36 10.28-27.6 0-50.93-18.91-59.3-44.22a65.61 65.61 0 0 1 0-41l0 0c8.37-25.46 31.7-44.37 59.3-44.37a56.43 56.43 0 0 1 40.51 16.08L176.47 155a101.24 101.24 0 0 0-70.75-27.84 105.55 105.55 0 0 0-94.38 59.11 107.64 107.64 0 0 0 0 96.18v.15a105.41 105.41 0 0 0 94.38 59c28.47 0 52.55-9.53 70-25.91 20-18.61 31.41-46.15 31.41-78.91A133.76 133.76 0 0 0 205.38 215zm389.41-4c-10.13-9.38-23.93-14.14-41.39-14.14-22.46 0-39.34 8.34-50.5 24.86l20.85 13.26q11.45-17 31.26-17a34.05 34.05 0 0 1 22.75 8.79A28.14 28.14 0 0 1 487.79 248v5.51c-9.1-5.07-20.55-7.75-34.64-7.75-16.44 0-29.65 3.88-39.49 11.77s-14.82 18.31-14.82 31.56a39.74 39.74 0 0 0 13.94 31.27c9.25 8.34 21 12.51 34.79 12.51 16.29 0 29.21-7.3 39-21.89h1v17.72h22.61V250c.07-16.55-4.92-29.66-15.05-39zm-19.23 89.3a37.32 37.32 0 0 1-26.57 11.16A28.61 28.61 0 0 1 431 305.21a19.41 19.41 0 0 1-7.77-15.63c0-7 3.22-12.81 9.54-17.42s14.53-7 24.07-7c13.16-.16 23.46 2.84 30.8 8.78 0 10.13-3.96 18.91-11.74 26.36zm-93.65-142A55.71 55.71 0 0 0 341.74 142h-62.67v186.74h23.63V253.1h39c16 0 29.5-5.36 40.51-15.93.88-.89 1.76-1.79 2.65-2.68a54.45 54.45 0 0 0-2.61-76.23zm-16.58 62.23a30.65 30.65 0 0 1-23.34 9.68H302.7V165h39.63a32 32 0 0 1 22.6 9.23 33.18 33.18 0 0 1 .74 46.26zM614.31 201l-36.54 91.7h-.45L539.9 201h-25.69L566 320.55l-29.35 64.32H561L640 201z"/></svg>
      </span>
      <span class="dd-pay-logo dd-wallet" title="المحافظ الإلكترونية عبر Paymob" aria-label="المحافظ الإلكترونية">
        <svg viewBox="0 0 512 512" role="img" aria-hidden="true" style="fill:#6B3540"><path d="M64 32C28.7 32 0 60.7 0 96v320c0 35.3 28.7 64 64 64h384c35.3 0 64-28.7 64-64V192c0-35.3-28.7-64-64-64H80c-8.8 0-16-7.2-16-16s7.2-16 16-16h368c17.7 0 32-14.3 32-32s-14.3-32-32-32H64zm352 240a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/></svg>
      </span>
    `;
  }
  function ensureFloatingCart(){
    let link=document.getElementById('ddFloatingCart');
    if(link)return link;

    const style=document.createElement('style');
    style.id='dd-floating-cart-style';
    style.textContent=`
      #ddFloatingCart{
        position:fixed;left:24px;bottom:24px;z-index:9998;
        width:58px;height:58px;border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        background:#7b1027;color:#fff;text-decoration:none;
        box-shadow:0 12px 30px rgba(79,18,34,.28);
        border:2px solid rgba(255,255,255,.92);
        transition:transform .2s ease,opacity .2s ease,visibility .2s ease,box-shadow .2s ease;
        opacity:0;visibility:hidden;transform:translateY(8px) scale(.96);
      }
      #ddFloatingCart.dd-cart-visible{opacity:1;visibility:visible;transform:translateY(0) scale(1)}
      #ddFloatingCart:hover{transform:translateY(-2px) scale(1.03);box-shadow:0 15px 34px rgba(79,18,34,.34)}
      #ddFloatingCart svg{width:25px;height:25px;display:block;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
      #ddFloatingCart .dd-float-count{
        position:absolute;top:-6px;right:-5px;min-width:23px;height:23px;padding:0 6px;
        border-radius:999px;background:#f6d86b;color:#5d0c1d;
        display:grid;place-items:center;font:700 11px/1 Arial,sans-serif;
        border:2px solid #fff;
      }
      #ddFloatingCart .dd-float-label{
        position:absolute;left:68px;white-space:nowrap;background:#fff;color:#7b1027;
        border:1px solid rgba(123,16,39,.16);border-radius:999px;padding:7px 10px;
        font:700 11px/1.2 Tahoma,Arial,sans-serif;box-shadow:0 8px 22px rgba(70,35,40,.10);
        opacity:0;pointer-events:none;transform:translateX(-4px);transition:.18s ease;
      }
      #ddFloatingCart:hover .dd-float-label{opacity:1;transform:translateX(0)}
      body.dd-has-bottom-bar #ddFloatingCart{bottom:100px}
      @media(max-width:700px){
        #ddFloatingCart{left:14px;bottom:18px;width:54px;height:54px}
        body.dd-has-bottom-bar #ddFloatingCart{bottom:92px}
        #ddFloatingCart .dd-float-label{display:none}
      }
    `;
    document.head.appendChild(style);

    link=document.createElement('a');
    link.id='ddFloatingCart';
    link.href='/approved-pages/Dear-Day-Cart.html';
    link.setAttribute('aria-label','My Cart');
    link.innerHTML=`
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="20" r="1"></circle>
        <circle cx="19" cy="20" r="1"></circle>
        <path d="M3 4h2l2.5 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6.1"></path>
      </svg>
      <span class="dd-float-count" data-dd-cart-count>0</span>
      <span class="dd-float-label">My Cart</span>
    `;
    document.body.appendChild(link);
    return link;
  }
  function updateFloatingOffset(){
    const hasBottom=!!document.querySelector('.bottom.dd-floating,.sticky,.dd-sticky-dock.is-active');
    document.body.classList.toggle('dd-has-bottom-bar',hasBottom);
  }
  function paint(){
    removeHeaderCart();
    const n=count();
    document.querySelectorAll('[data-dd-cart-count]').forEach(el=>{el.textContent=n;el.setAttribute('aria-label',n+' عناصر في السلة')});
    const floating=ensureFloatingCart();
    floating.classList.toggle('dd-cart-visible',n>0);
    floating.setAttribute('aria-hidden',n>0?'false':'true');
    floating.tabIndex=n>0?0:-1;
    updateFloatingOffset();
  }
  function importPlan(plan){
    if(!plan||typeof plan!=='object')return read();
    let a=read();
    const types=[['gift','giftSelections'],['cake','cakeSelections'],['venue','venueSelections']];
    types.forEach(([type,key])=>{
      if(Array.isArray(plan[key])&&plan[key].length){
        a=a.filter(x=>x.type!==type).concat(plan[key].filter(Boolean).map(x=>normalize(type,x,plan)));
      }
    });
    return write(a);
  }
  window.DDCart={read,write,syncType,upsert,remove,clear,count,total,paint,importPlan,price,normalizeHeader:normalizeGlobalHeader};
  function boot(){
    normalizeGlobalHeader();
    normalizePaymentLogos();
    removeHeaderCart();
    paint();
    updateFloatingOffset();
    window.addEventListener('resize',updateFloatingOffset,{passive:true});
    window.addEventListener('scroll',updateFloatingOffset,{passive:true});
    const observer=new MutationObserver(()=>updateFloatingOffset());
    observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();