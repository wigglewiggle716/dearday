"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import OccasionDatePicker from "./occasion-date-picker";
import BrandedDropdown from "./branded-dropdown";
import { ProductCard, useCatalog } from "./live-catalog";
import { useCart, money } from "./cart-provider";
import { pathFor } from "../lib/locales";
import { composeLivePackages, selectedServiceNames, budgetLabels } from "../lib/planning-packages";
import PlanningStepper from "./planning-stepper";
import { getNextPlanningStep } from "../lib/planning-flow";

const media="/approved-pages/assets/media/";
const occasionMedia="/approved-pages/assets/sections-20261004/";

const serviceDefs=[
  {key:"gifts",name:"هدايا",image:"occasion-gift.jpg",icon:"🎁",ar:"هدايا مميزة تناسب شخصيتهم وذوقهم",en:"Thoughtful gifts chosen for the occasion."},
  {key:"cake",name:"شكولاته و كيك",image:"cake-service.jpg",icon:"🎂",ar:"تصاميم لذيذة ومخصصة لكل الأذواق",en:"Cakes, sweets and celebration ideas."},
  {key:"flowers",name:"ورد",image:"flowers-bouquet.jpg",icon:"🌷",ar:"بوكيهات وتنسيقات ورد تناسب المناسبة والذوق",en:"Bouquets and flower arrangements for the day."},
  {key:"venues",name:"أماكن وتجارب",image:"venue-service.jpg",icon:"⌖",ar:"أماكن مختارة وتجارب لا تُنسى",en:"Places and memorable experiences."}
];
const occasionInfo={
  birthday:{
    ar:{label:"عيد ميلاد",pill:"🎂 عيد ميلاد",title1:"خلّي يوم ميلادهم",title2:"أجمل من أي سنة",description:"من الهدية والكيك للمكان وكل التفاصيل، نساعدك تصمم تجربة مميزة تعبّر عنهم فعلًا."},
    en:{label:"Birthday",pill:"🎂 Birthday",title1:"Make their birthday",title2:"truly special",description:"From the gift and cake to the place and every little detail, make their celebration feel personal."}
  },
  anniversary:{
    ar:{label:"ذكرى سنوية",pill:"♡ ذكرى سنوية",title1:"خلّي ذكراكم السنوية",title2:"يوم يتكرر في الذاكرة",description:"من الهدية والتجربة للمكان والتفاصيل الصغيرة، رتّب ذكرى سنوية تعبّر عن قصتكم."},
    en:{label:"Anniversary",pill:"♡ Anniversary",title1:"Make your anniversary",title2:"a day to remember",description:"Plan the gift, experience and meaningful details around your story."}
  },
  date_night:{
    ar:{label:"Date Night",pill:"🌙 Date Night",title1:"خلّي الـ Date Night",title2:"وقت معمول ليكم",description:"اختار المكان أو التجربة، وأضف الهدية والورد والحلويات لو حابب، وخلي كل تفاصيل الوقت ده في خطة واحدة."},
    en:{label:"Date Night",pill:"🌙 Date Night",title1:"Make date night",title2:"all about you two",description:"Choose a place or experience, then add flowers, gifts or sweets as you like."}
  },
  proposal:{
    ar:{label:"طلب زواج",pill:"💍 طلب زواج",title1:"خلّي طلب الزواج",title2:"لحظة ما تتنسيش",description:"خطّط للمفاجأة والمكان والهدية وكل التفاصيل في تجربة واحدة شخصية ومميزة."},
    en:{label:"Proposal",pill:"💍 Proposal",title1:"Make your proposal",title2:"unforgettable",description:"Plan a memorable surprise, venue and every thoughtful detail in one place."}
  }
};
const texts={
  ar:{
    select:"اختيار الخدمات",flow:["اختيار الخدمات","الهدايا","شكولاته و كيك","الأماكن والتجارب","تفاصيل المناسبة","مراجعة وحجز"],
    chosen:"المناسبة المختارة",area:"المنطقة",areaPlace:"اختر المنطقة",date:"تاريخ المناسبة",datePlace:"اختر التاريخ",
    budget:"الميزانية التقريبية",budgetAll:"غير محدد",budgetNote:"حسب ميزانيتك",
    recHeading:"باقات مقترحة ليومك",recIntro:"اختر باقة جاهزة من نفس المنتجات الحالية، وتقدر تعدّل أي عنصر بعدين.",
    recAll:"اختر من كل الباقات المقترحة، وتقدر تعدّل أي عنصر بعدين.",
    selectPackage:"اختيار الباقة",selectedPackage:"✓ تم الاختيار",packageTotal:"إجمالي الباقة",emptyPackages:"مفيش باقات في النطاق ده حاليًا.",
    packageTypes:{gift:"هدية",cake:"شكولاته و كيك",flower:"ورد",venue:"مكان أو تجربة"},
    services:"اختر ما تحتاجه",serviceHint:"يمكنك اختيار خدمة واحدة أو أكثر",
    titles:["هدايا","شكولاته و كيك","ورد","أماكن وتجارب"],suggestions:"اقتراحات مناسبة لك",
    suggestionsDesc:"بناءً على نوع المناسبة والخدمات التي اخترتها",noProducts:"لا توجد منتجات منشورة حاليًا.",
    more:"عرض المزيد ←",inspire:"محتاج أفكار أكتر؟",inspireCopy:"استكشف تجارب مناسبة واستوحي منها فكرتك الخاصة.",
    viewExperiences:"شاهد التجارب ←",selectedCount:(n)=>n? n+" "+(n===1?"عنصر مختار":"عناصر مختارة"):"لم تختر أي عناصر بعد",
    continue:"التالي: كمّل ترتيب مناسبتك",nextShort:"التالي",choose:"اختار خدمة واحدة على الأقل علشان نكمل",
    serviceImage:"صورة الخدمة",venueDisclaimer:"تقدر تستكشف الأماكن والتجارب في الخطوة التالية.",

  },
  en:{
    select:"Choose services",flow:["Choose services","Gifts","Chocolate & Cakes","Places & Experiences","Occasion Details","Review & Booking"],
    chosen:"Selected occasion",area:"Area",areaPlace:"Choose an area",date:"Occasion date",datePlace:"Choose the date",
    budget:"Estimated budget",budgetAll:"Not sure yet",budgetNote:"Based on your budget",
    recHeading:"Suggested packages for your day",recIntro:"Choose a suggested bundle and personalize every item in the next steps.",
    recAll:"Browse all suggested packages and customize them later.",
    selectPackage:"Choose package",selectedPackage:"✓ Selected",packageTotal:"Bundle total",emptyPackages:"No suggested packages for this budget yet.",
    packageTypes:{gift:"Gift",cake:"Chocolate & Cakes",flower:"Flowers",venue:"Place or experience"},
    services:"What would you like to include?",serviceHint:"Select one or more services. You can change your choices later.",
    titles:["Gifts","Chocolate & Cakes","Flowers","Places & Experiences"],suggestions:"Suggested for you",
    suggestionsDesc:"Based on your occasion and selected services",noProducts:"No published products available right now.",
    more:"View more →",inspire:"Need more inspiration?",inspireCopy:"Explore experiences and get inspired for your own celebration.",
    viewExperiences:"See experiences →",selectedCount:(n)=>n?n+" selected "+(n===1?"item":"items"):"No items selected yet",
    continue:"Next: Build your occasion",nextShort:"Next",choose:"Choose at least one service to continue",
    serviceImage:"Service image",venueDisclaimer:"Browse places and experiences in the next step.",

  }
};

