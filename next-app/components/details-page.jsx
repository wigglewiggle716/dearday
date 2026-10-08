"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PlanningStepper from "./planning-stepper";
import { money, useCart } from "./cart-provider";
import { pathFor } from "../lib/locales";

const occasionLabels={
  birthday:{ar:"عيد ميلاد",en:"Birthday"},
  anniversary:{ar:"ذكرى سنوية",en:"Anniversary"},
  engagement:{ar:"خطوبة",en:"Engagement"},
  proposal:{ar:"طلب زواج",en:"Marriage Proposal"},
};
const aliasToKey={
  "عيد ميلاد":"birthday","birthday":"birthday",
  "ذكرى سنوية":"anniversary","anniversary":"anniversary",
  "خطوبة":"engagement","engagement":"engagement",
  "طلب زواج":"proposal","proposal":"proposal"
};
const EMPTY={occasionType:"",celebrant:"",eventDate:"",eventTime:"",notes:"",locationMode:"address",address:""};
const words={
  ar:{
    title:"تفاصيل المناسبة",sub:"أخبرنا بمزيد من التفاصيل لنجهّز لك كل شيء كما تحب.",
    visualTitle:"خلّينا ننسّق التفاصيل",
    visualText:"أضف بيانات المناسبة علشان ننسّق كل شيء بشكل مثالي ويكون يوم مميز بكل التفاصيل.",
    occasionType:"نوع المناسبة",chooseOccasion:"اختر المناسبة",
    celebrant:"الاسم أو لقب الشخص",nameHint:"مثال: أحمد",
    eventDate:"التاريخ",eventTime:"الوقت",
    notes:"ملاحظات خاصة (اختياري)",noteHint:"مثال: يحب الألوان الوردية، يفضل أن تكون المفاجأة في المساء...",
    location:"موقع المناسبة",
    selectedVenue:"في مكان محدد معنا",venueDescription:"اختر من الأماكن والتجارب المتاحة",
    otherAddress:"في عنوان آخر",addressDescription:"أضف العنوان وسننسق التوصيل",
    address:"تفاصيل العنوان",addressHint:"مثال: التجمع الخامس، القاهرة الجديدة",
    chosenVenue:"المكان المختار في خطتك",chosenVenueUnconfirmed:"المكان اختيار تخطيطي؛ الحجز والتوافر غير مؤكدين.",
    noVenue:"مفيش مكان مختار في الخطة. اختار مكان الأول أو استخدم «في عنوان آخر».",
    total:"الإجمالي الحالي",noChoices:"لا توجد اختيارات",selectedLabel:"اختيار",
    back:"رجوع: My Cart",next:"التالي: مراجعة وحجز",backShort:"رجوع",nextShort:"التالي",
    errors:{
      noCart:"السلة فاضية. أضف اختيار واحد على الأقل قبل المراجعة.",
      required:"من فضلك اختار نوع المناسبة وأكمل الاسم والتاريخ والوقت.",
      venue:"اختار مكان من صفحة الأماكن والتجارب أو استخدم عنوانًا آخر."
    }
  },
  en:{
    title:"Occasion details",sub:"Tell us a little more so we can keep every part of the day coordinated.",
    visualTitle:"Let’s bring the details together",
    visualText:"Add the key occasion details so everything stays coordinated from your selections through to the final booking review.",
    occasionType:"Occasion type",chooseOccasion:"Choose an occasion",
    celebrant:"Name or nickname",nameHint:"For example: Ahmed",
    eventDate:"Date",eventTime:"Time",
    notes:"Special notes (optional)",noteHint:"For example: They love pink tones and prefer an evening surprise...",
    location:"Occasion location",
    selectedVenue:"At a place selected with Dear Day",venueDescription:"Use the place or experience already in your plan.",
    otherAddress:"At another address",addressDescription:"Add the address and we will keep it with the order details.",
    address:"Address details",addressHint:"For example: Fifth Settlement, New Cairo",
    chosenVenue:"Selected place in your plan",chosenVenueUnconfirmed:"This is a planning selection, not a confirmed reservation.",
    noVenue:"No venue selected yet. Choose one from Places & Experiences or use another address.",
    total:"Current total",noChoices:"No selections yet",selectedLabel:"selection",
    back:"Back: My Cart",next:"Next: Review & Book",backShort:"Back",nextShort:"Next",
    errors:{
      noCart:"Your cart is empty. Add at least one selection before review.",
      required:"Please complete the occasion type, name, date and time.",
      venue:"Select a place from Places & Experiences or use another address."
    }
  }
};
function readPlan(){
  try{
    const plan=JSON.parse(localStorage.getItem("dearDayPlan")||"{}");
    return plan&&typeof plan==="object"&&!Array.isArray(plan)?plan:{};
  }catch{return {};}
}
function inferOccasion(value){
  const str=String(value||"").trim();
  return occasionLabels[str]?str:aliasToKey[str.toLowerCase()]||"";
}
function initialFields(plan,hasVenue){
  const old=plan.eventDetails&&typeof plan.eventDetails==="object"?plan.eventDetails:{};
  const priorVenue=Array.isArray(plan.venueSelections)&&plan.venueSelections.length>0;
  return {
    occasionType:inferOccasion(old.occasionType||plan.occasionKey||plan.occasion),
    celebrant:String(old.celebrant||""),
    eventDate:String(old.eventDate||plan.date||""),
    eventTime:String(old.eventTime||""),
    notes:String(old.notes||""),
    locationMode:old.locationMode==="selected"||old.locationMode==="address"?
      old.locationMode:(hasVenue||priorVenue?"selected":"address"),
    address:String(old.address||"")
  };
}
function saveDetails(fields,items){
  const plan=readPlan();
  const clean={...fields};
  const occasionKey=clean.occasionType||plan.occasionKey||"";
  const occasion=occasionLabels[occasionKey]?.ar || plan.occasion || occasionKey;
  // Update only the two cart-backed product lists. Preserve the planned
  // preview venue (venues are deliberately excluded from the commerce cart),
  // and keep the customer's selected services and custom experience intact.
  const giftSelections=items.filter(x=>x.type==="gift").map(x=>({...x,img:x.image||""}));
  const cakeSelections=items.filter(x=>x.type==="cake").map(x=>({...x,img:x.image||""}));
  const next={
    ...plan,
    occasionKey,occasion,occasionLabel:occasion,
    eventDetails:clean,
    giftSelections,cakeSelections
  };
  try{localStorage.setItem("dearDayPlan",JSON.stringify(next));}catch{}
  return next;
}
function DetailIcon({name}){
  const common={viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",
    strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":"true",className:"dd-details-icon"};
  const draw={
    calendar:<><path d="M7 3v3M17 3v3M4.5 9h15M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V7A1.5 1.5 0 0 1 5 5.5Z"/></>,
    person:<><circle cx="12" cy="8" r="3.2"/><path d="M5.5 20c.6-4 3-6 6.5-6s5.9 2 6.5 6"/></>,
    clock:<><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3.2 2"/></>,
    edit:<><path d="M4.5 19.5l3.8-.8L18.7 8.3a2 2 0 0 0-2.8-2.8L5.5 15.9l-1 3.6Z"/><path d="m14.8 6.6 2.6 2.6"/></>,
    pin:<><path d="M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/></>,
    building:<><path d="M4 20h16M6 20V8h12v12M9 11h2M13 11h2M9 15h2M13 15h2M8 8l4-4 4 4"/></>,
    house:<><path d="m3.5 11 8.5-7 8.5 7M5.5 10v10h13V10M9.5 20v-6h5v6"/></>
  };
  return <svg {...common}>{draw[name]||draw.pin}</svg>;
}
function FormField({id,title,icon,children,full=false}){
  return <div className={"dd-details-field"+(full?" is-full":"")}>
    <label htmlFor={id}>{title}</label>
    <div className="dd-details-control">
      <span className="dd-details-control-icon"><DetailIcon name={icon}/></span>
      {children}
    </div>
  </div>;
}
export default function DetailsPage({locale="ar",flow=false}){
  const t=words[locale]||words.ar;
  const router=useRouter();
  const {items,isLoaded,total}=useCart();
  const [details,setDetails]=useState(EMPTY);
  const [hydrated,setHydrated]=useState(false);
  const [plannedVenue,setPlannedVenue]=useState(null);
  const [feedback,setFeedback]=useState("");
  const notesRef=useRef(null);
  const refs=useRef({});
  const feedbackRef=useRef(null);
  useEffect(()=>{
    if(!isLoaded)return;
    const plan=readPlan();
    const venue=Array.isArray(plan.venueSelections)?plan.venueSelections.find(v=>v&&v.id):null;
    const old=initialFields(plan,items.some(x=>x.type==="venue"));
    setDetails(old);
    setPlannedVenue(venue||null);
    setHydrated(true);
  },[isLoaded]);
  useEffect(()=>{
    if(!hydrated)return;
    // Also persist prefilled fields from the homepage/planning flow.
    saveDetails(details,items);
  },[hydrated,details,items]);
  useEffect(()=>{
    const el=notesRef.current;
    if(!el)return;
    el.style.height="auto";
    el.style.height=Math.max(78,el.scrollHeight)+"px";
  },[details.notes,hydrated]);

  function update(name,value){
    const next={...details,[name]:value};
    setDetails(next);
    setFeedback("");
    // Synchronous write keeps edits when changing language or navigating away.
    if(hydrated)saveDetails(next,items);
  }
  const venue=plannedVenue||items.find(x=>x.type==="venue")||null;
  function invalid(key,msg){
    setFeedback(msg);
    setTimeoutFocus(key);
  }
  function setTimeoutFocus(key){
    requestAnimationFrame(()=>{
      const el=refs.current[key]||feedbackRef.current;
      el?.focus();
      el?.scrollIntoView({behavior:"smooth",block:"center"});
    });
  }
  function continueToReview(event){
    event?.preventDefault();
    if(!hydrated)return;
    saveDetails(details,items);
    const missing=["occasionType","celebrant","eventDate","eventTime"].find(k=>!String(details[k]||"").trim());
    if(missing){invalid(missing,t.errors.required);return;}
    if(!items.length){invalid(null,t.errors.noCart);return;}
    if(details.locationMode==="selected"&&!venue){invalid(null,t.errors.venue);return;}
    router.push(pathFor("review",locale)+(flow?"?flow=1":""));
  }
  function goBack(){
    if(hydrated)saveDetails(details,items);
    router.push(pathFor("cart",locale)+(flow?"?flow=1":""));
  }
  function choosePlace(){
    if(hydrated)saveDetails(details,items);
    router.push(pathFor("venues",locale)+(flow?"?flow=1":""));
  }
  const mini=items.slice(0,4);
  return <>
    {flow&&<PlanningStepper locale={locale} current="details"/>}
    <section className="dd-details-page" dir={locale==="ar"?"rtl":"ltr"}>
      <div className="dd-details-shell">
        <main id="main-content" className="dd-details-main">
          {locale==="ar"&&<section className="dd-details-visual" aria-labelledby="dd-details-visual-heading">
            <img src="/approved-pages/assets/media/birthday-hero.jpg" alt=""/>
            <div className="dd-details-visual-copy">
              <h1 id="dd-details-visual-heading">{t.visualTitle}</h1>
              <p>{t.visualText}</p>
            </div>
          </section>}
          <form id="dd-details-form" noValidate onSubmit={continueToReview}
            className="dd-details-form">
            <div className="dd-details-section-head">
              <span className="dd-details-calendar"><DetailIcon name="calendar"/></span>
              <div><h2>{t.title}</h2><p>{t.sub}</p></div>
            </div>
            <div className="dd-details-fields">
              <FormField id="dd-details-occasion" title={t.occasionType} icon="calendar">
                <select id="dd-details-occasion" value={details.occasionType}
                  ref={el=>{refs.current.occasionType=el;}}
                  onChange={e=>update("occasionType",e.target.value)} required>
                  <option value="">{t.chooseOccasion}</option>
                  {Object.entries(occasionLabels).map(([key,labels])=>
                    <option value={key} key={key}>{labels[locale]}</option>)}
                </select>
              </FormField>
              <FormField id="dd-details-celebrant" title={t.celebrant} icon="person">
                <input id="dd-details-celebrant" type="text" maxLength={150}
                  ref={el=>{refs.current.celebrant=el;}}
                  value={details.celebrant} onChange={e=>update("celebrant",e.target.value)}
                  placeholder={t.nameHint} autoComplete="off" required/>
              </FormField>
              <FormField id="dd-details-date" title={t.eventDate} icon="calendar">
                <input id="dd-details-date" type="date" required
                  ref={el=>{refs.current.eventDate=el;}}
                  value={details.eventDate} onChange={e=>update("eventDate",e.target.value)}/>
              </FormField>
              <FormField id="dd-details-time" title={t.eventTime} icon="clock">
                <input id="dd-details-time" type="time" required
                  ref={el=>{refs.current.eventTime=el;}}
                  value={details.eventTime} onChange={e=>update("eventTime",e.target.value)}/>
              </FormField>
              <FormField id="dd-details-notes" title={t.notes} icon="edit" full>
                <textarea id="dd-details-notes" ref={notesRef}
                  rows={3} maxLength={2000} placeholder={t.noteHint}
                  value={details.notes} onChange={e=>update("notes",e.target.value)}/>
              </FormField>
            </div>
            <div className="dd-details-location">
              <h3><DetailIcon name="pin"/>{t.location}</h3>
              <div className="dd-details-location-grid" role="radiogroup" aria-label={t.location}>
                <label className={"dd-details-location-card"+(details.locationMode==="selected"?" is-selected":"")}>
                  <input name="dd-details-location" type="radio" value="selected"
                    checked={details.locationMode==="selected"}
                    onChange={()=>update("locationMode","selected")}/>
                  <span className="dd-details-location-icon"><DetailIcon name="building"/></span>
                  <span className="dd-details-location-copy">
                    <strong>{t.selectedVenue}</strong>
                    <small>{t.venueDescription}</small>
                  </span>
                </label>
                <label className={"dd-details-location-card"+(details.locationMode==="address"?" is-selected":"")}>
                  <input name="dd-details-location" type="radio" value="address"
                    checked={details.locationMode==="address"}
                    onChange={()=>update("locationMode","address")}/>
                  <span className="dd-details-location-icon"><DetailIcon name="house"/></span>
                  <span className="dd-details-location-copy">
                    <strong>{t.otherAddress}</strong>
                    <small>{t.addressDescription}</small>
                  </span>
                </label>
              </div>
              {details.locationMode==="selected"?(venue?
                <div className="dd-details-venue-hint">
                  <div>
                    <strong>{t.chosenVenue}: {venue.name||venue.ar||""}</strong>
                    <span>{t.chosenVenueUnconfirmed}</span>
                  </div>
                  <button type="button" onClick={choosePlace}>{locale==="ar"?"تغيير المكان":"Change place"}</button>
                </div>:
                <div className="dd-details-venue-hint">
                  <span>{t.noVenue}</span>
                  <button type="button" onClick={choosePlace}>{locale==="ar"?"اختيار مكان":"Choose a place"}</button>
                </div>):null}
              <div className="dd-details-address-wrap">
                <FormField id="dd-details-address" title={t.address} icon="pin" full>
                  <input id="dd-details-address" type="text" maxLength={350}
                    placeholder={t.addressHint}
                    value={details.address} onChange={e=>update("address",e.target.value)}/>
                </FormField>
              </div>
            </div>
          </form>
          {locale==="en"&&<section className="dd-details-visual" aria-labelledby="dd-details-visual-heading">
            <img src="/approved-pages/assets/media/birthday-hero.jpg" alt=""/>
            <div className="dd-details-visual-copy">
              <h1 id="dd-details-visual-heading">{t.visualTitle}</h1>
              <p>{t.visualText}</p>
            </div>
          </section>}
        </main>
        <div className="dd-details-action-dock">
          <button type="button" className="dd-details-back" onClick={goBack}>
            <span className="dd-details-long">{t.back}</span><span className="dd-details-short">{t.backShort}</span>
          </button>
          <div className="dd-details-mini">
            {mini.length?mini.map(x=><div className="dd-details-mini-item" key={x.key}>
              <span>{x.image?<img src={x.image} alt=""/>:
                (x.type==="gift"?"🎁":x.type==="cake"?"🎂":x.type==="flower"?"🌷":"♡")}</span>
              <div><small>{locale==="ar"?x.ar||x.name:x.name||x.ar}</small><strong>{money(x.price,locale)}</strong></div>
            </div>):<span>{t.noChoices}</span>}
          </div>
          <div className="dd-details-total">
            <small>{t.total}</small><strong>{money(total,locale)}</strong>
          </div>
          <button type="submit" form="dd-details-form" className="dd-details-next">
            <span className="dd-details-long">{t.next}</span><span className="dd-details-short">{t.nextShort}</span>
          </button>
        </div>
        {feedback&&<p className="dd-details-feedback" ref={feedbackRef} tabIndex={-1} role="alert">{feedback}</p>}
      </div>
    </section>
  </>;
}
