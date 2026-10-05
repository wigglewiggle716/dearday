import{createClient}from'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';

const cfg=window.DEAR_DAY_SUPABASE;
const storage=localStorage.getItem('ddAuthRemember')==='0'?sessionStorage:localStorage;
const supabase=createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage}});
const $=id=>document.getElementById(id);
const money=(v,c='EGP')=>new Intl.NumberFormat('ar-EG',{style:'currency',currency:c||'EGP',maximumFractionDigits:2}).format(Number(v||0));
const date=v=>v?new Intl.DateTimeFormat('ar-EG',{year:'numeric',month:'short',day:'numeric'}).format(new Date(v)):'—';
const esc=v=>String(v??'').replace(/[&<>'"]/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[x]));
const statusLabel=s=>({draft:'مسودة',approved:'معتمدة',paid:'مدفوعة',cancelled:'ملغاة',pending_payment:'بانتظار الدفع',confirmed:'مؤكد',in_progress:'قيد التنفيذ',completed:'مكتمل',refunded:'مسترد'})[s]||String(s||'—').replaceAll('_',' ');
const statusClass=s=>['paid','completed','confirmed'].includes(s)?'good':['draft','approved','pending_payment','in_progress'].includes(s)?'warn':['cancelled','refunded'].includes(s)?'bad':'';

async function context(){
  const{data:{user}}=await supabase.auth.getUser();
  if(!user){location.replace('/Dear-Day-Staff-Login.html');return null}
  const[{data:profile,error:pErr},{data:rows,error:rErr}]=await Promise.all([
    supabase.from('profiles').select('role,is_active,full_name').eq('id',user.id).maybeSingle(),
    supabase.rpc('get_my_permissions')
  ]);
  if(pErr||!profile?.is_active){location.replace('/Dear-Day-Staff-Login.html');return null}
  if(rErr)throw rErr;
  return{user,profile,permissions:new Set((rows||[]).map(x=>x.permission_code))};
}

function showGeneric(ctx){
  $('staffDashboard').hidden=false;
  $('accountantDashboard').hidden=true;
  $('staffRole').textContent=ctx.profile.role;
  document.querySelectorAll('.staff-card[data-perm]').forEach(card=>{
    card.classList.toggle('show',ctx.permissions.has(card.dataset.perm));
  });
}

async function loadAccountant(ctx){
  $('accountantDashboard').hidden=false;
  $('staffDashboard').hidden=true;
  $('accountantRole').textContent='Accountant';
  $('accountantEmail').textContent=ctx.user.email||'';

  const[partnersRes,settlementsRes,partnerOrdersRes,itemsRes,ordersRes]=await Promise.all([
    supabase.from('partners').select('id,name_ar,name_en'),
    supabase.from('partner_settlements').select('id,partner_id,status,period_start,period_end,gross_amount,commission_amount,partner_net,payment_reference,created_at').order('created_at',{ascending:false}),
    supabase.from('partner_orders').select('id,partner_id,status,subtotal,commission_amount,partner_net,completed_at').eq('status','completed').order('completed_at',{ascending:false}),
    supabase.from('settlement_items').select('partner_order_id'),
    supabase.from('orders').select('id,order_number,status,occasion_type,grand_total,currency,created_at').order('created_at',{ascending:false}).limit(6)
  ]);
  for(const result of[partnersRes,settlementsRes,partnerOrdersRes,itemsRes,ordersRes])if(result.error)throw result.error;

  const partners=partnersRes.data||[];
  const settlements=settlementsRes.data||[];
  const used=new Set((itemsRes.data||[]).map(x=>x.partner_order_id));
  const eligible=(partnerOrdersRes.data||[]).filter(x=>!used.has(x.id));
  const pName=id=>partners.find(p=>p.id===id)?.name_ar||partners.find(p=>p.id===id)?.name_en||'—';
  const sumStatus=status=>settlements.filter(x=>x.status===status).reduce((sum,x)=>sum+Number(x.partner_net||0),0);

  $('kpiUnsettled').textContent=money(eligible.reduce((sum,x)=>sum+Number(x.partner_net||0),0));
  $('kpiDraft').textContent=money(sumStatus('draft'));
  $('kpiApproved').textContent=money(sumStatus('approved'));
  $('kpiPaid').textContent=money(sumStatus('paid'));

  const recentSettlements=settlements.slice(0,6);
  $('settlementsBody').innerHTML=recentSettlements.map(x=>`<tr><td><strong>${esc(pName(x.partner_id))}</strong></td><td>${date(x.period_start)} — ${date(x.period_end)}</td><td>${money(x.partner_net)}</td><td><span class="badge ${statusClass(x.status)}">${statusLabel(x.status)}</span></td><td>${esc(x.payment_reference||'—')}</td></tr>`).join('');
  $('settlementsEmpty').hidden=recentSettlements.length>0;

  const orders=ordersRes.data||[];
  $('ordersBody').innerHTML=orders.map(o=>`<tr><td><strong>#DD${esc(o.order_number)}</strong></td><td>${esc(o.occasion_type||'—')}</td><td><span class="badge ${statusClass(o.status)}">${statusLabel(o.status)}</span></td><td>${money(o.grand_total,o.currency)}</td><td>${date(o.created_at)}</td></tr>`).join('');
  $('ordersEmpty').hidden=orders.length>0;
}

async function boot(){
  try{
    const ctx=await context();
    if(!ctx)return;
    if(ctx.profile.role==='accountant'&&ctx.permissions.has('finance.view'))await loadAccountant(ctx);
    else showGeneric(ctx);
  }catch(err){
    console.error(err);
    $('pageError').textContent='تعذر تحميل لوحة الفريق. حاول تحديث الصفحة.';
    $('pageError').style.display='block';
  }finally{
    $('loading').style.display='none';
  }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
