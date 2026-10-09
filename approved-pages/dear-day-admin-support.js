(function(){
"use strict";
// Dedicated support inbox. Supabase RLS and review_support_ticket enforce RBAC.
const SUPABASE_ESM="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm";
const CONFIG_SRC="/approved-pages/dear-day-supabase-config.js?v=20261002-1";
const STATUS={
 new:"جديد",in_progress:"قيد المتابعة",
 awaiting_customer:"في انتظار العميل",resolved:"تم الحل",closed:"مغلق"
};
const ALLOWED_MANAGERS=new Set(["super_admin","admin","customer_support"]);
const $=id=>document.getElementById(id);
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({
 "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));
const fmt=v=>{try{return new Intl.DateTimeFormat("ar-EG",{
 dateStyle:"medium",timeStyle:"short"
}).format(new Date(v))}catch{return "—"}};
const reference=v=>"DD-CS-"+String(v).padStart(6,"0");
const validUuid=v=>/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(v||"");
let sb=null,tickets=[],selectedId=null,canManage=false,lastFocus=null;
function notice(msg,kind="error"){
 const el=$("notice");el.hidden=!msg;
 el.textContent=msg||"";el.dataset.kind=kind;
}
function setStats(){
 const total=tickets.length;
 $("countAll").textContent=total;
 $("countNew").textContent=tickets.filter(x=>x.status==="new").length;
 $("countProgress").textContent=tickets.filter(x=>x.status==="in_progress"||x.status==="awaiting_customer").length;
 $("countResolved").textContent=tickets.filter(x=>x.status==="resolved"||x.status==="closed").length;
}
function render(){
 const q=$("ticketSearch").value.trim().toLowerCase();
 const st=$("ticketFilter").value;
 const rows=tickets.filter(x=>(!st||x.status===st)&&
  (!q||[reference(x.ticket_no),x.name,x.email,x.phone,x.subject,x.message].join(" ").toLowerCase().includes(q)));
 const tbody=$("ticketRows");
 tbody.innerHTML=rows.map(x=>
  '<tr><td><strong>'+esc(reference(x.ticket_no))+'</strong><small>'+esc(fmt(x.created_at))+'</small></td>'+
  '<td><b>'+esc(x.name)+'</b><small>'+esc(x.email)+'</small></td>'+
  '<td>'+esc(x.subject)+'</td>'+
  '<td><span class="pill" data-status="'+esc(x.status)+'">'+esc(STATUS[x.status]||x.status)+'</span></td>'+
  '<td><button class="btn" data-ticket-id="'+esc(x.id)+'" type="button">عرض التفاصيل</button></td></tr>'
 ).join("");
 $("emptyState").hidden=rows.length!==0;
 setStats();
}
async function loadTickets(focusId=null){
 if(!sb)return;
 notice("");
 const refresh=$("refreshBtn");
 refresh.disabled=true;
 try{
  const {data,error}=await sb.from("support_tickets").select("*")
    .order("created_at",{ascending:false}).limit(250);
  if(error)throw error;
  tickets=data||[];
  render();
  const focus=focusId||new URLSearchParams(location.search).get("ticket");
  if(validUuid(focus)&&tickets.some(x=>x.id===focus))openTicket(focus);
 }catch(error){
  console.error("Support inbox:",error);
  notice("تعذر تحميل الرسائل. تحقق من الاتصال أو صلاحية عرض العملاء.");
 }finally{refresh.disabled=false}
}
function detail(label,value,wide=false){
 return '<div class="detail'+(wide?" wide":"")+'"><span>'+esc(label)+'</span>'+
 '<strong>'+esc(value==null||value===""?"—":value)+'</strong></div>';
}
function closeTicket(){
 selectedId=null;$("ticketModal").classList.remove("show");
 $("ticketModal").setAttribute("aria-hidden","true");
 document.body.style.removeProperty("overflow");
 if(lastFocus?.isConnected)lastFocus.focus();
}
function openTicket(id){
 const t=tickets.find(x=>x.id===id);if(!t)return;
 selectedId=id;lastFocus=document.activeElement;
 $("modalTitle").textContent="رسالة "+reference(t.ticket_no);
 $("ticketDetail").innerHTML=
  '<div class="detail-grid">'+
  detail("رقم الطلب",reference(t.ticket_no))+detail("تاريخ الاستلام",fmt(t.created_at))+
  detail("الاسم",t.name)+detail("اللغة",t.locale==="en"?"English":"العربية")+
  detail("البريد الإلكتروني",t.email)+detail("الهاتف",t.phone)+
  detail("الموضوع",t.subject,true)+detail("نص الرسالة",t.message,true)+
  detail("آخر تحديث",fmt(t.updated_at))+detail("الحالة",STATUS[t.status]||t.status)+
  '</div>'+
  '<div class="contact-actions">'+
  '<a href="mailto:'+encodeURIComponent(t.email)+'" rel="noopener">رد يدوي بالإيميل</a>'+
  (t.phone?'<a href="tel:'+encodeURIComponent(t.phone)+'">اتصال</a>':"")+
  '</div>'+
  '<div class="review-section">'+
  '<label for="ticketStatus">حالة التذكرة</label>'+
  '<select id="ticketStatus"'+(canManage?"":" disabled")+'>'+
  Object.entries(STATUS).map(([status,label])=>'<option value="'+status+'"'+
   (status===t.status?" selected":"")+'>'+label+'</option>').join("")+'</select>'+
  '<label for="ticketNotes">ملاحظات فريق خدمة العملاء</label>'+
  '<textarea id="ticketNotes" maxlength="4000"'+(canManage?"":" readonly")+
   ' placeholder="اكتب ملحوظة داخلية لا يراها العميل">'+esc(t.internal_notes||"")+'</textarea>'+
  (canManage?'<button id="saveReview" class="btn primary" type="button">حفظ التحديث</button>':"")+
  '<div class="history"><h3>سجل المتابعة</h3><div id="ticketHistory" aria-live="polite">جاري تحميل السجل…</div></div>'+
  '</div>';
 if(canManage)$("saveReview").addEventListener("click",saveReview);
 $("ticketModal").classList.add("show");$("ticketModal").setAttribute("aria-hidden","false");
 document.body.style.overflow="hidden";$("closeModal").focus();
 loadHistory(t.id).catch(console.error);
}
async function loadHistory(id){
 const target=$("ticketHistory");if(!target)return;
 const {data,error}=await sb.from("support_ticket_events")
   .select("created_at,previous_status,next_status,note")
   .eq("ticket_id",id).order("created_at",{ascending:false}).limit(40);
 if(selectedId!==id||!target.isConnected)return;
 if(error){target.textContent="تعذر تحميل سجل المتابعة.";return}
 target.innerHTML=(data||[]).length?(data||[]).map(item=>
  '<div class="history-entry"><b>'+esc(fmt(item.created_at))+'</b>'+
  ' — '+esc(STATUS[item.previous_status]||"جديد")+
  ' ← '+esc(STATUS[item.next_status]||item.next_status)+
  (item.note?'<p>'+esc(item.note)+'</p>':"")+'</div>').join(""):
  '<p class="muted">لا يوجد تحديثات على هذه التذكرة بعد.</p>';
}
async function saveReview(){
 const id=selectedId;if(!id||!canManage)return;
 const status=$("ticketStatus").value,notes=$("ticketNotes").value.trim();
 if(!Object.prototype.hasOwnProperty.call(STATUS,status)||notes.length>4000)return;
 const btn=$("saveReview");btn.disabled=true;
 try{
  const {error}=await sb.rpc("review_support_ticket",{
   p_ticket_id:id,p_status:status,p_internal_notes:notes||null
  });
  if(error)throw error;
  closeTicket();await loadTickets();notice("تم حفظ تحديث التذكرة.","success");
 }catch(error){
  console.error("Ticket review:",error);
  notice("تعذر حفظ التحديث. راجع الصلاحيات وحاول مجددًا.");
 }finally{if(btn.isConnected)btn.disabled=false}
}
async function loadConfig(){
 if(window.DEAR_DAY_SUPABASE)return window.DEAR_DAY_SUPABASE;
 await new Promise((resolve,reject)=>{
  const s=document.createElement("script");s.src=CONFIG_SRC;
  s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
 });
 return window.DEAR_DAY_SUPABASE;
}
async function guard(){
 const auth=await sb.auth.getUser();
 if(auth.error||!auth.data?.user){
  location.replace("/auth?next="+encodeURIComponent("/Dear-Day-Admin-Support.html")+"#login");
  return false;
 }
 const user=auth.data.user;
 const [{data:profile,error:profileError},{data:permissions,error:permError}]=await Promise.all([
  sb.from("profiles").select("role,is_active").eq("id",user.id).single(),
  sb.rpc("get_my_permissions")
 ]);
 if(profileError||permError||!profile?.is_active){
  location.replace("/Dear-Day-Staff.html");return false;
 }
 const codes=new Set((permissions||[]).map(x=>x.permission_code));
 if(!codes.has("customers.view")){
  location.replace("/Dear-Day-Staff.html");return false;
 }
 // Respect the existing admin MFA requirement before fetching tickets.
 const mfa=await import("/approved-pages/dear-day-mfa.js");
 if(!await mfa.guardMfa(sb,profile.role))return false;
 canManage=ALLOWED_MANAGERS.has(profile.role);
 $("adminEmail").textContent=user.email||"—";
 $("roleBadge").textContent=profile.role==="super_admin"?"Super Admin":profile.role||"Staff";
 return true;
}
async function boot(){
 try{
  const cfg=await loadConfig();
  if(!cfg?.url||!cfg?.publishableKey)throw Error("Supabase config missing");
  const mod=await import(SUPABASE_ESM);
  const storage=localStorage.getItem("ddAuthRemember")==="0"?sessionStorage:localStorage;
  sb=mod.createClient(cfg.url,cfg.publishableKey,{auth:{
   persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage
  }});
  if(!await guard())return;
  $("ticketSearch").addEventListener("input",render);
  $("ticketFilter").addEventListener("change",render);
  $("refreshBtn").addEventListener("click",()=>loadTickets());
  $("closeModal").addEventListener("click",closeTicket);
  $("ticketModal").addEventListener("click",e=>{if(e.target===$("ticketModal"))closeTicket()});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("ticketModal").classList.contains("show"))closeTicket()});
  $("ticketRows").addEventListener("click",e=>{
   const btn=e.target.closest("button[data-ticket-id]");
   if(btn)openTicket(btn.dataset.ticketId);
  });
  await loadTickets();
 }catch(error){
  console.error("Support ticket boot:",error);
  notice("تعذر فتح قسم رسائل العملاء. راجع تسجيل الدخول والاتصال.");
 }finally{$("loading").hidden=true}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
else boot();
})();