(function(){
  const SUPABASE_ESM='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';
  const CONFIG_SRC='/approved-pages/dear-day-supabase-config.js?v=20261002-1';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
  const money=(v,c='EGP')=>new Intl.NumberFormat('ar-EG',{style:'currency',currency:c||'EGP',maximumFractionDigits:2}).format(Number(v||0));
  const date=v=>{if(!v)return'—';try{return new Intl.DateTimeFormat('ar-EG',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(v))}catch{return v}};
  const day=v=>{if(!v)return'—';try{return new Intl.DateTimeFormat('ar-EG',{year:'numeric',month:'short',day:'numeric'}).format(new Date(v))}catch{return v}};
  function loadConfig(){if(window.DEAR_DAY_SUPABASE)return Promise.resolve(window.DEAR_DAY_SUPABASE);return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=CONFIG_SRC;s.onload=()=>resolve(window.DEAR_DAY_SUPABASE);s.onerror=reject;document.head.appendChild(s)})}
  function ensureNotificationBadge(){if(document.querySelector('script[data-dd-notification-badge]'))return;const s=document.createElement('script');s.src='/approved-pages/dear-day-notification-badge.js?v=20261002-1';s.defer=true;s.dataset.ddNotificationBadge='1';document.head.appendChild(s)}
  function show(id,msg,type){const e=$(id);if(!e)return;e.textContent=msg||'';e.className=type==='success'?'success':'error';e.style.display=msg?'block':'none';if(msg)setTimeout(()=>{if(e.textContent===msg)e.style.display='none'},4500)}
  async function client(){const cfg=await loadConfig(),mod=await import(SUPABASE_ESM);return mod.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}})}
  async function guard(){
    ensureNotificationBadge();
    const supabase=await client();
    const {data:{user},error}=await supabase.auth.getUser();
    if(error||!user){location.replace('/Dear-Day-Partner-Login.html');return null}
    const {data:profile,error:pErr}=await supabase.from('profiles').select('id,full_name,role,is_active').eq('id',user.id).single();
    if(pErr||!profile||!profile.is_active||profile.role!=='partner_user'){await supabase.auth.signOut();location.replace('/Dear-Day-Partner-Login.html');return null}
    const {data:members,error:mErr}=await supabase.from('partner_users').select('partner_id,partner_role,is_active').eq('user_id',user.id).eq('is_active',true);if(mErr)throw mErr;
    if(!members?.length){await supabase.auth.signOut();location.replace('/Dear-Day-Partner-Login.html?error=no_partner');return null}
    const ids=members.map(x=>x.partner_id);
    const {data:partners,error:paErr}=await supabase.from('partners').select('id,name_ar,name_en,status,commission_rate,contact_name,phone,email,coverage_areas').in('id',ids);if(paErr)throw paErr;
    const partner=partners?.[0];if(!partner){await supabase.auth.signOut();location.replace('/Dear-Day-Partner-Login.html?error=no_partner');return null}
    if($('partnerEmail'))$('partnerEmail').textContent=user.email||profile.full_name||'Partner';
    if($('partnerName'))$('partnerName').textContent=partner.name_ar||partner.name_en||'Partner';
    if($('partnerStatus'))$('partnerStatus').textContent=partner.status;
    const logout=$('logoutBtn');if(logout)logout.onclick=async()=>{await supabase.auth.signOut();location.replace('/Dear-Day-Partner-Login.html')};
    return {supabase,user,profile,members,partners,partner};
  }
  window.DDPartner={$,esc,money,date,day,show,client,guard};
})();