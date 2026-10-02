(function(){
  const SUPABASE_ESM='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';
  const CONFIG_SRC='/approved-pages/dear-day-supabase-config.js?v=20261002-1';
  const ALLOWED_ROLES=new Set(['super_admin','admin','partner_manager']);
  let supabase,user,profile,partners=[],listingCounts={};

  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
  const roleLabel=r=>({super_admin:'Super Admin',admin:'Admin',partner_manager:'Partner Manager'})[r]||r||'—';
  const statusLabel=s=>({pending:'Pending',under_review:'Under Review',active:'Active',suspended:'Suspended',rejected:'Rejected'})[s]||s||'—';
  const statusClass=s=>s==='active'?'good':(['pending','under_review'].includes(s)?'warn':(['suspended','rejected'].includes(s)?'bad':''));
  const fmtDate=v=>{if(!v)return'—';try{return new Intl.DateTimeFormat('ar-EG',{year:'numeric',month:'short',day:'numeric'}).format(new Date(v))}catch{return v}};
  const normalizeAreas=v=>Array.isArray(v)?v:[];
  const areasText=v=>normalizeAreas(v).join('، ');

  function loadConfig(){if(window.DEAR_DAY_SUPABASE)return Promise.resolve(window.DEAR_DAY_SUPABASE);return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=CONFIG_SRC;s.onload=()=>resolve(window.DEAR_DAY_SUPABASE);s.onerror=reject;document.head.appendChild(s)})}
  function showMessage(id,msg){const el=$(id);el.textContent=msg||'';el.style.display=msg?'block':'none';if(msg)setTimeout(()=>{if(el.textContent===msg)el.style.display='none'},3500)}
  function openModal(id){const el=$(id);el.classList.add('show');el.setAttribute('aria-hidden','false')}
  function closeModal(id){const el=$(id);el.classList.remove('show');el.setAttribute('aria-hidden','true')}
  function slugify(v){return String(v||'').trim().toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g,'-').replace(/^-+|-+$/g,'')}

  async function audit(action,entityId,beforeData,afterData){
    const {error}=await supabase.from('audit_logs').insert({actor_id:user.id,action,entity_type:'partner',entity_id:String(entityId||''),before_data:beforeData||null,after_data:afterData||null});
    if(error)console.warn('Audit log failed',error);
  }

  async function loadData(){
    const [{data:p,error:pErr},{data:listings,error:lErr}]=await Promise.all([
      supabase.from('partners').select('*').order('created_at',{ascending:false}),
      supabase.from('listings').select('id,partner_id')
    ]);
    if(pErr)throw pErr;if(lErr)throw lErr;
    partners=p||[];listingCounts={};
    for(const item of listings||[])listingCounts[item.partner_id]=(listingCounts[item.partner_id]||0)+1;
    updateStats();render();
  }

  function updateStats(){
    $('statAll').textContent=partners.length;
    $('statActive').textContent=partners.filter(p=>p.status==='active').length;
    $('statPending').textContent=partners.filter(p=>['pending','under_review'].includes(p.status)).length;
    $('statSuspended').textContent=partners.filter(p=>p.status==='suspended').length;
    const avg=partners.length?partners.reduce((sum,p)=>sum+Number(p.commission_rate||0),0)/partners.length:0;
    $('statCommission').textContent=`${avg.toFixed(1)}%`;
  }

  function filtered(){
    const q=$('searchInput').value.trim().toLowerCase(),status=$('statusFilter').value;
    return partners.filter(p=>{
      if(status&&p.status!==status)return false;
      if(!q)return true;
      const hay=[p.name_ar,p.name_en,p.phone,p.email,p.contact_name,areasText(p.coverage_areas)].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }

  function render(){
    const rows=filtered(),body=$('partnersBody'),empty=$('emptyState');body.innerHTML='';
    empty.hidden=rows.length>0;
    for(const p of rows){
      const tr=document.createElement('tr');tr.dataset.id=p.id;
      const toggle=p.status==='active'?`<button class="mini danger" data-action="suspend" data-id="${p.id}">إيقاف</button>`:`<button class="mini" data-action="activate" data-id="${p.id}">تفعيل</button>`;
      tr.innerHTML=`<td><strong>${esc(p.name_ar)}</strong><div style="color:#786C69;font-size:10px">${esc(p.name_en||p.slug)}</div></td><td><span class="badge ${statusClass(p.status)}">${statusLabel(p.status)}</span></td><td>${Number(p.commission_rate||0).toFixed(2)}%</td><td>${esc(p.contact_name||'—')}<div style="color:#786C69;font-size:10px">${esc(p.phone||p.email||'—')}</div></td><td>${esc(areasText(p.coverage_areas)||'—')}</td><td>${listingCounts[p.id]||0}</td><td>${fmtDate(p.updated_at)}</td><td><div class="actions"><button class="mini" data-action="view" data-id="${p.id}">تفاصيل</button><button class="mini" data-action="edit" data-id="${p.id}">تعديل</button>${toggle}</div></td>`;
      body.appendChild(tr);
    }
  }

  function resetForm(){
    $('partnerForm').reset();$('partnerId').value='';$('status').value='pending';$('commission').value='0';$('formTitle').textContent='إضافة شريك';
  }
  function fillForm(p){
    $('partnerId').value=p.id;$('nameAr').value=p.name_ar||'';$('nameEn').value=p.name_en||'';$('slug').value=p.slug||'';$('status').value=p.status||'pending';$('commission').value=p.commission_rate??0;$('contactName').value=p.contact_name||'';$('phone').value=p.phone||'';$('email').value=p.email||'';$('coverageAreas').value=areasText(p.coverage_areas);$('notes').value=p.notes||'';$('formTitle').textContent='تعديل الشريك';
  }
  function formPayload(){
    const areas=$('coverageAreas').value.split(/[،,]/).map(v=>v.trim()).filter(Boolean);
    return {name_ar:$('nameAr').value.trim(),name_en:$('nameEn').value.trim()||null,slug:slugify($('slug').value),status:$('status').value,commission_rate:Number($('commission').value||0),contact_name:$('contactName').value.trim()||null,phone:$('phone').value.trim()||null,email:$('email').value.trim()||null,coverage_areas:areas,notes:$('notes').value.trim()||null};
  }

  async function savePartner(e){
    e.preventDefault();showMessage('errorBox','');showMessage('successBox','');
    const id=$('partnerId').value,payload=formPayload();
    if(!payload.name_ar||!payload.slug){showMessage('errorBox','اسم الشريك والـSlug مطلوبان.');return}
    if(payload.commission_rate<0||payload.commission_rate>100){showMessage('errorBox','العمولة يجب أن تكون بين 0 و100%.');return}
    const duplicate=partners.find(p=>p.slug===payload.slug&&p.id!==id);if(duplicate){showMessage('errorBox','الـSlug مستخدم بالفعل لشريك آخر.');return}
    try{
      if(id){
        const before=partners.find(p=>p.id===id);const {data,error}=await supabase.from('partners').update(payload).eq('id',id).select().single();if(error)throw error;await audit('partner.updated',id,before,data);showMessage('successBox','تم تحديث بيانات الشريك.');
      }else{
        payload.created_by=user.id;const {data,error}=await supabase.from('partners').insert(payload).select().single();if(error)throw error;await audit('partner.created',data.id,null,data);showMessage('successBox','تمت إضافة الشريك بنجاح.');
      }
      closeModal('editModal');await loadData();
    }catch(err){console.error(err);showMessage('errorBox',err?.message||'تعذر حفظ بيانات الشريك.');}
  }

  async function changeStatus(id,newStatus){
    const p=partners.find(x=>x.id===id);if(!p||p.status===newStatus)return;
    const label=newStatus==='suspended'?'إيقاف':'تفعيل';
    if(!confirm(`تأكيد ${label} الشريك: ${p.name_ar}؟`))return;
    try{
      const before={status:p.status};const {data,error}=await supabase.from('partners').update({status:newStatus}).eq('id',id).select().single();if(error)throw error;await audit('partner.status_changed',id,before,{status:data.status});showMessage('successBox',newStatus==='active'?'تم تفعيل الشريك.':'تم إيقاف الشريك.');await loadData();
    }catch(err){console.error(err);showMessage('errorBox',err?.message||'تعذر تغيير حالة الشريك.');}
  }

  function showDetails(p){
    $('detailTitle').textContent=p.name_ar||'تفاصيل الشريك';
    $('detailContent').innerHTML=`<div class="detail-grid">
      <div class="detail"><span>الحالة</span><strong><span class="badge ${statusClass(p.status)}">${statusLabel(p.status)}</span></strong></div>
      <div class="detail"><span>عمولة Dear Day</span><strong>${Number(p.commission_rate||0).toFixed(2)}%</strong></div>
      <div class="detail"><span>مسؤول التواصل</span><strong>${esc(p.contact_name||'—')}</strong></div>
      <div class="detail"><span>الهاتف</span><strong>${esc(p.phone||'—')}</strong></div>
      <div class="detail"><span>البريد</span><strong>${esc(p.email||'—')}</strong></div>
      <div class="detail"><span>المنتجات والخدمات</span><strong>${listingCounts[p.id]||0}</strong></div>
      <div class="detail full"><span>مناطق التغطية</span><strong>${esc(areasText(p.coverage_areas)||'—')}</strong></div>
      <div class="detail full"><span>ملاحظات داخلية</span><strong>${esc(p.notes||'—')}</strong></div>
      <div class="detail"><span>Slug</span><strong>${esc(p.slug)}</strong></div>
      <div class="detail"><span>آخر تحديث</span><strong>${fmtDate(p.updated_at)}</strong></div>
    </div><div class="detail-actions"><button class="primary" type="button" id="detailEditBtn">تعديل البيانات</button>${p.status==='active'?'<button class="secondary" type="button" id="detailStatusBtn">إيقاف مؤقت</button>':'<button class="secondary" type="button" id="detailStatusBtn">تفعيل الشريك</button>'}</div><p class="hint">لن نحذف Partner نهائيًا إذا كان مرتبطًا بطلبات أو بيانات مالية. الإيقاف يمنع اعتباره شريكًا نشطًا ويحافظ على التاريخ التشغيلي.</p>`;
    $('detailEditBtn').onclick=()=>{closeModal('detailModal');fillForm(p);openModal('editModal')};
    $('detailStatusBtn').onclick=()=>{closeModal('detailModal');changeStatus(p.id,p.status==='active'?'suspended':'active')};
    openModal('detailModal');
  }

  async function boot(){
    try{
      const cfg=await loadConfig(),mod=await import(SUPABASE_ESM);supabase=mod.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
      const {data:{user:u},error:uErr}=await supabase.auth.getUser();if(uErr||!u){location.replace('/Dear-Day-Auth.html#login');return}user=u;
      const {data:p,error:pErr}=await supabase.from('profiles').select('id,full_name,role,is_active').eq('id',u.id).single();if(pErr||!p||!p.is_active||!ALLOWED_ROLES.has(p.role)){location.replace('/Dear-Day-Account.html');return}profile=p;
      $('adminEmail').textContent=u.email||p.full_name||'Admin';$('roleBadge').textContent=roleLabel(p.role);
      $('logoutBtn').onclick=async()=>{await supabase.auth.signOut();location.replace('/Dear-Day-Auth.html#login')};
      $('addPartnerBtn').onclick=()=>{resetForm();openModal('editModal')};$('refreshBtn').onclick=loadData;$('partnerForm').addEventListener('submit',savePartner);$('searchInput').addEventListener('input',render);$('statusFilter').addEventListener('change',render);
      $('nameAr').addEventListener('input',()=>{if(!$('partnerId').value&&!$('slug').dataset.manual)$('slug').value=slugify($('nameAr').value)});$('slug').addEventListener('input',()=>{$('slug').dataset.manual='1'});
      document.addEventListener('click',e=>{const close=e.target.closest('[data-close]');if(close)closeModal(close.dataset.close);const action=e.target.closest('[data-action]');if(!action)return;const p=partners.find(x=>x.id===action.dataset.id);if(!p)return;if(action.dataset.action==='view')showDetails(p);if(action.dataset.action==='edit'){fillForm(p);openModal('editModal')}if(action.dataset.action==='suspend')changeStatus(p.id,'suspended');if(action.dataset.action==='activate')changeStatus(p.id,'active')});
      document.querySelectorAll('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)closeModal(m.id)}));
      await loadData();
    }catch(err){console.error(err);showMessage('errorBox','تعذر تحميل إدارة الشركاء. راجع الاتصال والصلاحيات.');}
    finally{$('loading').style.display='none'}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();