/* Dear Day — Partner portal shared sidebar. */
(function(){
  var PARTNER_NAV=[
    ['/Dear-Day-Partner.html','نظرة عامة'],
    ['/Dear-Day-Partner-Orders.html','طلباتي'],
    ['/Dear-Day-Partner-Products.html','منتجاتي وخدماتي'],
    ['/Dear-Day-Partner-Availability.html','التوفر والمواعيد'],
    ['/Dear-Day-Partner-Refund-Policies.html','سياسات الإلغاء والاسترداد'],
    ['/Dear-Day-Partner-Cancellations.html','الإلغاءات والاسترداد'],
    ['/Dear-Day-Notifications.html','الإشعارات']
  ];
  var KEY='ddPartnerSidebarScroll';
  function norm(p){p=String(p||'').split('?')[0].split('#')[0];return(p==='/'?'/':p.replace(/\/+$/,'')).toLowerCase()}
  var sidebar=document.querySelector('.sidebar');
  var nav=sidebar&&sidebar.querySelector('.nav');
  if(!nav)return;

  if(!document.getElementById('dd-partner-shell-style')){
    var style=document.createElement('style');
    style.id='dd-partner-shell-style';
    style.textContent=`
      .dd-partner-menu-btn{display:none}
      .dd-partner-quick-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
      .dd-partner-quick-actions a{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 13px;border:1px solid var(--line);border-radius:11px;background:#fff;color:var(--wine);font-size:11px;font-weight:700;text-decoration:none}
      .dd-partner-quick-actions a.primary{background:var(--wine);border-color:var(--wine);color:#fff}
      @media(max-width:760px){
        .sidebar{position:relative!important;height:auto!important;max-height:none!important;overflow:visible!important;padding:15px!important}
        .sidebar .brand{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;padding-bottom:14px!important}
        .dd-partner-menu-btn{display:grid;width:42px;height:42px;place-content:center;gap:4px;border:1px solid rgba(255,255,255,.28);border-radius:12px;background:rgba(255,255,255,.08);padding:0;cursor:pointer}
        .dd-partner-menu-btn span{display:block;width:18px;height:2px;border-radius:2px;background:#fff}
        .sidebar .nav{display:none!important;grid-template-columns:1fr!important;gap:6px!important;overflow:visible!important;margin-top:12px!important;padding:0!important}
        .sidebar.dd-mobile-open .nav{display:grid!important}
        .sidebar .nav a{text-align:right!important;white-space:normal!important;width:100%!important;padding:12px 14px!important;background:rgba(255,255,255,.06)!important}
        .sidebar .nav a.active{background:rgba(255,255,255,.16)!important}
        .sidebar-foot{display:none!important;position:static!important;margin-top:10px!important;padding-top:14px!important}
        .sidebar.dd-mobile-open .sidebar-foot{display:block!important}
        .main{padding:20px 14px!important}
        .topbar{display:block!important;margin-bottom:18px!important}
        .topbar>div:last-child{margin-top:12px!important;display:flex!important;gap:8px!important;align-items:center!important;flex-wrap:wrap!important}
        .topbar h1{font-size:25px!important}
        .dd-partner-quick-actions a{display:none!important}
        .panel-head{gap:10px!important;align-items:flex-start!important;flex-wrap:wrap!important}
        .toolbar{display:grid!important;grid-template-columns:1fr!important}
        .toolbar input,.toolbar select,.toolbar .btn{width:100%!important;min-width:0!important}
      }
      @media(max-width:480px){
        .cards{grid-template-columns:1fr!important}
        .stat{padding:15px!important}
        .stat strong{font-size:23px!important}
        .dd-partner-quick-actions{display:flex;width:100%}
      }
    `;
    document.head.appendChild(style);
  }

  var cur=norm(location.pathname);
  nav.innerHTML=PARTNER_NAV.map(function(i){var a=norm(i[0])===cur;return '<a'+(a?' class="active" aria-current="page"':'')+' href="'+i[0]+'">'+i[1]+'</a>'}).join('');

  var brand=sidebar.querySelector('.brand');
  if(brand&&!brand.querySelector('.dd-partner-menu-btn')){
    var btn=document.createElement('button');
    btn.type='button';btn.className='dd-partner-menu-btn';btn.setAttribute('aria-label','فتح قائمة بوابة الشريك');btn.setAttribute('aria-expanded','false');
    btn.innerHTML='<span></span><span></span><span></span>';
    brand.appendChild(btn);
    function sync(){var open=sidebar.classList.contains('dd-mobile-open');btn.setAttribute('aria-expanded',String(open));btn.setAttribute('aria-label',open?'إغلاق قائمة بوابة الشريك':'فتح قائمة بوابة الشريك')}
    btn.addEventListener('click',function(){sidebar.classList.toggle('dd-mobile-open');sync()});
    nav.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){sidebar.classList.remove('dd-mobile-open');sync()})});
    window.addEventListener('resize',function(){if(innerWidth>760){sidebar.classList.remove('dd-mobile-open');sync()}});
  }

  try{
    var y=parseInt(sessionStorage.getItem(KEY),10);if(y>0)sidebar.scrollTop=y;
    nav.addEventListener('click',function(){try{sessionStorage.setItem(KEY,String(sidebar.scrollTop))}catch(e){}});
    window.addEventListener('pagehide',function(){try{sessionStorage.setItem(KEY,String(sidebar.scrollTop))}catch(e){}});
  }catch(e){}
})();