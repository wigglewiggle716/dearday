(function(){
  const SUPABASE_ESM='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';
  const CONFIG_SRC='/approved-pages/dear-day-supabase-config.js?v=20261002-1';
  const REVIEW_ROLES=new Set(['super_admin','admin','partner_manager']);
  let supabase,user,profile;
  let pending=[],listings=[],partners=[],profiles=[],publishedVersions=[],selectedId=null;

  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
  const loadConfig=()=>window.DEAR_DAY_SUPABASE?Promise.resolve(window.DEAR_DAY_SUPABASE):new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=CONFIG_SRC;s.onload=()=>resolve(window.DEAR_DAY_SUPABASE);s.onerror=reject;document.head.appendChild(s)});
  const money=(v,c='EGP')=>v==null?'—':new Intl.NumberFormat('ar-EG',{style:'currency',currency:c||'EGP',maximumFractionDigits:2}).format(Number(v||0));
  const date=v=>{if(!v)return'—';try{return new Intl.DateTimeFormat('ar-EG',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(v))}catch{return v}};
  const kindLabel=k=>({product:'منتج',service:'خدمة',venue:'مكان',experience:'تجربة'})[k]||k||'—';
  const roleLabel=r=>({super_admin:'Super Admin',admin:'Admin',partner_manager:'Partner Manager'})[r]||r||'—';
  const listingBy=id=>listings.find(x=>x.id===id)||null;
  const partnerBy=id=>partners.find(x=>x.id===id)||null;
  const profileBy=id=>profiles.find(x=>x.id===id)||null;
  const publishedBy=id=>publishedVersions.find(x=>x.id===id)||null;
  const proposed=v=>(v?.metadata&&typeof v.metadata==='object'&&v.metadata.proposed&&typeof v.metadata.proposed==='object')?v.metadata.proposed:{};

  function show(id,msg){const el=$(id);if(!el)return;el.textContent=msg||'';el.style.display=msg?'block':'none';if(msg)setTimeout(()=>{if(el.textContent===msg)el.style.display='none'},4500)}
  function openModal(){$('reviewModal').classList.add('show');$('reviewModal').setAttribute('aria-hidden','false')}
  function closeModal(){$('reviewModal').classList.remove('show');$('reviewModal').setAttribute('aria-hidden','true');selectedId=null;$('actionStatus').textContent=''}

  async function authGuard(){
    const {data:{user:u},error}=await supabase.auth.getUser();
    if(error||!u){location.replace('/Dear-Day-Auth.html#login');return false}
    user=u;
    const {data:p,error:pErr}=await supabase.from('profiles').select('id,full_name,role,is_active').eq('id',u.id).single();
    if(pErr||!p||!p.is_active||!REVIEW_ROLES.has(p.role)){location.replace('/Dear-Day-Account.html');return false}
    profile=p;$('adminEmail').textContent=u.email||p.full_name||'Admin';$('roleBadge').textContent=roleLabel(p.role);return true;
  }

  async function loadData(){
    const {data:pv,error:pvErr}=await supabase.from('listing_versions').select('*').eq('status','pending_review').order('submitted_at',{ascending:true}).order('created_at',{ascending:true});
    if(pvErr)throw pvErr;pending=pv||[];
    const listingIds=[...new Set(pending.map(v=>v.listing_id).filter(Boolean))];
    if(!listingIds.length){listings=[];partners=[];profiles=[];publishedVersions=[];fillFilters();render();return}

    const {data:ls,error:lErr}=await supabase.from('listings').select('*').in('id',listingIds);if(lErr)throw lErr;listings=ls||[];
    const partnerIds=[...new Set(listings.map(l=>l.partner_id).filter(Boolean).concat(pending.map(v=>proposed(v).partner_id).filter(Boolean)))];
    const submitterIds=[...new Set(pending.map(v=>v.submitted_by).filter(Boolean))];
    const publishedIds=[...new Set(listings.map(l=>l.published_version_id).filter(Boolean))];
    const requests=[];
    requests.push(partnerIds.length?supabase.from('partners').select('id,name_ar,name_en,status').in('id',partnerIds):Promise.resolve({data:[],error:null}));
    requests.push(submitterIds.length?supabase.from('profiles').select('id,full_name,role').in('id',submitterIds):Promise.resolve({data:[],error:null}));
    requests.push(publishedIds.length?supabase.from('listing_versions').select('*').in('id',publishedIds):Promise.resolve({data:[],error:null}));
    const [pr,ps,pub]=await Promise.all(requests);for(const r of [pr,ps,pub])if(r.error)throw r.error;
    partners=pr.data||[];profiles=ps.data||[];publishedVersions=pub.data||[];
    fillFilters();render();
  }

  function fillFilters(){
    const current=$('partnerFilter').value;
    const ids=[...new Set(pending.map(v=>{const l=listingBy(v.listing_id),p=proposed(v);return p.partner_id||l?.partner_id}).filter(Boolean))];
    $('partnerFilter').innerHTML='<option value="">كل الشركاء</option>'+ids.map(id=>{const p=partnerBy(id);return `<option value="${id}">${esc(p?.name_ar||p?.name_en||'شريك')}</option>`}).join('');
    if(ids.includes(current))$('partnerFilter').value=current;
  }

  function effectivePartnerId(v){const l=listingBy(v.listing_id),p=proposed(v);return p.partner_id||l?.partner_id||''}
  function effectiveKind(v){const l=listingBy(v.listing_id),p=proposed(v);return p.kind||l?.kind||''}
  function currentVersion(v){const l=listingBy(v.listing_id);return l?.published_version_id?publishedBy(l.published_version_id):null}

  function filtered(){
    const q=$('searchInput').value.trim().toLowerCase(),pid=$('partnerFilter').value,kind=$('kindFilter').value;
    return pending.filter(v=>{
      const l=listingBy(v.listing_id),p=partnerBy(effectivePartnerId(v));
      const hay=[v.name_ar,v.name_en,p?.name_ar,p?.name_en].join(' ').toLowerCase();
      if(q&&!hay.includes(q))return false;if(pid&&effectivePartnerId(v)!==pid)return false;if(kind&&effectiveKind(v)!==kind)return false;return true;
    });
  }

  function renderStats(){
    $('statPending').textContent=pending.length;
    $('statNew').textContent=pending.filter(v=>!listingBy(v.listing_id)?.published_version_id).length;
    $('statUpdates').textContent=pending.filter(v=>!!listingBy(v.listing_id)?.published_version_id).length;
    $('statPartners').textContent=new Set(pending.map(effectivePartnerId).filter(Boolean)).size;
  }

  function render(){
    renderStats();const rows=filtered(),body=$('body');body.innerHTML='';$('emptyState').hidden=!!rows.length;
    for(const v of rows){
      const l=listingBy(v.listing_id),current=currentVersion(v),p=partnerBy(effectivePartnerId(v)),submitter=profileBy(v.submitted_by);const type=l?.published_version_id?'تعديل على Live':'عنصر جديد';
      const tr=document.createElement('tr');tr.dataset.id=v.id;tr.innerHTML=`<td><strong>${esc(v.name_ar||v.name_en||'بدون اسم')}</strong></td><td>${esc(p?.name_ar||p?.name_en||'—')}</td><td>${kindLabel(effectiveKind(v))}</td><td><span class="badge ${current?'warn':'good'}">${type}</span></td><td>${money(v.price,v.currency)}</td><td>${money(current?.price,current?.currency||v.currency)}</td><td>${esc(submitter?.full_name||'System / Admin')}</td><td>${date(v.submitted_at||v.created_at)}</td>`;tr.addEventListener('click',()=>openReview(v.id));body.appendChild(tr);
    }
  }

  function fieldRow(label,current,proposedValue,format=x=>x??'—'){
    const a=format(current),b=format(proposedValue),changed=String(a)!==String(b);return `<div class="label">${esc(label)}</div><div class="${changed?'changed':''}">${esc(a)}</div><div class="${changed?'changed':''}">${esc(b)}</div>`;
  }

  function openReview(id){
    const v=pending.find(x=>x.id===id);if(!v)return;selectedId=id;const l=listingBy(v.listing_id),cur=currentVersion(v),prop=proposed(v),p=partnerBy(effectivePartnerId(v)),submitter=profileBy(v.submitted_by);
    $('modalTitle').textContent=v.name_ar||v.name_en||'مراجعة التعديل';$('modalSub').textContent=l?.published_version_id?'مقارنة النسخة المقترحة بالنسخة المنشورة الحالية':'عنصر جديد بدون نسخة منشورة حالية';
    $('metaGrid').innerHTML=`<div class="meta"><span>الشريك</span><strong>${esc(p?.name_ar||p?.name_en||'—')}</strong></div><div class="meta"><span>النوع</span><strong>${kindLabel(effectiveKind(v))}</strong></div><div class="meta"><span>مرسل بواسطة</span><strong>${esc(submitter?.full_name||'System / Admin')}</strong></div><div class="meta"><span>تاريخ الإرسال</span><strong>${date(v.submitted_at||v.created_at)}</strong></div>`;
    const currentPartner=partnerBy(l?.partner_id),proposedPartner=partnerBy(prop.partner_id||l?.partner_id);
    $('compareGrid').innerHTML=`<div class="head">الحقل</div><div class="head">Live الحالي</div><div class="head">المقترح</div>`+
      fieldRow('الاسم عربي',cur?.name_ar||'—',v.name_ar||'—')+
      fieldRow('الاسم إنجليزي',cur?.name_en||'—',v.name_en||'—')+
      fieldRow('السعر',cur?money(cur.price,cur.currency):'—',money(v.price,v.currency),x=>x)+
      fieldRow('قبل الخصم',cur?.compare_at_price==null?'—':money(cur.compare_at_price,cur.currency),v.compare_at_price==null?'—':money(v.compare_at_price,v.currency),x=>x)+
      fieldRow('الشريك',currentPartner?.name_ar||currentPartner?.name_en||'—',proposedPartner?.name_ar||proposedPartner?.name_en||'—')+
      fieldRow('النوع',kindLabel(l?.kind),kindLabel(prop.kind||l?.kind))+
      fieldRow('التوفر',l?.is_available?'متاح':'غير متاح',prop.is_available==null?(l?.is_available?'متاح':'غير متاح'):(prop.is_available?'متاح':'غير متاح'))+
      fieldRow('المخزون',l?.stock_qty??'—',Object.prototype.hasOwnProperty.call(prop,'stock_qty')?(prop.stock_qty??'—'):(l?.stock_qty??'—'))+
      fieldRow('السعة اليومية',l?.capacity_per_day??'—',Object.prototype.hasOwnProperty.call(prop,'capacity_per_day')?(prop.capacity_per_day??'—'):(l?.capacity_per_day??'—'))+
      fieldRow('الوصف عربي',cur?.description_ar||'—',v.description_ar||'—')+
      fieldRow('الوصف إنجليزي',cur?.description_en||'—',v.description_en||'—');
    $('reviewNote').value='';openModal();
  }

  async function review(decision){
    const v=pending.find(x=>x.id===selectedId);if(!v)return;const note=$('reviewNote').value.trim();if(decision==='reject'&&!note){$('actionStatus').textContent='سبب الرفض مطلوب.';return}
    $('approveBtn').disabled=true;$('rejectBtn').disabled=true;$('actionStatus').textContent=decision==='approve'?'جاري النشر…':'جاري الرفض…';
    const {error}=await supabase.rpc('review_listing_version',{p_version_id:v.id,p_decision:decision,p_note:note||null});
    if(error){console.error(error);$('actionStatus').textContent=error.message||'تعذر تنفيذ القرار.';$('approveBtn').disabled=false;$('rejectBtn').disabled=false;return}
    closeModal();show('successBox',decision==='approve'?'تمت الموافقة ونشر النسخة الجديدة.':'تم رفض التعديل وحفظ الملاحظة.');await loadData();$('approveBtn').disabled=false;$('rejectBtn').disabled=false;
  }

  async function boot(){
    try{const cfg=await loadConfig(),mod=await import(SUPABASE_ESM);supabase=mod.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});if(!await authGuard())return;$('logoutBtn').onclick=async()=>{await supabase.auth.signOut();location.replace('/Dear-Day-Auth.html#login')};$('searchInput').addEventListener('input',render);$('partnerFilter').addEventListener('change',render);$('kindFilter').addEventListener('change',render);$('refreshBtn').onclick=()=>loadData().catch(e=>show('errorBox',e.message));$('closeModal').onclick=closeModal;$('reviewModal').addEventListener('click',e=>{if(e.target===$('reviewModal'))closeModal()});$('approveBtn').onclick=()=>review('approve');$('rejectBtn').onclick=()=>review('reject');document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});await loadData()}catch(err){console.error(err);show('errorBox','تعذر تحميل الموافقات. راجع الاتصال والصلاحيات.')}finally{$('loading').style.display='none'}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
