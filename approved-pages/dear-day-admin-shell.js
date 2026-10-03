(function(){
  const ADMIN_NAV=[
    ['/Dear-Day-Admin.html','نظرة عامة'],
    ['/Dear-Day-Admin-Orders.html','الطلبات'],
    ['/Dear-Day-Admin-Partners.html','الشركاء'],
    ['/Dear-Day-Admin-Products.html','المنتجات والخدمات'],
    ['/Dear-Day-Admin-Approvals.html','الموافقات'],
    ['/Dear-Day-Admin-Availability.html','التوفر والمواعيد'],
    ['/Dear-Day-Admin-Refund-Policies.html','سياسات الإلغاء والاسترداد'],
    ['/Dear-Day-Admin-Cancellations.html','الإلغاءات والاسترداد'],
    ['/Dear-Day-Notifications.html','الإشعارات'],
    ['/Dear-Day-Admin-Customers.html','العملاء'],
    ['/Dear-Day-Admin-Employees.html','الموظفون والصلاحيات'],
    ['/Dear-Day-Finance.html','المالية والتسويات']
  ];

  function normalizePath(v){
    const p=String(v||'').split('?')[0].split('#')[0];
    return p==='/'?'/':p.replace(/\/+$/,'');
  }

  function syncSidebar(){
    const sidebar=document.querySelector('.sidebar');
    const nav=sidebar?.querySelector('.nav');
    if(!sidebar||!nav)return;
    const current=normalizePath(location.pathname).toLowerCase();
    nav.innerHTML=ADMIN_NAV.map(([href,label])=>{
      const active=normalizePath(href).toLowerCase()===current;
      return `<a${active?' class="active" aria-current="page"':''} href="${href}">${label}</a>`;
    }).join('');
  }

  function simplifySiteNav(main){
    let nav=main.querySelector('.dd-admin-site-nav,.site-shortcuts');
    if(!nav){
      nav=document.createElement('nav');
      main.insertBefore(nav,main.firstChild);
    }
    nav.className='dd-admin-site-nav';
    nav.setAttribute('aria-label','العودة لموقع Dear Day');
    nav.innerHTML='<a class="dd-site-primary" href="/" target="_blank" rel="noopener">عرض الموقع ↗</a>';
  }

  function setupCatalogSectionFilter(){
    if(!/Dear-Day-Admin-Products\.html$/i.test(location.pathname))return;
    const toolbar=document.querySelector('.toolbar');
    const original=document.getElementById('kindFilter');
    const body=document.getElementById('body');
    if(!toolbar||!original||!body)return;

    original.style.display='none';
    original.value='';

    let select=document.getElementById('ddCategoryFilter');
    if(!select){
      select=document.createElement('select');
      select.id='ddCategoryFilter';
      select.setAttribute('aria-label','فلترة حسب القسم');
      select.innerHTML=`
        <option value="">كل الأقسام</option>
        <option value="gifts">هدايا</option>
        <option value="cakes">كيك وحلويات</option>
        <option value="flowers">ورد</option>
        <option value="places">أماكن وتجارب</option>`;
      original.insertAdjacentElement('afterend',select);
    }

    const normalize=v=>String(v||'').replace(/\s+/g,' ').trim().toLowerCase();
    const matches=(label,key)=>{
      const x=normalize(label);
      if(!key)return true;
      if(key==='gifts')return x.includes('هدايا')||x.includes('gift');
      if(key==='cakes')return x.includes('كيك')||x.includes('حلويات')||x.includes('شوكولات')||x.includes('شيكولات')||x.includes('cake')||x.includes('sweet');
      if(key==='flowers')return x.includes('ورد')||x.includes('زهور')||x.includes('flower');
      if(key==='places')return x.includes('أماكن')||x.includes('اماكن')||x.includes('تجارب')||x.includes('مكان')||x.includes('venue')||x.includes('experience');
      return true;
    };

    const apply=()=>{
      const key=select.value;
      let visible=0;
      body.querySelectorAll('tr[data-id]').forEach(row=>{
        const category=row.cells?.[0]?.querySelector('div')?.textContent||'';
        const show=matches(category,key);
        row.style.display=show?'':'none';
        if(show)visible++;
        if(row.cells?.[2]&&category.trim()&&row.cells[2].textContent.trim()!==category.trim())row.cells[2].textContent=category.trim();
      });
      const table=document.querySelector('.panel table');
      const th=table?.querySelector('thead tr th:nth-child(3)');
      if(th&&th.textContent.trim()!=='القسم')th.textContent='القسم';
      const empty=document.getElementById('emptyState');
      if(empty){
        empty.hidden=visible>0;
        if(!visible&&key)empty.textContent='لا توجد عناصر في هذا القسم.';
        else if(!visible)empty.textContent='لا توجد عناصر مطابقة.';
      }
    };

    select.addEventListener('change',apply);
    let queued=false;
    const observer=new MutationObserver(()=>{
      if(queued)return;
      queued=true;
      requestAnimationFrame(()=>{queued=false;apply()});
    });
    observer.observe(body,{childList:true});
    setTimeout(apply,0);
    setTimeout(apply,250);
    setTimeout(apply,900);
  }

  function mount(){
    const sidebar=document.querySelector('.sidebar');
    const main=document.querySelector('.main');
    if(!sidebar||!main)return;

    if(!document.getElementById('dd-admin-shell-style')){
      const style=document.createElement('style');
      style.id='dd-admin-shell-style';
      style.textContent=`
        @media(min-width:761px){
          .layout{display:block!important;min-height:100vh!important}
          .sidebar{position:fixed!important;top:0!important;right:0!important;bottom:0!important;left:auto!important;width:260px!important;height:100dvh!important;min-height:100vh!important;overflow-y:auto!important;overscroll-behavior:contain!important;display:flex!important;flex-direction:column!important;z-index:50!important;background:#6B3540!important}
          .sidebar .nav{flex:0 0 auto!important}
          .sidebar-foot{position:static!important;right:auto!important;left:auto!important;bottom:auto!important;margin-top:18px!important;padding-top:14px!important;flex:0 0 auto!important}
          .main{margin-right:260px!important;min-height:100vh!important}
        }
        .sidebar::-webkit-scrollbar{width:7px}.sidebar::-webkit-scrollbar-thumb{background:rgba(255,255,255,.22);border-radius:999px}
        .dd-admin-site-nav{position:sticky;top:0;z-index:35;margin:-30px -30px 24px;padding:10px 30px;background:rgba(250,243,234,.96);backdrop-filter:blur(10px);border-bottom:1px solid rgba(107,53,64,.14);display:flex;align-items:center;justify-content:flex-start;min-height:56px}
        .dd-admin-site-nav a{display:inline-flex;align-items:center;min-height:36px;padding:0 14px;border:1px solid rgba(107,53,64,.14);border-radius:999px;background:#fff;color:#6B3540;font-size:11px;font-weight:700;text-decoration:none}
        .dd-admin-site-nav a.dd-site-primary{background:#6B3540;color:#fff;border-color:#6B3540}
        .dd-admin-site-nav a.dd-site-primary:hover{background:#522731}
        #ddCategoryFilter{height:44px;border:1px solid rgba(107,53,64,.14);border-radius:13px;background:#fff;padding:0 12px;font:inherit;color:#352D2E}
        @media(max-width:760px){
          .sidebar{position:relative!important;top:auto!important;right:auto!important;bottom:auto!important;left:auto!important;width:auto!important;height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;display:block!important}
          .sidebar-foot{position:static!important;margin-top:14px!important}
          .main{margin-right:0!important}
          .dd-admin-site-nav{margin:-20px -14px 20px!important;padding:9px 14px!important;min-height:54px}
        }
      `;
      document.head.appendChild(style);
    }

    syncSidebar();
    simplifySiteNav(main);
    setupCatalogSectionFilter();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
