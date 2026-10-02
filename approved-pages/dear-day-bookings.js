(function(){
  const SUPABASE_ESM='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';
  const CONFIG_SRC='/approved-pages/dear-day-supabase-config.js?v=20261002-1';
  const en=()=>String(document.documentElement.lang||'').toLowerCase().startsWith('en');
  const t=(ar,enText)=>en()?enText:ar;
  const authPath=()=>en()?'/Dear-Day-Auth-en.html':'/Dear-Day-Auth.html';
  const occasionPath=()=>en()?'/approved-pages/Dear-Day-Occasions-Approved-en.html':'/approved-pages/Dear-Day-Occasions-Approved.html';
  const money=(n,c='EGP')=>new Intl.NumberFormat(en()?'en-EG':'ar-EG',{style:'currency',currency:c||'EGP',maximumFractionDigits:2}).format(Number(n||0));
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const statusLabels={draft:['مسودة','Draft'],pending_payment:['في انتظار الدفع','Pending payment'],paid:['تم الدفع','Paid'],confirmed:['مؤكد','Confirmed'],in_progress:['جاري التنفيذ','In progress'],completed:['مكتمل','Completed'],cancelled:['ملغي','Cancelled'],refunded:['تم رد المبلغ','Refunded']};
  function loadConfig(){if(window.DEAR_DAY_SUPABASE)return Promise.resolve(window.DEAR_DAY_SUPABASE);return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=CONFIG_SRC;s.onload=()=>resolve(window.DEAR_DAY_SUPABASE);s.onerror=reject;document.head.appendChild(s)})}
  function statusText(s){const x=statusLabels[s]||[s,s];return en()?x[1]:x[0]}
  function dateText(v){if(!v)return t('غير محدد','Not set');const d=new Date(v+'T12:00:00');return new Intl.DateTimeFormat(en()?'en-EG':'ar-EG',{year:'numeric',month:'long',day:'numeric'}).format(d)}
  function renderEmpty(){document.getElementById('bookingsList').innerHTML=`<section class="empty"><div class="icon">♡</div><h2>${esc(t('لا توجد حجوزات حتى الآن','No bookings yet'))}</h2><p>${esc(t('ابدأ ترتيب مناسبتك، وبعد إنشاء أول طلب هيظهر هنا تلقائيًا.','Start planning your occasion and your first order will appear here automatically.'))}</p><a href="${occasionPath()}">${esc(t('رتّب مناسبتي','Plan my occasion'))}</a></section>`}
  function renderOrders(orders){
    if(!orders.length){renderEmpty();return}
    const host=document.getElementById('bookingsList');
    host.innerHTML=orders.map(o=>{const items=(o.order_items||[]).map(i=>`<li><span>${esc(i.item_name)}</span><span>${esc(i.quantity)} × ${money(i.line_total/Math.max(Number(i.quantity)||1,1),o.currency)}</span></li>`).join('');return `<article class="booking-card"><div class="booking-head"><div><span class="eyebrow">${esc(t('طلب','Order'))} #${esc(o.order_number)}</span><h2>${esc(o.occasion_type||t('مناسبة Dear Day','Dear Day occasion'))}</h2></div><span class="status-pill status-${esc(o.status)}">${esc(statusText(o.status))}</span></div><div class="booking-meta"><div><small>${esc(t('تاريخ المناسبة','Occasion date'))}</small><strong>${esc(dateText(o.occasion_date))}</strong></div><div><small>${esc(t('المنطقة','Area'))}</small><strong>${esc(o.delivery_area||t('غير محدد','Not set'))}</strong></div><div><small>${esc(t('الإجمالي','Total'))}</small><strong>${money(o.grand_total,o.currency)}</strong></div></div>${items?`<ul class="items">${items}</ul>`:''}<div class="created">${esc(t('تاريخ إنشاء الطلب','Created'))}: ${new Intl.DateTimeFormat(en()?'en-EG':'ar-EG',{year:'numeric',month:'short',day:'numeric'}).format(new Date(o.created_at))}</div></article>`}).join('');
  }
  async function boot(){
    const cfg=await loadConfig();const mod=await import(SUPABASE_ESM);const supabase=mod.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    const {data:userData,error:userError}=await supabase.auth.getUser();if(userError)throw userError;if(!userData?.user){location.replace(authPath()+'#login');return}
    const {data,error}=await supabase.from('orders').select('id,order_number,status,occasion_type,occasion_date,occasion_time,delivery_area,grand_total,currency,created_at,order_items(item_name,quantity,line_total)').neq('status','draft').order('created_at',{ascending:false});
    if(error)throw error;renderOrders(data||[]);
  }
  const start=()=>boot().catch(err=>{console.error(err);const host=document.getElementById('bookingsList');if(host)host.innerHTML=`<section class="empty"><h2>${esc(t('تعذر تحميل الحجوزات','Could not load bookings'))}</h2><p>${esc(t('جرّب تحديث الصفحة مرة أخرى.','Please refresh the page and try again.'))}</p></section>`});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();