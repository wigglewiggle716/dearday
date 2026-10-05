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