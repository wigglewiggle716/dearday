(function(){
  const ADMIN_ROLES=new Set(['super_admin','admin']);
  const ADMIN_NAV=[
    {href:'/Dear-Day-Admin.html',label:'نظرة عامة'},
    {href:'/Dear-Day-Admin-Orders.html',label:'الطلبات'},
    {href:'/Dear-Day-Admin-Partners.html',label:'الشركاء'},
    {href:'/Dear-Day-Admin-Products.html',label:'المنتجات والخدمات'},
    {href:'/Dear-Day-Admin-Approvals.html',label:'الموافقات'},
    {href:'/Dear-Day-Admin-Availability.html',label:'التوفر والمواعيد'},
    {href:'/Dear-Day-Admin-Refund-Policies.html',label:'سياسات الإلغاء والاسترداد'},
    {href:'/Dear-Day-Admin-Cancellations.html',label:'الإلغاءات والاسترداد'},
    {href:'/Dear-Day-Notifications.html',label:'الإشعارات'},
    {href:'/Dear-Day-Admin-Customers.html',label:'العملاء'},
    {href:'/Dear-Day-Admin-Employees.html',label:'الموظفون والصلاحيات'},
    {href:'/Dear-Day-Finance.html',label:'المالية والتسويات'}
  ];
  const STAFF_NAV=[
    {href:'/Dear-Day-Staff.html',label:'بوابة الفريق'},
    {href:'/Dear-Day-Admin-Orders.html',label:'الطلبات',perm:'orders.view'},
    {href:'/Dear-Day-Admin-Partners.html',label:'الشركاء',perm:'partners.view'},
    {href:'/Dear-Day-Admin-Products.html',label:'المنتجات والخدمات',perm:'catalog.view'},
    {href:'/Dear-Day-Admin-Approvals.html',label:'الموافقات',perm:'approvals.review'},
    {href:'/Dear-Day-Admin-Availability.html',label:'التوفر والمواعيد',perm:'availability.view'},
    {href:'/Dear-Day-Admin-Refund-Policies.html',label:'سياسات الإلغاء والاسترداد',perm:'approvals.review'},
    {href:'/Dear-Day-Admin-Cancellations.html',label:'الإلغاءات والاسترداد',perm:'approvals.review'},
    {href:'/Dear-Day-Notifications.html',label:'الإشعارات'},
    {href:'/Dear-Day-Admin-Customers.html',label:'العملاء',perm:'customers.view'},
    {href:'/Dear-Day-Admin-Employees.html',label:'الموظفون والصلاحيات',perm:'employees.view'},
    {href:'/Dear-Day-Finance.html',label:'المالية والتسويات',perm:'finance.view'}
  ];
  const SUPABASE_ESM='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';
  const CONFIG_SRC='/approved-pages/dear-day-supabase-config.js?v=20261002-1';

  function normalizePath(v){
    const p=String(v||'').split('?')[0].split('#')[0];
    return p==='/'?'/':p.replace(/\/+$/,'');
  }

  function renderSidebar(navItems){
    const sidebar=document.querySelector('.sidebar');
    const nav=sidebar?.querySelector('.nav');
    if(!sidebar||!nav)return;
    const current=normalizePath(location.pathname).toLowerCase();
    nav.innerHTML=navItems.map(({href,label})=>{
      const active=normalizePath(href).toLowerCase()===current;
      return `<a${active?' class="active" aria-current="page"':''} href="${href}">${label}</a>`;
    }).join('');
  }

  async function loadShellContext(){
    let cfg=window.DEAR_DAY_SUPABASE;
    if(!cfg){
      await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=CONFIG_SRC;s.onload=resolve;s.onerror=reject;(document.head||document.documentElement).appendChild(s)});
      cfg=window.DEAR_DAY_SUPABASE;
    }
    if(!cfg)return null;
    const mod=await import(SUPABASE_ESM);
    const storage=localStorage.getItem('ddAuthRemember')==='0'?sessionStorage:localStorage;
    const client=mod.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage}});
    const {data:{user}}=await client.auth.getUser();
    if(!user)return {client,user:null,role:null,permissions:new Set()};
    const [{data:profile},{data:rows}]=await Promise.all([
      client.from('profiles').select('role,is_active').eq('id',user.id).maybeSingle(),
      client.rpc('get_my_permissions')
    ]);
    const permissions=new Set((rows||[]).map(x=>x.permission_code));
    return {client,user,role:profile?.role||null,isActive:profile?.is_active!==false,permissions};
  }

  function navForContext(ctx){
    if(!ctx?.user)return [];
    if(ADMIN_ROLES.has(ctx.role))return ADMIN_NAV;
    return STAFF_NAV.filter(item=>!item.perm||ctx.permissions.has(item.perm));
  }

  async function ensureSidebarFooter(sidebar,ctx){
    let foot=sidebar.querySelector('.sidebar-foot');
    if(!foot){
      foot=document.createElement('div');
      foot.className='sidebar-foot';
      foot.innerHTML='<p id="adminEmail">—</p><button id="logoutBtn" class="logout" type="button">تسجيل الخروج</button>';
      sidebar.appendChild(foot);
    }
    const email=foot.querySelector('#adminEmail');
    if(email)email.textContent=ctx?.user?.email||'—';
    const button=foot.querySelector('#logoutBtn');
    if(button&&!button.dataset.ddBound){
      button.dataset.ddBound='1';
      button.addEventListener('click',async()=>{try{await ctx?.client?.auth.signOut()}catch(e){}location.replace('/auth#login')});
    }
  }

  function labelPortal(sidebar,role){
    const span=sidebar.querySelector('.brand span');
    if(!span)return;
    span.textContent=ADMIN_ROLES.has(role)?'Admin Panel':role==='accountant'?'Finance Portal':'Staff Portal';
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

  function ensureStyles(){
    if(document.getElementById('dd-admin-shell-style'))return;
    const style=document.createElement('style');
    style.id='dd-admin-shell-style';
    style.textContent=`
      @media(min-width:761px){
        .layout{display:block!important;min-height:100vh!important}
        .sidebar{position:fixed!important;top:0!important;right:0!important;bottom:0!important;left:auto!important;width:260px!important;height:100dvh!important;min-height:0!important;max-height:100dvh!important;overflow:hidden!important;overscroll-behavior:contain!important;display:flex!important;flex-direction:column!important;z-index:50!important;background:#6B3540!important;padding-bottom:0!important}
        .sidebar .brand{flex:0 0 auto!important}
        .sidebar .nav{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;margin-bottom:0!important;padding-bottom:14px!important;scrollbar-width:thin!important;scrollbar-color:rgba(255,255,255,.24) transparent!important}
        .sidebar .nav::-webkit-scrollbar{width:6px}.sidebar .nav::-webkit-scrollbar-thumb{background:rgba(255,255,255,.24);border-radius:999px}
        .sidebar-foot{position:relative!important;right:auto!important;left:auto!important;bottom:auto!important;margin-top:0!important;padding:14px 0 max(16px,env(safe-area-inset-bottom))!important;flex:0 0 auto!important;background:#6B3540!important;z-index:2!important;border-top:1px solid rgba(255,255,255,.15)!important}
        .sidebar-foot p{font-size:11px!important;opacity:.72!important;margin:0 0 10px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;color:#fff!important}
        .sidebar-foot .logout{width:100%!important;border:1px solid rgba(255,255,255,.3)!important;background:transparent!important;color:#fff!important;border-radius:12px!important;padding:10px!important;font:700 12px 'Noto Sans Arabic',Tahoma,Arial,sans-serif!important;cursor:pointer!important}
        .main{margin-right:260px!important;min-height:100vh!important}
      }
      .dd-admin-site-nav{position:sticky;top:0;z-index:35;margin:-30px -30px 24px;padding:10px 30px;background:rgba(250,243,234,.96);backdrop-filter:blur(10px);border-bottom:1px solid rgba(107,53,64,.14);display:flex;align-items:center;justify-content:flex-start;min-height:56px}
      .dd-admin-site-nav a{display:inline-flex;align-items:center;min-height:36px;padding:0 14px;border:1px solid rgba(107,53,64,.14);border-radius:999px;background:#fff;color:#6B3540;font-size:11px;font-weight:700;text-decoration:none}
      .dd-admin-site-nav a.dd-site-primary{background:#6B3540;color:#fff;border-color:#6B3540}
      .dd-admin-site-nav a.dd-site-primary:hover{background:#522731}
      #ddCategoryFilter{height:44px;border:1px solid rgba(107,53,64,.14);border-radius:13px;background:#fff;padding:0 12px;font:inherit;color:#352D2E}
      @media(max-width:760px){
        .sidebar{position:relative!important;top:auto!important;right:auto!important;bottom:auto!important;left:auto!important;width:auto!important;height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;display:block!important;padding-bottom:16px!important}
        .sidebar .nav{overflow-x:auto!important;overflow-y:visible!important;padding-bottom:4px!important}
        .sidebar-foot{position:static!important;margin-top:14px!important;padding:14px 0 0!important}
        .main{margin-right:0!important}
        .dd-admin-site-nav{margin:-20px -14px 20px!important;padding:9px 14px!important;min-height:54px}
      }
    `;
    document.head.appendChild(style);
  }

  async function mount(){
    const sidebar=document.querySelector('.sidebar');
    const main=document.querySelector('.main');
    if(!sidebar||!main)return;
    ensureStyles();
    simplifySiteNav(main);
    setupCatalogSectionFilter();
    try{
      const ctx=await loadShellContext();
      if(!ctx?.user||ctx.isActive===false)return;
      renderSidebar(navForContext(ctx));
      labelPortal(sidebar,ctx.role);
      await ensureSidebarFooter(sidebar,ctx);
    }catch(e){console.error('Dear Day shell:',e)}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
