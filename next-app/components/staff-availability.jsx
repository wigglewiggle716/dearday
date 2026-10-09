"use client";

import Link from "next/link";
import {useEffect,useMemo,useRef,useState} from "react";
import {authClient,EMPLOYEE_ROLES,readCurrentAccount,rememberPreference} from "../lib/auth-client";
import {useAuthSession} from "./auth-session-provider";
import {usePartnerPortalOptional} from "./partner-portal-base";
import {pathFor} from "../lib/locales";

const DAYS={
  ar:["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"],
  en:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
};
const messages={
 ar:{
  title:"التوفر والمواعيد",subtitle:"إعدادات الحجز والجداول الأسبوعية والأيام المستثناة والحجوزات القادمة.",
  back:"لوحة الفريق",reload:"تحديث",loading:"جاري تحميل بيانات التوفر…",loadingListing:"جاري تحميل جدول العنصر…",
  denied:"هذه الصفحة للموظفين المصرّح لهم بعرض التوفر.",failed:"تعذر تحميل بيانات التوفر. جرّب مرة أخرى.",
  signIn:"تسجيل الدخول",setup:"تفعيل التحقق بخطوتين",mfa:"إكمال التحقق بخطوتين",
  choose:"اختر المنتج أو الخدمة",none:"لا يوجد عنصر متاح للعرض.",statusOn:"الحجز مفعّل",statusOff:"الحجز متوقف",
  mode:"نوع الحجز",dateOnly:"يوم كامل",slot:"موعد محدد",settings:"قواعد الحجز",
  enabled:"تفعيل الحجز لهذا العنصر",slotMinutes:"مدة الموعد بالدقائق",daily:"السعة اليومية",
  perSlot:"السعة لكل موعد",cutoff:"آخر موعد للحجز قبل المناسبة (ساعات)",hold:"مدة الحجز المؤقت عند الدفع (دقائق)",
  weekly:"الجدول الأسبوعي",weekday:"اليوم",open:"مفتوح",start:"من",end:"إلى",override:"سعة خاصة",
  addWindow:"إضافة فترة",removeWindow:"حذف الفترة",saveConfig:"حفظ الجدول والإعدادات",
  exceptions:"الإغلاق والأيام الاستثنائية",exceptionDate:"التاريخ",exceptionType:"نوع اليوم",
  closed:"مغلق بالكامل",custom:"ساعات مخصصة",note:"ملاحظة",capacity:"السعة",
  exceptionSave:"حفظ اليوم",exceptionReset:"جديد",edit:"تعديل",remove:"حذف",noExceptions:"لا توجد أيام استثنائية.",
  upcoming:"الحجوزات والـHolds القادمة",reservationDate:"التاريخ",reservationTime:"الوقت",
  quantity:"الكمية",reservationStatus:"الحالة",expires:"انتهاء الـHold",order:"الطلب",
  noReservations:"لا توجد حجوزات قادمة ضمن النتائج.",activeHolds:"Holds نشطة",confirmed:"مؤكد",
  holdsHint:"الـHold المنتهي لا يُحسب ضمن السعة، حتى لو ظهر بالسجل.",
  nextPage:"يعرض أحدث 150 سجل حجز قادم فقط؛ يلزم استكمال التصفح إذا تجاوزت الحجوزات هذا العدد.",
  ready:"جاهز",yes:"نعم",no:"لا",timeZone:"كل الأوقات المحلية: القاهرة (Africa/Cairo)",
  manageDenied:"عرض فقط — هذا الحساب لا يملك صلاحية تعديل التوفر.",
  needWindow:"لازم تضيف فترة عمل واحدة على الأقل قبل تفعيل الحجز.",
  invalidSettings:"راجع الأرقام: مدة الموعد من 15 إلى 1440 دقيقة وبمضاعفات 15، والـHold من 5 إلى 60 دقيقة، والسعات موجبة.",
  invalidWindow:"أوقات العمل غير صالحة: وقت النهاية لازم يكون بعد البداية، والسعة الخاصة رقم موجب.",
  invalidException:"اختر تاريخًا صالحًا، وتأكد إن الساعات والسعة الخاصة صحيحة.",
  conflict:"تم تغيير البيانات بواسطة مستخدم آخر. حدث الصفحة وراجع التغييرات قبل الحفظ.",
  confirmConfig:"حفظ جدول العمل سيستبدل فترات هذا العنصر الحالية وقد يؤثر على إمكانية الحجز مستقبلًا. هل تؤكد الحفظ في Supabase؟",
  confirmException:"تأكيد حفظ اليوم الاستثنائي في قاعدة البيانات الفعلية؟",
  confirmDelete:"تأكيد حذف هذا اليوم الاستثنائي؟ قد يفتح اليوم للحجز مرة أخرى.",
  configSaved:"تم حفظ إعدادات التوفر في سجل النظام.",exceptionSaved:"تم حفظ اليوم الاستثنائي.",
  exceptionDeleted:"تم حذف اليوم الاستثنائي.",saveError:"تعذر تنفيذ العملية. تحقق من الصلاحيات والبيانات ثم حدّث الصفحة.",
  refreshFirst:"تغير العنصر أو الجدول أثناء العملية؛ حدّث البيانات وأعد المحاولة.",
  check:"فحص التوفر (للقراءة فقط)",checkDate:"التاريخ",checkTime:"الوقت",checkQty:"العدد",
  checkButton:"فحص",checkAvailable:"الموعد متاح",checkUnavailable:"الموعد غير متاح",
  remaining:"المتاح",reason:"السبب",checkError:"تعذر فحص التوفر.",
  kind:{product:"منتج",service:"خدمة",venue:"مكان",experience:"تجربة"},
  statuses:{hold:"حجز مؤقت",confirmed:"مؤكد",released:"محرر",cancelled:"ملغي",expired:"منتهي"},
  noBooking:"غير مهيّأ",limit:"الكتالوج يعرض أحدث 400 عنصر في هذه المرحلة. محتاجين Pagination لو العدد زاد.",
  reservationCaution:"الحجوزات للعرض فقط؛ تعديلها أو إلغاؤها يتم من سير العمل المعتمد، وليس من هذه الصفحة."
 },
 en:{
  title:"Availability & Scheduling",subtitle:"Booking settings, weekly windows, special dates and upcoming reservations.",
  back:"Staff workspace",reload:"Refresh",loading:"Loading availability…",loadingListing:"Loading listing schedule…",
  denied:"This page is restricted to staff authorised to view availability.",failed:"Could not load availability. Please try again.",
  signIn:"Log in",setup:"Set up authenticator",mfa:"Complete two-step verification",
  choose:"Choose a product or service",none:"No listings found.",statusOn:"Booking enabled",statusOff:"Booking disabled",
  mode:"Booking mode",dateOnly:"Date only",slot:"Time slot",settings:"Booking rules",
  enabled:"Enable booking for this listing",slotMinutes:"Slot length (minutes)",daily:"Daily capacity",
  perSlot:"Capacity per slot",cutoff:"Booking cutoff (hours before event)",hold:"Checkout hold duration (minutes)",
  weekly:"Weekly schedule",weekday:"Day",open:"Open",start:"From",end:"To",override:"Override capacity",
  addWindow:"Add window",removeWindow:"Remove window",saveConfig:"Save booking settings",
  exceptions:"Blackout & special dates",exceptionDate:"Date",exceptionType:"Exception type",
  closed:"Closed all day",custom:"Custom hours",note:"Note",capacity:"Capacity",
  exceptionSave:"Save date",exceptionReset:"New",edit:"Edit",remove:"Delete",noExceptions:"No special dates.",
  upcoming:"Upcoming reservations and holds",reservationDate:"Date",reservationTime:"Time",
  quantity:"Quantity",reservationStatus:"Status",expires:"Hold expiry",order:"Order",
  noReservations:"No upcoming bookings in the loaded results.",activeHolds:"Active holds",confirmed:"Confirmed",
  holdsHint:"Expired holds do not consume capacity even if they remain in the record.",
  nextPage:"Showing up to 150 upcoming bookings; add server-side pagination if volume grows.",
  ready:"Ready",yes:"Yes",no:"No",timeZone:"Local times: Cairo (Africa/Cairo)",
  manageDenied:"Read-only — this account cannot edit availability.",
  needWindow:"Add at least one open booking window before enabling booking.",
  invalidSettings:"Check numeric inputs: slots must be 15–1440 minutes in 15-minute increments, holds 5–60 minutes, capacities positive.",
  invalidWindow:"Invalid opening window: end must be later than start; capacity must be positive.",
  invalidException:"Provide a valid date, opening hours and optional positive capacity.",
  conflict:"Someone else changed the schedule. Refresh and review before saving.",
  confirmConfig:"Saving will replace the listing's current weekly windows and may affect future bookability. Confirm the live Supabase update?",
  confirmException:"Confirm saving this special date to the live database?",
  confirmDelete:"Delete this special date? It could reopen the date for booking.",
  configSaved:"Availability settings saved and audited.",exceptionSaved:"Special date saved.",
  exceptionDeleted:"Special date removed.",saveError:"Operation failed. Check your permissions and data, then refresh.",
  refreshFirst:"The selected listing or schedule changed. Refresh before retrying.",
  check:"Availability check (read-only)",checkDate:"Date",checkTime:"Time",checkQty:"Quantity",
  checkButton:"Check",checkAvailable:"Slot available",checkUnavailable:"Not available",
  remaining:"Remaining",reason:"Reason",checkError:"Could not check availability.",
  kind:{product:"Product",service:"Service",venue:"Venue",experience:"Experience"},
  statuses:{hold:"Hold",confirmed:"Confirmed",released:"Released",cancelled:"Cancelled",expired:"Expired"},
  noBooking:"Not configured",limit:"Up to 400 latest catalog listings are loaded. Use server-side pagination when larger.",
  reservationCaution:"Bookings are read-only here; cancellations or edits belong in the authorised operational workflow."
 }
};
const LIMIT_LISTINGS=400;
const SETTINGS="listing_id,booking_enabled,booking_mode,timezone,slot_minutes,daily_capacity,slot_capacity,cutoff_hours,hold_minutes,updated_at";
const WINDOWS="id,listing_id,weekday,start_time,end_time,is_active,capacity_override,updated_at";
const EXCEPTIONS="id,listing_id,exception_date,is_closed,start_time,end_time,capacity_override,note,updated_at";
const RESERVATIONS="id,reservation_date,start_time,end_time,quantity,status,expires_at,order_id,created_at";
const emptyScope={stage:"loading",settings:null,windows:[],exceptions:[],reservations:[],baseline:"",overflow:false};
function cairoDate(){
 const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Cairo",year:"numeric",month:"2-digit",day:"2-digit"})
  .formatToParts(new Date());
 const by=Object.fromEntries(parts.map(x=>[x.type,x.value]));
 return [by.year,by.month,by.day].join("-");
}
function dayLabel(iso,locale){
 if(!iso)return "—";
 const parts=String(iso).slice(0,10).split("-");
 return parts.length===3?[parts[2],parts[1],parts[0]].join("/"):String(iso);
}
function dtLabel(value,locale){
 if(!value)return "—";
 const d=new Date(value);
 if(Number.isNaN(d.getTime()))return "—";
 return new Intl.DateTimeFormat(locale==="ar"?"ar-EG":"en-GB",{dateStyle:"medium",timeStyle:"short",timeZone:"Africa/Cairo"}).format(d);
}
function trimTime(value){return value?String(value).slice(0,5):"";}
function nullablePositive(value){return String(value??"").trim()===""?null:Number(value);}
function validInteger(value,min,max=Number.MAX_SAFE_INTEGER){return Number.isInteger(value)&&value>=min&&value<=max;}
function weekDefault(day){return {key:"day-"+day,weekday:day,active:false,start:"09:00",end:"22:00",capacity:""};}
function freshWeek(windows){
 const entries=Array.from({length:7},(_,day)=>weekDefault(day));
 const byDay=new Set();
 for(const w of windows){
  if(!w.is_active)continue;
  const obj={key:w.id||"saved-"+w.weekday+"-"+w.start_time,weekday:w.weekday,
   active:true,start:trimTime(w.start_time),end:trimTime(w.end_time),
   capacity:w.capacity_override==null?"":String(w.capacity_override)};
  if(!byDay.has(w.weekday)){entries[w.weekday]=obj;byDay.add(w.weekday);}
  else entries.push(obj);
 }
 return entries;
}
function createSettings(s,listing){
 return {booking_enabled:Boolean(s?.booking_enabled),booking_mode:s?.booking_mode||"date",
  timezone:"Africa/Cairo",slot_minutes:String(s?.slot_minutes??60),
  daily_capacity:s?.daily_capacity==null?"":String(s.daily_capacity),
  slot_capacity:s?.slot_capacity==null?"":String(s.slot_capacity),
  cutoff_hours:String(s?.cutoff_hours??0),hold_minutes:String(s?.hold_minutes??15)};
}
function normalizeWindows(rows){
 return rows.filter(w=>w.active).map(w=>({
  weekday:Number(w.weekday),is_active:true,start_time:w.start,end_time:w.end,
  capacity_override:nullablePositive(w.capacity)
 })).sort((a,b)=>a.weekday-b.weekday||a.start_time.localeCompare(b.start_time));
}
function baseline(settings,windows){
 return JSON.stringify({settings:settings?{
  booking_enabled:settings.booking_enabled,booking_mode:settings.booking_mode,timezone:settings.timezone,
  slot_minutes:settings.slot_minutes,daily_capacity:settings.daily_capacity,
  slot_capacity:settings.slot_capacity,cutoff_hours:settings.cutoff_hours,
  hold_minutes:settings.hold_minutes,updated_at:settings.updated_at
 }:null,windows:windows.map(w=>({
  id:w.id,weekday:w.weekday,start_time:trimTime(w.start_time),end_time:trimTime(w.end_time),
  capacity_override:w.capacity_override,is_active:w.is_active,updated_at:w.updated_at
 })).sort((a,b)=>a.weekday-b.weekday||a.start_time.localeCompare(b.start_time))});
}
function FormField({label,children}){return <label className="dd-av-field"><span>{label}</span>{children}</label>;}
export default function StaffAvailability({locale="ar",portal="staff"}){
 const t=messages[locale]||messages.ar;
 const session=useAuthSession();
 const partnerContext=usePartnerPortalOptional();
 const isPartner=portal==="partner";
 const currentPartner=isPartner?partnerContext?.partner:null;
 const active=session.status==="authenticated"&&(isPartner?(session.role==="partner_user"&&Boolean(currentPartner)):EMPLOYEE_ROLES.has(session.role));
 const uid=active?session.user?.id:null;
 const client=useMemo(()=>typeof window==="undefined"?null:authClient(rememberPreference()),[]);
 const [root,setRoot]=useState({stage:"loading",permissions:[],listings:[],names:{},overflow:false});
 const [selected,setSelected]=useState("");
 const [scope,setScope]=useState(emptyScope);
 const [config,setConfig]=useState(createSettings(null,null));
 const [week,setWeek]=useState(()=>freshWeek([]));
 const [exception,setException]=useState({id:"",date:"",kind:"closed",start:"09:00",end:"22:00",capacity:"",note:""});
 const [probe,setProbe]=useState({date:"",time:"",quantity:"1",result:null,working:false});
 const [revision,setRevision]=useState(0),[scopeRevision,setScopeRevision]=useState(0);
 const [saving,setSaving]=useState(false),[notice,setNotice]=useState(""),[error,setError]=useState("");
 const rootReq=useRef(0),scopeReq=useRef(0);
 const canView=active&&root.stage==="ready"&&(!isPartner||root.partnerId===currentPartner?.id);
 const canManage=canView&&(isPartner||root.permissions.includes("availability.manage"));
 const listing=root.listings.find(x=>x.id===selected)||null;
 const today=useMemo(()=>cairoDate(),[]);
 const recentHolds=scope.reservations.filter(x=>x.status==="hold"&&x.expires_at&&new Date(x.expires_at)>new Date()).length;
 const confirmed=scope.reservations.filter(x=>x.status==="confirmed").length;
 function reload(){setRevision(v=>v+1);setScopeRevision(v=>v+1);}
 function refreshSelected(){setScopeRevision(v=>v+1);}
 useEffect(()=>{if(isPartner)setSelected("");},[isPartner,currentPartner?.id]);
 function choose(id){setSelected(id);setNotice("");setError("");setProbe({date:"",time:"",quantity:"1",result:null,working:false});}
 useEffect(()=>{
  const seq=++rootReq.current;
  if(!uid||!client){setRoot({stage:"loading",permissions:[],listings:[],names:{},overflow:false});return;}
  setRoot({stage:"loading",permissions:[],listings:[],names:{},overflow:false});
  (async()=>{
   try{
    let permissions=[];
    if(isPartner){
     const account=await readCurrentAccount(client);
     if(account.status!=="authenticated"||account.role!=="partner_user"||!currentPartner)throw Error("partner");
     const member=await client.from("partner_users").select("partner_id").eq("user_id",uid).eq("partner_id",currentPartner.id).eq("is_active",true).maybeSingle();
     if(member.error||!member.data)throw Error("partner");
    }else{
     const grant=await client.rpc("get_my_permissions");
     if(grant.error)throw grant.error;
     permissions=(grant.data||[]).map(x=>x.permission_code);
     if(!permissions.some(x=>x==="availability.view"||x==="availability.manage")){
      if(seq===rootReq.current)setRoot({stage:"denied",permissions:[],listings:[],names:{},overflow:false});return;
     }
    }
    let query=client.from("listings")
     .select("id,partner_id,kind,is_available,capacity_per_day,published_version_id,updated_at");
    if(isPartner)query=query.eq("partner_id",currentPartner.id);
    const ls=await query.order("updated_at",{ascending:false}).limit(LIMIT_LISTINGS+1);
    if(ls.error)throw ls.error;
    const listings=(ls.data||[]).slice(0,LIMIT_LISTINGS);
    const publishedIds=[...new Set(listings.map(x=>x.published_version_id).filter(Boolean))];
    const names={};
    for(let i=0;i<publishedIds.length;i+=50){
     const result=await client.from("listing_versions").select("id,name_ar,name_en").in("id",publishedIds.slice(i,i+50));
     if(result.error)throw result.error;
     for(const v of result.data||[])names[v.id]=v;
    }
    if(seq===rootReq.current)setRoot({stage:"ready",permissions,listings,names,partnerId:isPartner?currentPartner.id:null,overflow:(ls.data||[]).length>LIMIT_LISTINGS});
   }catch{
    if(seq===rootReq.current)setRoot({stage:"error",permissions:[],listings:[],names:{},overflow:false});
   }
  })();
  return()=>{rootReq.current++;};
 },[uid,client,revision,isPartner,currentPartner?.id]);

 useEffect(()=>{
  const seq=++scopeReq.current;
  if(!selected||!canView||!client){setScope(emptyScope);return;}
  setScope(emptyScope);
  (async()=>{
   try{
    const [settings,windows,exceptions,reservations]=await Promise.all([
     client.from("listing_availability_settings").select(SETTINGS).eq("listing_id",selected).maybeSingle(),
     client.from("listing_availability_windows").select(WINDOWS).eq("listing_id",selected).order("weekday").order("start_time"),
     client.from("listing_availability_exceptions").select(EXCEPTIONS).eq("listing_id",selected).order("exception_date"),
     client.from("booking_reservations").select(RESERVATIONS).eq("listing_id",selected)
      .gte("reservation_date",today).order("reservation_date").order("start_time").limit(151)
    ]);
    if([settings,windows,exceptions,reservations].some(x=>x.error))throw Error("read");
    if(seq!==scopeReq.current)return;
    const s=settings.data||null,w=windows.data||[];
    setScope({stage:"ready",settings:s,windows:w,exceptions:exceptions.data||[],
     reservations:(reservations.data||[]).slice(0,150),
     overflow:(reservations.data||[]).length>150,baseline:baseline(s,w)});
    setConfig(createSettings(s,listing));
    setWeek(freshWeek(w));
    setException({id:"",date:"",kind:"closed",start:"09:00",end:"22:00",capacity:"",note:""});
    setProbe(p=>({...p,result:null,working:false}));
   }catch{if(seq===scopeReq.current)setScope({...emptyScope,stage:"error"});}
  })();
  return()=>{scopeReq.current++;};
 },[selected,canView,client,scopeRevision,today]);

 async function verifyManage(){
  if(!uid||!canManage)throw Error("permission");
  const who=await readCurrentAccount(client);
  if(who.status!=="authenticated"||who.user?.id!==uid)throw Error("permission");
  if(isPartner){
   if(who.role!=="partner_user"||!currentPartner||!root.listings.some(x=>x.id===selected&&x.partner_id===currentPartner.id))throw Error("permission");
   const m=await client.from("partner_users").select("partner_id").eq("user_id",uid).eq("partner_id",currentPartner.id).eq("is_active",true).maybeSingle();
   const p=await client.from("partners").select("status").eq("id",currentPartner.id).maybeSingle();
   if(m.error||!m.data||p.error||p.data?.status!=="active")throw Error("permission");
  }else{
   if(!EMPLOYEE_ROLES.has(who.role))throw Error("permission");
   const grants=await client.rpc("get_my_permissions");
   if(grants.error||!(grants.data||[]).some(x=>x.permission_code==="availability.manage"))throw Error("permission");
  }
 }
 function updateWindow(key,changes){
  setWeek(rows=>rows.map(w=>w.key===key?{...w,...changes}:w));
 }
 function newWindow(day){
  setWeek(rows=>[...rows,{key:"new-"+day+"-"+Math.random().toString(36).slice(2),weekday:day,active:true,start:"09:00",end:"22:00",capacity:""}]);
 }
 function removeWindow(key){
  setWeek(rows=>rows.map(x=>x.key===key&&x.key.startsWith("day-")?{...x,active:false}:x).filter(x=>x.key!==key||x.key.startsWith("day-")));
 }
 async function freshSnapshot(){
  const [s,w]=await Promise.all([
   client.from("listing_availability_settings").select(SETTINGS).eq("listing_id",selected).maybeSingle(),
   client.from("listing_availability_windows").select(WINDOWS).eq("listing_id",selected).order("weekday").order("start_time")
  ]);
  if(s.error||w.error)throw Error("read");
  return baseline(s.data||null,w.data||[]);
 }
 async function saveConfig(event){
  event.preventDefault();
  if(!selected||!canManage||scope.stage!=="ready"||saving)return;
  const settings={
   booking_enabled:config.booking_enabled,booking_mode:config.booking_mode,timezone:"Africa/Cairo",
   slot_minutes:Number(config.slot_minutes),daily_capacity:nullablePositive(config.daily_capacity),
   slot_capacity:nullablePositive(config.slot_capacity),cutoff_hours:Number(config.cutoff_hours),
   hold_minutes:Number(config.hold_minutes)
  };
  if(!["date","time_slot"].includes(settings.booking_mode)||
   !validInteger(settings.slot_minutes,15,1440)||settings.slot_minutes%15||
   !validInteger(settings.hold_minutes,5,60)||!validInteger(settings.cutoff_hours,0,8760)||
   [settings.daily_capacity,settings.slot_capacity].some(v=>v!==null&&!validInteger(v,1))) {
   setError(t.invalidSettings);return;
  }
  const rows=normalizeWindows(week);
  if(settings.booking_enabled&&!rows.length){setError(t.needWindow);return;}
  if(rows.some(w=>!w.start_time||!w.end_time||w.end_time<=w.start_time||
     (w.capacity_override!==null&&!validInteger(w.capacity_override,1)))){
   setError(t.invalidWindow);return;
  }
  // No overlaps: prevents ambiguous availability and protects previously
  // configured multi-window days from accidental duplicate time spans.
  for(let d=0;d<7;d++){
   const parts=rows.filter(x=>x.weekday===d).sort((a,b)=>a.start_time.localeCompare(b.start_time));
   if(parts.some((v,i)=>i>0&&v.start_time<parts[i-1].end_time)){setError(t.invalidWindow);return;}
  }
  if(!window.confirm(t.confirmConfig))return;
  setSaving(true);setError("");setNotice("");
  try{
   await verifyManage();
   if(scope.baseline!==await freshSnapshot())throw Error("conflict");
   const result=await client.rpc("save_listing_availability_config",{p_listing_id:selected,p_settings:settings,p_windows:rows});
   if(result.error||result.data!==true)throw result.error||Error("save");
   setNotice(t.configSaved);refreshSelected();
  }catch(e){setError(e.message==="conflict"?t.conflict:t.saveError);}
  finally{setSaving(false);}
 }
 function editException(item){
  setException({id:item.id,date:item.exception_date,kind:item.is_closed?"closed":"custom",
   start:trimTime(item.start_time)||"09:00",end:trimTime(item.end_time)||"22:00",
   capacity:item.capacity_override==null?"":String(item.capacity_override),note:item.note||""});
 }
 function resetException(){setException({id:"",date:"",kind:"closed",start:"09:00",end:"22:00",capacity:"",note:""});}
 async function saveException(event){
  event.preventDefault();
  if(!canManage||saving||!selected||scope.stage!=="ready")return;
  const closed=exception.kind==="closed",capacity=nullablePositive(exception.capacity);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(exception.date)||
   (capacity!==null&&!validInteger(capacity,1))||
   (!closed&&(!exception.start||!exception.end||exception.start>=exception.end))){
   setError(t.invalidException);return;
  }
  if(!window.confirm(t.confirmException))return;
  setSaving(true);setError("");setNotice("");
  try{
   await verifyManage();
   const previous=scope.exceptions.find(x=>x.id===exception.id);
   const find=await client.from("listing_availability_exceptions").select(EXCEPTIONS)
    .eq("listing_id",selected).eq("exception_date",exception.date).maybeSingle();
   if(find.error)throw find.error;
   if(previous){
    const current=await client.from("listing_availability_exceptions").select(EXCEPTIONS)
     .eq("id",previous.id).eq("listing_id",selected).maybeSingle();
    if(current.error||!current.data||current.data.updated_at!==previous.updated_at)throw Error("conflict");
   }else if(find.data)throw Error("conflict");
   const result=await client.rpc("upsert_listing_availability_exception",{
    p_listing_id:selected,p_exception_id:exception.id||null,p_date:exception.date,
    p_is_closed:closed,p_start_time:closed?null:exception.start,p_end_time:closed?null:exception.end,
    p_capacity_override:capacity,p_note:exception.note.trim()||null
   });
   if(result.error||!result.data)throw result.error||Error("save");
   setNotice(t.exceptionSaved);refreshSelected();
  }catch(e){setError(e.message==="conflict"?t.conflict:t.saveError);}
  finally{setSaving(false);}
 }
 async function deleteException(item){
  if(!canManage||saving||!selected||scope.stage!=="ready"||!window.confirm(t.confirmDelete))return;
  setSaving(true);setError("");setNotice("");
  try{
   await verifyManage();
   const check=await client.from("listing_availability_exceptions").select("id,updated_at")
     .eq("id",item.id).eq("listing_id",selected).maybeSingle();
   if(check.error||!check.data||check.data.updated_at!==item.updated_at)throw Error("conflict");
   const result=await client.rpc("delete_listing_availability_exception",{p_exception_id:item.id});
   if(result.error||result.data!==true)throw result.error||Error("save");
   setNotice(t.exceptionDeleted);refreshSelected();
  }catch(e){setError(e.message==="conflict"?t.conflict:t.saveError);}
  finally{setSaving(false);}
 }
 async function checkAvailability(event){
  event.preventDefault();
  if(!selected||!canView||probe.working)return;
  const qty=Number(probe.quantity);
  if(!probe.date||!validInteger(qty,1,10000)){setError(t.checkError);return;}
  setProbe(p=>({...p,working:true,result:null}));setError("");
  try{
   const result=await client.rpc("check_listing_availability",{
    p_listing_id:selected,p_date:probe.date,p_start_time:scope.settings?.booking_mode==="time_slot"?probe.time||null:null,p_quantity:qty
   });
   if(result.error)throw result.error;
   setProbe(p=>({...p,working:false,result:result.data}));
  }catch{
   setError(t.checkError);setProbe(p=>({...p,working:false,result:null}));
  }
 }
 const gate=session.status==="mfa_setup_required"?{href:pathFor("security",locale),label:t.setup}:
 session.status==="mfa_required"?{href:pathFor("auth",locale)+"?mode=mfa",label:t.mfa}:
 session.status==="signed_out"?{href:pathFor("auth",locale)+"?next="+encodeURIComponent(pathFor("staffAvailability",locale)),label:t.signIn}:null;
 const kindName=l=>t.kind[l.kind]||l.kind;
 const nameOf=l=>{const v=root.names[l.published_version_id];return (locale==="en"?v?.name_en||v?.name_ar:v?.name_ar||v?.name_en)||kindName(l)+" · "+l.id.slice(0,8);};
 return <section id={isPartner?undefined:"main-content"} className="dd-staff-availability" dir={locale==="ar"?"rtl":"ltr"}>
  <div className="dd-av-wrap">
   <header className="dd-av-header"><div><Link href={pathFor(isPartner?"partnerPortal":"staffPortal",locale)}>{isPartner?(locale==="ar"?"بوابة الشريك":"Partner portal"):t.back} ↗</Link>
    <h1>{t.title}</h1><p>{t.subtitle}</p></div>
    {canView&&<button type="button" className="dd-av-button secondary" onClick={reload}>{t.reload}</button>}
   </header>
   {!active?<section className="dd-av-panel dd-av-guard"><p>{session.status==="loading"?t.loading:t.denied}</p>
     {gate&&<Link className="dd-av-button" href={gate.href}>{gate.label}</Link>}</section>:
   root.stage==="loading"?<section className="dd-av-panel dd-av-guard" role="status">{t.loading}</section>:
   !canView?<section className="dd-av-panel dd-av-guard" role="alert">{root.stage==="denied"?t.denied:t.failed}</section>:<>
    {root.overflow&&<p className="dd-av-warning">{t.limit}</p>}
    <div className="dd-av-picker"><label htmlFor="dd-av-listing">{t.choose}</label>
     <select id="dd-av-listing" value={selected} onChange={e=>choose(e.target.value)}>
      <option value="">{t.choose}</option>
      {root.listings.map(l=><option key={l.id} value={l.id}>{nameOf(l)} · {kindName(l)}</option>)}
     </select>
    </div>
    {!root.listings.length?<section className="dd-av-panel dd-av-guard">{t.none}</section>:
     selected&&(scope.stage==="loading"?<section className="dd-av-panel dd-av-guard" role="status">{t.loadingListing}</section>:
      scope.stage==="error"?<section className="dd-av-panel dd-av-guard" role="alert">{t.failed}
       <button type="button" className="dd-av-button secondary" onClick={refreshSelected}>{t.reload}</button></section>:
      scope.stage==="ready"?<>
       {notice&&<p className="dd-av-success" role="status">{notice}</p>}
       {error&&<p className="dd-av-error" role="alert">{error}</p>}
       <div className="dd-av-stats">
        {[[t.enabled,scope.settings?.booking_enabled?t.yes:t.no],
          [t.mode,scope.settings?.booking_mode==="time_slot"?t.slot:t.dateOnly],
          [t.daily,scope.settings?.daily_capacity??listing?.capacity_per_day??"—"],
          [t.activeHolds,recentHolds],[t.confirmed,confirmed]].map(([label,value])=>
           <article key={label}><span>{label}</span><strong>{value}</strong></article>)}
       </div>
       <section className="dd-av-panel">
        <div className="dd-av-section-head"><h2>{t.settings}</h2><span>{t.timeZone}</span></div>
        <form className="dd-av-form" onSubmit={saveConfig}>
         <div className="dd-av-field-grid">
          <label className="dd-av-check"><input type="checkbox" checked={config.booking_enabled} disabled={!canManage||saving}
            onChange={e=>setConfig(s=>({...s,booking_enabled:e.target.checked}))}/>{t.enabled}</label>
          <FormField label={t.mode}><select value={config.booking_mode} disabled={!canManage||saving}
            onChange={e=>setConfig(s=>({...s,booking_mode:e.target.value}))}>
            <option value="date">{t.dateOnly}</option><option value="time_slot">{t.slot}</option>
           </select></FormField>
          {config.booking_mode==="time_slot"&&<FormField label={t.slotMinutes}><input type="number" min="15" max="1440" step="15" value={config.slot_minutes}
           disabled={!canManage||saving} onChange={e=>setConfig(s=>({...s,slot_minutes:e.target.value}))}/></FormField>}
          <FormField label={t.daily}><input type="number" min="1" value={config.daily_capacity} disabled={!canManage||saving}
           onChange={e=>setConfig(s=>({...s,daily_capacity:e.target.value}))}/></FormField>
          {config.booking_mode==="time_slot"&&<FormField label={t.perSlot}><input type="number" min="1" value={config.slot_capacity} disabled={!canManage||saving}
           onChange={e=>setConfig(s=>({...s,slot_capacity:e.target.value}))}/></FormField>}
          <FormField label={t.cutoff}><input type="number" min="0" max="8760" value={config.cutoff_hours} disabled={!canManage||saving}
           onChange={e=>setConfig(s=>({...s,cutoff_hours:e.target.value}))}/></FormField>
          <FormField label={t.hold}><input type="number" min="5" max="60" value={config.hold_minutes} disabled={!canManage||saving}
           onChange={e=>setConfig(s=>({...s,hold_minutes:e.target.value}))}/></FormField>
         </div>
         <h3>{t.weekly}</h3>
         <div className="dd-av-table-wrap"><table className="dd-av-week">
          <thead><tr><th>{t.weekday}</th><th>{t.open}</th><th>{t.start}</th><th>{t.end}</th><th>{t.override}</th><th></th></tr></thead>
          <tbody>{week.map(w=><tr key={w.key}>
           <td>{DAYS[locale][w.weekday]}</td>
           <td><input type="checkbox" checked={w.active} disabled={!canManage||saving} onChange={e=>updateWindow(w.key,{active:e.target.checked})}
             aria-label={DAYS[locale][w.weekday]+" "+t.open}/></td>
           <td><input type="time" value={w.start} disabled={!canManage||saving||!w.active} onChange={e=>updateWindow(w.key,{start:e.target.value})}
             aria-label={DAYS[locale][w.weekday]+" "+t.start}/></td>
           <td><input type="time" value={w.end} disabled={!canManage||saving||!w.active} onChange={e=>updateWindow(w.key,{end:e.target.value})}
             aria-label={DAYS[locale][w.weekday]+" "+t.end}/></td>
           <td><input type="number" min="1" value={w.capacity} disabled={!canManage||saving||!w.active} onChange={e=>updateWindow(w.key,{capacity:e.target.value})}
             aria-label={DAYS[locale][w.weekday]+" "+t.override}/></td>
           <td>{canManage&&<button type="button" disabled={saving} className="dd-av-text-button" onClick={()=>removeWindow(w.key)}>{t.removeWindow}</button>}</td>
          </tr>)}</tbody>
         </table></div>
         {canManage&&<div className="dd-av-add-days">{DAYS[locale].map((day,i)=><button type="button" key={i} disabled={saving}
           className="dd-av-day-button" onClick={()=>newWindow(i)}>+ {t.addWindow} · {day}</button>)}</div>}
         {canManage?<div className="dd-av-actions"><button className="dd-av-button" type="submit" disabled={saving}>{saving?t.loading:t.saveConfig}</button></div>:
          <p className="dd-av-muted">{t.manageDenied}</p>}
        </form>
       </section>
       <section className="dd-av-panel">
        <div className="dd-av-section-head"><h2>{t.exceptions}</h2></div>
        {canManage&&<form className="dd-av-form dd-av-exception-form" onSubmit={saveException}>
         <div className="dd-av-field-grid">
          <FormField label={t.exceptionDate}><input type="date" value={exception.date} disabled={saving} onChange={e=>setException(s=>({...s,date:e.target.value}))} required/></FormField>
          <FormField label={t.exceptionType}><select value={exception.kind} disabled={saving} onChange={e=>setException(s=>({...s,kind:e.target.value}))}>
            <option value="closed">{t.closed}</option><option value="custom">{t.custom}</option>
          </select></FormField>
          {exception.kind==="custom"&&<>
           <FormField label={t.start}><input type="time" value={exception.start} disabled={saving} onChange={e=>setException(s=>({...s,start:e.target.value}))}/></FormField>
           <FormField label={t.end}><input type="time" value={exception.end} disabled={saving} onChange={e=>setException(s=>({...s,end:e.target.value}))}/></FormField>
          </>}
          <FormField label={t.capacity}><input type="number" min="1" value={exception.capacity} disabled={saving} onChange={e=>setException(s=>({...s,capacity:e.target.value}))}/></FormField>
          <FormField label={t.note}><input type="text" maxLength={450} value={exception.note} disabled={saving} onChange={e=>setException(s=>({...s,note:e.target.value}))}/></FormField>
         </div>
         <div className="dd-av-actions"><button className="dd-av-button" disabled={saving} type="submit">{saving?t.loading:t.exceptionSave}</button>
          <button className="dd-av-button secondary" type="button" disabled={saving} onClick={resetException}>{t.exceptionReset}</button></div>
        </form>}
        {scope.exceptions.length?<div className="dd-av-table-wrap"><table>
         <thead><tr><th>{t.exceptionDate}</th><th>{t.exceptionType}</th><th>{t.start} – {t.end}</th><th>{t.capacity}</th><th>{t.note}</th><th></th></tr></thead>
         <tbody>{scope.exceptions.map(e=><tr key={e.id}>
          <td>{dayLabel(e.exception_date,locale)}</td><td>{e.is_closed?t.closed:t.custom}</td>
          <td dir="ltr">{e.is_closed?"—":trimTime(e.start_time)+" – "+trimTime(e.end_time)}</td>
          <td>{e.capacity_override??"—"}</td><td>{e.note||"—"}</td>
          <td>{canManage&&<div className="dd-av-row-actions">
           <button type="button" className="dd-av-text-button" disabled={saving} onClick={()=>editException(e)}>{t.edit}</button>
           <button type="button" className="dd-av-text-button" disabled={saving} onClick={()=>deleteException(e)}>{t.remove}</button>
          </div>}</td>
         </tr>)}</tbody></table></div>:<p className="dd-av-muted dd-av-empty">{t.noExceptions}</p>}
       </section>
       <section className="dd-av-panel">
        <div className="dd-av-section-head"><h2>{t.check}</h2></div>
        <form className="dd-av-form" onSubmit={checkAvailability}>
         <div className="dd-av-field-grid">
          <FormField label={t.checkDate}><input type="date" value={probe.date} min={today} required onChange={e=>setProbe(p=>({...p,date:e.target.value,result:null}))}/></FormField>
          {scope.settings?.booking_mode==="time_slot"&&<FormField label={t.checkTime}><input type="time" value={probe.time} onChange={e=>setProbe(p=>({...p,time:e.target.value,result:null}))}/></FormField>}
          <FormField label={t.checkQty}><input type="number" min="1" value={probe.quantity} onChange={e=>setProbe(p=>({...p,quantity:e.target.value,result:null}))}/></FormField>
         </div>
         <div className="dd-av-actions"><button type="submit" className="dd-av-button secondary" disabled={probe.working}>{probe.working?t.loading:t.checkButton}</button></div>
         {probe.result&&<p className="dd-av-result" role="status">
          <strong>{probe.result.available?t.checkAvailable:t.checkUnavailable}</strong> · {t.remaining}: {probe.result.remaining??"—"} · {t.reason}: {probe.result.reason||"—"}
         </p>}
        </form>
       </section>
       <section className="dd-av-panel">
        <div className="dd-av-section-head"><h2>{t.upcoming}</h2></div>
        <p className="dd-av-muted dd-av-indent">{t.holdsHint} {t.reservationCaution}</p>
        {scope.overflow&&<p className="dd-av-warning">{t.nextPage}</p>}
        {scope.reservations.length?<div className="dd-av-table-wrap"><table>
         <thead><tr><th>{t.reservationDate}</th><th>{t.reservationTime}</th><th>{t.quantity}</th>
         <th>{t.reservationStatus}</th><th>{t.expires}</th><th>{t.order}</th></tr></thead>
         <tbody>{scope.reservations.map(r=>{
          const stat=r.status==="hold"&&r.expires_at&&new Date(r.expires_at)<=new Date()?"expired":r.status;
          return <tr key={r.id}><td>{dayLabel(r.reservation_date,locale)}</td>
           <td dir="ltr">{r.start_time?trimTime(r.start_time)+(r.end_time?" – "+trimTime(r.end_time):""):"—"}</td>
           <td>{r.quantity}</td><td>{t.statuses[stat]||stat}</td>
           <td>{r.expires_at?dtLabel(r.expires_at,locale):"—"}</td><td dir="ltr">{r.order_id?r.order_id.slice(0,8)+"…":"—"}</td>
          </tr>;
         })}</tbody>
        </table></div>:<p className="dd-av-muted dd-av-empty">{t.noReservations}</p>}
       </section>
      </>:null)}
   </>}
  </div>
 </section>;
}
