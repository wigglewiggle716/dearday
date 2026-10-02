(function(){
  const SUPABASE_ESM='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';
  const CONFIG_SRC='/approved-pages/dear-day-supabase-config.js?v=20261002-1';
  const DAYS=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  let supabase,user,profile,partner,portal,canManage=false,listings=[],versions=[],selectedListing=null,settings=null,windows=[],exceptions=[],reservations=[];
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
  const loadConfig=()=>window.DEAR_DAY_SUPABASE?Promise.resolve(window.DEAR_DAY_SUPABASE):new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=CONFIG_SRC;s.onload=()=>resolve(window.DEAR_DAY_SUPABASE);s.onerror=reject;document.head.appendChild(s)});
  const date=v=>{if(!v)return'—';try{return new Intl.DateTimeFormat('ar-EG',{year:'numeric',month:'short',day:'numeric'}).format(new Date(v+'T12:00:00'))}catch{return v}};
  const dt=v=>{if(!v)return'—';try{return new Intl.DateTimeFormat('ar-EG',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(v))}catch{return v}};
  const time=v=>v?String(v).slice(0,5):'—';
  const kindLabel=k=>({product:'منتج',service:'خدمة',venue:'مكان',experience:'تجربة'})[k]||k||'—';
  function show(id,msg,type='error'){const el=$(id);if(!el)return;el.textContent=msg||'';el.className=type==='success'?'success':'error';el.style.display=msg?'block':'none';if(msg)setTimeout(()=>{if(el.textContent===msg)el.style.display='none'},5000)}
  function latestVersion(listingId){return versions.filter(v=>v.listing_id===listingId).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0]||null}
  function listingName(l){const v=latestVersion(l.id);return v?.name_ar||v?.name_en||`${kindLabel(l.kind)} بدون اسم`}
  function roleLabel(r){return ({super_admin:'Super Admin',admin:'Admin',operations:'Operations',partner_manager:'Partner Manager'})[r]||r||'—'}
  async function client(){const cfg=await loadConfig(),mod=await import(SUPABASE_ESM);return mod.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}})}

  async function guard(){
    portal=document.body.dataset.portal||'admin';
    if(portal==='partner'){
      if(!window.DDPartner)throw new Error('Partner guard is unavailable');
      const ctx=await window.DDPartner.guard();if(!ctx)return false;
      supabase=ctx.supabase;user=ctx.user;profile=ctx.profile;partner=ctx.partner;canManage=true;return true;
    }
    supabase=await client();
    const {data:{user:u},error}=await supabase.auth.getUser();if(error||!u){location.replace('/Dear-Day-Staff-Login.html');return false}user=u;
    const {data:p,error:pErr}=await supabase.from('profiles').select('id,full_name,role,is_active').eq('id',u.id).single();if(pErr||!p||!p.is_active){location.replace('/Dear-Day-Staff-Login.html');return false}profile=p;
    const {data:perms,error:permErr}=await supabase.rpc('get_my_permissions');if(permErr)throw permErr;const set=new Set((perms||[]).map(x=>x.permission_code));
    if(!set.has('availability.view')&&!set.has('availability.manage')){location.replace('/Dear-Day-Staff.html');return false}
    canManage=set.has('availability.manage');
    if($('adminEmail'))$('adminEmail').textContent=u.email||p.full_name||'Admin';if($('roleBadge'))$('roleBadge').textContent=roleLabel(p.role);
    const logout=$('logoutBtn');if(logout)logout.onclick=async()=>{await supabase.auth.signOut();location.replace('/Dear-Day-Staff-Login.html')};
    return true;
  }

  async function loadListings(){
    let q=supabase.from('listings').select('id,partner_id,kind,is_available,capacity_per_day,published_version_id,created_at,updated_at').order('updated_at',{ascending:false});
    if(portal==='partner')q=q.eq('partner_id',partner.id);
    const {data:ls,error:lErr}=await q;if(lErr)throw lErr;listings=ls||[];
    if(listings.length){const ids=listings.map(x=>x.id);const {data:vs,error:vErr}=await supabase.from('listing_versions').select('id,listing_id,status,name_ar,name_en,created_at').in('listing_id',ids).order('created_at',{ascending:false});if(vErr)throw vErr;versions=vs||[]}else versions=[];
    const sel=$('listingSelect');sel.innerHTML='<option value="">اختر المنتج / الخدمة</option>'+listings.map(l=>`<option value="${l.id}">${esc(listingName(l))} — ${kindLabel(l.kind)}</option>`).join('');
    $('emptyListings').hidden=!!listings.length;
    $('workspace').hidden=true;
    if(listings.length===1){sel.value=listings[0].id;await selectListing(listings[0].id)}
  }

  async function selectListing(id){
    selectedListing=listings.find(x=>x.id===id)||null;if(!selectedListing){$('workspace').hidden=true;return}
    $('workspace').hidden=false;$('selectedListingName').textContent=listingName(selectedListing);$('selectedListingMeta').textContent=`${kindLabel(selectedListing.kind)} · ${selectedListing.is_available?'متاح على الكتالوج':'غير متاح على الكتالوج'}`;
    const [s,w,e,r]=await Promise.all([
      supabase.from('listing_availability_settings').select('*').eq('listing_id',id).maybeSingle(),
      supabase.from('listing_availability_windows').select('*').eq('listing_id',id).order('weekday').order('start_time'),
      supabase.from('listing_availability_exceptions').select('*').eq('listing_id',id).order('exception_date',{ascending:true}),
      supabase.from('booking_reservations').select('id,reservation_date,start_time,end_time,quantity,status,expires_at,order_id,order_item_id,customer_id,created_at').eq('listing_id',id).gte('reservation_date',new Date().toISOString().slice(0,10)).order('reservation_date',{ascending:true}).order('start_time',{ascending:true}).limit(150)
    ]);for(const x of [s,w,e,r])if(x.error)throw x.error;settings=s.data||null;windows=w.data||[];exceptions=e.data||[];reservations=r.data||[];
    renderSettings();renderExceptions();renderReservations();
  }

  function renderSettings(){
    const s=settings||{};$('bookingEnabled').checked=!!s.booking_enabled;$('bookingMode').value=s.booking_mode||'date';$('slotMinutes').value=s.slot_minutes??60;$('dailyCapacity').value=s.daily_capacity??selectedListing.capacity_per_day??'';$('slotCapacity').value=s.slot_capacity??'';$('cutoffHours').value=s.cutoff_hours??0;$('holdMinutes').value=s.hold_minutes??15;
    $('statEnabled').textContent=s.booking_enabled?'مفعّل':'متوقف';$('statMode').textContent=(s.booking_mode||'date')==='time_slot'?'Time Slots':'Date Only';$('statCapacity').textContent=s.daily_capacity??selectedListing.capacity_per_day??'1';$('statCutoff').textContent=`${s.cutoff_hours??0} س`;
    document.querySelectorAll('[data-weekday]').forEach(row=>{const d=Number(row.dataset.weekday),ws=windows.filter(x=>x.weekday===d&&x.is_active);const first=ws[0];row.querySelector('[data-open]').checked=!!first;row.querySelector('[data-start]').value=first?time(first.start_time):'09:00';row.querySelector('[data-end]').value=first?time(first.end_time):'22:00';row.querySelector('[data-cap]').value=first?.capacity_override??''});
    document.querySelectorAll('#settingsForm input,#settingsForm select,#saveConfigBtn').forEach(el=>el.disabled=!canManage);
    toggleSlotFields();
  }
  function toggleSlotFields(){const slot=$('bookingMode').value==='time_slot';$('slotMinutesField').style.display=slot?'grid':'none';$('slotCapacityField').style.display=slot?'grid':'none'}

  function collectWindows(){return [...document.querySelectorAll('[data-weekday]')].map(row=>({weekday:Number(row.dataset.weekday),is_active:row.querySelector('[data-open]').checked,start_time:row.querySelector('[data-start]').value,end_time:row.querySelector('[data-end]').value,capacity_override:row.querySelector('[data-cap]').value?Number(row.querySelector('[data-cap]').value):null})).filter(x=>x.is_active)}
  async function saveConfig(e){e.preventDefault();if(!canManage||!selectedListing)return;const payload={booking_enabled:$('bookingEnabled').checked,booking_mode:$('bookingMode').value,timezone:'Africa/Cairo',slot_minutes:Number($('slotMinutes').value||60),daily_capacity:$('dailyCapacity').value?Number($('dailyCapacity').value):null,slot_capacity:$('slotCapacity').value?Number($('slotCapacity').value):null,cutoff_hours:Number($('cutoffHours').value||0),hold_minutes:Number($('holdMinutes').value||15)};const rows=collectWindows();if(!rows.length){show('errorBox','فعّل يوم واحد على الأقل في الجدول الأسبوعي.');return}$('saveConfigBtn').disabled=true;const {error}=await supabase.rpc('save_listing_availability_config',{p_listing_id:selectedListing.id,p_settings:payload,p_windows:rows});$('saveConfigBtn').disabled=false;if(error){show('errorBox',error.message);return}show('successBox','تم حفظ إعدادات التوفر والمواعيد.','success');await selectListing(selectedListing.id)}

  function renderExceptions(){const body=$('exceptionsBody');body.innerHTML='';$('exceptionsEmpty').hidden=!!exceptions.length;for(const e of exceptions){const tr=document.createElement('tr');tr.innerHTML=`<td>${date(e.exception_date)}</td><td><span class="badge ${e.is_closed?'bad':'good'}">${e.is_closed?'مغلق / Blackout':'ساعات مخصصة'}</span></td><td>${e.is_closed?'—':`${time(e.start_time)} – ${time(e.end_time)}`}</td><td>${e.capacity_override??'—'}</td><td>${esc(e.note||'—')}</td><td>${canManage?`<div class="actions"><button class="btn secondary" data-edit="${e.id}" type="button">تعديل</button><button class="btn bad" data-delete="${e.id}" type="button">حذف</button></div>`:'—'}</td>`;body.appendChild(tr)}body.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editException(b.dataset.edit));body.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deleteException(b.dataset.delete))}
  function resetException(){ $('exceptionId').value='';$('exceptionDate').value='';$('exceptionType').value='closed';$('exceptionStart').value='09:00';$('exceptionEnd').value='22:00';$('exceptionCapacity').value='';$('exceptionNote').value='';toggleExceptionFields() }
  function editException(id){const e=exceptions.find(x=>x.id===id);if(!e)return;$('exceptionId').value=e.id;$('exceptionDate').value=e.exception_date;$('exceptionType').value=e.is_closed?'closed':'custom';$('exceptionStart').value=time(e.start_time)==='—'?'09:00':time(e.start_time);$('exceptionEnd').value=time(e.end_time)==='—'?'22:00':time(e.end_time);$('exceptionCapacity').value=e.capacity_override??'';$('exceptionNote').value=e.note||'';toggleExceptionFields();$('exceptionDate').focus()}
  function toggleExceptionFields(){const closed=$('exceptionType').value==='closed';$('exceptionTimeFields').style.opacity=closed?'.45':'1';$('exceptionStart').disabled=closed||!canManage;$('exceptionEnd').disabled=closed||!canManage}
  async function saveException(e){e.preventDefault();if(!canManage||!selectedListing)return;const closed=$('exceptionType').value==='closed';const params={p_listing_id:selectedListing.id,p_exception_id:$('exceptionId').value||null,p_date:$('exceptionDate').value,p_is_closed:closed,p_start_time:closed?null:$('exceptionStart').value,p_end_time:closed?null:$('exceptionEnd').value,p_capacity_override:$('exceptionCapacity').value?Number($('exceptionCapacity').value):null,p_note:$('exceptionNote').value.trim()||null};if(!params.p_date){show('errorBox','اختر التاريخ.');return}const {error}=await supabase.rpc('upsert_listing_availability_exception',params);if(error){show('errorBox',error.message);return}resetException();show('successBox','تم حفظ اليوم الاستثنائي.','success');await selectListing(selectedListing.id)}
  async function deleteException(id){if(!canManage||!confirm('حذف هذا الاستثناء من جدول التوفر؟'))return;const {error}=await supabase.rpc('delete_listing_availability_exception',{p_exception_id:id});if(error){show('errorBox',error.message);return}show('successBox','تم حذف الاستثناء.','success');await selectListing(selectedListing.id)}

  function effectiveStatus(r){if(r.status==='hold'&&r.expires_at&&new Date(r.expires_at)<=new Date())return'expired';return r.status}
  function renderReservations(){const body=$('reservationsBody');body.innerHTML='';$('reservationsEmpty').hidden=!!reservations.length;let holds=0,confirmed=0;for(const r of reservations){const st=effectiveStatus(r);if(st==='hold')holds++;if(st==='confirmed')confirmed++;const tr=document.createElement('tr');tr.innerHTML=`<td>${date(r.reservation_date)}</td><td>${r.start_time?`${time(r.start_time)} – ${time(r.end_time)}`:'طوال اليوم'}</td><td>${r.quantity}</td><td><span class="badge ${st==='confirmed'?'good':st==='hold'?'warn':st==='cancelled'||st==='released'?'bad':''}">${esc(({hold:'Hold',confirmed:'Confirmed',released:'Released',cancelled:'Cancelled',expired:'Expired'})[st]||st)}</span></td><td>${r.expires_at?dt(r.expires_at):'—'}</td><td>${r.order_id?'مرتبط بطلب':'—'}</td>`;body.appendChild(tr)}$('statHolds').textContent=holds;$('statConfirmed').textContent=confirmed}

  async function boot(){try{if(!await guard())return;await loadListings();$('listingSelect').addEventListener('change',e=>selectListing(e.target.value).catch(err=>show('errorBox',err.message)));$('bookingMode').addEventListener('change',toggleSlotFields);$('settingsForm').addEventListener('submit',saveConfig);$('exceptionForm').addEventListener('submit',saveException);$('exceptionType').addEventListener('change',toggleExceptionFields);$('resetExceptionBtn').addEventListener('click',resetException);if(!canManage){document.querySelectorAll('#exceptionForm input,#exceptionForm select,#exceptionForm textarea,#exceptionForm button').forEach(el=>el.disabled=true)}resetException()}catch(err){console.error(err);show('errorBox','تعذر تحميل إدارة التوفر. راجع الاتصال والصلاحيات.')}finally{if($('loading'))$('loading').style.display='none'}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();