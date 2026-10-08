"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PlanningStepper from "./planning-stepper";
import { useCart, money } from "./cart-provider";
import { pathFor } from "../lib/locales";

// Based on the currently published review.html and review-en.html
// (production commit 5d97cc458910279646ec10a18ffecaca81a6854d).
// No payment, order confirmation, or partner reservation action is triggered.
const names={
  ar:{
    steps:["الاختيارات","تفاصيل المناسبة","مراجعة الحجز","الدفع"],
    eyebrow:"مراجعة الحجز",title:"راجع يومك قبل الدفع",
    directTitle:"راجع منتجاتك قبل الدفع",directDescription:"راجع المنتجات والكميات والأسعار قبل المتابعة لبيانات الدفع. مش مطلوب تدخل تفاصيل مناسبة كاملة.",backCart:"الرجوع للسلة",
    description:"تأكد من تفاصيل المناسبة واختياراتك والأسعار. لو محتاج تعدّل أي حاجة، تقدر ترجع لها قبل الانتقال للدفع.",
    fields:"تفاصيل المناسبة",editFields:"تعديل التفاصيل",cart:"اختياراتك",editCart:"تعديل الاختيارات",
    summary:"ملخص الحجز",items:"عدد العناصر",subtotal:"قيمة الاختيارات",fee:"رسوم الخدمة",total:"الإجمالي",
    pay:"متابعة لصفحة الدفع",back:"الرجوع لتفاصيل المناسبة",
    secure:"لن يتم خصم أي مبلغ قبل خطوة الدفع وتأكيد الطلب.",
    paymentPaused:"تقدر تراجع صفحة الدفع والبيانات، لكن الدفع الإلكتروني وإنشاء الحجز لسه غير مفعّلين في نسخة React.",
    consentBefore:"أوافق على ",terms:"الشروط والأحكام",consentMiddle:" و",refunds:"سياسة الإلغاء والاسترداد",consentAfter:" قبل المتابعة للدفع.",
    detailLabels:{occasion:"المناسبة",name:"الاسم أو اللقب",date:"التاريخ",time:"الوقت",budget:"الميزانية التقريبية",location:"المكان / العنوان",notes:"ملاحظات خاصة"},
    empty:"لا توجد عناصر في السلة حاليًا. ارجع إلى My Cart وأضف اختياراتك.",
    addProducts:"تصفح المنتجات",noDetails:"تفاصيل المناسبة لسه ناقصة. كمّل الاسم والتاريخ والوقت قبل المراجعة.",
    example:"عنصر توضيحي — التوافر والسعر النهائي غير مؤكدين.",unconfirmedPlace:"المكان في الخطة فقط — الحجز غير مؤكد.",
    locationFallback:"مكان مختار",noInfo:"—",
    kinds:{gift:"هدية",cake:"شكولاته و كيك",flower:"ورد",venue:"مكان وتجربة"},
    estimated:"قيمة توضيحية غير نهائية",noCharges:"رسوم الخدمة النهائية لم تُحدَّد بعد.",
    progress:"مراحل الحجز",
    legalPreview:"الموافقة دي للمعاينة فقط؛ مش هتتسجل كموافقة حجز قبل تفعيل الدفع.",
    budgetLabels:{"under-1000":"أقل من 1,000","1000-2500":"1,000–2,500","2500-5000":"2,500–5,000","5000-plus":"5,000+","unsure":"لسه مش محدد"},
    occasionLabels:{birthday:"عيد ميلاد",anniversary:"ذكرى سنوية",engagement:"خطوبة",proposal:"طلب زواج"}
  },
  en:{
    steps:["Selections","Occasion Details","Review & Book","Payment"],
    eyebrow:"Review & Book",title:"Review everything before payment",
    directTitle:"Review your items before payment",directDescription:"Check your products, quantities and prices before entering billing details. A complete occasion plan is not required.",backCart:"Back to Cart",
    description:"Check the occasion details, your selections, note and total. You can still edit anything before continuing to payment.",
    fields:"Occasion details",editFields:"Edit details",cart:"Your selections",editCart:"Edit selections",
    summary:"Booking summary",items:"Items",subtotal:"Selections subtotal",fee:"Service fee",total:"Total",
    pay:"Preview Payment Step",back:"Back to Occasion Details",
    secure:"No payment will be taken until the payment step and final order confirmation.",
    paymentPaused:"You can preview the payment page, but online payment and order creation are not enabled in this React version.",
    consentBefore:"I agree to the ",terms:"Terms & Conditions",consentMiddle:" and ",refunds:"Cancellation & Refunds Policy",consentAfter:" before proceeding to payment.",
    detailLabels:{occasion:"Occasion",name:"Name or nickname",date:"Date",time:"Time",location:"Location",budget:"Budget",notes:"Special notes"},
    empty:"There are no items in your cart yet. Go back to My Cart and add your selections.",
    addProducts:"Browse products",noDetails:"Your occasion details are incomplete. Add the name, date and time before review.",
    example:"Illustrative item — availability and final price are not confirmed.",unconfirmedPlace:"Planned venue only — booking not confirmed.",
    locationFallback:"Selected Dear Day place",noInfo:"—",
    kinds:{gift:"Gift",cake:"Chocolate & Cakes",flower:"Flowers",venue:"Place & Experience"},
    estimated:"Illustrative amount, not a final quote",noCharges:"The final service fee has not been determined.",
    progress:"Booking progress",
    legalPreview:"This is a preview checkbox; legal consent will only be recorded as part of a future enabled booking flow.",
    budgetLabels:{"under-1000":"Under EGP 1,000","1000-2500":"EGP 1,000–2,500","2500-5000":"EGP 2,500–5,000","5000-plus":"EGP 5,000+","unsure":"Not sure yet"},
    occasionLabels:{birthday:"Birthday",anniversary:"Anniversary",engagement:"Engagement",proposal:"Marriage Proposal"}
  }
};
function readPlan(){
  try{
    const p=JSON.parse(localStorage.getItem("dearDayPlan")||"{}");
    return p&&typeof p==="object"&&!Array.isArray(p)?p:{};
  }catch{return {};}
}
function dateText(s,locale){
  if(!s)return "—";
  try{
    const d=new Date(s+"T12:00:00");
    return isNaN(d.getTime())?s:new Intl.DateTimeFormat(locale==="ar"?"ar-EG":"en-GB",
      {day:"numeric",month:locale==="ar"?"long":"short",year:"numeric"}).format(d);
  }catch{return s;}
}
function timeText(s,locale){
  if(!s)return "—";
  const parts=s.split(":").map(Number);
  if(parts.length<2||parts[0]>23||parts[1]>59||parts.some(Number.isNaN))return s;
  const time=new Date(2000,0,1,parts[0],parts[1]);
  return new Intl.DateTimeFormat(locale==="ar"?"ar-EG":"en-US",
    {hour:"numeric",minute:"2-digit"}).format(time);
}
function briefType(type,t){return t.kinds[type]||t.kinds.gift;}
function fallbackEmoji(type){
  return type==="gift"?"🎁":type==="cake"?"🎂":type==="flower"?"💐":type==="venue"?"📍":"♡";
}
function DetailCell({label,value,full=false,alert=false}){
  return <div className={"dd-review-detail"+(full?" is-full":"")}>
    <small>{label}</small><strong>{String(value||"—")}</strong>
    {alert&&<span className="dd-review-venue-alert" role="note">{alert}</span>}
  </div>;
}
export default function ReviewPage({locale="ar",flow=false}){
  const t=names[locale]||names.ar;
  const router=useRouter();
  const {items,isLoaded,total,count}=useCart();
  const [plan,setPlan]=useState({});
  const [ready,setReady]=useState(false);
  const [consent,setConsent]=useState(false);
  const [editingNote,setEditingNote]=useState(false);
  const [noteDraft,setNoteDraft]=useState("");
  useEffect(()=>{
    if(!isLoaded)return;
    const stored=readPlan();
    setPlan(stored);
    setNoteDraft(typeof stored.heartMessage==="string"?stored.heartMessage:"");
    setReady(true);
  },[isLoaded]);
  const details=plan.eventDetails||{};
  const venue=Array.isArray(plan.venueSelections)?plan.venueSelections.find(x=>x?.id):null;
  const budgetKey=plan.budgetKey||plan.budget;
  const budget=t.budgetLabels[budgetKey]||plan.budgetLabel||t.noInfo;
  const occKey=details.occasionType||plan.occasionKey;
  const occasion=t.occasionLabels[occKey]||(locale==="ar"
    ?plan.occasionLabel||plan.occasion:plan.occasionLabelEn)||occKey||t.noInfo;
  const date=dateText(details.eventDate||plan.date,locale);
  const time=timeText(details.eventTime,locale);
  const venueName=venue?(locale==="ar"?venue.ar||venue.name:venue.name||venue.ar):null;
  const location=details.locationMode==="selected"
    ?venueName||t.locationFallback:details.address||plan.area||t.noInfo;
  const hasDetails=!!(occKey&&details.celebrant&&details.eventDate&&details.eventTime);
  const hasExamples=items.some(x=>x.previewOnly);
  const previewTotal=items.reduce((sum,x)=>sum+
    (Number(x.price)||0)*(x.type==="venue"?1:Math.max(1,Number(x.quantity)||1)),0);
  const subtotal=Number.isFinite(total)?total:previewTotal;
  const cells=[
    ["occasion",occasion],["name",details.celebrant],["date",date],["time",time],
    ...(locale==="ar"?[["budget",budget],["location",location]]:[["location",location],["budget",budget]])
  ];
  const status=[
    [t.detailLabels.occasion,occasion],
    [t.detailLabels.date,date],
    [t.detailLabels.budget,budget],
    [t.detailLabels.time,time]
  ];
  const go=(slug)=>router.push(pathFor(slug,locale)+(flow?"?flow=1":""));
  function saveHeart(){
    const value=noteDraft.trim().slice(0,2000);
    const updated={...readPlan(),heartMessage:value};
    try{localStorage.setItem("dearDayPlan",JSON.stringify(updated));}catch{}
    setPlan(updated);setEditingNote(false);
  }
  // The original English page links "Edit note" to a signature control on
  // the old cart page. That control isn't migrated yet, so this edits the
  // same heartMessage locally without pretending a missing cart feature exists.
  const liveNote=String(plan.heartMessage||"").trim();
  return <>
    {flow&&<PlanningStepper locale={locale} current="review"/>}
    <main id="main-content" className="dd-review-page" dir={locale==="ar"?"rtl":"ltr"}>
      <div className="dd-review-wrap">
        {flow&&<nav className="dd-review-steps" aria-label={t.progress}>
          {t.steps.map((label,index)=><div key={label}
            className={"dd-review-step"+(index<2?" is-done":index===2?" is-active":"")}
            aria-current={index===2?"step":undefined}>
            <span className="dd-review-step-num">{index<2?"✓":index+1}</span>
            <span>{label}</span>
          </div>)}
        </nav>}
        <section className="dd-review-hero">
          <div className="dd-review-hero-copy">
            <span className="dd-review-eyebrow">{t.eyebrow}</span>
            <h1>{flow?t.title:t.directTitle}</h1>
            <p>{flow?t.description:t.directDescription}</p>
          </div>
          {flow&&<div className="dd-review-status">
            {status.map(([label,value],index)=><div key={index} className="dd-review-status-row">
              <span>{label}</span><b>{ready?value:"—"}</b>
            </div>)}
          </div>}
        </section>
        <div className="dd-review-layout">
          <div className="dd-review-stack">
            {flow&&<section className="dd-review-panel" aria-labelledby="dd-review-details-head">
              <div className="dd-review-panel-head">
                <h2 id="dd-review-details-head">{t.fields}</h2>
                <button type="button" className="dd-review-edit" onClick={()=>go("details")}>
                  {t.editFields}
                </button>
              </div>
              <div className="dd-review-details-grid">
                {cells.map(([key,value])=><DetailCell key={key} label={t.detailLabels[key]}
                  value={ready?value:t.noInfo}
                  alert={key==="location"&&details.locationMode==="selected"&&venue?t.unconfirmedPlace:false}/>)}
                {(locale==="en"||details.notes)&&<DetailCell full label={t.detailLabels.notes} value={details.notes||t.noInfo}/>}
              </div>
              {ready&&!hasDetails&&<p className="dd-review-inline-warning" role="status">{t.noDetails}</p>}
            </section>}
            <section className="dd-review-panel" aria-labelledby="dd-review-selections-head">
              <div className="dd-review-panel-head">
                <h2 id="dd-review-selections-head">{t.cart}</h2>
                <button className="dd-review-edit" type="button" onClick={()=>go("cart")}>
                  {t.editCart}
                </button>
              </div>
              {ready&&items.length?<div className="dd-review-items">
                {items.map((item,index)=><article key={item.key||index} className="dd-review-item">
                  <div className="dd-review-thumb">
                    {item.image?<img src={item.image} alt="" loading="lazy"/>:fallbackEmoji(item.type)}
                  </div>
                  <div className="dd-review-item-body">
                    <span className="dd-review-kind">{briefType(item.type,t)}</span>
                    <h3>{locale==="ar"?item.ar||item.name:item.name||item.ar}</h3>
                    <p>{[item.vendor,item.area,item.people,item.meta].filter(Boolean).join(" · ")}</p>
                    <small>{locale==="ar"?"الكمية: ":"Quantity: "}{item.quantity||1}</small>
                    {item.previewOnly&&<p className="dd-review-example">{t.example}</p>}
                  </div>
                  <div className="dd-review-item-price">
                    {money((Number(item.price)||0)*Math.max(1,Number(item.quantity)||1),locale)}
                  </div>
                </article>)}
              </div>:<div className="dd-review-empty">
                <p>{t.empty}</p>
                <button type="button" onClick={()=>go("gifts")}>{t.addProducts}</button>
              </div>}
              {flow&&venue&&<div className="dd-review-planned-venue">
                <span>📍</span>
                <div><strong>{venueName}</strong><p>{t.unconfirmedPlace}</p></div>
              </div>}
            </section>
            {flow&&locale==="en"&&<section className="dd-review-panel" aria-labelledby="dd-review-dear-note">
              <div className="dd-review-panel-head">
                <h2 id="dd-review-dear-note">Dear note</h2>
                <button type="button" className="dd-review-edit"
                  onClick={()=>{setNoteDraft(String(plan.heartMessage||""));setEditingNote(x=>!x);}}>
                  Edit note
                </button>
              </div>
              <div className="dd-review-heart">
                {editingNote?<form onSubmit={e=>{e.preventDefault();saveHeart();}}>
                  <label htmlFor="dd-review-heart-input">Your Dear Note</label>
                  <textarea id="dd-review-heart-input" maxLength={2000} rows={3}
                    value={noteDraft} onChange={e=>setNoteDraft(e.target.value)}
                    placeholder="Add your personal message..."/>
                  <div>
                    <button type="button" onClick={()=>setEditingNote(false)}>Cancel</button>
                    <button type="submit">Save note</button>
                  </div>
                </form>:liveNote?<blockquote>{liveNote}</blockquote>:
                  <p>No Dear Note has been added yet.</p>}
              </div>
            </section>}
          </div>
          <aside className="dd-review-panel dd-review-summary" aria-labelledby="dd-review-summary-head">
            <h2 id="dd-review-summary-head">{t.summary}</h2>
            <div className="dd-review-sum-row"><span>{t.items}</span><b>{ready?count:0}</b></div>
            <div className="dd-review-sum-row"><span>{t.subtotal}</span><b>{money(subtotal,locale)}</b></div>
            <div className="dd-review-sum-row"><span>{t.fee}</span><b>{t.noInfo}</b></div>
            <div className="dd-review-sum-row is-total"><span>{t.total}</span><b>{money(subtotal,locale)}</b></div>
            {(hasExamples||(flow&&venue))&&<p className="dd-review-estimated">{t.estimated}</p>}
            <p className="dd-review-fee-note">{t.noCharges}</p>
            <label className="dd-review-consent">
              <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>
              <span>{t.consentBefore}
                <Link href={pathFor("terms",locale)} target="_blank" rel="noopener noreferrer">{t.terms}</Link>
                {t.consentMiddle}
                <Link href={pathFor("refunds",locale)} target="_blank" rel="noopener noreferrer">{t.refunds}</Link>
                {t.consentAfter}
              </span>
            </label>
            <p className="dd-review-legal-preview">{t.legalPreview}</p>
            <button className="dd-review-primary" type="button"
              disabled={!ready||!items.length||(flow&&!hasDetails)||!consent}
              aria-disabled={!ready||!items.length||(flow&&!hasDetails)||!consent}
              onClick={()=>go("payment")}>{t.pay}</button>
            <button className="dd-review-secondary" type="button"
              onClick={()=>go(flow?"details":"cart")}>{flow?t.back:t.backCart}</button>
            <div className="dd-review-warning" role="status">
              {(!ready||!items.length)?t.empty:(flow&&!hasDetails)?t.noDetails:t.paymentPaused}
            </div>
            <p className="dd-review-secure">{t.secure}</p>
          </aside>
        </div>
      </div>
    </main>
  </>;
}
