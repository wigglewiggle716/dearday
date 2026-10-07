import{createClient}from'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';
import{STAFF_ROLES,safePortalPath,needsChallenge}from'./dear-day-mfa.js';
const cfg=window.DEAR_DAY_SUPABASE;
const client=createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,storage:localStorage.getItem('ddAuthRemember')==='0'?sessionStorage:localStorage}});
const $=id=>document.getElementById(id);
let pending=null,busy=false;
const next=safePortalPath(new URLSearchParams(location.search).get('next'));
const status=message=>{$('status').textContent=message};
const clearSecret=()=>{$('qr').removeAttribute('src');$('secret').textContent='';$('code').value='';$('enrollment').hidden=true};
function setBusy(value){busy=value;document.querySelectorAll('button').forEach(b=>b.disabled=value)}
function errorMessage(error){return /rate|too many/i.test(error?.message||'')?'محاولات كثيرة. انتظر قليلًا ثم حاول مجددًا.':'تعذر إتمام العملية. تأكد من الرمز وضبط وقت جهازك ثم حاول مجددًا.'}
async function refresh(){
  const {data,error}=await client.auth.mfa.listFactors();if(error)throw error;
  const factors=(data.totp||[]).filter(f=>f.status==='verified');
  const challenge=await needsChallenge(client);
  $('setup').hidden=factors.length>0;$('enabled').hidden=factors.length===0||challenge;$('verify').hidden=!challenge;
  $('factor').replaceChildren(...factors.map((f,i)=>new Option(f.friendly_name||`تطبيق ${i+1}`,f.id)));
  $('factor').hidden=false;$('factor').previousElementSibling.hidden=false;
  $('intro').textContent=challenge?'أدخل رمز تطبيق المصادقة لاستكمال الدخول.':factors.length?'حسابك محمي بالتحقق بخطوتين.':'فعّل طبقة حماية إضافية لحسابك.';
  $('continue').href=next;
}
async function enroll(){
 if(busy)return;setBusy(true);status('');
 try{
  if(await needsChallenge(client)){await refresh();return}
  const listed=await client.auth.mfa.listFactors();if(listed.error)throw listed.error;
  for(const factor of (listed.data.all||[])){if(factor.factor_type==='totp'&&factor.status==='unverified'&&factor.friendly_name?.startsWith('Dear Day ')){const cleaned=await client.auth.mfa.unenroll({factorId:factor.id});if(cleaned.error)throw cleaned.error}}
  const {data,error}=await client.auth.mfa.enroll({factorType:'totp',friendlyName:'Dear Day '+new Date().toISOString(),issuer:'Dear Day'});
  if(error)throw error;pending=data.id;
  $('setup').hidden=true;$('enabled').hidden=true;$('enrollment').hidden=false;$('verify').hidden=false;
  const qr=data.totp.qr_code;
  $('qr').src=qr.startsWith('data:image/')?qr:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(qr);
  $('secret').textContent=data.totp.secret;
  $('factor').replaceChildren(new Option('التطبيق الجديد',pending));$('factor').hidden=true;$('factor').previousElementSibling.hidden=true;$('code').focus();
 }catch(e){status(errorMessage(e))}finally{setBusy(false)}
}
$('enroll').onclick=enroll;$('backup').onclick=enroll;
$('cancel').onclick=async()=>{if(!pending||busy)return;setBusy(true);try{const {error}=await client.auth.mfa.unenroll({factorId:pending});if(error)throw error;pending=null;clearSecret();await refresh()}catch(e){status(errorMessage(e))}finally{setBusy(false)}};
$('verify').onsubmit=async event=>{
 event.preventDefault();if(busy||!$('verify').reportValidity())return;setBusy(true);status('');
 try{
   const wasEnrollment=!!pending;
   const {error}=await client.auth.mfa.challengeAndVerify({factorId:pending||$('factor').value,code:$('code').value.trim()});if(error)throw error;
   pending=null;clearSecret();
   if(wasEnrollment){await refresh();status('تم تفعيل التحقق بخطوتين. يمكنك الآن إضافة تطبيق احتياطي.')}else location.replace(next);
 }catch(e){$('code').value='';status(errorMessage(e))}finally{setBusy(false)}
};
$('logout').onclick=async()=>{setBusy(true);clearSecret();const{error}=await client.auth.signOut();if(error){status('تعذر تسجيل الخروج. حاول مرة أخرى.');setBusy(false);return}location.replace('/Dear-Day-Staff-Login.html')};
try{
 const {data:{user},error}=await client.auth.getUser();if(error||!user)location.replace('/Dear-Day-Staff-Login.html');
 else{const{data:profile,error:pError}=await client.from('profiles').select('role,is_active').eq('id',user.id).single();if(pError||!profile?.is_active||!STAFF_ROLES.has(profile.role)){status('هذه الصفحة مخصصة لحسابات الفريق النشطة.');$('intro').textContent='غير مصرح بالدخول.'}else await refresh()}
}catch(e){status('تعذر تحميل إعدادات الأمان. أعد تحميل الصفحة للمحاولة مجددًا.')}
