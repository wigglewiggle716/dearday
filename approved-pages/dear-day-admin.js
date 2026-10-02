(function(){
  const SUPABASE_ESM='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';
  const CONFIG_SRC='/approved-pages/dear-day-supabase-config.js?v=20261002-1';
  const ADMIN_ROLES=new Set(['super_admin','admin']);
  const OPEN_STATUSES=['draft','pending_payment','paid','confirmed','in_progress'];
  let supabase,user,profile;

  function $(id){return document.getElementById(id)}
  function showError(msg){const el=$('errorBox');if(!el)return;el.textContent=msg||'حدث خطأ غير متوقع.';el.style.display='block'}
  function loadConfig(){if(window.DEAR_DAY_SUPABASE)return Promise.resolve(window.DEAR_DAY_SUPABASE);return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=CONFIG_SRC;s.onload=()=>resolve(window.DEAR_DAY_SUPABASE);s.onerror=reject;document.head.appendChild(s)})}
  function money(v,c='EGP'){return new Intl.NumberFormat('ar-EG',{style:'currency',currency:c||'EGP',maximumFractionDigits:2}).format(Number(v||0))}
  function date(v){if(!v)return'—';try{return new Intl.DateTimeFormat('ar-EG',{year:'numeric',month:'short',day:'numeric'}).format(new Date(v))}catch{return v}}
  function occasionDate(v){if(!v)return'—';const p=String(v).split('-');return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:v}
  function roleLabel(r){return ({super_admin:'Super Admin',admin:'Admin'})[r]||r||'—'}
  function statusLabel(s){return ({draft:'مسودة',pending_payment:'بانتظار الدفع',paid:'مدفوع',confirmed:'مؤكد',in_progress:'قيد التنفيذ',completed:'مكتمل',cancelled:'ملغي',refunded:'مسترد'})[s]||s||'—'}
  function statusClass(s){if(['paid','confirmed','completed'].includes(s))return'good';if(['draft','pending_payment','in_progress'].includes(s))return'warn';if(['cancelled','refunded'].includes(s))return'bad';return''}

  async function count(table,build){let q=supabase.from(table).select('*',{count:'exact',head:true});if(build)q=build(q);const {count,error}=await q;if(error)throw error;return count||0}

  async function loadStats(){
    const [orders,openOrders,customers,partners,listings,pending]=await Promise.all([
      count('orders'),
      count('orders',q=>q.in('status',OPEN_STATUSES)),
      count('profiles',q=>q.eq('role','customer')),
      count('partners'),
      count('listings'),
      count('listing_versions',q=>q.eq('status','pending_review'))
    ]);
    $('statOrders').textContent=orders;
    $('statOpenOrders').textContent=openOrders;
    $('statCustomers').textContent=customers;
    $('statPartners').textContent=partners;
    $('statListings').textContent=listings;
    $('statPending').textContent=pending;
  }

  async function loadOrders(){
    const {data,error}=await supabase.from('orders').select('id,order_number,status,occasion_type,occasion_date,delivery_area,grand_total,currency,created_at').order('created_at',{ascending:false}).limit(10);
    if(error)throw error;
    const body=$('ordersBody'),empty=$('ordersEmpty');body.innerHTML='';
    if(!data?.length){empty.hidden=false;return}
    empty.hidden=true;
    for(const o of data){
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>#DD${String(o.order_number??'—')}</td><td><span class="badge ${statusClass(o.status)}">${statusLabel(o.status)}</span></td><td>${escapeHtml(o.occasion_type||'—')}</td><td>${occasionDate(o.occasion_date)}</td><td>${escapeHtml(o.delivery_area||'—')}</td><td>${money(o.grand_total,o.currency)}</td><td>${date(o.created_at)}</td>`;
      body.appendChild(tr);
    }
  }

  function escapeHtml(value){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]))}

  async function boot(){
    try{
      const cfg=await loadConfig();
      const mod=await import(SUPABASE_ESM);
      supabase=mod.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
      const {data:{user:currentUser},error:userError}=await supabase.auth.getUser();
      if(userError||!currentUser){location.replace('/Dear-Day-Auth.html#login');return}
      user=currentUser;
      const {data:p,error:pError}=await supabase.from('profiles').select('id,full_name,role,is_active').eq('id',user.id).single();
      if(pError||!p||!p.is_active||!ADMIN_ROLES.has(p.role)){location.replace('/Dear-Day-Account.html');return}
      profile=p;
      $('adminEmail').textContent=user.email||p.full_name||'Admin';
      $('roleBadge').textContent=roleLabel(p.role);
      $('logoutBtn').addEventListener('click',async()=>{await supabase.auth.signOut();location.replace('/Dear-Day-Auth.html#login')});
      await Promise.all([loadStats(),loadOrders()]);
    }catch(err){console.error(err);showError('تعذر تحميل لوحة الإدارة. راجع الاتصال والصلاحيات ثم حاول مرة أخرى.');}
    finally{$('loading').style.display='none'}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();