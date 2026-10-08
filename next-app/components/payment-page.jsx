"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PlanningStepper from "./planning-stepper";
import { useCart, money } from "./cart-provider";
import { pathFor } from "../lib/locales";

// Payment UI extracted from the current production payment.html/payment-en.html
// commit 5d97cc458910279646ec10a18ffecaca81a6854d.
// This preview intentionally never calls the Paymob/checkout APIs and never
// creates an order, a payment reference, or a booking.
const DRAFT_KEY="dearDayPaymentPreviewDraft";
const INITIAL={fullName:"",phone:"",email:"",address:"",city:"",country:"Egypt",sameAddress:false,method:"card"};
const copy={
  ar:{
    steps:["الاختيارات","تفاصيل المناسبة","مراجعة الحجز","الدفع"],
    eyebrow:"الدفع",title:"إتمام الحجز بأمان",
    intro:"راجع الإجمالي وأدخل بيانات التواصل الخاصة بالدافع. الدفع الإلكتروني غير متاح حاليًا في نسخة المعاينة.",
    secureTitle:"Secure Checkout",secureSubtitle:"متاح بعد تفعيل بوابة الدفع",
    contactTitle:"بيانات التواصل والفاتورة",
    contactIntro:"البيانات دي تخص الشخص اللي هيكمل الدفع، وممكن تختلف عن اسم صاحب المناسبة.",
    fullName:"الاسم بالكامل *",fullNamePlace:"الاسم بالكامل",phone:"رقم الموبايل *",
    phonePlace:"01xxxxxxxxx",email:"البريد الإلكتروني *",emailPlace:"name@example.com",
    sameAddress:"استخدام عنوان المناسبة كعنوان الفاتورة",
    address:"العنوان / الشارع *",addressPlace:"المنطقة، الشارع، رقم المبنى",
    city:"المدينة *",chooseCity:"اختر المدينة",cairo:"القاهرة",giza:"الجيزة",
    country:"الدولة",
    methodTitle:"طريقة الدفع",
    methodIntro:"اختار وسيلة الدفع لمعاينة شكلها. الوسائل غير مفعّلة حاليًا في نسخة React.",
    card:"بطاقة بنكية",cardDesc:"Visa أو Mastercard — بيانات البطاقة تُدخل في بوابة الدفع بعد تفعيل Paymob.",
    cardNote:"3D Secure عند طلب البنك",
    wallet:"محفظة إلكترونية",walletDesc:"Mobile Wallet عبر Paymob، بعد تفعيل المحافظ على الحساب.",
    methodDisabled:"الدفع الإلكتروني غير متاح حاليًا.",
    securityTitle:"بيانات البطاقة آمنة",
    securityDesc:"Dear Day لا يطلب أو يخزّن أرقام البطاقات. عند تفعيل الدفع، تُدخل البيانات داخل بوابة الدفع المعتمدة فقط.",
    gatewayNote:"الرجوع من بوابة الدفع مش دليل على نجاح العملية. أي دفع فعلي لازم يتأكد من السيرفر والـWebhook قبل اعتبار الطلب مدفوعًا.",
    summary:"ملخص الدفع",occasion:"المناسبة",datePlace:"التاريخ والمكان",
    items:"عدد العناصر",subtotal:"قيمة الاختيارات",fee:"رسوم الخدمة",total:"الإجمالي",
    noFee:"غير محددة",estimated:"قيمة الاختيارات الحالية فقط — المبلغ النهائي يحتاج تأكيد السعر والرسوم والتوافر.",
    pay:"الانتقال إلى الدفع الآمن",back:"الرجوع للمراجعة",
    paymentsUnavailable:"الدفع الإلكتروني غير متاح حاليًا. زر الدفع متوقف في هذه المعاينة ولا يتم إنشاء طلب أو تحصيل مبلغ.",
    secureFoot:"عند إتاحة Paymob، مش هنعتبر أي عملية مدفوعة إلا بعد التحقق من حالتها على السيرفر.",
    returnWarning:"معاملات النجاح الظاهرة في الرابط لا تثبت دفعًا حقيقيًا. يلزم التحقق من السيرفر.",
    empty:"سلتك فاضية حاليًا",noData:"—",example:"منتج توضيحي — السعر والتوافر غير مؤكدين.",
    venuePreview:"المكان المختار ضمن الخطة فقط، وليس حجزًا مؤكدًا.",
    note:"في المعاينة، بيانات التواصل بتتحفظ مؤقتًا داخل تبويب المتصفح فقط، ومش بتتبعت للسيرفر.",
    progress:"مراحل الحجز",
    occasionLabels:{birthday:"عيد ميلاد",anniversary:"ذكرى سنوية",engagement:"خطوبة",proposal:"طلب زواج"}
  },
  en:{
    steps:["Selections","Occasion Details","Review & Book","Payment"],
    eyebrow:"Payment",title:"Complete your booking securely",
    intro:"Review your selections and fill in your billing details. Online payment is currently unavailable in this preview.",
    secureTitle:"Secure checkout",secureSubtitle:"Available after the payment gateway is enabled",
    contactTitle:"Billing & contact details",
    contactIntro:"These details belong to the person completing payment and can be different from the occasion recipient.",
    fullName:"Full name *",fullNamePlace:"Full name",phone:"Mobile number *",
    phonePlace:"01xxxxxxxxx",email:"Email address *",emailPlace:"name@example.com",
    sameAddress:"Use the occasion address as the billing address",
    address:"Address / street *",addressPlace:"Area, street, building number",
    city:"City *",chooseCity:"Select city",cairo:"Cairo",giza:"Giza",
    country:"Country",
    methodTitle:"Payment method",
    methodIntro:"Preview a payment method. No methods are currently active in this React preview.",
    card:"Bank card",cardDesc:"Visa or Mastercard — card details will be entered in Paymob after activation.",
    cardNote:"Your bank may request 3D Secure",
    wallet:"Mobile Wallet",walletDesc:"Mobile wallet through Paymob when supported wallets are enabled.",
    methodDisabled:"Online payment is currently unavailable.",
    securityTitle:"Card details stay secure",
    securityDesc:"Dear Day does not request or store card numbers. Once payment is enabled, card details will be entered only within the authorized gateway.",
    gatewayNote:"Returning from a payment gateway does not confirm payment. Final status must be verified on the server via the webhook.",
    summary:"Payment summary",occasion:"Occasion",datePlace:"Date & location",
    items:"Items",subtotal:"Selections subtotal",fee:"Service fee",total:"Total",
    noFee:"Not set",estimated:"Selections subtotal only — prices, availability, fees and the final amount still need confirmation.",
    pay:"Continue to Secure Payment",back:"Back to Review",
    paymentsUnavailable:"Online payment is unavailable. The payment button is disabled and this preview cannot create an order or charge you.",
    secureFoot:"When Paymob is enabled, an order will be marked paid only after server-side verification.",
    returnWarning:"Payment parameters in the URL do not prove that any transaction succeeded. Server-side verification is required.",
    empty:"Your cart is empty",noData:"—",example:"Illustrative product — final price and availability are not confirmed.",
    venuePreview:"Your planned venue is not a confirmed booking.",
    note:"In this preview, contact details are stored only for this browser tab and are not sent to a server.",
    progress:"Booking progress",
    occasionLabels:{birthday:"Birthday",anniversary:"Anniversary",engagement:"Engagement",proposal:"Marriage Proposal"}
  }
};
function loadPlan(){
  try{
    const p=JSON.parse(localStorage.getItem("dearDayPlan")||"{}");
    return p&&typeof p==="object"&&!Array.isArray(p)?p:{};
  }catch{return {};}
}
function prettyDate(value,locale){
  if(!value)return "—";
  try{
    const d=new Date(value+"T12:00:00");
    return Number.isNaN(d.getTime())?value:new Intl.DateTimeFormat(locale==="ar"?"ar-EG":"en-GB",
      {day:"numeric",month:"long",year:"numeric"}).format(d);
  }catch{return value;}
}
function emoji(type){
  return type==="gift"?"🎁":type==="cake"?"🎂":type==="flower"?"💐":"📍";
}
function PaymentMethodCard({locale,type,value,onChange,t}){
  const isCard=type==="card",active=value===type;
  return <label className={"dd-payment-method"+(active?" is-selected":"")}>
    <input type="radio" name="dd-payment-method" checked={active} value={type}
      onChange={()=>onChange(type)} aria-label={isCard?t.card:t.wallet}/>
    <span className="dd-payment-method-icon" aria-hidden="true">
      {isCard?<span className="dd-payment-card-icons">
        <span className="dd-payment-mastercard"><i/><i/></span>
        <strong>VISA</strong>
      </span>:<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
        <rect x="6" y="11" width="36" height="27" rx="7"/>
        <path d="M30 19h12v12H30a6 6 0 0 1 0-12Z"/><circle cx="34" cy="25" r="1.8" fill="currentColor" stroke="none"/>
      </svg>}
    </span>
    <span className="dd-payment-method-text">
      <strong>{isCard?t.card:t.wallet}</strong>
      <small>{isCard?t.cardDesc:t.walletDesc}</small>
      {isCard&&<span className="dd-payment-method-note">🛡 {t.cardNote}</span>}
    </span>
    <span className="dd-payment-method-check" aria-hidden="true">{active?"✓":""}</span>
  </label>;
}
function BillingField({name,id,value,onChange,placeholder="",type="text",autoComplete,
  inputMode,maxLength,full=false,required=false,children}){
  return <div className={"dd-payment-field"+(full?" is-full":"")}>
    <label htmlFor={id}>{name}</label>
    {children||<input id={id} value={value||""} onChange={e=>onChange(e.target.value)}
      type={type} required={required} autoComplete={autoComplete}
      inputMode={inputMode} maxLength={maxLength} placeholder={placeholder}/>}
  </div>;
}
export default function PaymentPage({locale="ar",flow=false,hasReturnParams=false}){
  const t=copy[locale]||copy.ar;
  const router=useRouter();
  const {items,total,count,isLoaded}=useCart();
  const [plan,setPlan]=useState({});
  const [form,setForm]=useState(INITIAL);
  const [hydrated,setHydrated]=useState(false);
  useEffect(()=>{
    if(!isLoaded)return;
    setPlan(loadPlan());
    try{
      const stored=JSON.parse(sessionStorage.getItem(DRAFT_KEY)||"null");
      if(stored&&typeof stored==="object"&&!Array.isArray(stored)){
        const safe=Object.fromEntries(Object.keys(INITIAL).filter(k=>Object.hasOwn(stored,k))
          .map(k=>[k,stored[k]]));
        setForm({...INITIAL,...safe});
      }
    }catch{}
    setHydrated(true);
  },[isLoaded]);
  useEffect(()=>{
    if(!hydrated)return;
    try{sessionStorage.setItem(DRAFT_KEY,JSON.stringify(form));}catch{}
  },[form,hydrated]);
  const details=plan.eventDetails||{};
  const venue=Array.isArray(plan.venueSelections)?plan.venueSelections.find(v=>v?.id):null;
  const occasionKey=details.occasionType||plan.occasionKey||"";
  const occasion=t.occasionLabels[occasionKey]||(locale==="ar"?
    plan.occasionLabel||plan.occasion:plan.occasionLabelEn||plan.occasionLabel||plan.occasion)||t.noData;
  const recipient=details.celebrant?(" — "+details.celebrant):"";
  const occasionDate=prettyDate(details.eventDate||plan.date,locale);
  const place=details.locationMode==="selected"?
    (locale==="ar"?venue?.ar||venue?.name:venue?.name||venue?.ar)||plan.area||"":
    details.address||plan.area||"";
  const eventAddress=details.locationMode==="selected"?"":(details.address||plan.area||"");
  const cityFromPlan=plan.area==="القاهرة"?"Cairo":plan.area==="الجيزة"?"Giza":"";
  const displayedTotal=Number.isFinite(total)?total:0;
  const hasExamples=items.some(item=>item.previewOnly)||Boolean(venue);
  const mini=items.slice(0,4);
  function update(key,value){
    setForm(old=>({...old,[key]:value}));
  }
  function sameAddressToggle(enabled){
    setForm(old=>({...old,sameAddress:enabled,
      address:enabled&&eventAddress?eventAddress:old.address,
      city:enabled&&cityFromPlan?cityFromPlan:old.city}));
  }
  function goBack(){
    router.push(pathFor("review",locale)+(flow?"?flow=1":""));
  }
  return <>
    {flow&&<PlanningStepper locale={locale} current="review"/>}
    <main id="main-content" className="dd-payment-page" dir={locale==="ar"?"rtl":"ltr"}>
      <div className="dd-payment-wrap">
        {flow&&<nav className="dd-payment-steps" aria-label={t.progress}>
          {t.steps.map((step,index)=><div key={step}
            className={"dd-payment-step"+(index<3?" is-done":" is-active")}
            aria-current={index===3?"step":undefined}>
            <span className="dd-payment-step-num">{index<3?"✓":index+1}</span>
            <span>{step}</span>
          </div>)}
        </nav>}
        <section className="dd-payment-hero">
          <div className="dd-payment-hero-copy">
            <span className="dd-payment-eyebrow">{t.eyebrow}</span>
            <h1>{t.title}</h1><p>{t.intro}</p>
          </div>
          <div className="dd-payment-secure-chip">
            <span className="dd-payment-lock" aria-hidden="true">🔒</span>
            <div><strong>{t.secureTitle}</strong><small>{t.secureSubtitle}</small></div>
          </div>
        </section>
        {hasReturnParams&&<div className="dd-payment-return-warning" role="alert">{t.returnWarning}</div>}
        <div className="dd-payment-layout">
          <div className="dd-payment-stack">
            <section className="dd-payment-panel" aria-labelledby="dd-payment-billing">
              <div className="dd-payment-panel-head">
                <h2 id="dd-payment-billing">{t.contactTitle}</h2><p>{t.contactIntro}</p>
              </div>
              <form className="dd-payment-form" autoComplete="on" onSubmit={e=>e.preventDefault()}>
                <BillingField name={t.fullName} id="dd-payer-name" value={form.fullName} required
                  placeholder={t.fullNamePlace} autoComplete="name" maxLength={150}
                  onChange={v=>update("fullName",v)}/>
                <BillingField name={t.phone} id="dd-payer-phone" value={form.phone} required
                  placeholder={t.phonePlace} inputMode="tel" autoComplete="tel" maxLength={24}
                  onChange={v=>update("phone",v)}/>
                <BillingField name={t.email} id="dd-payer-email" value={form.email} required full
                  placeholder={t.emailPlace} type="email" autoComplete="email" maxLength={254}
                  onChange={v=>update("email",v)}/>
                {flow&&<label className="dd-payment-same-address">
                  <input type="checkbox" checked={form.sameAddress}
                    onChange={e=>sameAddressToggle(e.target.checked)}/>
                  <span>{t.sameAddress}</span>
                </label>}
                <BillingField name={t.address} id="dd-billing-address" full required
                  placeholder={t.addressPlace} autoComplete="street-address" maxLength={350}
                  value={form.address} onChange={v=>update("address",v)}/>
                <BillingField id="dd-billing-city" name={t.city} full={false}>
                  <select id="dd-billing-city" value={form.city} required autoComplete="address-level2"
                    onChange={e=>update("city",e.target.value)}>
                    <option value="">{t.chooseCity}</option>
                    <option value="Cairo">{t.cairo}</option>
                    <option value="Giza">{t.giza}</option>
                  </select>
                </BillingField>
                <BillingField id="dd-billing-country" name={t.country} full={false}>
                  <input id="dd-billing-country" value="Egypt" readOnly aria-readonly="true"/>
                </BillingField>
              </form>
              <p className="dd-payment-storage-note">{t.note}</p>
            </section>
            <section className="dd-payment-panel" aria-labelledby="dd-payment-methods">
              <div className="dd-payment-panel-head">
                <h2 id="dd-payment-methods">{t.methodTitle}</h2><p>{t.methodIntro}</p>
              </div>
              <div className="dd-payment-methods" role="radiogroup" aria-label={t.methodTitle}>
                <PaymentMethodCard locale={locale} type="card" value={form.method}
                  onChange={v=>update("method",v)} t={t}/>
                <PaymentMethodCard locale={locale} type="wallet" value={form.method}
                  onChange={v=>update("method",v)} t={t}/>
              </div>
              <p className="dd-payment-method-status" role="status">{t.methodDisabled}</p>
              <div className="dd-payment-security">
                <span className="dd-payment-shield" aria-hidden="true">♢</span>
                <div><strong>{t.securityTitle}</strong><p>{t.securityDesc}</p></div>
              </div>
              <p className="dd-payment-gateway-note">{t.gatewayNote}</p>
            </section>
          </div>
          <aside className="dd-payment-panel dd-payment-summary" aria-labelledby="dd-payment-summary">
            <h2 id="dd-payment-summary">{t.summary}</h2>
            {flow&&<div className="dd-payment-event-box">
              <small>{t.occasion}</small>
              <strong>{hydrated?occasion+recipient:t.noData}</strong>
              <small>{t.datePlace}</small>
              <strong>{hydrated?[occasionDate,place].filter(Boolean).join(" · "):t.noData}</strong>
              {venue&&<span className="dd-payment-venue-note">{t.venuePreview}</span>}
            </div>}
            <div className="dd-payment-mini-items">
              {hydrated&&mini.length?mini.map((item,index)=><div key={item.key||index} className="dd-payment-mini-item">
                <div className="dd-payment-mini-thumb">
                  {item.image?<img src={item.image} alt="" loading="lazy"/>:emoji(item.type)}
                </div>
                <div className="dd-payment-mini-copy">
                  <b>{locale==="ar"?item.ar||item.name:item.name||item.ar}</b>
                  <small>{money((Number(item.price)||0)*Math.max(1,Number(item.quantity)||1),locale)}</small>
                  {item.previewOnly&&<small className="dd-payment-preview-note">{t.example}</small>}
                </div>
                <span className="dd-payment-mini-qty">×{item.quantity||1}</span>
              </div>):<p className="dd-payment-no-items">{t.empty}</p>}
            </div>
            <div className="dd-payment-sum-row"><span>{t.items}</span><b>{hydrated?count:0}</b></div>
            <div className="dd-payment-sum-row"><span>{t.subtotal}</span><b>{money(displayedTotal,locale)}</b></div>
            <div className="dd-payment-sum-row"><span>{t.fee}</span><b>{t.noFee}</b></div>
            <div className="dd-payment-sum-row is-total"><span>{t.total}</span><b>{money(displayedTotal,locale)}</b></div>
            <p className="dd-payment-estimated">{t.estimated}</p>
            <button className="dd-payment-primary" disabled aria-disabled="true" type="button">{t.pay}</button>
            <button className="dd-payment-secondary" type="button" onClick={goBack}>{t.back}</button>
            <div className="dd-payment-unavailable" role="status">{t.paymentsUnavailable}</div>
            <div className="dd-payment-paymob-ready">
              <span>●</span><span>{t.secureFoot}</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  </>;
}
