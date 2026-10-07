(function(){
  'use strict';
  if(window.__ddCartDrawerReady)return;
  window.__ddCartDrawerReady=true;

  const KEY='dearDayCart';
  let lastFocus=null;

  function english(){
    return String(document.documentElement.lang||'').toLowerCase().startsWith('en')||document.documentElement.dir==='ltr'||document.body?.dir==='ltr';
  }
  function cartUrl(){return english()?'/cart-en':'/cart';}
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function money(v){
    const n=Number(String(v??0).replace(/[^0-9.]/g,''))||0;
    try{return new Intl.NumberFormat(english()?'en-EG':'ar-EG',{style:'currency',currency:'EGP',maximumFractionDigits:0}).format(n)}
    catch(e){return 'EGP '+n.toLocaleString()}
  }
  function read(){
    try{
      if(window.DDCart&&typeof window.DDCart.read==='function')return window.DDCart.read();
      const x=JSON.parse(localStorage.getItem(KEY)||'[]');
      return Array.isArray(x)?x:[];
    }catch(e){return []}
  }
  function displayName(item){
    if(!item)return english()?'Item':'عنصر';
    if(item.type==='venue')return item.name||item.ar||(english()?'Venue':'مكان');
    return english()?(item.name||item.ar||'Item'):(item.ar||item.name||'عنصر');
  }
  function removeItem(item,index){
    if(window.DDCart&&typeof window.DDCart.remove==='function'&&item&&item.key){
      window.DDCart.remove(item.key);
      return;
    }
    const a=read();
    a.splice(index,1);
    try{localStorage.setItem(KEY,JSON.stringify(a))}catch(e){}
    window.dispatchEvent(new CustomEvent('ddcartchange',{detail:{count:a.length}}));
  }
  function ensureStyle(){
    if(document.getElementById('dd-cart-drawer-style'))return;
    const style=document.createElement('style');
    style.id='dd-cart-drawer-style';
    style.textContent=`
      body.dd-cart-drawer-open{overflow:hidden!important}
      #ddCartDrawerRoot{position:fixed;inset:0;z-index:2147483600;pointer-events:none;font-family:Tahoma,Arial,sans-serif}
      #ddCartDrawerRoot *{box-sizing:border-box}
      #ddCartDrawerBackdrop{position:absolute;inset:0;background:rgba(28,20,21,.58);opacity:0;transition:opacity .24s ease}
      #ddCartDrawerPanel{position:absolute;top:0;right:0;width:min(430px,82vw);min-width:min(310px,100vw);height:100dvh;background:#FFFDFC;color:#352D2E;display:flex;flex-direction:column;box-shadow:-18px 0 50px rgba(39,23,26,.18);transform:translateX(102%);transition:transform .28s cubic-bezier(.2,.75,.25,1);overflow:hidden}
      #ddCartDrawerRoot.dd-open{pointer-events:auto}
      #ddCartDrawerRoot.dd-open #ddCartDrawerBackdrop{opacity:1}
      #ddCartDrawerRoot.dd-open #ddCartDrawerPanel{transform:translateX(0)}
      .dd-cart-drawer-head{min-height:94px;padding:24px 24px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:1px solid rgba(107,53,64,.12);background:#FFFDFC}
      .dd-cart-drawer-title{margin:0;color:#3B292B;font-family:Lora,Georgia,'Times New Roman',serif;font-size:27px;line-height:1.2}
      .dd-cart-drawer-close{appearance:none;border:0;background:transparent;color:#6B3540;display:flex;align-items:center;gap:7px;font:700 13px/1 Tahoma,Arial,sans-serif;cursor:pointer;padding:8px 0}
      .dd-cart-drawer-close svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round}
      .dd-cart-drawer-items{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;padding:4px 0 18px;scrollbar-width:thin;scrollbar-color:rgba(107,53,64,.28) transparent}
      .dd-cart-drawer-item{display:grid;grid-template-columns:82px minmax(0,1fr) 28px;gap:14px;align-items:center;padding:20px 22px;border-bottom:1px solid rgba(107,53,64,.10)}
      .dd-cart-drawer-img,.dd-cart-drawer-placeholder{width:82px;height:82px;border-radius:14px;display:block;object-fit:cover;background:#F7ECE7}
      .dd-cart-drawer-placeholder{display:grid;place-items:center;color:#6B3540;font-family:Georgia,serif;font-weight:700;font-size:20px}
      .dd-cart-drawer-name{font-weight:800;font-size:15px;line-height:1.55;color:#352D2E;overflow-wrap:anywhere}
      .dd-cart-drawer-meta{margin-top:6px;color:#978985;font-size:12px;line-height:1.5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .dd-cart-drawer-price{margin-top:5px;color:#6B3540;font-weight:800;font-size:13px}
      .dd-cart-drawer-remove{align-self:start;margin-top:2px;width:28px;height:28px;border:0;background:transparent;color:#7C6C69;font-size:24px;line-height:1;cursor:pointer;border-radius:50%}
      .dd-cart-drawer-remove:hover{background:#F6E7E1;color:#6B3540}
      .dd-cart-drawer-empty{min-height:280px;padding:44px 28px;display:grid;place-items:center;text-align:center;color:#8A7B77}
      .dd-cart-drawer-empty strong{display:block;color:#6B3540;font-size:18px;margin-bottom:7px}
      .dd-cart-drawer-foot{padding:18px 22px max(20px,env(safe-area-inset-bottom));border-top:1px solid rgba(107,53,64,.12);background:#FFFDFC;box-shadow:0 -10px 30px rgba(74,39,43,.05)}
      .dd-cart-drawer-subtotal{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:15px;font-size:16px;font-weight:800}
      .dd-cart-drawer-subtotal strong{color:#6B3540;font-size:19px;white-space:nowrap}
      .dd-cart-drawer-view{width:100%;min-height:50px;border:0;border-radius:999px;background:#6B3540;color:#fff;display:flex;align-items:center;justify-content:center;text-decoration:none;font-weight:800;font-size:14px;box-shadow:0 10px 24px rgba(107,53,64,.16);transition:transform .18s ease,background .18s ease}
      .dd-cart-drawer-view:hover{background:#5c2e38;transform:translateY(-1px)}
      html[dir="rtl"] #ddCartDrawerPanel{direction:rtl;text-align:right}
      html[dir="ltr"] #ddCartDrawerPanel{direction:ltr;text-align:left}
      @media(max-width:520px){
        #ddCartDrawerPanel{width:86vw;min-width:0}
        .dd-cart-drawer-head{min-height:82px;padding:20px 18px 17px}
        .dd-cart-drawer-title{font-size:24px}
        .dd-cart-drawer-item{grid-template-columns:72px minmax(0,1fr) 26px;padding:17px 16px;gap:12px}
        .dd-cart-drawer-img,.dd-cart-drawer-placeholder{width:72px;height:72px;border-radius:12px}
        .dd-cart-drawer-foot{padding-inline:16px}
      }
      @media(prefers-reduced-motion:reduce){
        #ddCartDrawerBackdrop,#ddCartDrawerPanel,.dd-cart-drawer-view{transition:none!important}
      }
    `;
    (document.head||document.documentElement).appendChild(style);
  }
  function ensureDrawer(){
    ensureStyle();
    let root=document.getElementById('ddCartDrawerRoot');
    if(root)return root;
    root=document.createElement('div');
    root.id='ddCartDrawerRoot';
    root.setAttribute('aria-hidden','true');
    root.innerHTML=`
      <div id="ddCartDrawerBackdrop" data-dd-cart-close></div>
      <aside id="ddCartDrawerPanel" role="dialog" aria-modal="true" aria-labelledby="ddCartDrawerTitle">
        <div class="dd-cart-drawer-head">
          <h2 class="dd-cart-drawer-title" id="ddCartDrawerTitle"></h2>
          <button class="dd-cart-drawer-close" type="button" data-dd-cart-close>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>
            <span></span>
          </button>
        </div>
        <div class="dd-cart-drawer-items" id="ddCartDrawerItems"></div>
        <div class="dd-cart-drawer-foot">
          <div class="dd-cart-drawer-subtotal"><span></span><strong id="ddCartDrawerSubtotal"></strong></div>
          <a class="dd-cart-drawer-view" id="ddCartDrawerView" href="/cart"></a>
        </div>
      </aside>
    `;
    document.body.appendChild(root);
    root.querySelectorAll('[data-dd-cart-close]').forEach(el=>el.addEventListener('click',close));
    root.querySelector('#ddCartDrawerPanel').addEventListener('click',e=>e.stopPropagation());
    root.querySelector('#ddCartDrawerView').addEventListener('click',()=>close(false));
    return root;
  }
  function render(){
    const root=ensureDrawer();
    const en=english();
    const items=read();
    root.querySelector('#ddCartDrawerTitle').textContent=en?'Shopping cart':'سلة المشتريات';
    root.querySelector('.dd-cart-drawer-close span').textContent=en?'Close':'إغلاق';
    root.querySelector('.dd-cart-drawer-subtotal span').textContent=en?'Subtotal':'الإجمالي';
    const view=root.querySelector('#ddCartDrawerView');
    view.textContent=en?'View Cart':'الانتقال للسلة';
    view.href=cartUrl();

    const list=root.querySelector('#ddCartDrawerItems');
    if(!items.length){
      list.innerHTML='<div class="dd-cart-drawer-empty"><div><strong>'+esc(en?'Your cart is empty':'السلة فارغة')+'</strong><span>'+esc(en?'Add something you love, then it will appear here.':'اختار حاجة تعجبك وهتظهر هنا مباشرة.')+'</span></div></div>';
    }else{
      list.innerHTML=items.map((item,index)=>{
        const img=String(item.image||item.img||'').trim();
        const name=displayName(item);
        const meta=[item.vendor,item.area,item.people,item.meta].filter(Boolean).join(' • ');
        return '<article class="dd-cart-drawer-item" data-index="'+index+'">'+
          (img?'<img class="dd-cart-drawer-img" src="'+esc(img)+'" alt="'+esc(name)+'">':'<span class="dd-cart-drawer-placeholder" aria-hidden="true">DD</span>')+
          '<div><div class="dd-cart-drawer-name">'+esc(name)+'</div>'+
          (meta?'<div class="dd-cart-drawer-meta">'+esc(meta)+'</div>':'')+
          '<div class="dd-cart-drawer-price">1 × '+esc(money(item.price))+'</div></div>'+
          '<button class="dd-cart-drawer-remove" type="button" data-dd-remove="'+index+'" aria-label="'+esc(en?'Remove item':'حذف العنصر')+'">×</button>'+
        '</article>';
      }).join('');
      list.querySelectorAll('img.dd-cart-drawer-img').forEach(img=>img.addEventListener('error',()=>{const ph=document.createElement('span');ph.className='dd-cart-drawer-placeholder';ph.textContent='DD';img.replaceWith(ph)},{once:true}));
      list.querySelectorAll('[data-dd-remove]').forEach(btn=>btn.addEventListener('click',()=>{
        const index=Number(btn.getAttribute('data-dd-remove'));
        const current=read();
        if(Number.isInteger(index)&&current[index])removeItem(current[index],index);
        render();
      }));
    }
    const total=items.reduce((sum,x)=>sum+(Number(String(x.price??0).replace(/[^0-9.]/g,''))||0),0);
    root.querySelector('#ddCartDrawerSubtotal').textContent=money(total);
  }
  function open(){
    const root=ensureDrawer();
    render();
    lastFocus=document.activeElement;
    root.classList.add('dd-open');
    root.setAttribute('aria-hidden','false');
    document.body.classList.add('dd-cart-drawer-open');
    setTimeout(()=>root.querySelector('.dd-cart-drawer-close')?.focus(),20);
  }
  function close(restore=true){
    const root=document.getElementById('ddCartDrawerRoot');
    if(!root)return;
    root.classList.remove('dd-open');
    root.setAttribute('aria-hidden','true');
    document.body.classList.remove('dd-cart-drawer-open');
    if(restore!==false&&lastFocus&&typeof lastFocus.focus==='function')setTimeout(()=>lastFocus.focus(),20);
  }

  document.addEventListener('click',function(e){
    const trigger=e.target&&e.target.closest?e.target.closest('#ddFloatingCart'):null;
    if(!trigger)return;
    e.preventDefault();
    e.stopPropagation();
    open();
  },true);

  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&document.getElementById('ddCartDrawerRoot')?.classList.contains('dd-open'))close();
  });
  window.addEventListener('ddcartchange',function(){if(document.getElementById('ddCartDrawerRoot')?.classList.contains('dd-open'))render()});
  window.addEventListener('storage',function(e){if(!e.key||e.key===KEY){if(document.getElementById('ddCartDrawerRoot')?.classList.contains('dd-open'))render()}});
})();