(function(){
  const SUPABASE_ESM='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';
  const CONFIG_SRC='/approved-pages/dear-day-supabase-config.js?v=20261002-1';
  const isEn=()=>String(document.documentElement.lang||'').toLowerCase().startsWith('en')||document.documentElement.dir==='ltr';
  const home=()=>isEn()?'/index-en.html':'/';
  const authPath=()=>isEn()?'/Dear-Day-Auth-en.html':'/Dear-Day-Auth.html';
  const msg=(ar,en)=>isEn()?en:ar;
  const safeNext=()=>{const n=new URLSearchParams(location.search).get('next');return n&&n.startsWith('/')&&!n.startsWith('//')?n:home()};
  const setStatus=(id,text,error=false)=>{const el=document.getElementById(id);if(!el)return;el.textContent=text||'';el.style.color=error?'#A8583D':'#6B3540'};
  const setBusy=(form,busy)=>{const b=form?.querySelector('button[type="submit"]');if(!b)return;b.disabled=busy;b.style.opacity=busy?'.65':'1';b.setAttribute('aria-busy',String(busy))};

  function loadConfig(){
    if(window.DEAR_DAY_SUPABASE)return Promise.resolve(window.DEAR_DAY_SUPABASE);
    return new Promise((resolve,reject)=>{
      const existing=document.querySelector('script[data-dd-supabase-config]');
      if(existing){existing.addEventListener('load',()=>resolve(window.DEAR_DAY_SUPABASE),{once:true});existing.addEventListener('error',reject,{once:true});return;}
      const s=document.createElement('script');s.src=CONFIG_SRC;s.async=true;s.dataset.ddSupabaseConfig='1';
      s.onload=()=>window.DEAR_DAY_SUPABASE?resolve(window.DEAR_DAY_SUPABASE):reject(new Error('Supabase config unavailable'));
      s.onerror=reject;(document.head||document.documentElement).appendChild(s);
    });
  }

  async function boot(){
    const config=await loadConfig();
    const mod=await import(SUPABASE_ESM);
    const storage=localStorage.getItem('ddAuthRemember')==='0'?sessionStorage:localStorage;
    let supabase=mod.createClient(config.url,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage}});

    function clientForRemember(remember){
      localStorage.setItem('ddAuthRemember',remember?'1':'0');
      return mod.createClient(config.url,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:remember?localStorage:sessionStorage}});
    }

    const loginForm=document.getElementById('loginForm');
    const signupForm=document.getElementById('signupForm');
    const forgotForm=document.getElementById('forgotForm');

    loginForm?.addEventListener('submit',async e=>{
      e.preventDefault();e.stopImmediatePropagation();setStatus('loginStatus','');
      if(!loginForm.checkValidity()){loginForm.reportValidity();return;}
      setBusy(loginForm,true);
      try{
        const remember=!!loginForm.querySelector('[name="remember"]')?.checked;
        const c=clientForRemember(remember);
        const email=document.getElementById('loginEmail').value.trim();
        const password=document.getElementById('loginPassword').value;
        const {error}=await c.auth.signInWithPassword({email,password});
        if(error)throw error;
        setStatus('loginStatus',msg('تم تسجيل الدخول بنجاح.','Signed in successfully.'));
        location.href=safeNext();
      }catch(err){setStatus('loginStatus',translateError(err),true)}finally{setBusy(loginForm,false)}
    },true);

    signupForm?.addEventListener('submit',async e=>{
      e.preventDefault();e.stopImmediatePropagation();setStatus('signupStatus','');
      if(!signupForm.checkValidity()){signupForm.reportValidity();return;}
      setBusy(signupForm,true);
      try{
        const first=document.getElementById('firstName')?.value.trim()||'';
        const last=document.getElementById('lastName')?.value.trim()||'';
        const email=document.getElementById('signupEmail').value.trim();
        const phone=document.getElementById('signupPhone')?.value.trim()||'';
        const password=document.getElementById('signupPassword').value;
        const {data,error}=await supabase.auth.signUp({
          email,password,
          options:{
            data:{first_name:first,last_name:last,full_name:[first,last].filter(Boolean).join(' '),phone,profile_complete:true},
            emailRedirectTo:location.origin+authPath()+'#login'
          }
        });
        if(error)throw error;
        if(data.session){setStatus('signupStatus',msg('تم إنشاء الحساب بنجاح.','Account created successfully.'));location.href=safeNext();return;}
        setStatus('signupStatus',msg('تم إنشاء الحساب. راجع بريدك الإلكتروني لتأكيد الحساب ثم سجّل الدخول.','Account created. Check your email to confirm it, then log in.'));
        signupForm.reset();
      }catch(err){setStatus('signupStatus',translateError(err),true)}finally{setBusy(signupForm,false)}
    },true);

    forgotForm?.addEventListener('submit',async e=>{
      if(forgotForm.dataset.recoveryMode==='1')return;
      e.preventDefault();e.stopImmediatePropagation();setStatus('forgotStatus','');
      if(!forgotForm.checkValidity()){forgotForm.reportValidity();return;}
      setBusy(forgotForm,true);
      try{
        const email=document.getElementById('forgotEmail').value.trim();
        const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:location.origin+authPath()+'#forgot'});
        if(error)throw error;
        setStatus('forgotStatus',msg('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني.','Password reset link sent. Check your email.'));
      }catch(err){setStatus('forgotStatus',translateError(err),true)}finally{setBusy(forgotForm,false)}
    },true);

    document.querySelectorAll('.social-btn').forEach(btn=>btn.addEventListener('click',async e=>{
      e.preventDefault();e.stopImmediatePropagation();
      const provider=String(btn.dataset.provider||'').toLowerCase();
      if(!['google','facebook','apple'].includes(provider))return;
      const statusId=btn.closest('#signupPanel')?'signupStatus':'loginStatus';
      setStatus(statusId,msg('جاري فتح تسجيل الدخول…','Opening sign in…'));
      try{
        localStorage.setItem('ddAuthRemember','1');
        localStorage.setItem('ddPostAuthNext',safeNext());
        const {error}=await supabase.auth.signInWithOAuth({provider,options:{redirectTo:location.origin+authPath()}});
        if(error)throw error;
      }catch(err){setStatus(statusId,translateError(err),true)}
    },true));

    const {data:{session}}=await supabase.auth.getSession();
    if(session&&location.hash==='#login')setStatus('loginStatus',msg('أنت مسجل الدخول بالفعل.','You are already signed in.'));

    supabase.auth.onAuthStateChange((event)=>{
      if(event==='PASSWORD_RECOVERY')showRecoveryForm(supabase);
    });
    if(location.hash.includes('type=recovery'))showRecoveryForm(supabase);

    window.DearDayAuth={
      getSession:()=>supabase.auth.getSession(),
      getUser:()=>supabase.auth.getUser(),
      signOut:()=>supabase.auth.signOut()
    };
  }

  function showRecoveryForm(supabase){
    const form=document.getElementById('forgotForm');if(!form||form.dataset.recoveryMode==='1')return;
    document.getElementById('loginPanel')?.setAttribute('hidden','');
    document.getElementById('signupPanel')?.setAttribute('hidden','');
    document.getElementById('forgotPanel')?.removeAttribute('hidden');
    document.getElementById('headerLogin')?.classList.remove('active');
    document.getElementById('headerSignup')?.classList.remove('active');
    const title=document.getElementById('forgotTitle');if(title)title.textContent=msg('اختيار كلمة مرور جديدة','Choose a new password');
    form.dataset.recoveryMode='1';
    form.innerHTML=`<div class="field"><label for="ddNewPassword">${msg('كلمة المرور الجديدة','New password')}</label><div class="control"><input id="ddNewPassword" name="newPassword" type="password" autocomplete="new-password" minlength="8" required placeholder="${msg('8 أحرف على الأقل','At least 8 characters')}"></div></div><div class="field"><label for="ddConfirmPassword">${msg('تأكيد كلمة المرور','Confirm password')}</label><div class="control"><input id="ddConfirmPassword" name="confirmPassword" type="password" autocomplete="new-password" minlength="8" required></div></div><button class="primary" type="submit">${msg('حفظ كلمة المرور الجديدة','Save new password')}</button><p class="form-status" id="forgotStatus" role="status" aria-live="polite"></p>`;
    form.addEventListener('submit',async e=>{
      e.preventDefault();e.stopImmediatePropagation();setStatus('forgotStatus','');
      if(!form.checkValidity()){form.reportValidity();return;}
      const p=document.getElementById('ddNewPassword').value,c=document.getElementById('ddConfirmPassword').value;
      if(p!==c){setStatus('forgotStatus',msg('كلمتا المرور غير متطابقتين.','Passwords do not match.'),true);return;}
      setBusy(form,true);
      try{
        const {error}=await supabase.auth.updateUser({password:p});if(error)throw error;
        setStatus('forgotStatus',msg('تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.','Password updated. You can now log in.'));
        setTimeout(()=>{history.replaceState(null,'',authPath()+'#login');location.reload()},900);
      }catch(err){setStatus('forgotStatus',translateError(err),true)}finally{setBusy(form,false)}
    },true);
  }

  function translateError(err){
    const raw=String(err?.message||err||'').toLowerCase();
    if(raw.includes('invalid login credentials'))return msg('البريد الإلكتروني أو كلمة المرور غير صحيحة.','Incorrect email or password.');
    if(raw.includes('email not confirmed'))return msg('أكد بريدك الإلكتروني أولًا ثم حاول تسجيل الدخول.','Confirm your email first, then try again.');
    if(raw.includes('user already registered'))return msg('هذا البريد مسجل بالفعل. جرّب تسجيل الدخول.','This email is already registered. Try logging in.');
    if(raw.includes('password')&&raw.includes('least'))return msg('اختر كلمة مرور أقوى وبعدد أحرف كافٍ.','Choose a stronger password with enough characters.');
    if(raw.includes('provider')||raw.includes('unsupported'))return msg('طريقة تسجيل الدخول هذه غير مفعّلة حاليًا.','This sign-in provider is not enabled yet.');
    if(raw.includes('rate limit'))return msg('محاولات كثيرة في وقت قصير. حاول مرة أخرى بعد قليل.','Too many attempts. Please try again shortly.');
    return msg('حدث خطأ أثناء تنفيذ الطلب. حاول مرة أخرى.','Something went wrong. Please try again.');
  }

  function start(){boot().catch(()=>{
    setStatus('loginStatus',msg('تعذر تشغيل خدمة تسجيل الدخول حاليًا.','Authentication service is currently unavailable.'),true);
    setStatus('signupStatus',msg('تعذر تشغيل خدمة إنشاء الحساب حاليًا.','Account service is currently unavailable.'),true);
  })}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
