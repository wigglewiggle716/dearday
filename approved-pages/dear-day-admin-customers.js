(function(){
  const SUPABASE_ESM='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';
  const CONFIG_SRC='/approved-pages/dear-day-supabase-config.js?v=20261002-1';
  let supabase,user,profile,customers=[],deletionRequests=[],permissions=new Set(),selectedId=null;
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
  const money=(v,c='EGP')=>new Intl.NumberFormat('ar-EG',{style:'currency',currency:c||'EGP',maximumFractionDigits:0}).format(Number(v||0));
  const date=v=>{if(!v)return'—';try{return new Intl.DateTimeFormat('ar-EG',{year:'numeric',month:'short',day:'numeric'}).format(new Date(v))}catch{return v}};
  const roleLabel=r=>({super_admin:'Super Admin',admin:'Admin'})[r]||r||'—';
  const statusLabel=s=>({draft:'مسودة',pending_payment:'بانتظار الدفع',paid:'مدفوع',confirmed:'مؤكد',in_progress:'قيد التنفيذ',completed:'مكتمل',cancelled:'ملغي',refunded:'مسترد'})[s]||s||'—';
  const loadConfig=()=>window.DEAR_DAY_SUPABASE?Promise.resolve(window.DEAR_DAY_SUPABASE):new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=CONFIG_SRC;s.onload=()=>resolve(window.DEAR_DAY_SUPABASE);s.onerror=reject;document.head.appendChild(s)});
  function show(id,msg){const el=$(id);if(!el)return;el.textContent=msg||'';el.style.display=msg?'block':'none';if(msg)setTimeout(()=>{if(el.textContent===msg)el.style.display='none'},4500)}

  async function guard(){
    const {data:{user:u},error}=await supabase.auth.getUser();
    if(error||!u){location.replace('/Dear-Day-Staff-Login.html');return false}
    user=u;
    const [{data:p,error:pErr},{data:perms,error:permErr}]=await Promise.all([
      supabase.from('profiles').select('id,full_name,role,is_active').eq('id',u.id).single(),
      supabase.rpc('get_my_permissions')
    ]);
    if(pErr||permErr||!p||!p.is_active){location.replace('/Dear-Day-Staff-Login.html');return false}
    profile=p;permissions=new Set((perms||[]).map(x=>x.permission_code));
    if(!permissions.has('customers.view')){location.replace('/Dear-Day-Staff.html');return false}
    $('adminEmail').textContent=u.email||p.full_name||'Admin';$('roleBadge').textContent=roleLabel(p.role);return true;
  }

  async function loadCustomers(){
    const {data,error}=await supabase.rpc('customer_list');
    if(error)throw error;customers=data||[];renderStats();render();
  }

  function renderStats(){
    $('statAll').textContent=customers.length;
    $('statActive').textContent=customers.filter(x=>x.is_active).length;
    $('statSuspended').textContent=customers.filter(x=>!x.is_active).length;
    $('statSpend').textContent=money(customers.reduce((s,x)=>s+Number(x.total_spend||0),0));
  }

  function filtered(){
    const q=$('searchInput').value.trim().toLowerCase(),st=$('statusFilter').value;
    return customers.filter(c=>{
      if(st==='active'&&!c.is_active)return false;if(st==='suspended'&&c.is_active)return false;
      if(!q)return true;
      return [c.full_name,c.first_name,c.last_name,c.email,c.phone,c.area].join(' ').toLowerCase().includes(q);
    });
  }

  function render(){
    const rows=filtered(),body=$('body');body.innerHTML='';$('emptyState').hidden=!!rows.length;
    for(const c of rows){
      const tr=document.createElement('tr');
      tr.innerHTML=`<td><strong>${esc(c.full_name||[c.first_name,c.last_name].filter(Boolean).join(' ')||'بدون اسم')}</strong></td><td>${esc(c.email||'—')}</td><td>${esc(c.phone||'—')}</td><td>${esc(c.area||'—')}</td><td><span class="badge ${c.is_active?'good':'bad'}">${c.is_active?'نشط':'موقوف'}</span></td><td>${Number(c.order_count||0)}</td><td>${money(c.total_spend)}</td><td>${date(c.last_order_at)}</td><td>${date(c.created_at)}</td>`;
      tr.addEventListener('click',()=>openCustomer(c.id));body.appendChild(tr);
    }
  }

  async function openCustomer(id){
    const c=customers.find(x=>x.id===id);if(!c)return;selectedId=id;
    $('drawerTitle').textContent=c.full_name||[c.first_name,c.last_name].filter(Boolean).join(' ')||'عميل Dear Day';
    $('drawerSub').textContent=c.email||'';$('drawerContent').innerHTML='<div class="muted">جاري تحميل التفاصيل…</div>';openDrawer();
    try{
      const [a,o]=await Promise.all([
        supabase.from('customer_addresses').select('id,label,recipient_name,phone,area,address_line1,address_line2,landmark,is_default,created_at').eq('user_id',id).order('is_default',{ascending:false}).order('created_at',{ascending:false}),
        supabase.from('orders').select('id,order_number,status,occasion_type,occasion_date,delivery_area,grand_total,currency,created_at').eq('customer_id',id).order('created_at',{ascending:false}).limit(20)
      ]);
      if(a.error)throw a.error;if(o.error)throw o.error;
      const addresses=a.data||[],orders=o.data||[];
      const addrHtml=addresses.length?addresses.map(x=>`<div class="card"><div class="card-top"><strong>${esc(x.label||'عنوان')}</strong>${x.is_default?'<span class="badge good">Default</span>':''}</div><div class="muted">${esc([x.address_line1,x.address_line2,x.area,x.landmark].filter(Boolean).join(' — '))}</div><div class="muted">${esc(x.recipient_name||'')} ${x.phone?'· '+esc(x.phone):''}</div></div>`).join(''):'<div class="muted">لا توجد عناوين محفوظة.</div>';
      const ordersHtml=orders.length?orders.map(x=>`<div class="card"><div class="card-top"><strong>#DD${esc(x.order_number)}</strong><span class="badge">${esc(statusLabel(x.status))}</span></div><div class="muted">${esc(x.occasion_type||'—')} · ${esc(x.delivery_area||'—')} · ${date(x.created_at)}</div><strong>${money(x.grand_total,x.currency)}</strong></div>`).join(''):'<div class="muted">لا توجد طلبات لهذا العميل.</div>';
      const manage=permissions.has('customers.manage')?`<div class="section"><h3>حالة الحساب</h3><button id="statusAction" class="${c.is_active?'danger':'activate'}" type="button">${c.is_active?'إيقاف حساب العميل':'إعادة تفعيل الحساب'}</button><div class="muted" style="margin-top:6px">إيقاف الحساب يمنع استخدامه كحساب نشط، ولا يحذف الطلبات أو البيانات التاريخية.</div></div>`:'';
      $('drawerContent').innerHTML=`<div class="detail-grid"><div class="detail"><span>الاسم</span><strong>${esc(c.full_name||'—')}</strong></div><div class="detail"><span>البريد</span><strong>${esc(c.email||'—')}</strong></div><div class="detail"><span>الهاتف</span><strong>${esc(c.phone||'—')}</strong></div><div class="detail"><span>المنطقة</span><strong>${esc(c.area||'—')}</strong></div><div class="detail"><span>تاريخ الميلاد</span><strong>${esc(c.birth_date||'—')}</strong></div><div class="detail"><span>الحالة</span><strong>${c.is_active?'نشط':'موقوف'}</strong></div><div class="detail"><span>عدد الطلبات</span><strong>${Number(c.order_count||0)}</strong></div><div class="detail"><span>قيمة الطلبات</span><strong>${money(c.total_spend)}</strong></div></div>${manage}<div class="section"><h3>العناوين المحفوظة</h3>${addrHtml}</div><div class="section"><h3>آخر الطلبات</h3>${ordersHtml}</div>`;
      const b=$('statusAction');if(b)b.addEventListener('click',()=>toggleStatus(c));
    }catch(err){console.error(err);$('drawerContent').innerHTML='<div class="error" style="display:block">تعذر تحميل تفاصيل العميل.</div>'}
  }

  async function toggleStatus(c){
    const next=!c.is_active,verb=next?'إعادة تفعيل':'إيقاف';
    if(!confirm(`${verb} حساب ${c.full_name||c.email||'العميل'}؟`))return;
    const b=$('statusAction');if(b)b.disabled=true;
    const {error}=await supabase.rpc('customer_set_active',{p_customer_id:c.id,p_is_active:next});
    if(error){show('errorBox',error.message||'تعذر تغيير حالة الحساب.');if(b)b.disabled=false;return}
    c.is_active=next;show('successBox',next?'تمت إعادة تفعيل الحساب.':'تم إيقاف حساب العميل.');renderStats();render();await openCustomer(c.id);
  }


  async function loadDeletionRequests(){
    const panel=$('account-deletion-requests');if(!panel)return;
    if(profile?.role!=='super_admin'){panel.hidden=true;return}
    panel.hidden=false;
    const {data,error}=await supabase.rpc('admin_account_deletion_list');
    if(error)throw error;
    deletionRequests=data||[];renderDeletionRequests();
    if(location.hash==='#account-deletion-requests')setTimeout(()=>panel.scrollIntoView({behavior:'smooth',block:'start'}),80);
  }

  function renderDeletionRequests(){
    const host=$('deletionRequestsList'),count=$('deletionPendingCount');if(!host)return;
    const pending=deletionRequests.filter(r=>r.status==='pending');if(count)count.textContent=String(pending.length);
    const rows=[...pending,...deletionRequests.filter(r=>r.status!=='pending').slice(0,8)];
    if(!rows.length){host.innerHTML='<div class="muted">لا توجد طلبات حذف حساب.</div>';return}
    host.innerHTML=rows.map(r=>`<article class="deletion-request"><div class="deletion-request-top"><div><strong>${esc(r.full_name||r.email||'عميل Dear Day')}</strong><div class="muted">${esc(r.email||'—')}${r.phone?' · '+esc(r.phone):''}</div><div class="muted">تاريخ الطلب: ${date(r.requested_at)}</div></div><span class="badge ${r.status==='pending'?'bad':'good'}">${r.status==='pending'?'بانتظار المراجعة':r.status==='completed'?'تم الحذف':'مرفوض'}</span></div>${r.status==='pending'?`<div class="deletion-actions"><button class="approve-delete" data-delete-approve="${esc(r.id)}" type="button">موافقة وحذف نهائي</button><button class="reject-delete" data-delete-reject="${esc(r.id)}" type="button">رفض الطلب</button></div>`:''}${r.admin_note?`<div class="muted" style="margin-top:7px">ملاحظة: ${esc(r.admin_note)}</div>`:''}</article>`).join('');
    host.querySelectorAll('[data-delete-approve]').forEach(b=>b.addEventListener('click',()=>reviewDeletion(b.dataset.deleteApprove,'approve')));
    host.querySelectorAll('[data-delete-reject]').forEach(b=>b.addEventListener('click',()=>reviewDeletion(b.dataset.deleteReject,'reject')));
  }

  async function reviewDeletion(id,decision){
    const req=deletionRequests.find(r=>r.id===id);if(!req)return;
    if(decision==='approve'){
      const who=req.full_name||req.email||'العميل';
      if(!confirm(`تأكيد الحذف النهائي لحساب ${who}؟ سيتم حذف حساب تسجيل الدخول والبيانات الشخصية، وفصل السجلات التاريخية عن هوية العميل.`))return;
    }
    const note=prompt(decision==='reject'?'سبب الرفض أو ملاحظة للسجل (اختياري):':'ملاحظة داخلية عن الحذف (اختياري):','')||null;
    const {error}=await supabase.rpc('admin_review_account_deletion',{p_request_id:id,p_decision:decision,p_note:note});
    if(error){show('errorBox',error.message||'تعذر مراجعة طلب حذف الحساب.');return}
    show('successBox',decision==='approve'?'تم حذف الحساب والبيانات الشخصية نهائيًا.':'تم رفض طلب الحذف.');
    closeDrawer();await loadCustomers();await loadDeletionRequests();
  }

  function openDrawer(){$('drawerBg').classList.add('show');$('drawerBg').setAttribute('aria-hidden','false')}
  function closeDrawer(){$('drawerBg').classList.remove('show');$('drawerBg').setAttribute('aria-hidden','true');selectedId=null}

  async function boot(){
    try{
      const cfg=await loadConfig(),mod=await import(SUPABASE_ESM);supabase=mod.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
      if(!await guard())return;
      $('logoutBtn').onclick=async()=>{await supabase.auth.signOut();location.replace('/Dear-Day-Staff-Login.html')};
      $('searchInput').addEventListener('input',render);$('statusFilter').addEventListener('change',render);$('refreshBtn').onclick=()=>Promise.all([loadCustomers(),loadDeletionRequests()]).catch(e=>show('errorBox',e.message));
      $('closeDrawer').onclick=closeDrawer;$('drawerBg').addEventListener('click',e=>{if(e.target===$('drawerBg'))closeDrawer()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer()});
      await loadCustomers();await loadDeletionRequests();
    }catch(err){console.error(err);show('errorBox','تعذر تحميل إدارة العملاء. راجع الاتصال والصلاحيات.')}finally{$('loading').style.display='none'}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();