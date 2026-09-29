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
      .payments.dd-payment-logos .dd-pay-logo img{
        display:block;max-width:100%;max-height:22px;width:auto;height:auto;object-fit:contain
      }
      .payments.dd-payment-logos .dd-pay-logo.dd-wallet img{max-height:20px}
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
        <img src="https://cdn.simpleicons.org/visa/1A1F71" alt="Visa" loading="lazy">
      </span>
      <span class="dd-pay-logo" title="Mastercard" aria-label="Mastercard">
        <img src="https://cdn.simpleicons.org/mastercard/EB001B" alt="Mastercard" loading="lazy">
      </span>
      <span class="dd-pay-logo" title="Apple Pay" aria-label="Apple Pay">
        <img src="https://cdn.simpleicons.org/applepay/000000" alt="Apple Pay" loading="lazy">
      </span>
      <span class="dd-pay-logo dd-wallet" title="Vodafone Cash" aria-label="Vodafone Cash">
        <img src="https://cdn.simpleicons.org/vodafone/E60000" alt="Vodafone Cash" loading="lazy">
      </span>
      <span class="dd-pay-logo dd-wallet" title="Orange Cash" aria-label="Orange Cash">
        <img src="https://cdn.simpleicons.org/orange/FF7900" alt="Orange Cash" loading="lazy">
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