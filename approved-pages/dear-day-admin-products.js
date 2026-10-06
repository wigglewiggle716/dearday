(function(){
  const SUPABASE_ESM='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';
  const CONFIG_SRC='/approved-pages/dear-day-supabase-config.js?v=20261002-1';
  const ADMIN_ROLES=new Set(['super_admin','admin']);
  let supabase,user,profile;
  let partners=[],categories=[],listings=[],versions=[];

  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
  const loadConfig=()=>window.DEAR_DAY_SUPABASE?Promise.resolve(window.DEAR_DAY_SUPABASE):new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=CONFIG_SRC;s.onload=()=>resolve(window.DEAR_DAY_SUPABASE);s.onerror=reject;document.head.appendChild(s)});
  const money=(v,c='EGP')=>new Intl.NumberFormat('ar-EG',{style:'currency',currency:c||'EGP',maximumFractionDigits:2}).format(Number(v||0));
  const date=v=>{if(!v)return'—';try{return new Intl.DateTimeFormat('ar-EG',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(v))}catch{return v}};
  const roleLabel=r=>({super_admin:'Super Admin',admin:'Admin'})[r]||r||'—';
  const kindLabel=k=>({product:'منتج',service:'خدمة',venue:'مكان',experience:'تجربة'})[k]||k||'—';
  const statusLabel=s=>({draft:'Draft',pending_review:'Pending Review',published:'Published',rejected:'Rejected',archived:'Archived'})[s]||s||'—';
  const statusClass=s=>s==='published'?'good':(['draft','pending_review'].includes(s)?'warn':(['rejected','archived'].includes(s)?'bad':''));
  const show=(id,msg)=>{const e=$(id);if(!e)return;e.textContent=msg;e.style.display='block';setTimeout(()=>{e.style.display='none'},4500)};
  const partnerBy=id=>partners.find(p=>p.id===id);
  const categoryBy=id=>categories.find(c=>c.id===id);
  const versionsFor=id=>versions.filter(v=>v.listing_id===id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  const latestFor=id=>versionsFor(id)[0]||null;
  const publishedFor=l=>versions.find(v=>v.id===l.published_version_id)||null;
  const proposed=v=>(v&&v.metadata&&typeof v.metadata==='object'&&v.metadata.proposed)?v.metadata.proposed:{};

  async function audit(action,entityId,beforeData,afterData){
    const {error}=await supabase.from('audit_logs').insert({actor_id:user.id,action,entity_type:'listing',entity_id:String(entityId||''),before_data:beforeData||null,after_data:afterData||null});
    if(error)console.warn('Audit log failed',error);
  }

  async function loadData(){
    const [p,c,l,v]=await Promise.all([
      supabase.from('partner_directory').select('id,name_ar,name_en,status').order('name_ar'),
      supabase.from('categories').select('id,slug,name_ar,name_en,is_active,sort_order').order('sort_order').order('name_ar'),
      supabase.from('listings').select('*').order('updated_at',{ascending:false}),
      supabase.from('listing_versions').select('*').order('created_at',{ascending:false})
    ]);
    for(const r of [p,c,l,v])if(r.error)throw r.error;
    partners=p.data||[];categories=c.data||[];listings=l.data||[];versions=v.data||[];
    fillReferenceSelects();render();
  }

  function fillReferenceSelects(){
    const currentPartnerFilter=$('partnerFilter').value,currentPartner=$('partnerId').value,currentCategory=$('categoryId').value;
    $('partnerFilter').innerHTML='<option value="">كل الشركاء</option>'+partners.map(p=>`<option value="${p.id}">${esc(p.name_ar||p.name_en||'—')}</option>`).join('');
    $('partnerId').innerHTML='<option value="">اختر الشريك</option>'+partners.map(p=>`<option value="${p.id}">${esc(p.name_ar||p.name_en||'—')} — ${esc(p.status)}</option>`).join('');
    $('categoryId').innerHTML='<option value="">بدون تصنيف</option>'+categories.filter(c=>c.is_active).map(c=>`<option value="${c.id}">${esc(c.name_ar||c.name_en||c.slug)}</option>`).join('');
    if([...$('partnerFilter').options].some(o=>o.value===currentPartnerFilter))$('partnerFilter').value=currentPartnerFilter;
    if([...$('partnerId').options].some(o=>o.value===currentPartner))$('partnerId').value=currentPartner;
    if([...$('categoryId').options].some(o=>o.value===currentCategory))$('categoryId').value=currentCategory;
  }

  function renderStats(){
    $('statAll').textContent=listings.length;
    $('statAvailable').textContent=listings.filter(l=>l.is_available).length;
    $('statPublished').textContent=listings.filter(l=>!!l.published_version_id).length;
    $('statPending').textContent=listings.filter(l=>latestFor(l.id)?.status==='pending_review').length;
    $('statUnavailable').textContent=listings.filter(l=>!l.is_available).length;
  }

  function filtered(){
    const q=$('searchInput').value.trim().toLowerCase(),pid=$('partnerFilter').value,kind=$('kindFilter').value,av=$('availabilityFilter').value;
    return listings.filter(l=>{
      const v=latestFor(l.id)||publishedFor(l),p=partnerBy(l.partner_id);
      const text=[v?.name_ar,v?.name_en,p?.name_ar,p?.name_en,kindLabel(l.kind)].join(' ').toLowerCase();
      if(q&&!text.includes(q))return false;
      if(pid&&l.partner_id!==pid)return false;
      if(kind&&l.kind!==kind)return false;
      if(av==='available'&&!l.is_available)return false;
      if(av==='unavailable'&&l.is_available)return false;
      return true;
    });
  }

  function stockText(l){
    if(l.kind==='product')return l.stock_qty==null?'غير محدد':String(l.stock_qty);
    return l.capacity_per_day==null?'غير محددة':`${l.capacity_per_day} / يوم`;
  }

  function render(){
    renderStats();
    const data=filtered(),body=$('body');body.innerHTML='';$('emptyState').hidden=!!data.length;
    for(const l of data){
      const v=latestFor(l.id)||publishedFor(l),p=partnerBy(l.partner_id),cat=categoryBy(l.category_id),hasLive=!!l.published_version_id;
      const tr=document.createElement('tr');tr.dataset.id=l.id;
      tr.innerHTML=`<td><strong>${esc(v?.name_ar||v?.name_en||'بدون اسم')}</strong><div style="font-size:10px;color:#786C69;margin-top:3px">${esc(cat?.name_ar||'بدون تصنيف')}</div></td><td>${esc(p?.name_ar||p?.name_en||'—')}</td><td>${kindLabel(l.kind)}</td><td><span class="badge ${statusClass(v?.status)}">${statusLabel(v?.status)}</span>${hasLive&&v?.id!==l.published_version_id?'<div style="font-size:9px;color:#376a4a;margin-top:4px">يوجد إصدار Live</div>':''}</td><td>${money(v?.price,v?.currency)}</td><td><span class="badge ${l.is_available?'good':'bad'}">${l.is_available?'متاح':'غير متاح'}</span></td><td>${esc(stockText(l))}</td><td>${date(l.updated_at)}</td><td><div class="actions"><button class="mini" data-act="edit">تعديل</button><button class="mini" data-act="availability">${l.is_available?'إيقاف':'إتاحة'}</button><button class="mini danger" data-act="archive">أرشفة</button></div></td>`;
      tr.addEventListener('click',e=>{const b=e.target.closest('button');if(!b){openEdit(l.id);return}e.stopPropagation();if(b.dataset.act==='edit')openEdit(l.id);if(b.dataset.act==='availability')toggleAvailability(l.id);if(b.dataset.act==='archive')archiveListing(l.id)});
      body.appendChild(tr);
    }
  }

  function resetForm(){
    $('form').reset();$('listingId').value='';$('versionStatus').value='draft';$('currency').value='EGP';$('isAvailable').checked=true;$('formTitle').textContent='إضافة منتج أو خدمة';$('history').hidden=true;$('historyList').innerHTML='';
  }

  function openAdd(){resetForm();if(partners.length===1)$('partnerId').value=partners[0].id;$('editModal').classList.add('show');$('editModal').setAttribute('aria-hidden','false')}
  function closeModal(){ $('editModal').classList.remove('show');$('editModal').setAttribute('aria-hidden','true') }

  function openEdit(id){
    const l=listings.find(x=>x.id===id);if(!l)return;const v=latestFor(id)||publishedFor(l);const prop=proposed(v);
    resetForm();$('listingId').value=l.id;$('formTitle').textContent='تعديل المنتج / الخدمة';
    $('partnerId').value=prop.partner_id||l.partner_id||'';$('categoryId').value=prop.category_id||l.category_id||'';$('kind').value=prop.kind||l.kind||'product';$('versionStatus').value=v?.status||'draft';
    $('nameAr').value=v?.name_ar||'';$('nameEn').value=v?.name_en||'';$('descriptionAr').value=v?.description_ar||'';$('descriptionEn').value=v?.description_en||'';$('price').value=v?.price??0;$('compareAtPrice').value=v?.compare_at_price??'';$('currency').value=v?.currency||'EGP';
    $('stockQty').value=(prop.stock_qty??l.stock_qty)??'';$('capacityPerDay').value=(prop.capacity_per_day??l.capacity_per_day)??'';$('isAvailable').checked=(prop.is_available??l.is_available)!==false;$('mediaUrls').value=Array.isArray(v?.media)?v.media.map(x=>typeof x==='string'?x:(x?.url||'')).filter(Boolean).join('\n'):'';$('reviewNote').value=v?.review_note||'';
    const history=versionsFor(id);$('history').hidden=!history.length;$('historyList').innerHTML=history.map(x=>`<div class="version"><div><strong>${esc(x.name_ar||x.name_en||'نسخة')}</strong><div><span class="badge ${statusClass(x.status)}">${statusLabel(x.status)}</span> ${l.published_version_id===x.id?'<span class="badge good">Live</span>':''}</div></div><div><strong>${money(x.price,x.currency)}</strong><br><small>${date(x.created_at)}</small></div></div>`).join('');
    $('editModal').classList.add('show');$('editModal').setAttribute('aria-hidden','false');
  }

  function formPayload(){
    const listing={partner_id:$('partnerId').value,category_id:$('categoryId').value||null,kind:$('kind').value,is_available:$('isAvailable').checked,stock_qty:$('stockQty').value===''?null:Number($('stockQty').value),capacity_per_day:$('capacityPerDay').value===''?null:Number($('capacityPerDay').value)};
    const status=$('versionStatus').value;
    const media=$('mediaUrls').value.split(/\n+/).map(x=>x.trim()).filter(Boolean);
    const version={status,name_ar:$('nameAr').value.trim(),name_en:$('nameEn').value.trim()||null,description_ar:$('descriptionAr').value.trim()||null,description_en:$('descriptionEn').value.trim()||null,price:Number($('price').value||0),compare_at_price:$('compareAtPrice').value===''?null:Number($('compareAtPrice').value),currency:$('currency').value||'EGP',media,metadata:{source:'admin',proposed:listing},review_note:$('reviewNote').value.trim()||null};
    if(status==='pending_review'){version.submitted_by=user.id;version.submitted_at=new Date().toISOString()}
    if(['published','rejected','archived'].includes(status)){version.reviewed_by=user.id;version.reviewed_at=new Date().toISOString()}
    return {listing,version};
  }

  async function save(e){
    e.preventDefault();const id=$('listingId').value,{listing,version}=formPayload();if(!listing.partner_id||!version.name_ar){show('errorBox','الشريك والاسم بالعربي مطلوبان.');return}
    try{
      let listingId=id,before=null;
      if(id){before=listings.find(x=>x.id===id)||null}
      else{
        const initial={...listing,is_available:version.status==='archived'?false:listing.is_available};
        const {data,error}=await supabase.from('listings').insert(initial).select('*').single();if(error)throw error;listingId=data.id;
      }
      version.listing_id=listingId;
      const {data:newVersion,error:vError}=await supabase.from('listing_versions').insert(version).select('*').single();if(vError)throw vError;
      if(version.status==='published'){
        const {error}=await supabase.from('listings').update({...listing,published_version_id:newVersion.id}).eq('id',listingId);if(error)throw error;
      }else if(version.status==='archived'){
        const {error}=await supabase.from('listings').update({published_version_id:null,is_available:false}).eq('id',listingId);if(error)throw error;
      }else if(!id){
        const {error}=await supabase.from('listings').update(listing).eq('id',listingId);if(error)throw error;
      }
      await audit(id?'listing_version_created':'listing_created',listingId,before,{version_id:newVersion.id,status:version.status,proposed:listing});
      closeModal();show('successBox',version.status==='published'?'تم حفظ ونشر النسخة بنجاح.':'تم حفظ النسخة بنجاح.');await loadData();
    }catch(err){console.error(err);show('errorBox',err.message||'تعذر حفظ العنصر.');}
  }

  async function toggleAvailability(id){
    const l=listings.find(x=>x.id===id);if(!l)return;try{const next=!l.is_available;const {error}=await supabase.from('listings').update({is_available:next}).eq('id',id);if(error)throw error;await audit('listing_availability_changed',id,{is_available:l.is_available},{is_available:next});show('successBox',next?'تمت إتاحة العنصر.':'تم إيقاف العنصر مؤقتًا.');await loadData()}catch(err){console.error(err);show('errorBox',err.message||'تعذر تغيير التوفر.')}
  }

  async function archiveListing(id){
    const l=listings.find(x=>x.id===id),v=latestFor(id)||publishedFor(l);if(!l||!v)return;if(!confirm('سيتم إخفاء العنصر من الموقع وأرشفته مع الاحتفاظ بسجله. متابعة؟'))return;
    try{
      const archived={listing_id:id,status:'archived',name_ar:v.name_ar,name_en:v.name_en,description_ar:v.description_ar,description_en:v.description_en,price:v.price,compare_at_price:v.compare_at_price,currency:v.currency,media:v.media||[],metadata:{source:'admin',proposed:{partner_id:l.partner_id,category_id:l.category_id,kind:l.kind,is_available:false,stock_qty:l.stock_qty,capacity_per_day:l.capacity_per_day}},reviewed_by:user.id,reviewed_at:new Date().toISOString(),review_note:'Archived by admin'};
      const {data:newV,error:vError}=await supabase.from('listing_versions').insert(archived).select('id').single();if(vError)throw vError;
      const {error}=await supabase.from('listings').update({published_version_id:null,is_available:false}).eq('id',id);if(error)throw error;
      await audit('listing_archived',id,{published_version_id:l.published_version_id,is_available:l.is_available},{archive_version_id:newV.id,is_available:false});show('successBox','تمت أرشفة العنصر.');await loadData();
    }catch(err){console.error(err);show('errorBox',err.message||'تعذر أرشفة العنصر.')}
  }

  async function boot(){
    try{
      const cfg=await loadConfig(),mod=await import(SUPABASE_ESM);supabase=mod.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
      const {data:{user:u},error:ue}=await supabase.auth.getUser();if(ue||!u){location.replace('/auth#login');return}user=u;
      const {data:p,error:pe}=await supabase.from('profiles').select('id,full_name,role,is_active').eq('id',u.id).single();if(pe||!p||!p.is_active||!ADMIN_ROLES.has(p.role)){location.replace('/account');return}profile=p;
      $('adminEmail').textContent=u.email||p.full_name||'Admin';$('roleBadge').textContent=roleLabel(p.role);$('logoutBtn').addEventListener('click',async()=>{await supabase.auth.signOut();location.replace('/auth#login')});
      $('addBtn').addEventListener('click',openAdd);$('form').addEventListener('submit',save);document.querySelectorAll('[data-close="editModal"]').forEach(b=>b.addEventListener('click',closeModal));$('editModal').addEventListener('click',e=>{if(e.target===$('editModal'))closeModal()});
      ['searchInput','partnerFilter','kindFilter','availabilityFilter'].forEach(id=>$(id).addEventListener(id==='searchInput'?'input':'change',render));$('refreshBtn').addEventListener('click',loadData);
      await loadData();
    }catch(err){console.error(err);show('errorBox','تعذر تحميل إدارة المنتجات والخدمات.');}finally{$('loading').style.display='none'}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