const knownBudgets=["under-1000","1000-2500","2500-5000","5000-plus","unsure"];
const validOccasions=["birthday","anniversary","date_night","proposal"];
const normOccasion = value => {
  const v=String(value||"").trim();
  if(validOccasions.includes(v))return v;
  if(v==="date-night"||v==="Date Night")return "date_night";
  if(v==="ذكرى سنوية"||v==="الذكرى السنوية")return "anniversary";
  if(v==="طلب الزواج"||v==="طلب زواج")return "proposal";
  return "birthday";
};
const budgetPrice=(price,budget)=>{
  const p=Number(price)||0, bands={"under-1000":[0,1000,700],"1000-2500":[1000,2500,1750],"2500-5000":[2500,5000,3750],"5000-plus":[5000,Infinity,6000]};
  const band=bands[budget];if(!band)return 0;
  const [min,max,target]=band;
  return p>=min&&p<=max?Math.abs(p-target):p<min?100000+min-p:100000+p-max;
};
function budgetTitle(key,locale){
  if(locale==="ar")return budgetLabels[key]||budgetLabels.unsure;
  return ({"under-1000":"Under 1,000","1000-2500":"1,000–2,500","2500-5000":"2,500–5,000","5000-plus":"5,000+","unsure":"Not sure yet"})[key]||"Not sure yet";
}
function readStoredPlan(){
  try { const p=JSON.parse(localStorage.getItem("dearDayPlan")||"{}"); return p&&typeof p==="object" ? p : {}; } catch { return {}; }
}
const writePlan=(obj)=>{try{localStorage.setItem("dearDayPlan",JSON.stringify(obj));}catch{}};


