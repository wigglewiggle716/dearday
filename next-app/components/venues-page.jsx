"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PlanningStepper from "./planning-stepper";
import PlanningFlowDock from "./planning-flow-dock";
import BrandedDropdown from "./branded-dropdown";
import { getNextPlanningStep, readPlanningServices } from "../lib/planning-flow";
import { pathFor } from "../lib/locales";
import { venuePreviews } from "../lib/venues-preview";
import { useCatalog } from "./live-catalog";

const filtersEmpty={type:"all",area:"all",atmosphere:"all",budget:"all"};
const labels={
  ar:{
    title:"أماكن لكل لحظة",
    hero:"اكتشف أماكن وتجارب تناسب أسلوبكم وتضيف لمسة خاصة ليوم ميلادهم.",
    search:"ابحث عن مكان أو تجربة...",type:"نوع المكان / التجربة",area:"المنطقة",
    atmosphere:"الأجواء",budget:"الميزانية",reset:"مسح الفلاتر",
    typeChoices:[["all","الكل"],["restaurant","مطاعم وكافيهات"],["private","أماكن خاصة"],["experience","تجارب وترفيه"]],
    areaChoices:[["all","الكل"],["الشيخ زايد","الشيخ زايد"],["التجمع الخامس","التجمع"],["الزمالك","الزمالك"],["مصر الجديدة","مصر الجديدة"],["أكتوبر","أكتوبر"]],
    atmosphereChoices:[["all","الكل"],["romantic","رومانسي"],["quiet","هادئ"],["outdoor","Outdoor"],["luxury","فاخر"]],
    budgetChoices:[["all","الكل"],["low","أقل من 1,000"],["mid","1,000–2,500"],["high","أكثر من 2,500"]],
    sort:"ترتيب الأماكن",sortChoices:[["recommended","الأكثر مناسبة"],["asc","السعر: الأقل أولًا"],["desc","السعر: الأعلى أولًا"]],
    picks:"مختارات Dear Day",more:"كل الأماكن والتجارب",
    noResults:"لا توجد نتائج لهذه الفلاتر. جرّب مسح الفلاتر أو تغيير الاختيارات.",
    current:"اختيارك الحالي",emptyCurrent:"لسه ما اخترتش مكان أو تجربة. اختار من النتائج تحت.",
    people:"أشخاص",change:"تغيير",remove:"حذف",choose:"اختيار المكان",removeChoice:"إلغاء اختيار المكان",
    favorite:"أضف للمفضلة",unfavorite:"إزالة من المفضلة",
    customTitle:"تجربة مخصصة حسب ذوقك؟",
    customCopy:"احكيلنا فكرتك، وفريق Dear Day هيراجع طلبك ويتواصل معاك.",
    customAction:"طلب تجربة مخصصة",dialogTitle:"احكي لنا عن تجربتك",
    dialogCopy:"اكتب تفاصيل تجربتك وبيانات التواصل عشان فريق خدمة العملاء يقدر يراجع الطلب ويرد عليك.",
    idea:"وصف التجربة",ideaPlaceholder:"احكي لنا عايز تعمل إيه...",
    ideaError:"اكتب فكرة التجربة الأول",expectedBudget:"ميزانية تقريبية (اختياري)",
    save:"إرسال الطلب",cancel:"إلغاء",customSaved:"تم استلام طلبك. خدمة العملاء هتراجع الفكرة وتتواصل معاك.",
    nameLabel:"اسمك",phoneLabel:"رقم الموبايل",emailLabel:"البريد الإلكتروني",sending:"جاري الإرسال...",
    requestRef:"رقم المتابعة",returning:"هنرجعك للصفحة تلقائيًا خلال ثوانٍ.",
    submitError:"حصلت مشكلة في إرسال الطلب. جرّب تاني.",invalidRequest:"راجع البيانات المدخلة.",rateLimited:"طلبات كتير اتبعتت من نفس الاتصال. جرّب لاحقًا.",
    selectedSummary:"مكان مختار في الخطة",
    customSummary:"تم إرسال طلب التجربة المخصصة",next:"حفظ ومتابعة التخطيط",
  },
  en:{
    title:"Find the right setting for the moment",
    hero:"Explore places and experiences that fit the occasion, your mood and your budget — from relaxed dinners to private settings and something a little different.",
    search:"Search places or experiences...",type:"Place / experience type",area:"Area",
    atmosphere:"Atmosphere",budget:"Budget",reset:"Clear filters",
    typeChoices:[["all","All"],["restaurant","Restaurants & Cafés"],["private","Private Places"],["experience","Experiences"]],
    areaChoices:[["all","All"],["الشيخ زايد","Sheikh Zayed"],["التجمع الخامس","New Cairo"],["الزمالك","Zamalek"],["مصر الجديدة","Heliopolis"],["أكتوبر","6th of October"]],
    atmosphereChoices:[["all","All"],["romantic","Romantic"],["quiet","Quiet"],["outdoor","Outdoor"],["luxury","Luxury"]],
    budgetChoices:[["all","All"],["low","Under 1,000"],["mid","1,000–2,500"],["high","Over 2,500"]],
    sort:"Sort places",sortChoices:[["recommended","Recommended"],["asc","Price: low to high"],["desc","Price: high to low"]],
    picks:"Dear Day Picks",more:"All Places & Experiences",
    noResults:"No places match these filters. Try changing or clearing the filters.",
    current:"Your current choice",emptyCurrent:"You haven't selected a place or experience yet. Choose one from the results below.",
    people:"guests",change:"Change",remove:"Remove",choose:"Choose place",removeChoice:"Remove selection",
    favorite:"Add to favorites",unfavorite:"Remove from favorites",
    customTitle:"Have a custom experience in mind?",
    customCopy:"Tell us what you have in mind. Our team will review the request and get in touch.",
    customAction:"Request a Custom Experience",dialogTitle:"Tell us about the experience",
    dialogCopy:"Share your experience idea and contact details so our customer care team can follow up.",
    idea:"Describe your experience",ideaPlaceholder:"Tell us what you have in mind...",
    ideaError:"Add your experience idea first",expectedBudget:"Approximate budget (optional)",
    save:"Send request",cancel:"Cancel",customSaved:"Your request has been received. Our customer care team will review it and get in touch.",
    nameLabel:"Your name",phoneLabel:"Mobile number",emailLabel:"Email address",sending:"Sending...",
    requestRef:"Request reference",returning:"Returning you to the page in a few seconds.",
    submitError:"Could not send your request. Please try again.",invalidRequest:"Please review your details.",rateLimited:"Too many requests from this connection. Try again later.",
    selectedSummary:"Selected place in your plan",
    customSummary:"Custom experience request submitted",next:"Save & continue planning",
  }
};
function readPlan() {
  try { const p=JSON.parse(localStorage.getItem("dearDayPlan")||"{}");return p&&typeof p==="object"&&!Array.isArray(p)?p:{}; }
  catch{return {};}
}
function budgetDistance(price,budget) {
  const p=Number(price)||0;
  const bands={"under-1000":[0,1000,700],"1000-2500":[1000,2500,1750],"2500-5000":[2500,5000,3750],"5000-plus":[5000,Infinity,6000]};
  const band=bands[budget];if(!band)return 0;
  const [min,max,target]=band;
  return p>=min&&p<=max?Math.abs(p-target):p<min?100000+min-p:100000+p-max;
}
const currency=n=>"EGP "+new Intl.NumberFormat("en-US",{maximumFractionDigits:0}).format(Number(n)||0);
function FilterGroup({name,choices,value,onChange}) {
  return <section className="dd-venues-filter-group">
    <h3>{name}</h3>
    <div className="dd-venues-chips" role="group" aria-label={name}>
      {choices.map(([key,label])=><button key={key} type="button"
        className={"dd-venues-chip"+(key===value?" is-active":"")}
        aria-pressed={key===value} onClick={()=>onChange(key)}>{label}</button>)}
    </div>
  </section>;
}
function VenueCard({venue,locale,t,isSelected,isFavorite,onSelect,onFavorite}) {
  const title=venue.name;
  const desc=locale==="ar"?venue.ar:venue.descEn;
  const area=locale==="ar"?venue.area:venue.areaEn;
  return <article className={"dd-venues-card"+(isSelected?" is-selected":"")} id={"dd-venue-"+venue.id}>
    <div className="dd-venues-card-media">
      <img src={venue.img} alt={desc||title} loading="lazy"/>
      <button type="button" className={"dd-venues-favorite"+(isFavorite?" is-active":"")}
        aria-label={isFavorite?t.unfavorite:t.favorite} aria-pressed={isFavorite}
        onClick={()=>onFavorite(venue.id)}>{isFavorite?"♥":"♡"}</button>
    </div>
    <div className="dd-venues-card-body">
      <h4>{title}</h4>
      <p>{desc}</p>
      <div className="dd-venues-card-meta">
        <span><span aria-hidden="true">⌖ </span>{area}</span>
        <span><span aria-hidden="true">♙ </span>{venue.people}</span>
        <span><span aria-hidden="true">★ </span>{venue.rating}</span>
      </div>
      <div className="dd-venues-card-buy">
        <strong>{currency(venue.price)}</strong>
        <button type="button" className="dd-venues-card-select"
          aria-label={isSelected?t.removeChoice:t.choose}
          aria-pressed={isSelected} onClick={()=>onSelect(venue.id)}>
          {isSelected?"✓":"+"}
        </button>
      </div>
    </div>
  </article>;
}
export default function VenuesPage({locale="ar",flow=false,standalone=false,incoming=null}){
  const router=useRouter();
  const t=labels[locale]||labels.ar;
  const {rows:liveCatalog}=useCatalog();
  // Published venues take priority over legacy showcase previews. Showcase
  // entries stay explicitly nonbookable and are never used in live bundles.
  const venues=useMemo(()=>{
    const published=liveCatalog.venues||[];
    if(!published.length)return venuePreviews;
    return published.map(item=>{
      const m=item.metadata||{};
      return {
        id:item.id,listing_id:item.listing_id,partner_id:item.partner_id,
        name:locale==="ar"?item.name_ar:item.name_en,
        ar:item.desc_ar,descEn:item.desc_en,img:item.image||"/approved-pages/assets/media/venue-01.jpg",
        price:item.price,area:m.area||m.district||"",areaEn:m.area_en||m.district_en||m.area||"",
        people:m.capacity||m.guests||"—",rating:m.rating||"—",
        type:m.venue_type|| (m.kind==="experience"?"experience":"restaurant"),
        atmosphere:m.atmosphere||"",meta:item.vendor_ar||"",metaEn:item.vendor_en||"",
        isPick:!!item.score,previewOnly:false,bookingConfirmed:false
      };
    });
  },[liveCatalog.venues,locale]);
  const [filters,setFilters]=useState(filtersEmpty);
  const [sort,setSort]=useState("recommended");
  const [search,setSearch]=useState("");
  const [budgetKey,setBudgetKey]=useState("unsure");
  const [selectedId,setSelectedId]=useState(null);
  const [custom,setCustom]=useState(null);
  const [hydrated,setHydrated]=useState(false);
  const [favorites,setFavorites]=useState([]);
  const [customIdea,setCustomIdea]=useState("");
  const [customBudget,setCustomBudget]=useState("");
  const [ideaError,setIdeaError]=useState(false);
  const [requestName,setRequestName]=useState("");
  const [requestPhone,setRequestPhone]=useState("");
  const [requestEmail,setRequestEmail]=useState("");
  const [requestPending,setRequestPending]=useState(false);
  const [requestResult,setRequestResult]=useState(null);
  const closeTimer=useRef(null);
  const [mobileFilterOpen,setMobileFilterOpen]=useState(false);
  const dialog=useRef(null);
  useEffect(()=>()=>{if(closeTimer.current)clearTimeout(closeTimer.current);},[]);

  useEffect(()=>{
    let saved=standalone?{}:readPlan();
    if(incoming&&typeof incoming==="string"&&incoming.length<30000){
      try{const from=JSON.parse(incoming);if(from&&typeof from==="object"&&!Array.isArray(from))saved={...saved,...from};}catch{}
    }
    const old=Array.isArray(saved.venueSelections)?saved.venueSelections:[];
    // Previous English preview used four different IDs; keep prior selections
    // when switching languages, without changing the shared product identities.
    const legacyId={"dummy-rooftop":"dummy-rooftop-zayed","dummy-bistro":"dummy-quiet-heliopolis",
      "dummy-cinema":"dummy-experience-october","dummy-studio":"dummy-private-zamalek"};
    const savedId=legacyId[old[0]?.id]||old[0]?.id;
    const match=venues.find(v=>v.id===savedId);
    setSelectedId(match?.id||null);
    const previousDraft=saved.customExperience&&typeof saved.customExperience==="object"?saved.customExperience:null;
    // Old preview builds saved custom ideas without actually sending them.
    // Never mislabel those browser-only drafts as customer-service requests.
    const cust=previousDraft&&typeof previousDraft.ticket_reference==="string"&&
      /^DD-CS-[0-9]{6,}$/.test(previousDraft.ticket_reference)?previousDraft:null;
    setCustom(cust);
    setCustomIdea(previousDraft?.idea||"");
    setCustomBudget(previousDraft?.budget?String(previousDraft.budget):"");
    setBudgetKey(saved.budgetKey||saved.budget||"unsure");
    setHydrated(true);
  },[locale,standalone,incoming,venues]);

  const selected=venues.find(v=>v.id===selectedId)||null;
  useEffect(()=>{
    if(!hydrated)return;
    // Preserve products and gifts already in the customer plan.
    // Sample venue preview is *not* a live listing and stays OUT of the paid cart.
    const before=readPlan();
    const preview=selected?{
      ...selected,name_ar:selected.name,name_en:selected.name,
      description_ar:selected.ar,description_en:selected.descEn,
      previewOnly:!!selected.previewOnly,bookingConfirmed:false
    } : null;
    const next={...before,venueSelections:preview?[preview]:[],customExperience:custom||null};
    try{localStorage.setItem("dearDayPlan",JSON.stringify(next));window.dispatchEvent(new Event("ddplanchange"));}catch{}
  },[hydrated,selectedId,custom,locale]);

  const filtered=useMemo(()=>{
    const q=search.trim().toLowerCase();
    const arr=venues.map((v,index)=>({...v,order:index})).filter(v=>{
      if(filters.type!=="all"&&v.type!==filters.type)return false;
      if(filters.area!=="all"&&v.area!==filters.area)return false;
      if(filters.atmosphere!=="all"&&v.atmosphere!==filters.atmosphere)return false;
      if(filters.budget==="low"&&v.price>=1000)return false;
      if(filters.budget==="mid"&&(v.price<1000||v.price>2500))return false;
      if(filters.budget==="high"&&v.price<=2500)return false;
      if(q&&![v.name,v.ar,v.descEn,v.area,v.areaEn].join(" ").toLowerCase().includes(q))return false;
      return true;
    });
    arr.sort((a,b)=>sort==="asc"?a.price-b.price:sort==="desc"?b.price-a.price:
      budgetDistance(a.price,budgetKey)-budgetDistance(b.price,budgetKey)||a.order-b.order);
    return arr;
  },[venues,search,filters,sort,budgetKey]);
  const picks=filtered.filter(v=>v.isPick);
  const rest=filtered.filter(v=>!v.isPick);

  function choose(id){
    setSelectedId(id===selectedId?null:id);
  }
  function scrollToSelection(){
    if(!selectedId)return;
    setFilters(filtersEmpty);setSearch("");
    requestAnimationFrame(()=>document.getElementById("dd-venue-"+selectedId)?.scrollIntoView({behavior:"smooth",block:"center"}));
  }
  function reset(){setFilters(filtersEmpty);setSearch("");}
  function openCustom(){
    if(closeTimer.current){clearTimeout(closeTimer.current);closeTimer.current=null;}
    setRequestResult(null);
    setIdeaError(false);
    dialog.current?.showModal();
  }
  function closeCustom(){
    if(requestPending)return;
    if(closeTimer.current){clearTimeout(closeTimer.current);closeTimer.current=null;}
    dialog.current?.close();
    setRequestResult(null);
    setIdeaError(false);
  }
  async function saveCustom(event){
    event.preventDefault();
    if(requestPending||requestResult?.type==="success")return;
    const idea=customIdea.trim();
    if(idea.length<10||idea.length>4500){setIdeaError(true);return;}
    setIdeaError(false);
    setRequestPending(true);
    setRequestResult(null);
    const budgetDescription=customBudget?"Budget: EGP "+String(Number(customBudget)):"Budget not specified";
    const message=idea+"\n\n"+budgetDescription+"\nOrigin: Places & Experiences custom request";
    try{
      const response=await fetch("https://hpffdmldtdtwcaoemyso.supabase.co/functions/v1/contact-submit",{
        method:"POST",mode:"cors",cache:"no-store",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          name:requestName.trim(),phone:requestPhone.trim(),email:requestEmail.trim(),
          subject:"طلب تجربة مخصصة — Places & Experiences",
          message,locale,websiteExtra:""
        })
      });
      const result=await response.json().catch(()=>({}));
      if(!response.ok||result.ok!==true||!result.ticket_reference){
        setRequestResult({type:"error",message:response.status===429?t.rateLimited:
          response.status===400?t.invalidRequest:t.submitError});
        return;
      }
      setCustom({idea,budget:Math.max(0,Number(customBudget)||0),ticket_reference:result.ticket_reference});
      setRequestResult({type:"success",message:t.customSaved,reference:result.ticket_reference});
      if(closeTimer.current)clearTimeout(closeTimer.current);
      closeTimer.current=setTimeout(()=>{
        dialog.current?.close();setRequestResult(null);closeTimer.current=null;
      },5500);
    }catch{setRequestResult({type:"error",message:t.submitError});}
    finally{setRequestPending(false);}
  }
  function continuePlanning(){
    // All preview venues are example inventory; never present them as a
    // confirmed reservation or turn them into real cart line items.
    if(!selected&&!custom)return;
    if(flow){
      const target=getNextPlanningStep("venues",readPlanningServices());
      router.push(pathFor(target,locale)+"?flow=1");
    }
  }
  function renderCards(list) {
    return list.map(v=><VenueCard key={v.id} venue={v} locale={locale} t={t}
      isSelected={selectedId===v.id} isFavorite={favorites.includes(v.id)}
      onSelect={choose} onFavorite={id=>setFavorites(old=>old.includes(id)?old.filter(x=>x!==id):[...old,id])}/>);
  }

  return <>
    {flow&&<PlanningStepper locale={locale} current="venues"/>}
    <div className="dd-venues-page" dir={locale==="ar"?"rtl":"ltr"}>
      <div className="dd-venues-container">
        <section className="dd-venues-hero" aria-labelledby="dd-venues-hero-heading">
          <div className="dd-venues-hero-image" role="img" aria-label={t.title}/>
          <div className="dd-venues-hero-copy"><h1 id="dd-venues-hero-heading">{t.title}</h1><p>{t.hero}</p></div>
        </section>
      </div>
      <main id="main-content" className="dd-venues-shell">
        <div className="dd-venues-container">
          <div className="dd-venues-layout">
            <aside className={"dd-venues-filters"+(mobileFilterOpen?" is-mobile-open":"")} aria-label={t.search}>
              <div className="dd-venues-search">
                <input type="search" value={search} placeholder={t.search}
                  aria-label={t.search} onChange={e=>setSearch(e.target.value)}/>
                <span aria-hidden="true">⌕</span>
              </div>
              <FilterGroup name={t.type} choices={t.typeChoices} value={filters.type}
                onChange={value=>setFilters(x=>({...x,type:value}))}/>
              <FilterGroup name={t.area} choices={t.areaChoices} value={filters.area}
                onChange={value=>setFilters(x=>({...x,area:value}))}/>
              <FilterGroup name={t.atmosphere} choices={t.atmosphereChoices} value={filters.atmosphere}
                onChange={value=>setFilters(x=>({...x,atmosphere:value}))}/>
              <FilterGroup name={t.budget} choices={t.budgetChoices} value={filters.budget}
                onChange={value=>setFilters(x=>({...x,budget:value}))}/>
              <button className="dd-venues-reset" type="button" onClick={reset}>{t.reset}</button>
            </aside>
            <section className="dd-venues-results" aria-label={t.picks}>
              <div className="dd-venues-section-title">
                <h2>{locale==="ar"?<>مختارات <bdi dir="ltr">Dear Day</bdi></>:t.picks}</h2>
                <div className="dd-venues-sort">
                  <BrandedDropdown locale={locale} label={t.sort} placeholder={t.sort}
                    value={sort} onChange={setSort} options={t.sortChoices}/>
                </div>
              </div>
              {selected&&<div className="dd-venues-current">
                <h2>{t.current}</h2>
                <div className="dd-venues-current-card">
                  <img src={selected.img} alt={selected.name}/>
                  <div><small>{locale==="ar"?selected.meta:selected.metaEn}</small><h3>{selected.name}</h3>
                    <p>{locale==="ar"?selected.area:selected.areaEn} · {selected.people} {t.people} · <strong>{currency(selected.price)}</strong></p>
                  </div>
                  <div className="dd-venues-current-actions">
                    <button type="button" onClick={scrollToSelection}>{t.change}</button>
                    <button type="button" onClick={()=>choose(selected.id)}>{t.remove}</button>
                  </div>
                </div>
              </div>}
              {picks.length>0&&<section className="dd-venues-group dd-venues-picks">
                <div className="dd-venues-group-box">
                  <div className="dd-venues-grid">{renderCards(picks)}</div>
                </div>
              </section>}
              {rest.length>0&&<section className="dd-venues-group">
                <h3>{t.more}</h3>
                <div className="dd-venues-group-box">
                  <div className="dd-venues-grid">{renderCards(rest)}</div>
                </div>
              </section>}
              {filtered.length===0&&<p className="dd-venues-no-results">{t.noResults}</p>}
              <section className="dd-venues-custom">
                <img src="/approved-pages/assets/media/custom-venue.jpg" alt="" loading="lazy"/>
                <div className="dd-venues-custom-copy">
                  <h3>{t.customTitle}</h3><p>{t.customCopy}</p>
                </div>
                <button type="button" onClick={openCustom}>{t.customAction}</button>
              </section>
              {(selected||custom)&&<div className="dd-venues-plan-summary" aria-live="polite">
                <span>{selected? t.selectedSummary+": "+selected.name : t.customSummary}</span>
                {custom?.idea&&<small>{t.customSummary}: {custom.idea}</small>}
              </div>}

            </section>
          </div>
        </div>
      </main>
      {flow&&<PlanningFlowDock locale={locale} current="venues"/>}
    </div>
    <dialog className="dd-venues-dialog" ref={dialog} dir={locale==="ar"?"rtl":"ltr"}
      onCancel={event=>{
        if(requestPending){event.preventDefault();return;}
        if(closeTimer.current){clearTimeout(closeTimer.current);closeTimer.current=null;}
        setRequestResult(null);
      }}>
      <form onSubmit={saveCustom}>
        <div className="dd-venues-dialog-top">
          <h2>{t.dialogTitle}</h2>
          <button type="button" aria-label={t.cancel} disabled={requestPending} onClick={closeCustom}>×</button>
        </div>
        {requestResult?.type==="success"?<div className="dd-venues-dialog-success" role="status" aria-live="polite">
          <span aria-hidden="true">✓</span>
          <p>{requestResult.message}</p>
          <strong>{t.requestRef}: <bdi dir="ltr">{requestResult.reference}</bdi></strong>
          <small>{t.returning}</small>
          <button type="button" onClick={closeCustom}>{t.cancel}</button>
        </div>:<>
          <p>{t.dialogCopy}</p>
          <div className="dd-venues-dialog-fields">
            <label htmlFor="dd-venues-name">{t.nameLabel}</label>
            <input id="dd-venues-name" type="text" autoComplete="name" required
              minLength={2} maxLength={160} value={requestName} onChange={e=>setRequestName(e.target.value)}/>
            <label htmlFor="dd-venues-phone">{t.phoneLabel}</label>
            <input id="dd-venues-phone" type="tel" autoComplete="tel" inputMode="tel" required
              minLength={6} maxLength={40} value={requestPhone} onChange={e=>setRequestPhone(e.target.value)}/>
            <label htmlFor="dd-venues-email">{t.emailLabel}</label>
            <input id="dd-venues-email" type="email" autoComplete="email" required maxLength={254}
              value={requestEmail} onChange={e=>setRequestEmail(e.target.value)}/>
            <label htmlFor="dd-venues-idea">{t.idea}</label>
            <textarea id="dd-venues-idea" rows={4} minLength={10} maxLength={4500} required
              value={customIdea} onChange={e=>{setCustomIdea(e.target.value);setIdeaError(false);}}
              aria-invalid={ideaError||undefined} placeholder={t.ideaPlaceholder}/>
            {ideaError&&<p className="dd-venues-error" role="alert">{t.ideaError}</p>}
            <label htmlFor="dd-venues-budget">{t.expectedBudget}</label>
            <input id="dd-venues-budget" type="number" min="0" max="10000000" inputMode="numeric"
              value={customBudget} onChange={e=>setCustomBudget(e.target.value)}/>
          </div>
          {requestResult?.type==="error"&&<p className="dd-venues-error" role="alert">{requestResult.message}</p>}
          <div className="dd-venues-dialog-actions">
            <button type="button" onClick={closeCustom} disabled={requestPending}>{t.cancel}</button>
            <button type="submit" disabled={requestPending}>{requestPending?t.sending:t.save}</button>
          </div>
        </>}
      </form>
    </dialog>
  </>;
}
