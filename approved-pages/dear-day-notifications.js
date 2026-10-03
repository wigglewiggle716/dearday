(function(){
  const SUPABASE_ESM='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';
  const CONFIG_SRC='/approved-pages/dear-day-supabase-config.js?v=20261002-1';
  const ADMIN_ROLES=new Set(['super_admin','admin']);
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  let supabase;
  async function loadConfig(){if(window.DEAR_DAY_SUPABASE)return window.DEAR_DAY_SUPABASE;await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=CONFIG_SRC;s.onload=resolve;s.onerror=reject;(document.head||document.documentElement).appendChild(s)});return window.DEAR_DAY_SUPABASE}
  function backFor(role){if(['super_admin','admin'].includes(role))return'/Dear-Day-Admin.html';if(role==='accountant')return'/Dear-Day-Finance.html';if(role==='partner_user')return'/Dear-Day-Partner.html';return'/Dear-Day-Account.html'}
  function when(v){try{return new Intl.DateTimeFormat('ar-EG',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v))}catch{return String(v||'')}}

  function adminNotificationsStyle(){
    if(document.getElementById('dd-notifications-admin-style'))return;
    const style=document.createElement('style');style.id='dd-notifications-admin-style';style.textContent=`
      body.dd-admin-notifications{background:#f7f2ed!important}
      body.dd-admin-notifications .dd-notifications-layout{min-height:100vh;display:block}
      body.dd-admin-notifications .sidebar{background:#6B3540;color:#fff;padding:24px 18px}
      body.dd-admin-notifications .brand{padding:0 10px 22px;border-bottom:1px solid rgba(255,255,255,.15)}
      body.dd-admin-notifications .brand strong{display:block;font-size:23px}.brand span{font-size:11px;opacity:.72}
      body.dd-admin-notifications .nav{display:grid;gap:7px;margin-top:24px}
      body.dd-admin-notifications .nav a{width:100%;text-align:right;background:transparent;color:#fff;padding:12px 14px;border-radius:13px;font:700 13px/1.2 'Noto Sans Arabic',Tahoma,Arial,sans-serif;text-decoration:none;opacity:.82}
      body.dd-admin-notifications .nav a.active{background:rgba(255,255,255,.14);opacity:1}
      body.dd-admin-notifications .sidebar-foot{border-top:1px solid rgba(255,255,255,.15);padding-top:14px}
      body.dd-admin-notifications .sidebar-foot p{font-size:11px;opacity:.72;margin:0 0 10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      body.dd-admin-notifications .logout{width:100%;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;border-radius:12px;padding:10px;font:700 12px 'Noto Sans Arabic',Tahoma,Arial,sans-serif;cursor:pointer}
      body.dd-admin-notifications .main{padding:30px;min-height:100vh}
      body.dd-admin-notifications .wrap{width:min(980px,100%);padding:18px 0 80px}
      body.dd-admin-notifications .head{margin-bottom:22px}
      body.dd-admin-notifications #backLink{display:none}
      @media(max-width:760px){body.dd-admin-notifications .main{padding:20px 14px}body.dd-admin-notifications .wrap{padding-top:8px}}
    `;(document.head||document.documentElement).appendChild(style);
  }

  async function enableAdminLayout(user){
    if(document.body.classList.contains('dd-admin-notifications'))return;
    const content=document.querySelector('main.wrap');if(!content)return;
    adminNotificationsStyle();
    document.body.classList.add('dd-admin-notifications');
    const layout=document.createElement('div');layout.className='layout dd-notifications-layout';
    const sidebar=document.createElement('aside');sidebar.className='sidebar';sidebar.innerHTML=`<div class="brand"><strong>Dear Day</strong><span>Admin Panel</span></div><nav class="nav"></nav><div class="sidebar-foot"><p>${esc(user?.email||'Admin')}</p><button id="ddNotificationsLogout" class="logout" type="button">تسجيل الخروج</button></div>`;
    const adminMain=document.createElement('main');adminMain.className='main';
    content.replaceWith(layout);layout.append(sidebar,adminMain);adminMain.appendChild(content);
    document.getElementById('ddNotificationsLogout')?.addEventListener('click',async()=>{try{await supabase.auth.signOut()}catch(e){}location.replace('/Dear-Day-Auth.html#login')});
    await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/approved-pages/dear-day-admin-shell.js?v=20261003-3';s.onload=resolve;s.onerror=reject;(document.body||document.documentElement).appendChild(s)});
  }

  async function refresh(){
    const status=document.getElementById('status'),list=document.getElementById('notificationsList'),count=document.getElementById('unreadCount');
    const {data,error}=await supabase.from('notifications').select('*').order('created_at',{ascending:false}).limit(100);if(error)throw error;
    const rows=data||[],unread=rows.filter(x=>!x.is_read).length;count.textContent=unread;count.hidden=!unread;status.textContent=rows.length?`${rows.length} إشعار`:'لا توجد إشعارات جديدة.';
    if(!rows.length){list.innerHTML='<div class="empty">مفيش إشعارات لحد دلوقتي.</div>';return}
    list.innerHTML=rows.map(n=>`<article class="notice ${n.is_read?'':'unread'}" data-id="${esc(n.id)}"><div class="notice-top"><div><h2>${n.is_read?'':'<span class="dot"></span>'}${esc(n.title_ar)}</h2><p>${esc(n.body_ar)}</p></div><time>${esc(when(n.created_at))}</time></div></article>`).join('');
    list.querySelectorAll('.notice.unread').forEach(el=>el.addEventListener('click',async()=>{const {error}=await supabase.rpc('mark_notification_read',{p_notification_id:el.dataset.id});if(!error){el.classList.remove('unread');el.querySelector('.dot')?.remove();refresh().catch(()=>{})}}));
  }
  async function boot(){
    try{
      const cfg=await loadConfig();const mod=await import(SUPABASE_ESM);supabase=mod.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
      const {data:{user}}=await supabase.auth.getUser();if(!user){location.replace('/Dear-Day-Auth.html?next='+encodeURIComponent('/Dear-Day-Notifications.html')+'#login');return}
      const {data:profile}=await supabase.from('profiles').select('role').eq('id',user.id).single();const role=profile?.role||'customer';
      document.getElementById('backLink').href=backFor(role);
      if(ADMIN_ROLES.has(role))await enableAdminLayout(user);
      document.getElementById('markAll').onclick=async()=>{const {error}=await supabase.rpc('mark_all_notifications_read');if(!error)refresh().catch(()=>{})};
      await refresh();
    }catch(err){console.error(err);const s=document.getElementById('status');s.textContent='تعذر تحميل الإشعارات.';s.classList.add('error')}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
