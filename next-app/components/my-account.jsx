"use client";

import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import {useAuthSession} from "./auth-session-provider";
import {authClient,rememberPreference,destinationFor} from "../lib/auth-client";
import {pathFor} from "../lib/locales";

const c={
 ar:{
  title:"حسابي",hello:"أهلًا بيك",subtitle:"إدارة بياناتك وعناوينك وطلباتك في Dear Day",
  profile:"البيانات الشخصية",addresses:"عناويني",security:"الأمان وكلمة المرور",
  orders:"طلباتي",bookings:"حجوزاتي",deletion:"حذف الحساب",
  loading:"جاري تحميل حسابك…",loadError:"حصلت مشكلة في تحميل بيانات حسابك. حاول مرة تانية.",
  refresh:"إعادة المحاولة",login:"تسجيل الدخول",goAccount:"الذهاب للحساب المناسب",
  signinHint:"سجّل دخولك علشان تشوف بياناتك المحفوظة.",mfaHint:"كمّل التحقق الثنائي الأول.",
  inactive:"الحساب غير نشط. تواصل مع خدمة العملاء.",
  first:"الاسم الأول",last:"اسم العائلة",email:"البريد الإلكتروني",phone:"رقم الموبايل",
  birth:"تاريخ الميلاد (اختياري)",area:"المنطقة (اختياري)",save:"حفظ التعديلات",
  emailInfo:"تغيير الإيميل محتاج تأكيد على البريد الجديد.",newEmail:"البريد الإلكتروني الجديد",
  changeEmail:"إرسال رابط تأكيد تغيير الإيميل",emailSent:"تم إرسال تأكيد تغيير البريد. التغيير مش هيتم قبل التأكيد.",
  saved:"تم حفظ التغييرات بنجاح.",required:"الاسم الأول واسم العائلة مطلوبان.",
  addressAdd:"إضافة عنوان",addressEdit:"تعديل العنوان",addressEmpty:"معندكش عناوين محفوظة لسه.",
  label:"اسم العنوان",labelPh:"المنزل، العمل…",recipient:"اسم المستلم",
  addrArea:"المنطقة",line1:"العنوان بالتفصيل",line2:"تفاصيل إضافية (اختياري)",
  landmark:"علامة مميزة (اختياري)",default:"العنوان الافتراضي",setDefault:"جعله افتراضيًا",
  edit:"تعديل",remove:"حذف",cancel:"إلغاء",deleteAsk:"متأكد إنك عايز تحذف العنوان ده؟",
  addressSaved:"تم حفظ العنوان.",addressDeleted:"تم حذف العنوان.",
  addressError:"تعذر حفظ العنوان. حاول مرة تانية.",addressRequired:"المنطقة والعنوان بالتفصيل مطلوبان.",
  passwordTitle:"تغيير كلمة المرور",passwordInfo:"هنبعتلك رمز تحقق لتأكيد إن الحساب حسابك، وبعدها تختار كلمة مرور جديدة.",
  sendCode:"إرسال رمز التحقق",codeSent:"تم طلب رمز التحقق. راجع بريدك المسجل.",
  code:"رمز التحقق",newPassword:"كلمة المرور الجديدة",confirmPassword:"تأكيد كلمة المرور",
  updatePassword:"تغيير كلمة المرور",passwordSuccess:"تم تغيير كلمة المرور بنجاح.",
  passwordMatch:"كلمتا المرور مش متطابقتين.",passwordLength:"كلمة المرور لازم تكون 8 أحرف على الأقل.",
  passwordError:"تعذر تغيير كلمة المرور. تأكد من رمز التحقق وحاول مرة تانية.",
  changePhone:"تغيير رقم الموبايل",phoneInfo:"تغيير رقم الموبايل محتاج تأكيد الهوية برمز تحقق.",
  newPhone:"رقم الموبايل الجديد",phoneSuccess:"تم تحديث رقم الموبايل بعد التحقق.",
  phoneError:"تعذر تغيير رقم الموبايل. تأكد من رمز التحقق وحاول مرة تانية.",
  securityHelp:"لو دخلت عن طريق Google أو Apple فقط، تقدر تستخدم «نسيت كلمة السر» لإعداد كلمة مرور.",
  noOrders:"مفيش طلبات مؤكدة أو بانتظار الدفع حاليًا.",noBookings:"مفيش حجوزات مسجلة على حسابك.",
  order:"طلب",date:"التاريخ",occasion:"المناسبة",total:"الإجمالي",status:"الحالة",
  item:"المنتج",quantity:"الكمية",noItem:"لا توجد تفاصيل إضافية",
  reservation:"حجز",reservationDate:"تاريخ الحجز",reservationTime:"وقت الحجز",relatedOrder:"الطلب المرتبط",
  orderInfo:"هنا بتظهر الطلبات المرتبطة بحسابك فقط. المنتجات في السلة مش تعتبر حجز أو طلب مؤكد.",
  bookingInfo:"الحجوزات بتظهر بعد تسجيلها في النظام، مش بمجرد اختيار مكان من الصفحة.",
  deletionTitle:"طلب حذف الحساب والبيانات",deletionInfo:"طلب الحذف بيتم مراجعته من Dear Day أولًا. إرسال الطلب مش معناه حذف حسابك فورًا.",
  requestDelete:"تقديم طلب حذف الحساب",deletionPending:"طلب حذف الحساب قيد المراجعة.",
  deletionRejected:"الطلب السابق لم يتم اعتماده. تقدر تقدم طلب جديد أو تتواصل مع الدعم.",
  deletionCompleted:"تم تنفيذ طلب حذف الحساب السابق.",
  deletionConfirm:"هل أنت متأكد إنك عايز تقدم طلب حذف حسابك وبياناتك؟ الطلب هيتراجع قبل التنفيذ.",
  deletionSent:"تم تسجيل طلب حذف الحساب وإخطار الإدارة.",
  commonError:"تعذّر تنفيذ العملية. جرّب تاني.",processing:"جاري التنفيذ…",
  contact:"تواصل مع خدمة العملاء",home:"العودة للرئيسية",egp:"جنيه",
  roleError:"الصفحة دي مخصصة لحسابات العملاء فقط.",
  statusValues:{draft:"مسودة",pending_payment:"في انتظار الدفع",paid:"تم الدفع",confirmed:"مؤكد",in_progress:"جاري التنفيذ",completed:"مكتمل",cancelled:"ملغي",refunded:"تم الاسترداد",held:"محجوز مؤقتًا",reserved:"محجوز",released:"تم تحرير الحجز",expired:"منتهي"}
 },
 en:{
  title:"My Account",hello:"Welcome",subtitle:"Manage your details, addresses and orders in Dear Day",
  profile:"Personal details",addresses:"My addresses",security:"Security & password",
  orders:"My orders",bookings:"My bookings",deletion:"Delete account",
  loading:"Loading your account…",loadError:"We couldn't load your account information. Please try again.",
  refresh:"Try again",login:"Log in",goAccount:"Go to your account",
  signinHint:"Sign in to see your saved details.",mfaHint:"Complete two-step verification first.",
  inactive:"Your account is inactive. Please contact support.",
  first:"First name",last:"Last name",email:"Email address",phone:"Mobile number",
  birth:"Date of birth (optional)",area:"Area (optional)",save:"Save changes",
  emailInfo:"Email changes require confirmation at your new email address.",newEmail:"New email address",
  changeEmail:"Send email change confirmation",emailSent:"We sent an email change confirmation. Your email won't change until confirmed.",
  saved:"Changes saved successfully.",required:"First and last name are required.",
  addressAdd:"Add an address",addressEdit:"Edit address",addressEmpty:"You have no saved addresses yet.",
  label:"Address label",labelPh:"Home, Office…",recipient:"Recipient name",
  addrArea:"Area",line1:"Address line 1",line2:"Address line 2 (optional)",
  landmark:"Landmark (optional)",default:"Default address",setDefault:"Set as default",
  edit:"Edit",remove:"Delete",cancel:"Cancel",deleteAsk:"Are you sure you want to delete this address?",
  addressSaved:"Address saved.",addressDeleted:"Address deleted.",
  addressError:"Could not save this address. Please try again.",addressRequired:"Area and address line 1 are required.",
  passwordTitle:"Change your password",passwordInfo:"We'll send you a verification code to confirm it's your account, then you can set a new password.",
  sendCode:"Send verification code",codeSent:"Verification code requested. Check your registered email.",
  code:"Verification code",newPassword:"New password",confirmPassword:"Confirm password",
  updatePassword:"Update password",passwordSuccess:"Your password has been updated.",
  passwordMatch:"Passwords do not match.",passwordLength:"Password must be at least 8 characters.",
  passwordError:"Couldn't update your password. Verify the code and try again.",
  changePhone:"Change mobile number",phoneInfo:"Changing your mobile number requires an identity verification code.",
  newPhone:"New mobile number",phoneSuccess:"Your mobile number was updated after verification.",
  phoneError:"Couldn't update your mobile number. Check your code and try again.",
  securityHelp:"If you only use social login, you can set up a password using 'Forgot password'.",
  noOrders:"You don't have any placed orders yet.",noBookings:"You don't have any recorded bookings.",
  order:"Order",date:"Date",occasion:"Occasion",total:"Total",status:"Status",
  item:"Item",quantity:"Quantity",noItem:"No extra item details",
  reservation:"Reservation",reservationDate:"Booking date",reservationTime:"Booking time",relatedOrder:"Related order",
  orderInfo:"Only orders linked to your account appear here. Cart items are not placed orders.",
  bookingInfo:"Bookings only appear after they have been recorded. Selecting a venue does not confirm a booking.",
  deletionTitle:"Request account & data deletion",deletionInfo:"Dear Day reviews deletion requests. Submitting a request won't delete your account immediately.",
  requestDelete:"Request account deletion",deletionPending:"Your account deletion request is under review.",
  deletionRejected:"Your previous request was declined. You can request again or contact support.",
  deletionCompleted:"Your previous account deletion was completed.",
  deletionConfirm:"Are you sure you want to request deletion of your account and data? Dear Day will review the request before acting.",
  deletionSent:"Account deletion request recorded and sent to administration.",
  commonError:"Something went wrong. Please try again.",processing:"Working…",
  contact:"Contact customer support",home:"Back to home",egp:"EGP",
  roleError:"This area is only for customer accounts.",
  statusValues:{draft:"Draft",pending_payment:"Pending payment",paid:"Paid",confirmed:"Confirmed",in_progress:"In progress",completed:"Completed",cancelled:"Cancelled",refunded:"Refunded",held:"On hold",reserved:"Reserved",released:"Released",expired:"Expired"}
 }
};
const EMPTY_ADDRESS={label:"",recipient_name:"",phone:"",area:"",address_line1:"",address_line2:"",landmark:"",is_default:false};
const money=(amount,currency,locale)=>new Intl.NumberFormat(locale==="ar"?"ar-EG":"en-EG",{style:"currency",currency:currency||"EGP",maximumFractionDigits:2}).format(Number(amount||0));
const formatDate=(date,locale)=>date?new Intl.DateTimeFormat(locale==="ar"?"ar-EG":"en-GB",{dateStyle:"medium"}).format(new Date(String(date).length===10?date+"T12:00:00":date)):"—";

