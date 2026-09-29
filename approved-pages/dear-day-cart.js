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
  window.DDCart={read,write,syncType,upsert,remove,clear,count,total,paint,importPlan,price};
  function boot(){
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