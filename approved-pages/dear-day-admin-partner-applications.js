(function(){
"use strict";
// Independent, additive partner application inbox. Existing partner admin logic
// and partner records remain unchanged. Every action is checked by DB RLS/RPC.
var ESM="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm";
var CONFIG="/approved-pages/dear-day-supabase-config.js?v=20261002-1";
var BUCKET="partner-applications";
var STATES={new:"جديد",under_review:"قيد المراجعة",contacted:"تم التواصل",accepted:"مقبول",rejected:"مرفوض"};
var client=null,all=[],canManage=false,opened=null;
var $=function(id){return document.getElementById(id)};
var esc=function(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
var date=function(v){try{return new Intl.DateTimeFormat("ar-EG",{dateStyle:"medium",timeStyle:"short"}).format(new Date(v))}catch(e){return "—"}};
var uuid=function(v){return /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(String(v||""))};
function styles(){
 if($("dd-pa-style"))return;
 var style=document.createElement("style");style.id="dd-pa-style";
 style.textContent=[
 ".dd-pa-section{margin:38px 0 70px;scroll-margin-top:90px}.dd-pa-head{display:flex;align-items:center;justify-content:space-between;gap:15px;flex-wrap:wrap;margin-bottom:18px}",
 ".dd-pa-head h2{color:#6B3540;margin:0;font-size:25px}.dd-pa-head p{color:#756966;margin:5px 0 0;font-size:12px}.dd-pa-btn{border:1px solid #6B3540;color:#6B3540;background:#fff;border-radius:10px;padding:9px 13px;cursor:pointer;font-size:12px;font-weight:800}",
 ".dd-pa-stats{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:15px}.dd-pa-stats>div{padding:13px 16px;min-width:118px;border:1px solid #e4d8d3;background:#fff;border-radius:14px}.dd-pa-stats small{display:block;color:#746a67}.dd-pa-stats strong{display:block;color:#6B3540;font-size:23px}",
 ".dd-pa-filter{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px}.dd-pa-filter input,.dd-pa-filter select{min-height:43px;border:1px solid #e4d8d3;border-radius:12px;padding:10px;font:inherit;background:#fff}.dd-pa-filter input{flex:1;min-width:190px}",
 ".dd-pa-card{background:#fff;border:1px solid #e4d8d3;border-radius:18px;overflow:hidden}.dd-pa-scroll{overflow-x:auto}.dd-pa-table{border-collapse:collapse;width:100%;min-width:740px;font-size:12px}.dd-pa-table th{text-align:right;padding:13px;background:#faf3ea}.dd-pa-table td{padding:13px;border-top:1px solid #f2e8e5}.dd-pa-table small{display:block;font-size:10px;color:#7a6c68}.dd-pa-empty{text-align:center;padding:28px;color:#756966}",
 ".dd-pa-pill{display:inline-block;padding:4px 10px;border-radius:999px;background:#f6e7e1;color:#6B3540;font-size:11px}.dd-pa-pill[data-status=accepted]{background:#e5f2e8;color:#296943}.dd-pa-pill[data-status=rejected]{background:#f8e5e5;color:#913333}",
 ".dd-pa-msg{margin:0 0 14px;padding:11px 14px;background:#fff7df;color:#775f20;border:1px solid #ecd999;border-radius:12px}",
 ".dd-pa-backdrop{position:fixed;inset:0;background:rgba(22,10,13,.58);display:grid;place-items:center;z-index:300;padding:14px}.dd-pa-backdrop[hidden]{display:none}.dd-pa-dialog{background:#fff;border-radius:20px;max-height:94vh;overflow-y:auto;width:min(780px,100%);padding:24px;color:#352D2E}",
 ".dd-pa-dialog h3{margin:0;color:#6B3540;font-size:22px}.dd-pa-dialoghead{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px}",
 ".dd-pa-detailgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.dd-pa-detail{padding:12px;border:1px solid #e4d8d3;border-radius:12px;min-width:0}.dd-pa-detail.wide{grid-column:1/-1}.dd-pa-detail small{display:block;color:#756966;font-size:11px}.dd-pa-detail p{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px;margin:4px 0 0}",
 ".dd-pa-files{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0}.dd-pa-files button{border:1px solid #6B3540;color:#6B3540;background:#fff;border-radius:999px;padding:10px 13px;cursor:pointer}",
 ".dd-pa-editor{padding-top:16px;border-top:1px solid #e4d8d3;display:grid;gap:10px}.dd-pa-editor label{font-size:11px;color:#756966;font-weight:800}.dd-pa-editor select,.dd-pa-editor textarea{width:100%;padding:12px;border:1px solid #e4d8d3;border-radius:12px;font:inherit;background:#fff;color:#352D2E}.dd-pa-editor textarea{min-height:100px;resize:vertical}.dd-pa-save{background:#6B3540;color:#fff;border:0;padding:12px 18px;border-radius:999px;font-weight:800;cursor:pointer}.dd-pa-save:disabled{opacity:.6;cursor:wait}",
 ".dd-pa-toplink{display:inline-flex;align-items:center;margin-inline-start:7px;border:1px solid #6B3540;color:#6B3540;border-radius:11px;background:#fff;text-decoration:none;padding:9px 12px;font-size:12px;font-weight:800}.dd-pa-toplink b{background:#6B3540;color:#fff;border-radius:999px;padding:1px 6px;margin-inline-start:6px}",
 "@media(max-width:700px){.dd-pa-detailgrid{grid-template-columns:1fr}.dd-pa-detail.wide{grid-column:1}.dd-pa-dialog{padding:16px}.dd-pa-stats>div{flex:1;min-width:95px}.dd-pa-head h2{font-size:21px}}"
 ].join("");
 document.head.appendChild(style);
}
function mount(){
 var root=document.querySelector(".main");if(!root)return false;
 styles();
 var section=document.createElement("section");section.id="partner-applications";section.className="dd-pa-section";
 section.innerHTML='<div class="dd-pa-head"><div><h2>طلبات انضمام الشركاء <span id="dd-pa-total-title"></span></h2><p>الطلبات الجديدة منفصلة عن قائمة الشركاء الحاليين، والموافقة لا تفعّل الشريك تلقائيًا.</p></div><button class="dd-pa-btn" id="dd-pa-refresh" type="button">تحديث</button></div>'+
 '<div class="dd-pa-stats"><div><small>جديد</small><strong id="dd-pa-new">0</strong></div><div><small>قيد المراجعة</small><strong id="dd-pa-under_review">0</strong></div><div><small>تم التواصل</small><strong id="dd-pa-contacted">0</strong></div><div><small>إجمالي الطلبات</small><strong id="dd-pa-total">0</strong></div></div>'+
 '<div class="dd-pa-filter"><input type="search" id="dd-pa-search" placeholder="بحث بالاسم أو البراند أو البريد أو الهاتف" aria-label="بحث في طلبات الانضمام">'+
 '<select id="dd-pa-filter" aria-label="تصفية بالحالة"><option value="">كل الحالات</option><option value="new">جديد</option><option value="under_review">قيد المراجعة</option><option value="contacted">تم التواصل</option><option value="accepted">مقبول</option><option value="rejected">مرفوض</option></select></div>'+
 '<p id="dd-pa-msg" role="status" class="dd-pa-msg" hidden></p>'+
 '<div class="dd-pa-card"><div class="dd-pa-scroll"><table class="dd-pa-table"><thead><tr><th>البراند</th><th>مسؤول التواصل</th><th>التواصل</th><th>الفئة / المدينة</th><th>التاريخ</th><th>الحالة</th><th>عرض</th></tr></thead><tbody id="dd-pa-rows"></tbody></table></div><div id="dd-pa-empty" class="dd-pa-empty" hidden>لا توجد طلبات مطابقة.</div></div>'+
 '<div id="dd-pa-backdrop" class="dd-pa-backdrop" hidden><div class="dd-pa-dialog" role="dialog" aria-modal="true" aria-labelledby="dd-pa-dialog-title"><div class="dd-pa-dialoghead"><h3 id="dd-pa-dialog-title">تفاصيل الطلب</h3><button class="dd-pa-btn" id="dd-pa-close" type="button" aria-label="إغلاق">✕</button></div><div id="dd-pa-dialog-content"></div></div></div>';
 root.appendChild(section);
 var top=document.querySelector(".topbar .top-actions");
 if(top){
   var link=document.createElement("a");link.href="#partner-applications";
   link.className="dd-pa-toplink";link.innerHTML='طلبات الانضمام <b id="dd-pa-top-count">0</b>';
   top.insertBefore(link,top.firstChild);
 }
 $("dd-pa-refresh").onclick=load;
 $("dd-pa-search").oninput=render;
 $("dd-pa-filter").onchange=render;
 $("dd-pa-close").onclick=close;
 $("dd-pa-backdrop").onclick=function(e){if(e.target===$("dd-pa-backdrop"))close()};
 document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!$("dd-pa-backdrop").hidden)close()});
 $("dd-pa-rows").onclick=function(e){
   var target=e.target.closest("button[data-id]");if(target)open(target.dataset.id);
 };
 return true;
}
function message(text){if(!$("dd-pa-msg"))return;$("dd-pa-msg").textContent=text||"";$("dd-pa-msg").hidden=!text}
function render(){
 var q=$("dd-pa-search").value.trim().toLowerCase(),status=$("dd-pa-filter").value;
 var rows=all.filter(function(x){
  return (!status||x.status===status)&&(!q||[x.company_name,x.contact_name,x.email,x.phone,x.city,(x.categories||[]).join(" ")].join(" ").toLowerCase().includes(q))
 });
 Object.keys(STATES).filter(function(x){return x==="new"||x==="under_review"||x==="contacted"}).forEach(function(key){$("dd-pa-"+key).textContent=all.filter(function(x){return x.status===key}).length});
 var newCount=all.filter(function(x){return x.status==="new"}).length;
 $("dd-pa-total").textContent=all.length;
 $("dd-pa-total-title").textContent="("+all.length+")";
 if($("dd-pa-top-count"))$("dd-pa-top-count").textContent=newCount;
 $("dd-pa-empty").hidden=rows.length>0;
 $("dd-pa-rows").innerHTML=rows.map(function(a){
 return '<tr><td><b>'+esc(a.company_name)+'</b><small>'+esc(a.email)+'</small></td><td>'+esc(a.contact_name)+'</td><td>'+esc(a.phone)+
 '</td><td>'+esc((a.categories||[]).slice(0,2).join("، ")||a.other_category||"—")+'<small>'+esc(a.city)+'</small></td><td>'+esc(date(a.created_at))+'</td>'+
 '<td><span class="dd-pa-pill" data-status="'+esc(a.status)+'">'+esc(STATES[a.status]||a.status)+'</span></td>'+
 '<td><button type="button" class="dd-pa-btn" data-id="'+esc(a.id)+'">تفاصيل</button></td></tr>'
 }).join("");
}
async function load(){
 if(!client)return;
 message("");$("dd-pa-refresh").disabled=true;
 try{
   var res=await client.from("partner_applications").select("*").order("created_at",{ascending:false}).limit(250);
   if(res.error)throw res.error;
   all=res.data||[];render();
   var focus=new URLSearchParams(location.search).get("application");
   if(uuid(focus)&&all.some(function(a){return a.id===focus}))open(focus);
   if(location.hash==="#partner-applications")$("partner-applications").scrollIntoView({block:"start"});
 }catch(e){console.error("Applications:",e);message("تعذر تحميل طلبات الانضمام. راجع الاتصال والصلاحيات.")}
 finally{$("dd-pa-refresh").disabled=false}
}
function item(label,value,wide){
 return '<div class="dd-pa-detail'+(wide?' wide':'')+'"><small>'+esc(label)+'</small><p>'+esc(value==null||value===""?"—":value)+'</p></div>'
}
function close(){
 $("dd-pa-backdrop").hidden=true;opened=null;document.body.style.removeProperty("overflow");
}
async function download(path,name){
 try{
   var res=await client.storage.from(BUCKET).createSignedUrl(path,60,{download:name||"attachment"});
   if(res.error||!res.data?.signedUrl)throw res.error||new Error("No signed URL");
   window.open(res.data.signedUrl,"_blank","noopener,noreferrer");
 }catch(e){console.error(e);message("تعذر فتح المرفق. تأكد من صلاحيات عرض مستندات الشركاء.")}
}
function open(id){
 var a=all.find(function(x){return x.id===id});if(!a)return;
 opened=id;$("dd-pa-dialog-title").textContent="طلب انضمام: "+a.company_name;
 var details=[
 item("البراند",a.company_name),item("مسؤول التواصل",a.contact_name),
 item("الهاتف",a.phone),item("الإيميل",a.email),
 item("المدينة",a.city),item("سنوات النشاط",a.years_in_business),
 item("مجالات النشاط",(a.categories||[]).join("، ")+(a.other_category?"، "+a.other_category:""),true),
 item("وصف النشاط",a.company_description,true),
 item("الموقع",a.website),item("Instagram / Social",a.social_media),
 item("نموذج الشراكة",a.partnership_model,true),
 item("شراكات حالية",a.current_partnerships,true),
 item("تاريخ التقديم",date(a.created_at)),item("المراجعة الأخيرة",a.reviewed_at?date(a.reviewed_at):"—")
 ].join("");
 var options=Object.keys(STATES).map(function(key){
   return '<option value="'+esc(key)+'"'+(a.status===key?' selected':'')+'>'+esc(STATES[key])+'</option>'
 }).join("");
 $("dd-pa-dialog-content").innerHTML=
 '<div class="dd-pa-detailgrid">'+details+'</div>'+
 '<div class="dd-pa-files"><button type="button" data-file="company">تحميل Company Profile (PDF)</button>'+
 (a.product_list_path?'<button type="button" data-file="products">تحميل قائمة المنتجات</button>':'')+'</div>'+
 '<div class="dd-pa-editor"><div><label for="dd-pa-status">حالة الطلب</label><select id="dd-pa-status"'+(canManage?'':' disabled')+'>'+options+'</select></div>'+
 '<div><label for="dd-pa-notes">ملاحظات داخلية</label><textarea id="dd-pa-notes" maxlength="4000"'+(canManage?'':' readonly')+'>'+esc(a.internal_notes||"")+'</textarea></div>'+
 (canManage?'<button type="button" id="dd-pa-save" class="dd-pa-save">حفظ الحالة والملاحظات</button>':'')+
 '<small>الموافقة على الطلب لا تضيف الشريك تلقائيًا لقائمة الشركاء النشطين.</small></div>';
 $("dd-pa-dialog-content").querySelectorAll("button[data-file]").forEach(function(button){
   button.onclick=function(){
     var kind=button.dataset.file,p=kind==="company"?a.company_profile_path:a.product_list_path,
       name=kind==="company"?a.company_profile_name:a.product_list_name;
     if(p)download(p,name)
   };
 });
 if(canManage)$("dd-pa-save").onclick=save;
 $("dd-pa-backdrop").hidden=false;document.body.style.overflow="hidden";$("dd-pa-close").focus();
}
async function save(){
 if(!canManage||!opened)return;
 var status=$("dd-pa-status").value,notes=$("dd-pa-notes").value.trim();
 if(!Object.prototype.hasOwnProperty.call(STATES,status)||notes.length>4000)return;
 var button=$("dd-pa-save");button.disabled=true;
 try{
   var res=await client.rpc("review_partner_application",{
     p_application_id:opened,p_status:status,p_internal_notes:notes||null
   });
   if(res.error)throw res.error;
   close();await load();message("تم حفظ حالة طلب الشراكة.");
 }catch(e){console.error(e);message("تعذر تغيير حالة الطلب. تحقق من الصلاحيات.")}
 finally{if(button.isConnected)button.disabled=false}
}
async function boot(){
 try{
   var cfg=window.DEAR_DAY_SUPABASE;
   if(!cfg){
     await new Promise(function(resolve,reject){
       var script=document.createElement("script");script.src=CONFIG;
       script.onload=resolve;script.onerror=reject;document.head.appendChild(script)
     });
     cfg=window.DEAR_DAY_SUPABASE;
   }
   if(!cfg)return;
   var mod=await import(ESM);
   var storage=localStorage.getItem("ddAuthRemember")==="0"?sessionStorage:localStorage;
   client=mod.createClient(cfg.url,cfg.publishableKey,{
     auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:storage}
   });
   var u=await client.auth.getUser(),user=u.data?.user;if(!user)return;
   var results=await Promise.all([
     client.from("profiles").select("is_active").eq("id",user.id).maybeSingle(),
     client.rpc("get_my_permissions")
   ]);
   if(results[1].error||!results[0].data?.is_active)return;
   var permissions=new Set((results[1].data||[]).map(function(x){return x.permission_code}));
   canManage=permissions.has("partners.manage");
   if(!canManage&&!permissions.has("partners.view"))return;
   if(!mount())return;
   await load();
 }catch(e){
   console.error("Partner application UI:",e);
   if($("dd-pa-msg"))message("تعذر تحميل طلبات الانضمام.")
 }
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
else boot();
})();