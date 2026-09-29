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
  function paint(){
    const n=count();
    document.querySelectorAll('[data-dd-cart-count]').forEach(el=>{el.textContent=n;el.setAttribute('aria-label',n+' عناصر في السلة')});
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
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',paint);else paint();
})();