(function(){
  const path=String(location.pathname||'').replace(/\/+$/,'')||'/';
  const isHome=path==='/'||/\/index(?:-en)?\.html$/i.test(path);if(!isHome)return;
  const en=String(document.documentElement.lang||'').toLowerCase().startsWith('en')||document.documentElement.dir==='ltr';
  const t=(ar,enText)=>en?enText:ar;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=(v,c='EGP')=>new Intl.NumberFormat(en?'en-EG':'ar-EG',{style:'currency',currency:c,maximumFractionDigits:0}).format(Number(v||0));
  const SUPABASE_ESM='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';
  const CONFIG_SRC='/approved-pages/dear-day-supabase-config.js?v=20261002-1';
  const state={tab:'gifts',index:{gifts:0,'cakes-sweets':0,flowers:0,venues:0},data:{gifts:[],'cakes-sweets':[],flowers:[],venues:[]}};

  const tabs=[
    {key:'gifts',label:t('هدايا','Gifts'),url:en?'/approved-pages/Dear-Day-Gifts-Approved-en.html?standalone=1':'/approved-pages/Dear-Day-Gifts-Approved.html?standalone=1'},
    {key:'cakes-sweets',label:t('كيك وحلويات','Cakes & Sweets'),url:en?'/approved-pages/Dear-Day-Cake-Approved-en.html?standalone=1':'/approved-pages/Dear-Day-Cake-Approved.html?standalone=1'},
    {key:'flowers',label:t('ورد','Flowers'),url:en?'/approved-pages/Dear-Day-Flowers-Approved-en.html?standalone=1':'/approved-pages/Dear-Day-Flowers-Approved.html?standalone=1'},
    {key:'venues',label:t('أماكن وتجارب','Places & Experiences'),url:en?'/approved-pages/Dear-Day-Venues-Approved-en.html?standalone=1':'/approved-pages/Dear-Day-Venues-Approved.html?standalone=1'}
  ];

  state.data.venues=[
    {id:'terrace',name:'The Terrace Lounge',ar:'تجربة عشاء خارجية',price:2500,currency:'EGP',image:'/approved-pages/assets/media/venue-01.jpg',vendor:t('الشيخ زايد','Sheikh Zayed'),meta:t('مطعم وكافيهات','Restaurant & café'),rating:4.8,venue:true},
    {id:'ovio',name:'Ovio Restaurant',ar:'عشاء هادئ ومميز',price:1800,currency:'EGP',image:'/approved-pages/assets/media/venue-02.jpg',vendor:t('مصر الجديدة','Heliopolis'),meta:t('مطعم وكافيهات','Restaurant & café'),rating:4.7,venue:true},
    {id:'zooba',name:'Zooba Garden',ar:'جلسة جاردن خاصة',price:3200,currency:'EGP',image:'/approved-pages/assets/media/venue-03.jpg',vendor:t('الزمالك','Zamalek'),meta:t('مكان خاص','Private place'),rating:4.6,venue:true},
    {id:'boulud',name:'Café Boulud',ar:'تجربة عشاء أنيقة',price:2200,currency:'EGP',image:'/approved-pages/assets/media/venue-04.jpg',vendor:t('التجمع الخامس','New Cairo'),meta:t('مطعم وكافيهات','Restaurant & café'),rating:4.8,venue:true},
    {id:'nacelle',name:'Nacelle Experience',ar:'تجربة مسائية مختلفة',price:3500,currency:'EGP',image:'/approved-pages/assets/media/venue-05.jpg',vendor:t('أكتوبر','6th of October'),meta:t('تجربة وترفيه','Experience'),rating:4.9,venue:true},
    {id:'scarabeo',name:'Scarabeo',ar:'عشاء بإضاءة دافئة',price:2800,currency:'EGP',image:'/approved-pages/assets/media/venue-06.jpg',vendor:t('الشيخ زايد','Sheikh Zayed'),meta:t('مكان خاص','Private place'),rating:4.7,venue:true}
  ];

  function findPlanner(){
    const fixed=document.getElementById('occasions')||document.getElementById('ddOccasionsStart');
    if(fixed)return fixed;
    const heading=[...document.querySelectorAll('h1,h2,h3,h4')].find(el=>{const s=String(el.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();return s.includes('اختار مناسبتك')||s.includes('اختار المناسبة')||s.includes('choose your occasion')||s.includes('what are you celebrating')});
    return heading?.closest('section,.wrap,[data-section],main>div')||null;
  }

  function categorySection(){
    const section=document.createElement('section');section.id='ddDirectCategories';section.className='dd-direct-cats';
    section.innerHTML=`<div class="dd-direct-inner"><div class="dd-direct-head"><div><span>${t('لو عارف أنت محتاج إيه','Know what you need?')}</span><h2>${t('محتاج حاجة محددة؟','Looking for something specific?')}</h2><p>${t('ادخل مباشرة على القسم، من غير ما نغيّر إن رحلة Dear Day الأساسية تبدأ من المناسبة.','Jump straight to a category while keeping the main Dear Day journey occasion-first.')}</p></div></div><div class="dd-direct-grid"><a href="${tabs[0].url}"><img src="/approved-pages/assets/media/occasion-gift.jpg" alt="${t('هدايا','Gifts')}"><div><strong>${t('هدايا','Gifts')}</strong><small>${t('اختيارات حسب المناسبة والشخص والميزانية','By occasion, recipient and budget')}</small></div></a><a href="${tabs[1].url}"><img src="/approved-pages/assets/media/birthday-cake.jpg" alt="${t('كيك وحلويات','Cakes & Sweets')}"><div><strong>${t('كيك وحلويات','Cakes & Sweets')}</strong><small>${t('تورت، حلويات وبوكسات','Cakes, desserts and boxes')}</small></div></a><a href="${tabs[2].url}"><img src="/approved-pages/assets/media/flowers-bouquet.jpg" alt="${t('ورد','Flowers')}"><div><strong>${t('ورد','Flowers')}</strong><small>${t('بوكيهات، بوكسات وفازات','Bouquets, boxes and vases')}</small></div></a><a href="${tabs[3].url}"><img src="/approved-pages/assets/media/occasion-venue.jpg" alt="${t('أماكن وتجارب','Places & Experiences')}"><div><strong>${t('أماكن وتجارب','Places & Experiences')}</strong><small>${t('أماكن وتجارب لليوم نفسه','Places and experiences for the day')}</small></div></a></div></div>`;
    return section;
  }

  function curatedSection(){
    const section=document.createElement('section');section.id='ddCuratedPicks';section.className='dd-curated';
    section.innerHTML=`<div class="dd-curated-inner"><div class="dd-curated-head"><div><span>${t('اختيارات من Dear Day','Dear Day picks')}</span><h2>${t('مختارات جاهزة ليومك','Ready picks for your day')}</h2><p>${t('اختيارات من كل قسم تقدر تضيفها للسلة مباشرة، والأماكن تستكشفها قبل تأكيد الموعد.','Curated picks you can add straight to your cart, with places reviewed before confirming the date.')}</p></div><a id="ddCuratedBrowse" href="${tabs[0].url}">${t('عرض كل الهدايا','View all gifts')} ${en?'→':'←'}</a></div><div class="dd-curated-tabs" role="tablist" aria-label="${t('أقسام المختارات','Curated categories')}">${tabs.map((x,i)=>`<button type="button" role="tab" data-tab="${x.key}" aria-selected="${i===0}">${x.label}</button>`).join('')}</div><div class="dd-curated-shell"><button class="dd-curated-arrow dd-curated-prev" type="button" aria-label="${t('السابق','Previous')}" disabled>‹</button><div class="dd-curated-track" id="ddCuratedTrack" tabindex="0" aria-live="polite"><div class="dd-curated-loading">${t('جاري تحميل المختارات…','Loading picks…')}</div></div><button class="dd-curated-arrow dd-curated-next" type="button" aria-label="${t('التالي','Next')}">›</button></div><div class="dd-curated-progress" aria-hidden="true"><i id="ddCuratedProgress"></i></div></div>`;
    return section;
  }

  function visibleCount(){return innerWidth>=1050?4:2}
  function tabInfo(){return tabs.find(x=>x.key===state.tab)||tabs[0]}
  function itemName(x){return en?(x.name_en||x.name||x.name_ar||x.ar):(x.name_ar||x.ar||x.name||x.name_en)}
  function itemTag(x){const tags=Array.isArray(x.meta?.tags)?x.meta.tags:[];if(tags.includes('best_seller'))return t('الأكثر طلبًا','Best seller');if(tags.includes('new'))return t('جديد','New');return x.venue?t('تجربة','Experience'):t('مختار','Picked')}

  function cardHtml(x){
    const name=itemName(x),img=x.image||'/approved-pages/assets/media/occasion-gift.jpg';
    if(x.venue)return `<article class="dd-pick-card"><div class="dd-pick-media"><img src="${esc(img)}" alt="${esc(name)}"><span>${esc(itemTag(x))}</span></div><div class="dd-pick-body"><small>${esc(x.vendor||'Dear Day')}</small><h3>${esc(name)}</h3><p>${esc(x.meta||'')} · ★ ${esc(x.rating||'')}</p><div class="dd-pick-bottom"><strong>${money(x.price,x.currency)}</strong><a href="${tabInfo().url}">${t('عرض التجربة','View experience')}</a></div></div></article>`;
    return `<article class="dd-pick-card"><div class="dd-pick-media"><img src="${esc(img)}" alt="${esc(name)}"><span>${esc(itemTag(x))}</span></div><div class="dd-pick-body"><small>${esc(x.vendor||'Dear Day')}</small><h3>${esc(name)}</h3><p>${esc(x.description||'')}</p><div class="dd-pick-bottom"><strong>${money(x.price,x.currency)}</strong><button type="button" data-add="${esc(x.id)}">${t('+ أضف للسلة','+ Add to cart')}</button></div></div></article>`;
  }

  function updateBrowse(){const info=tabInfo(),a=document.getElementById('ddCuratedBrowse');if(!a)return;a.href=info.url;const names={gifts:t('الهدايا','gifts'),'cakes-sweets':t('الكيك والحلويات','cakes & sweets'),flowers:t('الورد','flowers'),venues:t('الأماكن والتجارب','places & experiences')};a.textContent=`${t('عرض كل','View all')} ${names[state.tab]} ${en?'→':'←'}`}
  function updateArrows(){const rows=state.data[state.tab]||[],v=visibleCount(),max=Math.max(0,rows.length-v),i=Math.min(state.index[state.tab]||0,max);state.index[state.tab]=i;const prev=document.querySelector('.dd-curated-prev'),next=document.querySelector('.dd-curated-next'),progress=document.getElementById('ddCuratedProgress');if(prev)prev.disabled=i<=0;if(next)next.disabled=i>=max;if(progress)progress.style.width=(max?((i+1)/(max+1))*100:100)+'%'}
  function scrollToIndex(smooth=true){const track=document.getElementById('ddCuratedTrack'),cards=track?.querySelectorAll('.dd-pick-card');if(!track||!cards?.length)return;const idx=Math.min(state.index[state.tab]||0,cards.length-1);const step=cards.length>1?Math.abs(cards[1].offsetLeft-cards[0].offsetLeft):(cards[0].getBoundingClientRect().width+14);const left=(en?1:-1)*idx*step;track.scrollTo({left,behavior:smooth?'smooth':'auto'});updateArrows()}

  function addToCart(id,btn){
    const x=(state.data[state.tab]||[]).find(z=>String(z.id)===String(id));if(!x||x.venue)return;
    const type=state.tab==='gifts'?'gift':state.tab==='cakes-sweets'?'cake':'flower';
    const item={id:x.id,name:itemName(x),ar:x.name_ar||itemName(x),vendor:x.vendor||'',price:x.price,img:x.image,listing_id:x.listing_id,partner_id:x.partner_id,quantity:1,meta:x.meta?.subcategory||''};
    if(window.DDCart?.upsert)window.DDCart.upsert(type,item,{});else{
      let rows=[];try{rows=JSON.parse(localStorage.getItem('dearDayCart')||'[]')}catch(e){};rows=Array.isArray(rows)?rows.filter(r=>r.key!==`${type}:${x.id}`):[];rows.push({key:`${type}:${x.id}`,type,id:x.id,name:item.name,ar:item.ar,vendor:item.vendor,price:item.price,image:item.img,listing_id:item.listing_id,partner_id:item.partner_id,quantity:1,addedAt:Date.now()});try{localStorage.setItem('dearDayCart',JSON.stringify(rows))}catch(e){};window.dispatchEvent(new CustomEvent('ddcartchange',{detail:{count:rows.length}}));
    }
    const old=btn.textContent;btn.textContent=t('تمت الإضافة ✓','Added ✓');btn.disabled=true;setTimeout(()=>{btn.textContent=old;btn.disabled=false},1200);
  }

  function render(){
    const track=document.getElementById('ddCuratedTrack');if(!track)return;const rows=state.data[state.tab]||[];track.innerHTML=rows.length?rows.map(cardHtml).join(''):`<div class="dd-curated-empty">${t('مفيش اختيارات متاحة في القسم ده حاليًا.','No picks are available in this category yet.')}</div>`;
    track.querySelectorAll('[data-add]').forEach(btn=>btn.onclick=()=>addToCart(btn.dataset.add,btn));
    document.querySelectorAll('.dd-curated-tabs [data-tab]').forEach(btn=>btn.setAttribute('aria-selected',String(btn.dataset.tab===state.tab)));
    updateBrowse();updateArrows();requestAnimationFrame(()=>scrollToIndex(false));
  }

  function bind(){
    document.querySelectorAll('.dd-curated-tabs [data-tab]').forEach(btn=>btn.addEventListener('click',()=>{state.tab=btn.dataset.tab;state.index[state.tab]=0;render()}));
    document.querySelector('.dd-curated-prev')?.addEventListener('click',()=>{state.index[state.tab]=Math.max(0,(state.index[state.tab]||0)-1);scrollToIndex()});
    document.querySelector('.dd-curated-next')?.addEventListener('click',()=>{const rows=state.data[state.tab]||[],max=Math.max(0,rows.length-visibleCount());state.index[state.tab]=Math.min(max,(state.index[state.tab]||0)+1);scrollToIndex()});
    const track=document.getElementById('ddCuratedTrack');let raf=0;track?.addEventListener('scroll',()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;const cards=[...track.querySelectorAll('.dd-pick-card')];if(!cards.length)return;const box=track.getBoundingClientRect();let best=0,dist=Infinity;cards.forEach((c,i)=>{const r=c.getBoundingClientRect(),d=en?Math.abs(r.left-box.left):Math.abs(box.right-r.right);if(d<dist){dist=d;best=i}});state.index[state.tab]=best;updateArrows()})},{passive:true});
    addEventListener('resize',()=>{updateArrows();scrollToIndex(false)},{passive:true});
  }

  async function config(){if(window.DEAR_DAY_SUPABASE)return window.DEAR_DAY_SUPABASE;await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=CONFIG_SRC;s.onload=resolve;s.onerror=reject;(document.head||document.documentElement).appendChild(s)});return window.DEAR_DAY_SUPABASE}
  function score(x){const tags=Array.isArray(x.meta?.tags)?x.meta.tags:[];return (x.meta?.featured?20:0)+(tags.includes('best_seller')?10:0)+(tags.includes('new')?4:0)+(x.meta?.is_demo?1:0)}
  async function loadLive(){
    const cfg=await config(),mod=await import(SUPABASE_ESM),client=mod.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    const {data:cats,error:ce}=await client.from('categories').select('id,slug').in('slug',['gifts','cakes-sweets','flowers']);if(ce)throw ce;
    const catMap=new Map((cats||[]).map(x=>[x.id,x.slug])),ids=[...catMap.keys()];if(!ids.length)return;
    const {data:ls,error:le}=await client.from('listings').select('id,partner_id,category_id,published_version_id').in('category_id',ids).eq('is_available',true).not('published_version_id','is',null);if(le)throw le;
    const versionIds=(ls||[]).map(x=>x.published_version_id).filter(Boolean),partnerIds=[...new Set((ls||[]).map(x=>x.partner_id).filter(Boolean))];
    const [{data:vs,error:ve},{data:ps,error:pe}]=await Promise.all([
      versionIds.length?client.from('listing_versions').select('id,status,name_ar,name_en,description_ar,description_en,price,currency,media,metadata').in('id',versionIds).eq('status','published'):Promise.resolve({data:[],error:null}),
      partnerIds.length?client.from('partners').select('id,name_ar,name_en,status').in('id',partnerIds).eq('status','active'):Promise.resolve({data:[],error:null})
    ]);if(ve)throw ve;if(pe)throw pe;
    const vm=new Map((vs||[]).map(x=>[x.id,x])),pm=new Map((ps||[]).map(x=>[x.id,x]));
    const grouped={gifts:[],'cakes-sweets':[],flowers:[]};
    (ls||[]).forEach(l=>{const v=vm.get(l.published_version_id),p=pm.get(l.partner_id),slug=catMap.get(l.category_id);if(!v||!p||!grouped[slug])return;const media=Array.isArray(v.media)?v.media:[];grouped[slug].push({id:l.id,listing_id:l.id,partner_id:l.partner_id,name_ar:v.name_ar,name_en:v.name_en,name:en?(v.name_en||v.name_ar):v.name_ar,description:en?(v.description_en||v.description_ar):v.description_ar,price:Number(v.price||0),currency:v.currency||'EGP',image:media[0]?.url||'',vendor:en?(p.name_en||p.name_ar):p.name_ar,meta:v.metadata||{}})});
    Object.keys(grouped).forEach(k=>{grouped[k].sort((a,b)=>score(b)-score(a)||a.price-b.price);state.data[k]=grouped[k].slice(0,10)});
  }

  function style(){if(document.getElementById('ddHomeDiscoveryStyle'))return;const s=document.createElement('style');s.id='ddHomeDiscoveryStyle';s.textContent=`
    .dd-direct-cats,.dd-curated{background:#FAF3EA;color:#352D2E}.dd-direct-cats{padding:10px 0 48px}.dd-curated{padding:4px 0 68px}.dd-direct-inner,.dd-curated-inner{max-width:1200px;margin:auto;padding:0 28px}.dd-direct-head span,.dd-curated-head span{color:#A8583D;font-size:11px;font-weight:800}.dd-direct-head h2,.dd-curated-head h2{margin:4px 0 6px;color:#6B3540;font-size:27px}.dd-direct-head p,.dd-curated-head p{margin:0 0 20px;color:#786C69;max-width:760px;font-size:13px}.dd-direct-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.dd-direct-grid a{display:block;background:#FFFDFC;border:1px solid rgba(107,53,64,.14);border-radius:18px;overflow:hidden;text-decoration:none;color:#352D2E;transition:.18s ease}.dd-direct-grid a:hover{transform:translateY(-3px);box-shadow:0 14px 30px rgba(79,40,43,.08);border-color:rgba(107,53,64,.28)}.dd-direct-grid img{width:100%;height:145px;object-fit:cover;display:block}.dd-direct-grid div{padding:13px}.dd-direct-grid strong{display:block;color:#6B3540;font-size:15px}.dd-direct-grid small{display:block;color:#786C69;margin-top:4px;line-height:1.6}.dd-curated-head{display:flex;align-items:flex-end;justify-content:space-between;gap:22px;margin-bottom:14px}.dd-curated-head p{margin-bottom:0}.dd-curated-head>a{color:#A8583D;font-size:12px;font-weight:800;text-decoration:none;white-space:nowrap}.dd-curated-tabs{display:flex;gap:8px;overflow-x:auto;padding:5px 0 17px;scrollbar-width:none}.dd-curated-tabs::-webkit-scrollbar{display:none}.dd-curated-tabs button{border:1px solid rgba(107,53,64,.18);background:#FFFDFC;color:#6B3540;border-radius:999px;padding:9px 16px;white-space:nowrap;font-weight:800;font-size:12px}.dd-curated-tabs button[aria-selected="true"]{background:#6B3540;color:#fff;border-color:#6B3540}.dd-curated-shell{display:grid;grid-template-columns:44px minmax(0,1fr) 44px;align-items:center;gap:10px}.dd-curated-arrow{width:42px;height:42px;border:1px solid rgba(107,53,64,.20);border-radius:50%;background:#FFFDFC;color:#6B3540;font-size:26px;display:grid;place-items:center;line-height:1;box-shadow:0 7px 18px rgba(74,35,39,.05)}.dd-curated-arrow:disabled{opacity:.28;cursor:not-allowed;box-shadow:none}.dd-curated-track{display:grid;grid-auto-flow:column;grid-auto-columns:calc((100% - 42px)/4);gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding:3px}.dd-curated-track::-webkit-scrollbar{display:none}.dd-pick-card{scroll-snap-align:start;min-width:0;background:#FFFDFC;border:1px solid rgba(107,53,64,.13);border-radius:18px;overflow:hidden;box-shadow:0 9px 24px rgba(70,35,40,.05)}.dd-pick-media{height:190px;position:relative;background:#f7ede8;overflow:hidden}.dd-pick-media img{width:100%;height:100%;object-fit:cover;display:block}.dd-pick-media img[src$='.svg']{object-fit:contain;padding:34px}.dd-pick-media span{position:absolute;top:10px;inset-inline-start:10px;background:#fffaf7;color:#6B3540;border:1px solid #ead9d3;border-radius:999px;padding:5px 8px;font-size:9px;font-weight:800}.dd-pick-body{padding:13px}.dd-pick-body small{color:#95837f;font-size:10px}.dd-pick-body h3{color:#433638;font-size:14px;margin:3px 0 6px;min-height:43px}.dd-pick-body p{color:#887974;font-size:10px;line-height:1.55;margin:0 0 12px;height:32px;overflow:hidden}.dd-pick-bottom{display:flex;align-items:center;justify-content:space-between;gap:8px}.dd-pick-bottom strong{color:#6B3540;font-size:13px}.dd-pick-bottom button,.dd-pick-bottom a{border:0;background:#6B3540;color:#fff;border-radius:999px;padding:8px 11px;font-weight:800;font-size:10px;text-decoration:none;white-space:nowrap}.dd-pick-bottom button:disabled{opacity:.7}.dd-curated-loading,.dd-curated-empty{grid-column:1/-1;min-height:250px;display:grid;place-items:center;border:1px dashed rgba(107,53,64,.18);border-radius:18px;color:#786C69;background:#FFFDFC}.dd-home-legacy-picks-hidden{display:none!important}@media(max-width:1049px){.dd-curated-track{grid-auto-columns:calc((100% - 14px)/2)}}@media(max-width:800px){.dd-direct-grid{grid-template-columns:repeat(2,1fr)}.dd-curated-head{align-items:flex-start;flex-direction:column;gap:8px}}.dd-curated-progress{display:none;height:3px;background:rgba(107,53,64,.10);border-radius:999px;overflow:hidden;margin:12px auto 0;max-width:110px}.dd-curated-progress i{display:block;height:100%;width:0;background:#A8583D;border-radius:inherit;transition:width .22s ease}@media(max-width:679px){.dd-direct-inner,.dd-curated-inner{padding:0 16px}.dd-direct-grid{gap:9px}.dd-direct-grid img{height:115px}.dd-direct-grid div{padding:10px}.dd-direct-grid strong{font-size:13px}.dd-direct-grid small{font-size:10px}.dd-curated{padding-bottom:42px}.dd-curated-head{margin-bottom:8px}.dd-curated-tabs{padding-bottom:12px}.dd-curated-shell{display:block}.dd-curated-arrow{display:none!important}.dd-curated-track{grid-auto-columns:calc((100% - 10px)/2);gap:10px;padding:2px 0 5px;overscroll-behavior-inline:contain;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch}.dd-pick-card{border-radius:16px;scroll-snap-align:start}.dd-pick-media{height:136px}.dd-pick-media span{top:7px;inset-inline-start:7px;font-size:8px;padding:4px 6px}.dd-pick-body{padding:9px 9px 10px}.dd-pick-body small{font-size:8px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dd-pick-body h3{font-size:12px;line-height:1.4;margin:3px 0 0;min-height:34px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.dd-pick-body p{display:none}.dd-pick-bottom{display:grid;grid-template-columns:1fr;gap:7px;margin-top:7px;align-items:stretch}.dd-pick-bottom strong{font-size:12px}.dd-pick-bottom button,.dd-pick-bottom a{width:100%;padding:8px 6px;font-size:9px;text-align:center}.dd-curated-progress{display:block;width:84px;margin-top:13px}.dd-curated-head h2{font-size:24px}}
  `;document.head.appendChild(s)}

  async function mount(){
    if(document.getElementById('ddDirectCategories'))return;const planner=findPlanner();if(!planner){setTimeout(mount,250);return}style();
    const direct=categorySection(),curated=curatedSection();planner.insertAdjacentElement('afterend',direct);direct.insertAdjacentElement('afterend',curated);bind();
    try{await loadLive();const legacy=document.getElementById('gifts');if(legacy&&!legacy.contains(curated))legacy.classList.add('dd-home-legacy-picks-hidden');render()}catch(e){console.error('Dear Day home curated picks',e);document.getElementById('ddCuratedTrack').innerHTML=`<div class="dd-curated-empty">${t('تعذر تحميل المختارات الآن. تقدر تدخل الأقسام مباشرة من الكروت اللي فوق.','Could not load the picks right now. You can still browse the categories above.')}</div>`;document.querySelector('.dd-curated-next').disabled=true}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,200),{once:true});else setTimeout(mount,200);
})();