function SelectionDock({t,selectedCount,chosenServices,onNext}) {
  // Place the bar in normal document flow and use CSS bottom-sticky positioning.
  // It settles naturally before the footer and does not recalculate position on
  // every scroll event (which caused the jitter when scrolling back upwards).
  const previews=chosenServices.map(x=>serviceDefs.find(s=>s.name===x)).filter(Boolean).slice(0,4);
  return <div className="dd-birthday-sticky" aria-label={t.select}>
    <div className="dd-birthday-sticky-summary">
      <div className="dd-birthday-sticky-thumbs" aria-hidden="true">
        {previews.map(service=><img key={service.key} src={media+service.image} alt=""/>)}
      </div>
      <span aria-live="polite">{t.selectedCount(selectedCount)}</span>
    </div>
    <button type="button" onClick={onNext} disabled={selectedCount===0}>
      <span className="dd-birthday-sticky-button-long">{t.continue}</span>
      <span className="dd-birthday-sticky-button-short">{t.nextShort}</span>
    </button>
  </div>;
}

export default function BirthdayPlanning({locale="ar",incoming={}}){
  const router=useRouter();
  const t=texts[locale];
  const {items:cartItems,count:cartCount,applyPackage,isLoaded:cartLoaded}=useCart();
  const {rows:catalog,loading:catalogLoading}=useCatalog();
  const [loaded,setLoaded]=useState(false);
  const [details,setDetails]=useState({occasionKey:normOccasion(incoming.occasion),area:"",date:"",budgetKey:"unsure",services:[],recommendedPackage:null});
  const [showAllSuggestions,setShowAllSuggestions]=useState(false);
  const flow=incoming.flow==="1";
  const occasion=occasionInfo[details.occasionKey]?.[locale]||occasionInfo.birthday[locale];
  const livePackages=useMemo(()=>composeLivePackages(catalog,details.occasionKey),[catalog,details.occasionKey]);
  const packageList=useMemo(()=>details.budgetKey==="unsure"?livePackages:livePackages.filter(p=>p.budget===details.budgetKey),[livePackages,details.budgetKey]);
  const selectedCount=details.services.length+cartCount;
  const preferred = useMemo(()=>{
    const candidates=[...(catalog.gifts||[]),...(catalog["cakes-sweets"]||[]),...(catalog.flowers||[])];
    candidates.sort((a,b)=>budgetPrice(a.price,details.budgetKey)-budgetPrice(b.price,details.budgetKey));
    return candidates;
  },[catalog,details.budgetKey]);
  const suggest=showAllSuggestions?preferred:preferred.slice(0,4);

  useEffect(()=>{
    const stored=readStoredPlan();
    let fromUrl={};
    if(typeof incoming.dd==="string"&&incoming.dd.length<50000) {
      try{const p=JSON.parse(incoming.dd);if(p&&typeof p==="object")fromUrl=p;}catch{}
    }
    const merged={...stored,...fromUrl};
    const occasionKey=normOccasion(incoming.occasion||merged.occasionKey||merged.occasion);
    const area=incoming.area||merged.area||"";
    const date=incoming.date||merged.date||"";
    const rawBudget=incoming.budget||merged.budgetKey||merged.budget||"unsure";
    const budgetKey=knownBudgets.includes(rawBudget)?rawBudget:"unsure";
    const services=Array.isArray(merged.services)?merged.services.filter(s=>serviceDefs.some(item=>item.name===s)): [];
    const last=merged.recommendedPackage;
    const validSelection=last&&typeof last.id==="string"&&Array.isArray(last.items)&&
      last.items.length>0&&last.items.every(x=>x?.listing_id&&x?.partner_id);
    setDetails({occasionKey,area,date,budgetKey,services,
      recommendedPackage:validSelection?last:null,packageSelections:validSelection?last.items:[]});
    setLoaded(true);
  },[incoming.dd,incoming.occasion,incoming.area,incoming.date,incoming.budget]);

  useEffect(()=>{
    if(!loaded)return;
    const previous=readStoredPlan();
    const name=occasionInfo[details.occasionKey]?.ar.label||"عيد ميلاد";
    writePlan({...previous,...details,occasion:name,occasionLabel:name,budget:details.budgetKey,budgetLabel:budgetLabels[details.budgetKey]||budgetLabels.unsure});
  },[loaded,details]);

  // If the customer comes back after publication/price/availability changed,
  // never silently reuse a previously stored bundle quote or old listing IDs.
  useEffect(()=>{
    if(!loaded||catalogLoading||!details.recommendedPackage)return;
    const saved=details.recommendedPackage;
    const current=livePackages.find(p=>p.id===saved.id);
    const valid=current&&current.items.length===saved.items?.length&&
      saved.items.every(x=>current.items.some(y=>y.type===x.type&&
        String(y.listing_id)===String(x.listing_id)&&Number(y.price)===Number(x.price)));
    if(valid)return;
    applyPackage(null);
    setDetails(prev=>({...prev,services:[],recommendedPackage:null,packageSelections:[],
      giftSelections:[],cakeSelections:[],flowerSelections:[],venueSelections:[]}));
  },[loaded,catalogLoading,livePackages,details.recommendedPackage,applyPackage,locale]);
  function updateDetails(change){
    if(change.recommendedPackage===null&&details.recommendedPackage)applyPackage(null);
    setDetails(old=>({...old,...change}));
  }
  function switchService(name){
    if(details.recommendedPackage)applyPackage(null);
    setDetails(prev=>{
      const before=prev.services;
      const services=before.includes(name)?before.filter(s=>s!==name):[...before,name];
      return {...prev,services,recommendedPackage:null,packageSelections:[],giftSelections:[],cakeSelections:[],flowerSelections:[],venueSelections:[]};
    });
  }
  function pickPackage(pkg){
    if(!cartLoaded||catalogLoading)return;
    // Same published listing IDs as the category pages; venue selection is a
    // planning preference until a real booking slot is confirmed.
    const services=selectedServiceNames(pkg);
    applyPackage(pkg);
    const selected={
      id:pkg.id,name_ar:pkg.name_ar,name_en:pkg.name_en,
      budget:pkg.budget,total:pkg.total,
      items:pkg.items.map(p=>({id:p.id,listing_id:p.listing_id,partner_id:p.partner_id,
        type:p.type,name_ar:p.name_ar,name_en:p.name_en,price:p.price,image:p.image}))
    };
    setDetails(prev=>({...prev,services,recommendedPackage:selected,packageSelections:selected.items,
      giftSelections:selected.items.filter(x=>x.type==="gift"),
      cakeSelections:selected.items.filter(x=>x.type==="cake"),
      flowerSelections:selected.items.filter(x=>x.type==="flower"),
      venueSelections:selected.items.filter(x=>x.type==="venue")}));
    const name=occasionInfo[details.occasionKey]?.ar.label||"عيد ميلاد";
    writePlan({...readStoredPlan(),...details,services,recommendedPackage:selected,packageSelections:selected.items,
      giftSelections:selected.items.filter(x=>x.type==="gift"),cakeSelections:selected.items.filter(x=>x.type==="cake"),
      flowerSelections:selected.items.filter(x=>x.type==="flower"),
      venueSelections:selected.items.filter(x=>x.type==="venue"),
      occasion:name,occasionKey:details.occasionKey,budget:details.budgetKey});
  }
  function unpickPackage(){
    applyPackage(null);
    setDetails(prev=>({...prev,services:[],recommendedPackage:null,packageSelections:[],giftSelections:[],cakeSelections:[],flowerSelections:[],venueSelections:[]}));
  }
  function moveNext(){
    if(selectedCount===0)return;
    const names=[...details.services];
    if(cartItems.some(x=>x.type==="gift")&&!names.includes("هدايا"))names.push("هدايا");
    if(cartItems.some(x=>x.type==="flower")&&!names.includes("ورد"))names.push("ورد");
    if(cartItems.some(x=>x.type==="cake")&&!names.includes("شكولاته و كيك"))names.push("شكولاته و كيك");
    if(cartItems.some(x=>x.type==="venue")&&!names.includes("أماكن وتجارب"))names.push("أماكن وتجارب");
    const next=getNextPlanningStep("plan",names);
    const previous=readStoredPlan();
    const name=occasionInfo[details.occasionKey]?.ar.label||"عيد ميلاد";
    writePlan({...previous,...details,services:names,occasion:name,occasionLabel:name,occasionKey:details.occasionKey,budget:details.budgetKey,budgetLabel:budgetLabels[details.budgetKey],
      products:cartItems.map(item=>({name:item.ar||item.name,listing_id:item.listing_id||item.id,type:item.type,quantity:item.quantity,price:item.price}))});
    router.push(pathFor(next,locale)+"?flow=1"+(details.recommendedPackage&&cartItems.length?"&fromPackage=1":""));
  }
  const heroImage=occasionMedia+"occasion-"+(details.occasionKey==="date_night"?"date-night":details.occasionKey)+".jpg";

  return <main id="main-content" className="dd-birthday-page" dir={locale==="ar"?"rtl":"ltr"}>
    {flow&&<PlanningStepper locale={locale} current="plan"/>}
    <section className="dd-birthday-hero">
      <div className="dd-birthday-hero-copy">
        <span className="dd-birthday-pill">{occasion.pill}</span>
        <h1><strong>{occasion.title1}</strong><span>{occasion.title2}</span></h1>
        <p>{occasion.description}</p>
      </div>
      <div className="dd-birthday-hero-photo" role="img" aria-label={occasion.label}
        style={{backgroundImage:"linear-gradient(90deg,rgba(255,253,251,.12),transparent 22%),url('"+heroImage+"')"}}/>
    </section>
    <section className="dd-birthday-context" aria-label={t.chosen}>
      <div className="dd-birthday-context-card">
        <div className="dd-birthday-context-title"><span>{t.chosen}</span><strong>{occasion.label}</strong></div>
        <BrandedDropdown locale={locale} label={t.area} placeholder={t.areaPlace}
          value={details.area} onChange={value=>updateDetails({area:value})}
          options={[[ "القاهرة",locale==="ar"?"القاهرة":"Cairo" ],[ "الجيزة",locale==="ar"?"الجيزة":"Giza" ]]}/>
        <OccasionDatePicker locale={locale} value={details.date} onChange={v=>updateDetails({date:v})}
          label={t.date} placeholder={t.datePlace}/>
        <BrandedDropdown locale={locale} label={t.budget} placeholder={t.budgetAll}
          value={details.budgetKey}
          onChange={value=>updateDetails({budgetKey:value,recommendedPackage:null,packageSelections:[],giftSelections:[],cakeSelections:[],venueSelections:[]})}
          options={knownBudgets.map(key=>[key,budgetTitle(key,locale)])}/>
      </div>
    </section>
    <div className="dd-birthday-main">
      <div className="dd-birthday-shell">
        <section className="dd-birthday-rec" aria-labelledby="dd-rec-title">
          <div className="dd-birthday-rec-head">
            <div><h2 id="dd-rec-title">{t.recHeading}</h2><p>{details.budgetKey==="unsure"?t.recAll:t.recIntro}</p></div>
            <span className="dd-birthday-budget-tag">{budgetTitle(details.budgetKey,locale)}</span>
          </div>
          <div className="dd-birthday-rec-grid">
            {catalogLoading?<p className="dd-birthday-products-empty">{locale==="ar"?"جاري تحميل الباقات الحقيقية…":"Loading available packages…"}</p>:packageList.length?packageList.map(pkg=>{
              const chosen=details.recommendedPackage?.id===pkg.id;
              return <article key={pkg.id} className={"dd-birthday-rec-card"+(chosen?" selected":"")}>
                <div className="dd-birthday-rec-top"><h3>{locale==="ar"?pkg.name_ar:pkg.name_en}</h3><span>{budgetTitle(pkg.budget,locale)}</span></div>
                <div className="dd-birthday-rec-items">
                  {pkg.items.map(item=><div key={item.type+":"+item.id} className="dd-birthday-rec-item">
                    <span>{t.packageTypes[item.type]} · {locale==="ar"?item.name_ar:item.name_en}</span><span>{money(item.price,locale)}</span>
                  </div>)}
                </div>
                <div className="dd-birthday-rec-bottom"><div><small>{t.packageTotal}</small><strong>{money(pkg.total,locale)}</strong></div>
                  <button type="button" className="dd-birthday-rec-btn" onClick={()=>chosen?unpickPackage():pickPackage(pkg)} disabled={!cartLoaded||catalogLoading}
                    aria-pressed={chosen}>{chosen?t.selectedPackage:t.selectPackage}</button>
                </div>
              </article>;
            }):<p>{t.emptyPackages}</p>}
          </div>
        </section>
        <section className="dd-birthday-services-section" aria-labelledby="dd-birthday-services">
          <div className="dd-birthday-section-head"><div><h2 id="dd-birthday-services">{t.services}</h2><p>{t.serviceHint}</p></div></div>
          <div className="dd-birthday-services">
            {serviceDefs.map((service,index)=>{
              const selected=details.services.includes(service.name);
              return <button className={"dd-birthday-service"+(selected?" selected":"")} type="button"
                aria-pressed={selected} key={service.key} onClick={()=>switchService(service.name)}>
                <span className="dd-birthday-service-check">{selected?"✓":""}</span>
                <span className="dd-birthday-service-icon">{service.icon}</span>
                <span className="dd-birthday-service-copy"><strong>{t.titles[index]}</strong><small>{locale==="ar"?service.ar:service.en}</small></span>
                <img src={media+service.image} alt={t.titles[index]} loading="lazy"/>
              </button>;
            })}
          </div>
        </section>
        <section className="dd-birthday-suggestions" aria-labelledby="dd-birthday-suggestions-title">
          <div className="dd-birthday-section-head">
            <div><h2 id="dd-birthday-suggestions-title">{t.suggestions}</h2><p>{t.suggestionsDesc}</p></div>
            {preferred.length>4&&<button type="button" onClick={()=>setShowAllSuggestions(v=>!v)}>{showAllSuggestions?t.services:t.more}</button>}
          </div>
          {catalogLoading?<p className="dd-birthday-products-empty">{locale==="ar"?"جاري تحميل المنتجات...":"Loading products..."}</p>
          :suggest.length?<div className="dd-birthday-product-grid">{suggest.map(item=><ProductCard key={item.id} product={item} locale={locale}/>)}</div>
          :<p className="dd-birthday-products-empty">{t.noProducts}</p>}
        </section>
        <section className="dd-birthday-inspire">
          <div className="dd-birthday-inspire-text">
            <h2>{t.inspire}</h2><p>{t.inspireCopy}</p>
            <Link href={pathFor("venues",locale)}>{t.viewExperiences}</Link>
          </div>
          <div className="dd-birthday-inspire-photos">
            <img src={media+"birthday-experience.jpg"} alt="" loading="lazy"/>
            <img src={media+"dinner-experience.jpg"} alt="" loading="lazy"/>
            <img src={media+"birthday-cake.jpg"} alt="" loading="lazy"/>
          </div>
        </section>
      </div>
    </div>
    <SelectionDock t={t} selectedCount={selectedCount} chosenServices={details.services} onNext={moveNext}/>
  </main>;
}