function Notice({notice}){return notice?<p className={"dd-my-notice"+(notice.error?" is-error":" is-success")} role={notice.error?"alert":"status"}>{notice.text}</p>:null;}
function Field({label,name,type="text",defaultValue,required=false,placeholder,readOnly=false,maxLength=160,autoComplete,dir}){
 return <label className="dd-my-field"><span>{label}</span>
   <input name={name} type={type} defaultValue={defaultValue||""} required={required} placeholder={placeholder}
     readOnly={readOnly} maxLength={type==="date"?undefined:maxLength} autoComplete={autoComplete} dir={dir}/>
 </label>;
}

export default function MyAccount({locale="ar",initialTab="profile"}){
 const t=c[locale]||c.ar;
 const session=useAuthSession();
 const uid=session.status==="authenticated"&&session.role==="customer"?session.user?.id:null;
 const [tab,setTab]=useState(initialTab);
 const [profile,setProfile]=useState(null);
 const [addresses,setAddresses]=useState([]);
 const [orders,setOrders]=useState([]);
 const [reservations,setReservations]=useState([]);
 const [deletion,setDeletion]=useState(null);
 const [loaded,setLoaded]=useState(false);
 const [loadedFor,setLoadedFor]=useState(null);
 const requestSeq=useRef(0);
 const [loadError,setLoadError]=useState(false);
 const [loadingKey,setLoadingKey]=useState("");
 const [notice,setNotice]=useState(null);
 const [addressId,setAddressId]=useState(null);
 const [addressForm,setAddressForm]=useState(EMPTY_ADDRESS);
 const [passwordStep,setPasswordStep]=useState("request");
 const [passwordNonce,setPasswordNonce]=useState("");
 const [phoneStep,setPhoneStep]=useState("request");
 const [emailFormOpen,setEmailFormOpen]=useState(false);
 const client=useMemo(()=>typeof window==="undefined"?null:authClient(rememberPreference()),[]);

 const load=useCallback(async()=>{
  if(!uid||!client)return;
  const requestId=++requestSeq.current;
  setLoaded(false);setLoadedFor(null);setLoadError(false);
  try{
   // Every read is scoped to the authenticated user; Supabase RLS enforces
   // ownership independently of this browser filter.
   const requests=[
     client.from("profiles").select("id,first_name,last_name,full_name,phone,birth_date,area").eq("id",uid).single(),
     client.from("customer_addresses").select("id,label,recipient_name,phone,area,address_line1,address_line2,landmark,is_default,created_at").eq("user_id",uid).order("created_at",{ascending:true}),
     client.from("orders").select("id,order_number,status,occasion_type,occasion_date,grand_total,currency,created_at,order_items(id,item_name,quantity,line_total,is_cancelled)").eq("customer_id",uid).neq("status","draft").order("created_at",{ascending:false}).limit(100),
     client.from("booking_reservations").select("id,order_id,reservation_date,start_time,end_time,quantity,status,created_at").eq("customer_id",uid).order("reservation_date",{ascending:false}).limit(100),
     client.rpc("my_account_deletion_request")
   ];
   const results=await Promise.all(requests);
   for(const result of results)if(result.error)throw result.error;
   if(requestId!==requestSeq.current)return;
   setProfile(results[0].data);
   setAddresses(results[1].data||[]);
   setOrders(results[2].data||[]);
   setReservations(results[3].data||[]);
   setDeletion(Array.isArray(results[4].data)?results[4].data[0]||null:results[4].data||null);
   setLoadedFor(uid);
  }catch{if(requestId===requestSeq.current)setLoadError(true);}
  finally{if(requestId===requestSeq.current)setLoaded(true);}
 },[uid,client]);
 useEffect(()=>{
   if(uid)void load();
   else{requestSeq.current++;setLoaded(false);setLoadedFor(null);}
 },[uid,load]);
 useEffect(()=>{setTab(initialTab);},[initialTab]);
 async function work(key,operation){
  if(loadingKey)return;
  setLoadingKey(key);setNotice(null);
  try{await operation();}catch(error){
   setNotice({error:true,text:error?.message?.includes("duplicate")?t.addressError:t.commonError});
  }finally{setLoadingKey("");}
 }
 async function saveProfile(event){
  event.preventDefault();
  const data=new FormData(event.currentTarget);
  const first=String(data.get("first_name")||"").trim(),last=String(data.get("last_name")||"").trim();
  if(!first||!last){setNotice({error:true,text:t.required});return;}
  await work("profile",async()=>{
   const row={first_name:first,last_name:last,full_name:first+" "+last,
     birth_date:String(data.get("birth_date")||"")||null,
     area:String(data.get("area")||"").trim()||null};
   const result=await client.from("profiles").update(row).eq("id",uid)
     .select("id,first_name,last_name,full_name,phone,birth_date,area").single();
   if(result.error)throw result.error;
   setProfile(result.data);
   const metadata={...session.user.user_metadata,first_name:first,last_name:last,
     full_name:row.full_name,birth_date:row.birth_date,area:row.area,
     profile_complete:true};
   const authResult=await client.auth.updateUser({data:metadata});
   if(authResult.error){setNotice({error:true,text:t.commonError});return;}
   await session.refresh();
   setNotice({error:false,text:t.saved});
  });
 }
 async function changeEmail(event){
  event.preventDefault();
  const email=String(new FormData(event.currentTarget).get("email")||"").trim().toLowerCase();
  if(!email)return;
  await work("email",async()=>{
   const {error}=await client.auth.updateUser({email});
   if(error)throw error;
   setEmailFormOpen(false);
   setNotice({error:false,text:t.emailSent});
  });
 }
 function updateAddress(e){const {name,value,type,checked}=e.currentTarget;
  setAddressForm(prev=>({...prev,[name]:type==="checkbox"?checked:value}));}
 function resetAddress(){setAddressId(null);setAddressForm({...EMPTY_ADDRESS});}
 async function refreshAddresses(){
  const {data,error}=await client.from("customer_addresses").select("id,label,recipient_name,phone,area,address_line1,address_line2,landmark,is_default,created_at").eq("user_id",uid).order("created_at",{ascending:true});
  if(error)throw error;setAddresses(data||[]);return data||[];
 }
 async function markDefault(id,oldId){
  // Preserve the previous default on a transient second-write failure.
  const clear=await client.from("customer_addresses").update({is_default:false}).eq("user_id",uid).eq("is_default",true);
  if(clear.error)throw clear.error;
  const mark=await client.from("customer_addresses").update({is_default:true}).eq("user_id",uid).eq("id",id);
  if(mark.error){
   if(oldId)await client.from("customer_addresses").update({is_default:true}).eq("user_id",uid).eq("id",oldId);
   throw mark.error;
  }
 }
 async function saveAddress(event){
  event.preventDefault();
  const values={...addressForm,label:addressForm.label.trim()|| (locale==="ar"?"المنزل":"Home"),
    recipient_name:addressForm.recipient_name.trim()||null,
    phone:addressForm.phone.trim()||null,area:addressForm.area.trim(),
    address_line1:addressForm.address_line1.trim(),
    address_line2:addressForm.address_line2.trim()||null,
    landmark:addressForm.landmark.trim()||null,is_default:Boolean(addressForm.is_default)};
  if(!values.area||!values.address_line1){setNotice({error:true,text:t.addressRequired});return;}
  await work("address",async()=>{
   const previousDefault=addresses.find(a=>a.is_default)?.id;
   const markRequested=values.is_default||addresses.length===0;
   // Avoid non-atomic default changes for unrelated address edits.
   const payload={...values,is_default:false,user_id:uid};
   if(addressId){
    const q=await client.from("customer_addresses").update(payload).eq("id",addressId).eq("user_id",uid);
    if(q.error)throw q.error;
    if(markRequested)await markDefault(addressId,previousDefault);
    else if(previousDefault===addressId){
      // Keep a default address rather than silently unsetting the sole default.
      await client.from("customer_addresses").update({is_default:true}).eq("id",addressId).eq("user_id",uid);
    }
   }else{
    const q=await client.from("customer_addresses").insert(payload).select("id").single();
    if(q.error)throw q.error;
    if(markRequested)await markDefault(q.data.id,previousDefault);
   }
   await refreshAddresses();resetAddress();
   setNotice({error:false,text:t.addressSaved});
  });
 }
 async function removeAddress(item){
  if(!window.confirm(t.deleteAsk))return;
  await work("address",async()=>{
   const result=await client.from("customer_addresses").delete().eq("user_id",uid).eq("id",item.id);
   if(result.error)throw result.error;
   const all=await refreshAddresses();
   if(item.is_default&&all[0]){await markDefault(all[0].id,null);await refreshAddresses();}
   if(addressId===item.id)resetAddress();
   setNotice({error:false,text:t.addressDeleted});
  });
 }
 async function setDefault(item){
  await work("address",async()=>{
   await markDefault(item.id,addresses.find(a=>a.is_default)?.id);
   await refreshAddresses();setNotice({error:false,text:t.addressSaved});
  });
 }
 async function sendReauth(){
  await work("password",async()=>{
   const {error}=await client.auth.reauthenticate();
   if(error)throw error;
   setPasswordStep("confirm");setNotice({error:false,text:t.codeSent});
  });
 }
 async function updatePassword(event){
  event.preventDefault();
  const form=new FormData(event.currentTarget);
  const nonce=String(form.get("nonce")||"").trim(),
    password=String(form.get("password")||""),confirm=String(form.get("confirm")||"");
  if(password.length<8){setNotice({error:true,text:t.passwordLength});return;}
  if(password!==confirm){setNotice({error:true,text:t.passwordMatch});return;}
  const formElement=event.currentTarget;
  await work("password",async()=>{
   const {error}=await client.auth.updateUser({password,nonce});
   if(error){setNotice({error:true,text:t.passwordError});return;}
   formElement.reset();
   setPasswordNonce("");setPasswordStep("request");
   setNotice({error:false,text:t.passwordSuccess});
  });
 }
 async function sendPhoneVerification(){
  await work("phone",async()=>{
   const {error}=await client.auth.reauthenticate();
   if(error)throw error;
   setPhoneStep("confirm");setNotice({error:false,text:t.codeSent});
  });
 }
 async function changePhone(event){
  event.preventDefault();
  const data=new FormData(event.currentTarget);
  const nonce=String(data.get("nonce")||"").trim();
  const newPhone=String(data.get("phone")||"").trim();
  if(!/^[+0-9() -]{6,40}$/.test(newPhone)){
   setNotice({error:true,text:t.phoneError});return;
  }
  await work("phone",async()=>{
   // Supabase enforces a valid reauthentication nonce before accepting
   // the Auth metadata update; update the profile only if that succeeds.
   const check=await client.auth.updateUser({data:{...session.user.user_metadata,phone:newPhone},nonce});
   if(check.error){setNotice({error:true,text:t.phoneError});return;}
   const updated=await client.from("profiles").update({phone:newPhone}).eq("id",uid)
    .select("id,first_name,last_name,full_name,phone,birth_date,area").single();
   if(updated.error)throw updated.error;
   setProfile(updated.data);
   setPhoneStep("request");
   await session.refresh();
   setNotice({error:false,text:t.phoneSuccess});
  });
 }
 async function deleteAccount(){
  if(!window.confirm(t.deletionConfirm))return;
  await work("deletion",async()=>{
   const {error}=await client.rpc("request_account_deletion");
   if(error)throw error;
   const latest=await client.rpc("my_account_deletion_request");
   if(latest.error)throw latest.error;
   setDeletion(Array.isArray(latest.data)?latest.data[0]||null:latest.data);
   setNotice({error:false,text:t.deletionSent});
  });
 }
 const tabs=["profile","addresses","security","orders","bookings","deletion"];
 const field=(key,label,value,optional=false,type="text",extra={})=><label className="dd-my-field" key={key}>
   <span>{label}</span><input key={String(value??"")} type={type} name={key} defaultValue={value||""}
     required={!optional} maxLength={type==="date"?undefined:extra.max||160}
     autoComplete={extra.autoComplete} dir={extra.dir} readOnly={extra.readOnly||false}/>
 </label>;
 if(session.status!=="authenticated"||!uid)return <main id="main-content" className="dd-my-account" dir={locale==="ar"?"rtl":"ltr"}>
   <section className="dd-my-guard">
    <h1>{t.title}</h1>
    <p>{session.status==="loading"?t.loading:session.status==="mfa_required"?t.mfaHint:
       session.status==="inactive"?t.inactive:session.status==="signed_out"?t.signinHint:
       session.status==="authenticated"?t.roleError:t.loadError}</p>
    <Link className="dd-my-primary" href={session.status==="authenticated"?destinationFor(session.role,locale):pathFor("auth",locale)+(session.status==="mfa_required"?"?mode=mfa":"")}>
      {session.status==="authenticated"?t.goAccount:t.login}
    </Link>
   </section>
 </main>;
 return <main id="main-content" className="dd-my-account" dir={locale==="ar"?"rtl":"ltr"}>
  <div className="dd-my-wrap">
   <div className="dd-my-heading"><h1>{t.title}</h1><p>{t.subtitle}</p></div>
   <div className="dd-my-layout">
    <nav className="dd-my-nav" aria-label={t.title}>{tabs.map(name=>
      <button key={name} type="button" className={tab===name?"is-selected":""}
        aria-current={tab===name?"page":undefined} onClick={()=>{setTab(name);setNotice(null);}}>
       {t[name]}
      </button>)}</nav>
    <section className="dd-my-panel">
      {!loaded||loadedFor!==uid?<p role="status">{t.loading}</p>:
       loadError?<div><p role="alert">{t.loadError}</p><button type="button" className="dd-my-primary" onClick={load}>{t.refresh}</button></div>:
       <>
        {tab==="profile"&&<div>
         <h2>{t.profile}</h2>
         <form key={profile?.id+"-"+profile?.updated_at} className="dd-my-form" onSubmit={saveProfile}>
          <div className="dd-my-fields">
           {field("first_name",t.first,profile?.first_name||session.user.user_metadata?.first_name)}
           {field("last_name",t.last,profile?.last_name||session.user.user_metadata?.last_name)}
           {field("phone",t.phone,profile?.phone,true,"tel",{max:40,autoComplete:"tel",dir:"ltr",readOnly:true})}
           {field("birth_date",t.birth,profile?.birth_date,true,"date")}
           {field("area",t.area,profile?.area,true)}
          </div>
          <div className="dd-my-readonly"><small>{t.email}</small><strong dir="ltr">{session.user.email}</strong></div>
          <button type="submit" disabled={Boolean(loadingKey)} className="dd-my-primary">{loadingKey==="profile"?t.processing:t.save}</button>
         </form>
         <div className="dd-my-subsection"><h3>{t.email}</h3><p>{t.emailInfo}</p>
          {!emailFormOpen?<button className="dd-my-secondary" onClick={()=>setEmailFormOpen(true)} type="button">{t.changeEmail}</button>:
           <form onSubmit={changeEmail} className="dd-my-form">
            <label className="dd-my-field"><span>{t.newEmail}</span><input type="email" name="email" required maxLength={254} autoComplete="email" dir="ltr"/></label>
            <div className="dd-my-actions"><button type="submit" disabled={Boolean(loadingKey)} className="dd-my-primary">{t.changeEmail}</button><button className="dd-my-secondary" type="button" onClick={()=>setEmailFormOpen(false)}>{t.cancel}</button></div>
           </form>}
         </div>
        </div>}
        {tab==="addresses"&&<div>
         <h2>{t.addresses}</h2>
         {addresses.length===0?<p className="dd-my-empty">{t.addressEmpty}</p>:
          <div className="dd-my-addresses">{addresses.map(a=><article key={a.id} className="dd-my-address">
           <div className="dd-my-address-title"><strong>{a.label}</strong>{a.is_default&&<span>{t.default}</span>}</div>
           <p>{[a.recipient_name,a.phone].filter(Boolean).join(" · ")}</p>
           <p>{[a.address_line1,a.address_line2,a.area,a.landmark].filter(Boolean).join("، ")}</p>
           <div className="dd-my-actions">
            <button type="button" className="dd-my-secondary" onClick={()=>{setAddressId(a.id);setAddressForm({
             label:a.label||"",recipient_name:a.recipient_name||"",phone:a.phone||"",area:a.area||"",
             address_line1:a.address_line1||"",address_line2:a.address_line2||"",
             landmark:a.landmark||"",is_default:!!a.is_default
            });}}>{t.edit}</button>
            {!a.is_default&&<button type="button" className="dd-my-secondary" disabled={Boolean(loadingKey)} onClick={()=>setDefault(a)}>{t.setDefault}</button>}
            <button type="button" className="dd-my-danger" disabled={Boolean(loadingKey)} onClick={()=>removeAddress(a)}>{t.remove}</button>
           </div>
          </article>)}</div>}
         <div className="dd-my-subsection"><h3>{addressId?t.addressEdit:t.addressAdd}</h3>
          <form className="dd-my-form" onSubmit={saveAddress}>
           <div className="dd-my-fields">
            {Object.entries({label:t.label,recipient_name:t.recipient,phone:t.phone,
              area:t.addrArea,address_line1:t.line1,address_line2:t.line2,landmark:t.landmark}).map(([key,label])=>
              <label className={"dd-my-field"+(key==="address_line1"?" dd-my-wide":"")} key={key}>
               <span>{label}</span><input name={key} value={addressForm[key]} onChange={updateAddress}
                placeholder={key==="label"?t.labelPh:undefined} required={["area","address_line1"].includes(key)}
                maxLength={key==="phone"?40:300} dir={key==="phone"?"ltr":undefined}/>
              </label>)}
           </div>
           <label className="dd-my-checkbox"><input type="checkbox" name="is_default" checked={addressForm.is_default} onChange={updateAddress}/><span>{t.default}</span></label>
           <div className="dd-my-actions"><button className="dd-my-primary" type="submit" disabled={Boolean(loadingKey)}>{loadingKey==="address"?t.processing:t.save}</button>
            {addressId&&<button type="button" className="dd-my-secondary" onClick={resetAddress}>{t.cancel}</button>}</div>
          </form>
         </div>
        </div>}
        {tab==="security"&&<div>
         <h2>{t.passwordTitle}</h2><p className="dd-my-muted">{t.passwordInfo}</p>
         {passwordStep==="request"?
          <button className="dd-my-primary" type="button" disabled={Boolean(loadingKey)} onClick={sendReauth}>{loadingKey==="password"?t.processing:t.sendCode}</button>:
          <form className="dd-my-form" onSubmit={updatePassword}>
           <label className="dd-my-field"><span>{t.code}</span><input name="nonce" type="text" inputMode="numeric" autoComplete="one-time-code" required maxLength={12} value={passwordNonce} onChange={e=>setPasswordNonce(e.target.value)} dir="ltr"/></label>
           <div className="dd-my-fields">
            <label className="dd-my-field"><span>{t.newPassword}</span><input type="password" name="password" minLength={8} required autoComplete="new-password"/></label>
            <label className="dd-my-field"><span>{t.confirmPassword}</span><input type="password" name="confirm" minLength={8} required autoComplete="new-password"/></label>
           </div>
           <div className="dd-my-actions"><button type="submit" disabled={Boolean(loadingKey)} className="dd-my-primary">{loadingKey==="password"?t.processing:t.updatePassword}</button>
            <button type="button" className="dd-my-secondary" onClick={()=>{setPasswordStep("request");setPasswordNonce("");}}>{t.cancel}</button></div>
          </form>}
         <div className="dd-my-subsection">
          <h3>{t.changePhone}</h3>
          <p className="dd-my-muted">{t.phoneInfo}</p>
          {phoneStep==="request"?
            <button type="button" className="dd-my-secondary" disabled={Boolean(loadingKey)}
              onClick={sendPhoneVerification}>{loadingKey==="phone"?t.processing:t.sendCode}</button>:
            <form className="dd-my-form" onSubmit={changePhone}>
              <div className="dd-my-fields">
                <label className="dd-my-field"><span>{t.code}</span>
                  <input name="nonce" autoComplete="one-time-code" inputMode="numeric" required maxLength={12} dir="ltr"/>
                </label>
                <label className="dd-my-field"><span>{t.newPhone}</span>
                  <input name="phone" type="tel" inputMode="tel" required maxLength={40} minLength={6} dir="ltr"/>
                </label>
              </div>
              <div className="dd-my-actions">
                <button type="submit" className="dd-my-primary" disabled={Boolean(loadingKey)}>{loadingKey==="phone"?t.processing:t.changePhone}</button>
                <button type="button" className="dd-my-secondary" onClick={()=>setPhoneStep("request")}>{t.cancel}</button>
              </div>
            </form>}
         </div>
         <p className="dd-my-muted">{t.securityHelp}</p>
        </div>}
        {tab==="orders"&&<div>
         <h2>{t.orders}</h2><p className="dd-my-muted">{t.orderInfo}</p>
         {orders.length===0?<p className="dd-my-empty">{t.noOrders}</p>:
          <div className="dd-my-order-list">{orders.map(o=><article className="dd-my-order" key={o.id}>
           <div className="dd-my-order-top"><h3>{t.order} #DD{o.order_number}</h3><span>{t.statusValues[o.status]||o.status}</span></div>
           <p>{formatDate(o.created_at,locale)} · {o.occasion_type||t.occasion}</p>
           <strong>{money(o.grand_total,o.currency,locale)}</strong>
           {(o.order_items||[]).length>0&&<div className="dd-my-order-items">{o.order_items.map(item=><div key={item.id}>
             <span>{item.item_name} × {item.quantity}{item.is_cancelled?" ("+(t.statusValues.cancelled)+")":""}</span>
             <strong>{money(item.line_total,o.currency,locale)}</strong>
           </div>)}</div>}
          </article>)}</div>}
        </div>}
        {tab==="bookings"&&<div>
         <h2>{t.bookings}</h2><p className="dd-my-muted">{t.bookingInfo}</p>
         {reservations.length===0?<p className="dd-my-empty">{t.noBookings}</p>:
          <div className="dd-my-order-list">{reservations.map(b=><article key={b.id} className="dd-my-order">
           <div className="dd-my-order-top"><h3>{t.reservation}</h3><span>{t.statusValues[b.status]||b.status}</span></div>
           <p>{t.reservationDate}: {formatDate(b.reservation_date,locale)}</p>
           {b.start_time&&<p>{t.reservationTime}: <bdi dir="ltr">{b.start_time.slice(0,5)}{b.end_time?" – "+b.end_time.slice(0,5):""}</bdi></p>}
           {b.order_id&&<p>{t.relatedOrder}: {orders.find(o=>o.id===b.order_id)?"#DD"+orders.find(o=>o.id===b.order_id).order_number:"—"}</p>}
          </article>)}</div>}
        </div>}
        {tab==="deletion"&&<div>
         <h2>{t.deletionTitle}</h2><p className="dd-my-muted">{t.deletionInfo}</p>
         {deletion?.status==="pending"?<p className="dd-my-pending" role="status">{t.deletionPending}</p>:
          <>
           {deletion?.status==="rejected"&&<p className="dd-my-pending">{t.deletionRejected}</p>}
           {deletion?.status==="completed"&&<p className="dd-my-pending">{t.deletionCompleted}</p>}
           <button className="dd-my-danger-primary" type="button" disabled={Boolean(loadingKey)} onClick={deleteAccount}>{loadingKey==="deletion"?t.processing:t.requestDelete}</button>
          </>}
         <p className="dd-my-muted"><Link href={pathFor("contact",locale)}>{t.contact}</Link></p>
        </div>}
        <Notice notice={notice}/>
       </>}
    </section>
   </div>
   <div className="dd-my-bottom"><Link href={pathFor("home",locale)}>{t.home}</Link></div>
  </div>
 </main>;
}
