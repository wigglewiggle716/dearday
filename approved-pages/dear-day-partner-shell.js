/* Dear Day — Partner portal shared sidebar.
   Single source of truth for the partner navigation. Loaded right after </aside>
   on every partner page so the menu is identical everywhere and renders before first paint. */
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
  var cur=norm(location.pathname);
  nav.innerHTML=PARTNER_NAV.map(function(i){
    var a=norm(i[0])===cur;
    return '<a'+(a?' class="active" aria-current="page"':'')+' href="'+i[0]+'">'+i[1]+'</a>';
  }).join('');
  /* keep the sidebar's scroll position across page loads so it feels persistent */
  try{
    var y=parseInt(sessionStorage.getItem(KEY),10);
    if(y>0)sidebar.scrollTop=y;
    nav.addEventListener('click',function(){try{sessionStorage.setItem(KEY,String(sidebar.scrollTop))}catch(e){}});
    window.addEventListener('pagehide',function(){try{sessionStorage.setItem(KEY,String(sidebar.scrollTop))}catch(e){}});
  }catch(e){}
})();