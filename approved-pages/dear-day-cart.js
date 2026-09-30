(function(){
  const KEY='dearDayCart';
  const CART_URL='/approved-pages/Dear-Day-Cart.html';

  function cartCount(){
    try{
      const items=JSON.parse(localStorage.getItem(KEY)||'[]');
      return Array.isArray(items)?items.length:0;
    }catch(e){return 0}
  }

  function patchEnglishAuthLinks(){
    const isEnglish=String(document.documentElement.lang||'').toLowerCase().startsWith('en')||document.body?.dir==='ltr';
    if(!isEnglish)return;
    document.querySelectorAll('a').forEach(a=>{
      const text=String(a.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
      if(text==='log in'||text==='login'||text==='sign in')a.href='/Dear-Day-Auth-en.html#login';
      if(text==='create account'||text==='create an account'||text==='sign up')a.href='/Dear-Day-Auth-en.html#signup';
    });
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
      @media(max-width:700px){#ddFloatingCart{left:max(14px,env(safe-area-inset-left))!important;bottom:max(18px,env(safe-area-inset-bottom))!important;width:54px!important;height:54px!important}}
    `;
    (document.head||document.documentElement).appendChild(style);
  }

  function update(){
    const link=document.getElementById('ddFloatingCart');
    if(!link)return;
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

  function mount(){
    ensureStyle();
    patchEnglishAuthLinks();
    if(!document.body)return null;
    let link=document.getElementById('ddFloatingCart');
    if(!link){
      link=document.createElement('a');
      link.id='ddFloatingCart';
      link.className='dd-cart-visible';
      link.href=CART_URL;
      link.setAttribute('aria-label','My Cart');
      link.innerHTML=`
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="20" r="1"></circle><circle cx="19" cy="20" r="1"></circle><path d="M3 4h2l2.5 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6.1"></path></svg>
        <span class="dd-float-count" data-dd-cart-count>0</span>
        <span class="dd-float-label">My Cart</span>`;
      document.body.appendChild(link);
    }
    update();
    return link;
  }

  ensureStyle();
  patchEnglishAuthLinks();
  if(document.body)mount();
  else document.addEventListener('DOMContentLoaded',mount,{once:true});
  window.addEventListener('storage',function(e){if(!e.key||e.key===KEY){mount();update();}});
  window.addEventListener('ddcartchange',function(){mount();update();});

  const core='/approved-pages/dear-day-cart-core.js?v=20260930-5';
  if(document.readyState==='loading'){
    document.write('<script src="'+core+'"></script>');
  }else{
    const script=document.createElement('script');
    script.src=core;
    script.async=false;
    (document.head||document.documentElement).appendChild(script);
  }
})();