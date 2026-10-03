(function(){
  const SUPABASE_ESM='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';
  const CONFIG_SRC='/approved-pages/dear-day-supabase-config.js?v=20261002-1';
  const en=()=>String(document.documentElement.lang||'').toLowerCase().startsWith('en');
  const t=(ar,enText)=>en()?enText:ar;
  const authPath=()=>en()?'/Dear-Day-Auth-en.html':'/Dear-Day-Auth.html';
  const home=()=>en()?'/index-en.html':'/';

  const STAFF_ROLES=new Set(['super_admin','admin','operations','accountant','partner_manager','customer_support','marketing','content_admin']);
  function portalForRole(role){if(role==='super_admin'||role==='admin')return'/Dear-Day-Admin.html';if(role==='partner_user')return'/Dear-Day-Partner.html';if(STAFF_ROLES.has(role))return'/Dear-Day-Staff.html';return null}
  let supabase,user,profile={},pendingAction='',addresses=[];

  function status(id,msg,error=false){const el=document.getElementById(id);if(!el)return;el.textContent=msg||'';el.style.color=error?'#A8583D':'#6B3540'}
  function loadConfig(){if(window.DEAR_DAY_SUPABASE)return Promise.resolve(window.DEAR_DAY_SUPABASE);return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=CONFIG_SRC;s.onload=()=>resolve(window.DEAR_DAY_SUPABASE);s.onerror=reject;document.head.appendChild(s)})}
  function meta(){return user?.user_metadata||{}}
  function clean(v){return String(v||'').trim()}
  function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

  async function ensureProfile(){
    const {data,error}=await supabase.from('profiles').select('id,first_name,last_name,full_name,phone,birth_date,area').eq('id',user.id).maybeSingle();
    if(error)throw error;
    if(data){profile=data;return}
    const m=meta(),first=m.first_name||'',last=m.last_name||'';
    const row={id:user.id,first_name:first||null,last_name:last||null,full_name:m.full_name||[first,last].filter(Boolean).join(' ')||null,phone:m.phone||user.phone||null,birth_date:m.birth_date||null,area:m.area||null};
    const created=await supabase.from('profiles').insert(row).select('id,first_name,last_name,full_name,phone,birth_date,area').single();
    if(created.error)throw created.error;
    profile=created.data;
  }

  function fill(){
    const m=meta();
    document.getElementById('firstName').value=profile.first_name||m.first_name||'';
    document.getElementById('lastName').value=profile.last_name||m.last_name||'';
    document.getElementById('email').value=user?.email||'';
    document.getElementById('phone').value=profile.phone||m.phone||user?.phone||'';
    document.getElementById('birthDate').value=profile.birth_date||m.birth_date||'';
    document.getElementById('area').value=profile.area||m.area||'';
  }

  async function saveProfile(e){
    e.preventDefault();status('profileStatus','');
    const first=clean(document.getElementById('firstName').value),last=clean(document.getElementById('lastName').value),birth=document.getElementById('birthDate').value||null,area=clean(document.getElementById('area').value)||null;
    if(!first||!last){status('profileStatus',t('الاسم الأول واسم العائلة مطلوبان.','First and last name are required.'),true);return}
    const row={first_name:first,last_name:last,full_name:[first,last].join(' '),birth_date:birth,area};
    const {data,error}=await supabase.from('profiles').update(row).eq('id',user.id).select('id,first_name,last_name,full_name,phone,birth_date,area').single();
    if(error){status('profileStatus',error.message,true);return}
    profile=data;
    const authUpdate=await supabase.auth.updateUser({data:{...meta(),first_name:first,last_name:last,full_name:row.full_name,birth_date:birth,area,profile_complete:true}});
    if(!authUpdate.error&&authUpdate.data?.user)user=authUpdate.data.user;
    status('profileStatus',t('تم حفظ البيانات بنجاح.','Details saved successfully.'));
  }

  async function loadAddresses(){
    const {data,error}=await supabase.from('customer_addresses').select('id,label,recipient_name,phone,area,address_line1,address_line2,landmark,is_default').order('is_default',{ascending:false}).order('created_at',{ascending:true});
    if(error)throw error;addresses=data||[];renderAddresses();
  }

  function renderAddresses(){
    const host=document.getElementById('addressesList');if(!host)return;
    if(!addresses.length){host.innerHTML='<div class="address-empty">'+esc(t('لا توجد عناوين محفوظة حتى الآن.','No saved addresses yet.'))+'</div>';return}
    host.innerHTML=addresses.map(a=>`<article class="address-item" data-address-id="${esc(a.id)}"><div><strong>${esc(a.label||t('عنوان','Address'))}${a.is_default?' <span class="default-badge">'+esc(t('الافتراضي','Default'))+'</span>':''}</strong><p>${esc(a.recipient_name||'')}${a.phone?' · '+esc(a.phone):''}</p><p>${esc([a.address_line1,a.address_line2,a.area,a.landmark].filter(Boolean).join('، '))}</p></div><div class="address-actions"><button type="button" data-edit-address="${esc(a.id)}">${esc(t('تعديل','Edit'))}</button>${a.is_default?'':`<button type="button" data-default-address="${esc(a.id)}">${esc(t('اجعله افتراضيًا','Set default'))}</button>`}<button type="button" class="danger" data-delete-address="${esc(a.id)}">${esc(t('حذف','Delete'))}</button></div></article>`).join('');
  }

  function resetAddressForm(){
    document.getElementById('addressId').value='';document.getElementById('addressForm').reset();document.getElementById('addressId').value='';
    document.getElementById('addressFormTitle').textContent=t('إضافة عنوان','Add address');
    document.getElementById('cancelAddressEdit').hidden=true;
  }

  function editAddress(id){
    const a=addresses.find(x=>x.id===id);if(!a)return;
    document.getElementById('addressId').value=a.id;
    document.getElementById('addressLabel').value=a.label||'';
    document.getElementById('addressRecipient').value=a.recipient_name||'';
    document.getElementById('addressPhone').value=a.phone||'';
    document.getElementById('addressArea').value=a.area||'';
    document.getElementById('addressLine1').value=a.address_line1||'';
    document.getElementById('addressLine2').value=a.address_line2||'';
    document.getElementById('addressLandmark').value=a.landmark||'';
    document.getElementById('addressDefault').checked=!!a.is_default;
    document.getElementById('addressFormTitle').textContent=t('تعديل العنوان','Edit address');
    document.getElementById('cancelAddressEdit').hidden=false;
    document.getElementById('addressForm').scrollIntoView({behavior:'smooth',block:'center'});
  }

  async function saveAddress(e){
    e.preventDefault();status('addressStatus','');
    const id=document.getElementById('addressId').value;
    const row={user_id:user.id,label:clean(document.getElementById('addressLabel').value)||t('المنزل','Home'),recipient_name:clean(document.getElementById('addressRecipient').value)||null,phone:clean(document.getElementById('addressPhone').value)||null,area:clean(document.getElementById('addressArea').value),address_line1:clean(document.getElementById('addressLine1').value),address_line2:clean(document.getElementById('addressLine2').value)||null,landmark:clean(document.getElementById('addressLandmark').value)||null,is_default:document.getElementById('addressDefault').checked};
    if(!row.area||!row.address_line1){status('addressStatus',t('المنطقة والعنوان الأساسي مطلوبان.','Area and address line are required.'),true);return}
    if(row.is_default){const r=await supabase.from('customer_addresses').update({is_default:false}).eq('user_id',user.id);if(r.error){status('addressStatus',r.error.message,true);return}}
    const q=id?supabase.from('customer_addresses').update(row).eq('id',id):supabase.from('customer_addresses').insert(row);
    const {error}=await q;if(error){status('addressStatus',error.message,true);return}
    if(!addresses.length&&!row.is_default){await supabase.from('customer_addresses').update({is_default:true}).eq('user_id',user.id)}
    await loadAddresses();resetAddressForm();status('addressStatus',t('تم حفظ العنوان.','Address saved.'));
  }

  async function setDefaultAddress(id){
    status('addressStatus','');
    const a=await supabase.from('customer_addresses').update({is_default:false}).eq('user_id',user.id);if(a.error){status('addressStatus',a.error.message,true);return}
    const b=await supabase.from('customer_addresses').update({is_default:true}).eq('id',id);if(b.error){status('addressStatus',b.error.message,true);return}
    await loadAddresses();
  }

  async function deleteAddress(id){
    if(!confirm(t('هل تريد حذف هذا العنوان؟','Delete this address?')))return;
    const wasDefault=addresses.find(a=>a.id===id)?.is_default;
    const {error}=await supabase.from('customer_addresses').delete().eq('id',id);if(error){status('addressStatus',error.message,true);return}
    await loadAddresses();
    if(wasDefault&&addresses[0]){await setDefaultAddress(addresses[0].id)}
  }

  async function requestReauth(action){pendingAction=action;status('securityStatus','');const box=document.getElementById('verifyBox'),input=document.getElementById('verifyInput'),text=document.getElementById('verifyText');box.classList.add('show');input.value='';input.type='text';input.placeholder=t('كود التحقق','Verification code');const {error}=await supabase.auth.reauthenticate();if(error){status('securityStatus',error.message,true);return}text.textContent=t('أرسلنا كود تحقق لوسيلة التحقق المسجلة. أدخل الكود للمتابعة.','We sent a verification code to your registered verification method. Enter it to continue.')}
  function askEmailChange(){pendingAction='email-direct';const box=document.getElementById('verifyBox'),input=document.getElementById('verifyInput'),text=document.getElementById('verifyText');box.classList.add('show');input.value='';input.type='email';input.placeholder=t('البريد الإلكتروني الجديد','New email address');text.textContent=t('أدخل البريد الجديد. سيتم إرسال رسالة تأكيد قبل اعتماد التغيير.','Enter the new email. A confirmation message will be sent before the change is applied.')}
  async function continueSecurity(){const input=document.getElementById('verifyInput'),value=input.value.trim();status('securityStatus','');if(!value){status('securityStatus',t('أدخل القيمة المطلوبة أولًا.','Enter the required value first.'),true);return}if(pendingAction==='email-direct'){const {error}=await supabase.auth.updateUser({email:value});if(error){status('securityStatus',error.message,true);return}status('securityStatus',t('تم إرسال رسالة تأكيد للبريد الجديد.','Confirmation sent to the new email address.'));return}const nonce=value;if(pendingAction==='password'){input.value='';input.type='password';input.placeholder=t('كلمة المرور الجديدة','New password');pendingAction='password-new';document.getElementById('verifyText').textContent=t('تم التحقق. أدخل كلمة المرور الجديدة.','Verified. Enter your new password.');input.dataset.nonce=nonce;return}if(pendingAction==='password-new'){if(value.length<8){status('securityStatus',t('كلمة المرور يجب أن تكون 8 أحرف على الأقل.','Password must be at least 8 characters.'),true);return}const {error}=await supabase.auth.updateUser({password:value,nonce:input.dataset.nonce});if(error){status('securityStatus',error.message,true);return}status('securityStatus',t('تم تغيير كلمة المرور بنجاح.','Password changed successfully.'));return}if(pendingAction==='phone'){input.value='';input.type='tel';input.placeholder=t('رقم الموبايل الجديد','New mobile number');pendingAction='phone-new';document.getElementById('verifyText').textContent=t('تم التحقق. أدخل رقم الموبايل الجديد.','Verified. Enter your new mobile number.');input.dataset.nonce=nonce;return}if(pendingAction==='phone-new'){const {data,error}=await supabase.from('profiles').update({phone:value}).eq('id',user.id).select('id,first_name,last_name,full_name,phone,birth_date,area').single();if(error){status('securityStatus',error.message,true);return}profile=data;await supabase.auth.updateUser({data:{...meta(),phone:value},nonce:input.dataset.nonce});document.getElementById('phone').value=value;status('securityStatus',t('تم تغيير رقم الموبايل بعد تأكيد الهوية.','Mobile number changed after identity verification.'));return}}


  async function loadDeletionRequest(){
    const btn=document.getElementById('requestAccountDeletion');if(!btn)return;
    const {data,error}=await supabase.rpc('my_account_deletion_request');
    if(error){status('deletionStatus',t('تعذر تحميل حالة طلب الحذف.','Could not load deletion request status.'),true);return}
    const r=Array.isArray(data)?data[0]:data;
    if(!r){btn.disabled=false;btn.textContent=t('طلب حذف الحساب','Request account deletion');status('deletionStatus','');return}
    if(r.status==='pending'){
      btn.disabled=true;btn.textContent=t('الطلب قيد المراجعة','Request under review');
      status('deletionStatus',t('تم استلام طلب حذف الحساب وهو الآن بانتظار مراجعة Dear Day.','Your deletion request has been received and is waiting for Dear Day review.'));
      return;
    }
    if(r.status==='rejected'){
      btn.disabled=false;btn.textContent=t('تقديم طلب حذف جديد','Submit a new deletion request');
      status('deletionStatus',t('تمت مراجعة الطلب السابق ولم تتم الموافقة عليه. يمكنك التواصل مع خدمة العملاء أو تقديم طلب جديد.','Your previous request was reviewed and was not approved. You can contact support or submit a new request.'),true);
      return;
    }
  }

  async function requestAccountDeletion(){
    const btn=document.getElementById('requestAccountDeletion');if(!btn)return;
    const msg=t('هل أنت متأكد من تقديم طلب حذف حسابك وبياناتك نهائيًا؟ لن يتم الحذف فورًا؛ سيقوم Dear Day بمراجعة الطلب أولًا.','Are you sure you want to request permanent deletion of your account and personal data? Deletion is not immediate; Dear Day will review the request first.');
    if(!confirm(msg))return;
    btn.disabled=true;status('deletionStatus',t('جاري إرسال الطلب…','Submitting request…'));
    const {error}=await supabase.rpc('request_account_deletion');
    if(error){btn.disabled=false;status('deletionStatus',error.message||t('تعذر إرسال الطلب.','Could not submit the request.'),true);return}
    await loadDeletionRequest();
  }

  async function boot(){
    const cfg=await loadConfig();const mod=await import(SUPABASE_ESM);supabase=mod.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    const {data,error}=await supabase.auth.getUser();if(error)throw error;user=data?.user;if(!user){location.replace(authPath()+'#login');return}const {data:ddAccess}=await supabase.from('profiles').select('role,is_active').eq('id',user.id).maybeSingle();if(ddAccess?.is_active===false){await supabase.auth.signOut();location.replace(authPath()+'#login');return}const ddPortal=portalForRole(ddAccess?.role);if(ddPortal){location.replace(ddPortal);return}
    await ensureProfile();fill();await loadAddresses();await loadDeletionRequest();
    document.getElementById('profileForm')?.addEventListener('submit',saveProfile);
    document.getElementById('addressForm')?.addEventListener('submit',saveAddress);
    document.getElementById('cancelAddressEdit')?.addEventListener('click',resetAddressForm);
    document.getElementById('addressesList')?.addEventListener('click',e=>{const edit=e.target.closest('[data-edit-address]'),def=e.target.closest('[data-default-address]'),del=e.target.closest('[data-delete-address]');if(edit)editAddress(edit.dataset.editAddress);if(def)setDefaultAddress(def.dataset.defaultAddress);if(del)deleteAddress(del.dataset.deleteAddress)});
    document.querySelector('[data-action="password"]')?.addEventListener('click',()=>requestReauth('password'));
    document.querySelector('[data-action="phone"]')?.addEventListener('click',()=>requestReauth('phone'));
    document.querySelector('[data-action="email"]')?.addEventListener('click',askEmailChange);
    document.getElementById('verifyAction')?.addEventListener('click',continueSecurity);
    document.getElementById('requestAccountDeletion')?.addEventListener('click',requestAccountDeletion);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>boot().catch(err=>{console.error(err);location.replace(authPath()+'#login')}),{once:true});else boot().catch(err=>{console.error(err);location.replace(authPath()+'#login')});
})();