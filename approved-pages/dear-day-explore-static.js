(function(){
  'use strict';

  function pageIsEnglish(){
    return String(document.documentElement.lang||'').toLowerCase().startsWith('en')||document.documentElement.dir==='ltr';
  }

  function closeAll(except){
    document.querySelectorAll('.dd-static-explore.dd-open,.dd-static-explore-mobile.dd-open').forEach(el=>{
      if(el!==except){
        el.classList.remove('dd-open');
        el.querySelector('button')?.setAttribute('aria-expanded','false');
      }
    });
  }

  function isGiftPage(){
    const p=String(location.pathname||'');
    return /^\/gifts(?:-en)?\/?$/i.test(p)||/\/approved-pages\/Dear-Day-Gifts-Approved(?:-en)?\.html$/i.test(p);
  }

  function patchGiftFilters(){
    if(!isGiftPage())return;

    const en=pageIsEnglish();
    const categoryGroup=document.querySelector('.chips[data-filter="category"]');
    const recipientGroup=document.querySelector('.chips[data-filter="recipient"]');

    // Flowers have their own Dear Day catalog/page, so remove them from Gifts.
    categoryGroup?.querySelector('.chip[data-value="flowers"]')?.remove();

    // Remove Anyone / أي شخص and make For both / للإثنين the default.
    if(recipientGroup){
      recipientGroup.querySelector('.chip[data-value="all"]')?.remove();
      const both=recipientGroup.querySelector('.chip[data-value="both"]');
      if(both&&recipientGroup.dataset.ddGiftRecipientDefault!=='1'){
        recipientGroup.dataset.ddGiftRecipientDefault='1';
        both.click();
      }
    }

    // Clearing filters must return recipient to For both instead of the removed generic state.
    const reset=document.getElementById('resetFilters');
    if(reset&&reset.dataset.ddGiftRecipientReset!=='1'){
      reset.dataset.ddGiftRecipientReset='1';
      reset.addEventListener('click',()=>setTimeout(()=>{
        const both=document.querySelector('.chips[data-filter="recipient"] .chip[data-value="both"]');
        if(both)both.click();
      },0));
    }

    // Remove the two legacy/demo flower products whenever the old Gifts grid re-renders.
    const legacyFlowerIds=['bouquet','dummy-bouquet-pastel'];
    const cleanGrid=()=>{
      legacyFlowerIds.forEach(id=>document.getElementById('prod-'+id)?.remove());
      const grid=document.getElementById('productGrid');
      if(!grid)return;
      const count=grid.querySelectorAll('.product').length;
      const counter=document.getElementById('resultCount');
      if(counter)counter.textContent=en?`${count} ${count===1?'gift':'gifts'}`:`${count} ${count===1?'هدية':'هدايا'}`;
      const empty=document.getElementById('noResults');
      if(empty)empty.style.display=count?'none':'block';
    };

    const grid=document.getElementById('productGrid');
    if(grid&&grid.dataset.ddLegacyFlowerGuard!=='1'){
      grid.dataset.ddLegacyFlowerGuard='1';
      new MutationObserver(cleanGrid).observe(grid,{childList:true});
    }

    // Remove stale flower-as-gift selections from old sessions, if any.
    const current=document.getElementById('currentWrap');
    if(current&&current.dataset.ddLegacyFlowerSelectionClean!=='1'){
      current.dataset.ddLegacyFlowerSelectionClean='1';
      legacyFlowerIds.forEach(id=>{
        if(current.innerHTML.includes("removeGift('"+id+"')")&&typeof window.removeGift==='function')window.removeGift(id);
      });
    }

    cleanGrid();
    setTimeout(cleanGrid,0);

    // Keep SEO copy aligned with the separated Flowers category.
    const description=document.querySelector('meta[name="description"]');
    if(description){
      description.content=en
        ? 'Explore thoughtful gifts for your occasion with Dear Day, including curated gift boxes, silver jewelry, watches, perfumes, and personalised pieces.'
        : 'اكتشف هدايا تناسب مناسبتك مع Dear Day، من بوكسات الهدايا للفضة والساعات والعطور والهدايا المخصصة، وقارن الاختيارات حسب النوع والسعر.';
    }
  }

  function bind(){
    document.querySelectorAll('.dd-static-explore,.dd-static-explore-mobile').forEach(w=>{
      const b=w.querySelector(':scope>button');
      if(!b||b.dataset.ddBound==='1')return;
      b.dataset.ddBound='1';
      b.addEventListener('click',e=>{
        e.preventDefault();
        e.stopPropagation();
        const open=!w.classList.contains('dd-open');
        closeAll(w);
        w.classList.toggle('dd-open',open);
        b.setAttribute('aria-expanded',String(open));
      });
    });

    document.querySelectorAll('.dd-native-mobile-panel').forEach(panel=>{
      if(panel.querySelector('.dd-static-explore-mobile'))return;
      const en=pageIsEnglish();
      const row=document.createElement('div');
      row.className='dd-static-explore-mobile';
      const btn=document.createElement('button');
      btn.type='button';
      btn.setAttribute('aria-expanded','false');
      btn.innerHTML='<span>'+(en?'Explore':'اكتشف')+'</span><span class="dd-chevron" aria-hidden="true">⌄</span>';
      const list=document.createElement('div');
      list.className='dd-static-explore-mobile-list';
      const items=en
        ?[['Gifts','/gifts-en'],['Chocolate & Cakes','/cake-en'],['Places & Experiences','/venues-en'],['Flowers','/flowers-en']]
        :[['هدايا','/gifts'],['شكولاته و كيك','/cake'],['أماكن وتجارب','/venues'],['ورد','/flowers']];
      items.forEach(([t,h])=>{
        const a=document.createElement('a');
        a.href=h;
        a.textContent=t;
        list.appendChild(a);
      });
      row.append(btn,list);
      const links=[...panel.querySelectorAll(':scope>a')];
      const home=links.find(a=>/^(الرئيسية|home)$/i.test((a.textContent||'').trim()));
      if(home)home.insertAdjacentElement('afterend',row);else panel.prepend(row);
    });

    document.querySelectorAll('.dd-static-explore-mobile').forEach(w=>{
      const b=w.querySelector(':scope>button');
      if(b&&b.dataset.ddBound!=='1'){
        b.dataset.ddBound='1';
        b.addEventListener('click',e=>{
          e.preventDefault();
          e.stopPropagation();
          const open=!w.classList.contains('dd-open');
          closeAll(w);
          w.classList.toggle('dd-open',open);
          b.setAttribute('aria-expanded',String(open));
        });
      }
    });

    patchGiftFilters();
  }

  /* Flower cart bridge.
     The legacy plan importer rebuilds the cart from gift/cake/venue selections.
     Keep flower selections in the plan and restore them immediately after that sync. */
  const FLOWER_KEY='flowerSelections';
  const path=String(location.pathname||'');
  const isFlowerPage=/^\/flowers(?:-en)?\/?$/i.test(path)||/Dear-Day-Flowers-Approved(?:-en)?\.html$/i.test(path);
  const isCartPage=/^\/cart(?:-en)?\/?$/i.test(path)||/Dear-Day-Cart(?:-en)?\.html$/i.test(path);
  const isEnglish=pageIsEnglish();
  let restoringFlowers=false;

  function readPlan(){
    try{
      const p=JSON.parse(localStorage.getItem('dearDayPlan')||'{}');
      return p&&typeof p==='object'&&!Array.isArray(p)?p:{};
    }catch(e){return {};}
  }

  function writePlan(p){
    try{localStorage.setItem('dearDayPlan',JSON.stringify(p||{}));}catch(e){}
  }

  function readCart(){
    try{
      const rows=JSON.parse(localStorage.getItem('dearDayCart')||'[]');
      return Array.isArray(rows)?rows:[];
    }catch(e){return [];}
  }

  function flowerToPlan(row){
    return {
      id:String(row.id||String(row.key||'').replace(/^flower:/,'')),
      name:row.name||row.ar||'',
      ar:row.ar||row.name||'',
      vendor:row.vendor||'',
      price:Number(row.price||0),
      img:row.image||row.img||'',
      image:row.image||row.img||'',
      meta:row.meta||'',
      area:row.area||'',
      people:row.people||''
    };
  }

  function persistFlowersFromCart(){
    if(restoringFlowers||!isFlowerPage)return;
    const flowers=readCart().filter(x=>x&&x.type==='flower').map(flowerToPlan);
    const plan=readPlan();
    plan[FLOWER_KEY]=flowers;
    writePlan(plan);
  }

  function restoreFlowers(){
    if(!window.DDCart?.upsert||restoringFlowers)return;
    const plan=readPlan();
    const flowers=Array.isArray(plan[FLOWER_KEY])?plan[FLOWER_KEY]:[];
    if(!flowers.length)return;
    restoringFlowers=true;
    try{
      flowers.forEach(item=>window.DDCart.upsert('flower',item,plan));
    }finally{
      restoringFlowers=false;
    }
    if(isCartPage&&typeof window.render==='function')window.render();
  }

  function removeFlowerFromPlanByKey(key){
    if(!/^flower:/i.test(String(key||'')))return;
    const id=String(key).replace(/^flower:/i,'');
    const plan=readPlan();
    const flowers=Array.isArray(plan[FLOWER_KEY])?plan[FLOWER_KEY]:[];
    plan[FLOWER_KEY]=flowers.filter(x=>String((x&&(x.id||x.name||x.ar))||'')!==id);
    writePlan(plan);
  }

  function patchCartFlowerUi(){
    if(!isCartPage)return;
    if(typeof window.typeLabel==='function'&&!window.typeLabel.__ddFlowerPatched){
      const old=window.typeLabel;
      const patched=function(type){return type==='flower'?(isEnglish?'Flowers':'ورد'):old(type);};
      patched.__ddFlowerPatched=true;
      window.typeLabel=patched;
    }
    if(typeof window.emoji==='function'&&!window.emoji.__ddFlowerPatched){
      const old=window.emoji;
      const patched=function(type){return type==='flower'?'🌷':old(type);};
      patched.__ddFlowerPatched=true;
      window.emoji=patched;
    }

    const items=document.getElementById('cartItems');
    if(items&&items.dataset.ddFlowerBridge!=='1'){
      items.dataset.ddFlowerBridge='1';
      items.addEventListener('click',e=>{
        const b=e.target.closest('[data-remove]');
        if(!b)return;
        const key=b.getAttribute('data-remove')||'';
        if(!/^flower:/i.test(key))return;
        setTimeout(()=>removeFlowerFromPlanByKey(key),0);
      });
    }

    const clear=document.getElementById('clearCart');
    if(clear&&clear.dataset.ddFlowerBridge!=='1'){
      clear.dataset.ddFlowerBridge='1';
      clear.addEventListener('click',()=>{
        setTimeout(()=>{
          const plan=readPlan();
          plan[FLOWER_KEY]=[];
          writePlan(plan);
        },0);
      });
    }
  }

  function initFlowerCartBridge(){
    patchCartFlowerUi();
    restoreFlowers();
    if(isFlowerPage){
      window.addEventListener('ddcartchange',persistFlowersFromCart);
      setTimeout(persistFlowersFromCart,250);
    }
    setTimeout(restoreFlowers,0);
    setTimeout(restoreFlowers,180);
    setTimeout(restoreFlowers,700);
  }

  document.addEventListener('click',()=>closeAll());
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAll();});

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{bind();initFlowerCartBridge();},{once:true});
  }else{
    bind();
    initFlowerCartBridge();
  }

  setTimeout(bind,500);
  setTimeout(bind,1400);
})();