(function(){
  const SUPABASE_ESM='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';
  const CONFIG_SRC='/approved-pages/dear-day-supabase-config.js?v=20261002-1';
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  let supabase;
  async function loadConfig(){if(window.DEAR_DAY_SUPABASE)return window.DEAR_DAY_SUPABASE;await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=CONFIG_SRC;s.onload=resolve;s.onerror=reject;(document.head||document.documentElement).appendChild(s)});return window.DEAR_DAY_SUPABASE}
  function backFor(role){if(['super_admin','admin'].includes(role))return'/Dear-Day-Admin.html';if(role==='accountant')return'/Dear-Day-Finance.html';if(role==='partner_user')return'/Dear-Day-Partner.html';return'/Dear-Day-Account.html'}
  function when(v){try{return new Intl.DateTimeFormat('ar-EG',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v))}catch{return String(v||'')}}
  async function refresh(){
    const status=document.getElementById('status'),list=document.getElementById('notificationsList'),count=document.getElementById('unreadCount');
    const {data,error}=await supabase.from('notifications').select('*').order('created_at',{ascending:false}).limit(100);if(error)throw error;
    const rows=data||[],unread=rows.filter(x=>!x.is_read).length;count.textContent=unread;count.hidden=!unread;status.textContent=rows.length?`${rows.length} إشعار`:'لا توجد إشعارات جديدة.';
    if(!rows.length){list.innerHTML='<div class="empty">مفيش إشعارات لحد دلوقتي.</div>';return}
    list.innerHTML=rows.map(n=>`<article class="notice ${n.is_read?'':'unread'}" data-id="${esc(n.id)}"><div class="notice-top"><div><h2>${n.is_read?'':'<span class="dot"></span>'}${esc(n.title_ar)}</h2><p>${esc(n.body_ar)}</p></div><time>${esc(when(n.created_at))}</time></div></article>`).join('');
    list.querySelectorAll('.notice.unread').forEach(el=>el.addEventListener('click',async()=>{const {error}=await supabase.rpc('mark_notification_read',{p_notification_id:el.dataset.id});if(!error){el.classList.remove('unread');el.querySelector('.dot')?.remove();refresh().catch(()=>{})}}));
  }
  async function boot(){
    try{const cfg=await loadConfig();const mod=await import(SUPABASE_ESM);supabase=mod.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});const {data:{user}}=await supabase.auth.getUser();if(!user){location.replace('/Dear-Day-Auth.html?next='+encodeURIComponent('/Dear-Day-Notifications.html')+'#login');return}const {data:profile}=await supabase.from('profiles').select('role').eq('id',user.id).single();document.getElementById('backLink').href=backFor(profile?.role);document.getElementById('markAll').onclick=async()=>{const {error}=await supabase.rpc('mark_all_notifications_read');if(!error)refresh().catch(()=>{})};await refresh()}catch(err){console.error(err);const s=document.getElementById('status');s.textContent='تعذر تحميل الإشعارات.';s.classList.add('error')}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();