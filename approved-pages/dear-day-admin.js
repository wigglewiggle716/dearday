(function(){
  const SUPABASE_ESM='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';
  const CONFIG_SRC='/approved-pages/dear-day-supabase-config.js?v=20261002-1';
  const ADMIN_ROLES=new Set(['super_admin','admin']);
  const OPEN_STATUSES=['draft','pending_payment','paid','confirmed','in_progress'];
  const PAID_STATUSES=['paid','confirmed','in_progress','completed'];
  let supabase,user,profile;
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
  const money=(v,c='EGP')=>new Intl.NumberFormat('ar-EG',{style:'currency',currency:c||'EGP',maximumFractionDigits:2}).format(Number(v||0));
  const date=v=>{if(!v)return'—';try{return new Intl.DateTimeFormat('ar-EG',{year:'numeric',month:'short',day:'numeric'}).format(new Date(v))}catch{return v}};
  const roleLabel=r=>({super_admin:'Super Admin',admin:'Admin'})[r]||r||'—';
  const statusLabel=s=>({draft:'مسودة',pending_payment:'بانتظار الدفع',paid:'مدفوع',confirmed:'مؤكد',in_progress:'قيد التنفيذ',completed:'مكتمل',cancelled:'ملغي',refunded:'مسترد'})[s]||s||'—';
  const statusClass=s=>['paid','confirmed','completed'].includes(s)?'good':['draft','pending_payment','in_progress'].includes(s)?'warn':['cancelled','refunded'].includes(s)?'bad':'';
  const loadConfig=()=>window.DEAR_DAY_SUPABASE?Promise.resolve(window.DEAR_DAY_SUPABASE):new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=CONFIG_SRC;s.onload=()=>resolve(window.DEAR_DAY_SUPABASE);s.onerror=reject;document.head.appendChild(s)});
  function showError(msg){const e=$('errorBox');if(!e)return;e.textContent=msg||'حدث خطأ غير متوقع.';e.style.display='block'}
  async function count(table,build){let q=supabase.from(table).select('*',{count:'exact',head:true});if(build)q=build(q);const{count,error}=await q;if(error)throw error;return count||0}
  async function sumOrders(statuses){const{data,error}=await supabase.from('orders').select('grand_total').in('status',statuses);if(error)throw error;return(data||[]).reduce((a,x)=>a+Number(x.grand_total||0),0)}
  async function loadOverview(){
    const [orders,openOrders,customers,activePartners,pending,cancelled,paidRevenue,partnerOrders,settlementItems,settlements]=await Promise.all([
      count('orders'),
      count('orders',q=>q.in('status',OPEN_STATUSES)),
      count('profiles',q=>q.eq('role','customer')),
      count('partners',q=>q.eq('status','active')),
      count('listing_versions',q=>q.eq('status','pending_review')),
      count('orders',q=>q.in('status',['cancelled','refunded'])),
      sumOrders(PAID_STATUSES),
      supabase.from('partner_orders').select('id,partner_net').eq('status','completed'),
      supabase.from('settlement_items').select('partner_order_id'),
      supabase.from('partner_settlements').select('status,partner_net')
    ]);
    for(const r of[partnerOrders,settlementItems,settlements])if(r.error)throw r.error;
    const used=new Set((settlementItems.data||[]).map(x=>x.partner_order_id));
    const unsettled=(partnerOrders.data||[]).filter(x=>!used.has(x.id)).reduce((a,x)=>a+Number(x.partner_net||0),0);
    const settlementSum=status=>(settlements.data||[]).filter(x=>x.status===status).reduce((a,x)=>a+Number(x.partner_net||0),0);
    $('statOrders').textContent=orders;
    $('statOpenOrders').textContent=openOrders;
    $('statCustomers').textContent=customers;
    $('statPartners').textContent=activePartners;
    $('statPending').textContent=pending;
    $('statUnsettled').textContent=money(unsettled);
    $('statPaidRevenue').textContent=money(paidRevenue);
    $('statCancelled').textContent=cancelled;
    $('financeDraft').textContent=money(settlementSum('draft'));
    $('financeApproved').textContent=money(settlementSum('approved'));
    $('financePaid').textContent=money(settlementSum('paid'));
    $('financeUnsettled').textContent=money(unsettled);
  }
  async function loadOrders(){
    const{data,error}=await supabase.from('orders').select('id,order_number,status,occasion_type,delivery_area,grand_total,currency,created_at').order('created_at',{ascending:false}).limit(8);
    if(error)throw error;
    $('ordersBody').innerHTML=(data||[]).map(o=>`<tr><td><strong>#DD${esc(o.order_number)}</strong></td><td><span class="badge ${statusClass(o.status)}">${statusLabel(o.status)}</span></td><td>${esc(o.occasion_type||'—')}</td><td>${esc(o.delivery_area||'—')}</td><td>${money(o.grand_total,o.currency)}</td><td>${date(o.created_at)}</td></tr>`).join('');
    $('ordersEmpty').hidden=!!data?.length;
  }
  async function loadApprovals(){
    const{data:versions,error}=await supabase.from('listing_versions').select('id,listing_id,name_ar,name_en,price,currency,submitted_at,created_at').eq('status','pending_review').order('submitted_at',{ascending:true}).order('created_at',{ascending:true}).limit(6);
    if(error)throw error;
    const ids=[...new Set((versions||[]).map(x=>x.listing_id).filter(Boolean))];
    let listings=[],partners=[];
    if(ids.length){const l=await supabase.from('listings').select('id,partner_id').in('id',ids);if(l.error)throw l.error;listings=l.data||[];const pids=[...new Set(listings.map(x=>x.partner_id).filter(Boolean))];if(pids.length){const p=await supabase.from('partners').select('id,name_ar,name_en').in('id',pids);if(p.error)throw p.error;partners=p.data||[]}}
    const partnerName=listingId=>{const l=listings.find(x=>x.id===listingId),p=partners.find(x=>x.id===l?.partner_id);return p?.name_ar||p?.name_en||'—'};
    $('approvalsBody').innerHTML=(versions||[]).map(v=>`<tr><td><strong>${esc(v.name_ar||v.name_en||'بدون اسم')}</strong></td><td>${esc(partnerName(v.listing_id))}</td><td>${money(v.price,v.currency)}</td><td>${date(v.submitted_at||v.created_at)}</td></tr>`).join('');
    $('approvalsEmpty').hidden=!!versions?.length;
  }
  async function boot(){
    try{
      const cfg=await loadConfig(),mod=await import(SUPABASE_ESM);
      const storage=localStorage.getItem('ddAuthRemember')==='0'?sessionStorage:localStorage;
      supabase=mod.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage}});
      const{data:{user:currentUser},error:userError}=await supabase.auth.getUser();
      if(userError||!currentUser){location.replace('/auth#login');return}
      user=currentUser;
      const{data:p,error:pError}=await supabase.from('profiles').select('id,full_name,role,is_active').eq('id',user.id).single();
      if(pError||!p||!p.is_active||!ADMIN_ROLES.has(p.role)){location.replace('/Dear-Day-Staff.html');return}
      profile=p;
      $('roleBadge').textContent=roleLabel(p.role);
      await Promise.all([loadOverview(),loadOrders(),loadApprovals()]);
    }catch(err){console.error(err);showError('تعذر تحميل لوحة الإدارة. راجع الاتصال والصلاحيات ثم حاول مرة أخرى.')}finally{const l=$('loading');if(l)l.style.display='none'}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();