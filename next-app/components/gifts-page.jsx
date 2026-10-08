"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { pathFor } from "../lib/locales";
import { useCatalog } from "./live-catalog";
import { useCart, QuantityAction, money } from "./cart-provider";
import PlanningStepper from "./planning-stepper";
import { getNextPlanningStep } from "../lib/planning-flow";

const copy = {
  ar: {
    heading:"اختار الهدية اللي تشبهه فعلًا",
    intro:"استخدم الفلاتر واختار الهدية المناسبة، وتقدر تضيف أكتر من اختيار لو حابب.",
    filters:"الفلاتر", reset:"مسح الكل",types:"نوع الهدية",
    recipients:"لمن الهدية؟",price:"السعر",all:"الكل",
    categories:[["all","الكل"],["silver","فضة"],["watch","ساعات"],["perfume","برفانات"],["flowers","ورد"],["box","Gift Boxes"]],
    recipientsList:[["all","أي شخص"],["her","لها"],["him","له"],["both","للإثنين"]],
    prices:[["all","الكل"],["low","أقل من 1,000"],["mid","1,000–2,500"],["high","أكثر من 2,500"]],
    curated:"مختارات Dear Day",sortLabel:"ترتيب المنتجات",
    sortList:[["recommended","الأكثر مناسبة"],["priceAsc","السعر: الأقل أولًا"],["priceDesc","السعر: الأعلى أولًا"]],
    loading:"جاري تحميل الهدايا...",error:"تعذر تحميل المنتجات المنشورة حاليًا.",
    none:"مفيش نتائج بالفلاتر دي. جرّب تغيّر فلتر أو تمسح الاختيارات.",
    noStock:"لا توجد هدايا منشورة حاليًا.",
    show:"عدد الهدايا المعروضة", tag:"هدية",
    choose:"أضف للسلة",back:"رجوع",next:"حفظ والانتقال للخطوة التالية ←",
    selected:"هدايا في السلة",personalized:"قابلة للتخصيص",
    saved:"هداياك محفوظة في السلة، وتقدر تكمل ترتيب المناسبة.",
    explore:"تصفح الهدايا",
    nextHint:"الاختيارات بتفضل في السلة حتى لو انتقلت لأقسام تانية.",
    flow:["اختيار الخدمات","الهدايا","شكولاته و كيك","الأماكن والتجارب","تفاصيل المناسبة","مراجعة وحجز"]
  },
  en: {
    heading:"Choose a gift that feels like them",
    intro:"Use the filters to find the right gift for the occasion. You can add more than one if you want to build a fuller surprise.",
    filters:"Filters",reset:"Clear all",types:"Gift type",
    recipients:"Who is it for?",price:"Price",all:"All",
    categories:[["all","All"],["silver","Silver"],["watch","Watches"],["perfume","Perfume"],["flowers","Flowers"],["box","Gift Boxes"]],
    recipientsList:[["all","Anyone"],["her","For her"],["him","For him"],["both","For both"]],
    prices:[["all","All"],["low","Under EGP 1,000"],["mid","EGP 1,000–2,500"],["high","Over EGP 2,500"]],
    curated:"Dear Day Picks",sortLabel:"Sort gifts",
    sortList:[["recommended","Recommended"],["priceAsc","Price: low to high"],["priceDesc","Price: high to low"]],
    loading:"Loading gifts…",error:"Published gifts could not be loaded.",
    none:"No gifts match these filters. Try changing a filter or clearing your selections.",
    noStock:"No published gifts available yet.",
    show:"Gifts shown", tag:"Gift",
    choose:"Add to cart",back:"Back",next:"Save & continue →",
    selected:"Gifts in your cart",personalized:"Personalizable",
    saved:"Your selected gifts stay in your cart as you continue planning.",
    explore:"Browse gifts",nextHint:"Your selections stay in your cart as you browse other categories.",
    flow:["Choose services","Gifts","Chocolate & Cakes","Places & Experiences","Occasion details","Review & Book"]
  }
};

function getCategory(item) {
  const m=item.metadata || {};
  const sub=String(m.subcategory || item.meta || "").toLowerCase();
  if(["jewelry","silver","rings","bracelets","necklaces"].includes(sub))return "silver";
  if(["watches","watch"].includes(sub))return "watch";
  if(["perfumes","perfume","fragrances"].includes(sub))return "perfume";
  if(["plants","flowers","bouquets"].includes(sub))return "flowers";
  return "box";
}
function getRecipient(item) {
  const raw=item.metadata?.recipient;
  const recipients=Array.isArray(raw)?raw:(typeof raw==="string"?[raw]:[]);
  if(recipients.includes("couple") || (recipients.includes("her") && recipients.includes("him")))return "both";
  if(recipients.includes("her"))return "her";
  if(recipients.includes("him"))return "him";
  return "both";
}
function isRecipientMatch(item,recipient){
  if(recipient==="all")return true;
  const actual=getRecipient(item);
  return actual===recipient || (actual==="both"&&recipient==="both");
}
function giftInRange(item,price){
  const val=Number(item.price)||0;
  if(price==="low")return val<1000;
  if(price==="mid")return val>=1000&&val<=2500;
  if(price==="high")return val>2500;
  return true;
}
function budgetDifference(item,key) {
  const p=Number(item.price)||0;
  const bands={"under-1000":[0,1000,700],"1000-2500":[1000,2500,1750],
    "2500-5000":[2500,5000,3750],"5000-plus":[5000,Infinity,6000]};
  const band=bands[key];if(!band)return 0;
  const [min,max,target]=band;
  return p>=min&&p<=max?Math.abs(p-target):p<min?100000+min-p:100000+p-max;
}
function readPlan() {
  try {
    const p=JSON.parse(localStorage.getItem("dearDayPlan")||"{}");
    return p && typeof p==="object" && !Array.isArray(p)?p:{};
  }catch{return {};}
}
function GiftItem({item,locale,t}){
  const name=locale==="ar"?item.name_ar:item.name_en;
  const vendor=locale==="ar"?item.vendor_ar:item.vendor_en;
  const description=locale==="ar"?item.desc_ar:item.desc_en;
  const cartProduct={...item,name,ar:item.name_ar,vendor};
  const tags=Array.isArray(item.metadata?.tags)?item.metadata.tags:[];
  const tag=tags.includes("best_seller")?(locale==="ar"?"اختيار شائع":"Popular"):
    tags.includes("new")?(locale==="ar"?"جديد":"New"):t.tag;
  return <article className="dd-gifts-product">
    <div className="dd-gifts-product-media">
      {item.image?<img src={item.image} alt={name} loading="lazy"/>:
        <div className="dd-gifts-image-fallback" aria-hidden="true">Dear Day</div>}
      <span className="dd-gifts-product-tag">{tag}</span>
    </div>
    <div className="dd-gifts-product-body">
      <span className="dd-gifts-product-vendor">{vendor || "Dear Day"}</span>
      <h3>{name}</h3>
      <p>{description || (item.metadata?.personalized?t.personalized:"")}</p>
      <div className="dd-gifts-product-buy">
        <strong>{money(item.price,locale)}</strong>
        <QuantityAction product={cartProduct} locale={locale}/>
      </div>
    </div>
  </article>;
}
function FilterSet({name,items,value,onSelect}){
  return <section className="dd-gifts-filter-section">
    <h3>{name}</h3>
    <div className="dd-gifts-filter-chips" role="group" aria-label={name}>
      {items.map(([key,label])=><button
        type="button" key={key} className={"dd-gifts-chip"+(key===value?" is-active":"")}
        aria-pressed={key===value} onClick={()=>onSelect(key)}>{label}</button>)}
    </div>
  </section>;
}

export default function GiftsPage({locale="ar",flow=false}){
  const t=copy[locale] || copy.ar;
  const {rows,loading,error}=useCatalog();
  const {items,isLoaded}=useCart();
  const router=useRouter();
  const [criteria,setCriteria]=useState({category:"all",recipient:"all",price:"all"});
  const [sort,setSort]=useState("recommended");
  const [planBudget,setPlanBudget]=useState("unsure");
  const [mobileFilters,setMobileFilters]=useState(false);

  const gifts=rows.gifts||[];
  useEffect(()=>{
    const plan=readPlan();
    setPlanBudget(plan.budgetKey||plan.budget||"unsure");
  },[]);
  useEffect(()=>{
    // Only persist the choice of this step, not stale demo product data.
    if(!isLoaded)return;
    const plan=readPlan();
    const selected=items.filter(row=>row?.type==="gift").map(row=>({
      id:row.id,listing_id:row.listing_id||row.id,type:"gift",
      name:row.ar||row.name,price:Number(row.price)||0,quantity:Number(row.quantity)||1
    }));
    try{
      localStorage.setItem("dearDayPlan",JSON.stringify({
        ...plan,giftSelections:selected,products:[
          ...(Array.isArray(plan.products)?plan.products.filter(p=>p?.type!=="gift"):[]),...selected
        ]
      }));
    }catch{}
  },[items,isLoaded]);

  const filtered=useMemo(()=>{
    const selected=gifts.filter(item=>{
      return (criteria.category==="all"||getCategory(item)===criteria.category)&&
        isRecipientMatch(item,criteria.recipient)&&giftInRange(item,criteria.price);
    });
    selected.sort((a,b)=>{
      if(sort==="priceAsc")return a.price-b.price;
      if(sort==="priceDesc")return b.price-a.price;
      return budgetDifference(a,planBudget)-budgetDifference(b,planBudget)||
        (b.score||0)-(a.score||0);
    });
    return selected;
  },[gifts,criteria,sort,planBudget]);
  // The original approved catalog separates Dear Day picks from the rest.
  // Reuse that layout with published listings, never with preview-only products.
  const curatedIds=useMemo(()=>new Set([...gifts]
    .sort((a,b)=>(b.score||0)-(a.score||0)||String(a.id).localeCompare(String(b.id)))
    .slice(0,6).map(item=>item.id)),[gifts]);
  const curatedGifts=filtered.filter(item=>curatedIds.has(item.id));
  const otherGifts=filtered.filter(item=>!curatedIds.has(item.id));
  const giftCart=items.filter(x=>x.type==="gift");
  const giftCount=giftCart.reduce((n,x)=>n+Math.max(1,Number(x.quantity)||1),0);

  function reset(){setCriteria({category:"all",recipient:"all",price:"all"});setSort("recommended");}
  function proceed(){
    const plan=readPlan();
    const names=Array.isArray(plan.services)?plan.services:[];
    const next=getNextPlanningStep("gifts",names);
    router.push(pathFor(next,locale)+(flow?"?flow=1":""));
  }

  return <main id="main-content" className="dd-gifts-page" dir={locale==="ar"?"rtl":"ltr"}>
    {flow&&<PlanningStepper locale={locale} current="gifts"/>}
    <section className="dd-gifts-hero">
      <div className="dd-gifts-shell">
        <div className="dd-gifts-hero-box">
          <div className="dd-gifts-hero-image"><img src="/approved-pages/assets/media/occasion-gift.jpg" alt={locale==="ar"?"هدايا Dear Day":"Dear Day gifts"}/></div>
          <div className="dd-gifts-hero-copy">
            <h1>{t.heading}</h1><p>{t.intro}</p>
          </div>
        </div>
      </div>
    </section>
    <section className="dd-gifts-catalog">
      <div className="dd-gifts-shell">
        <button className="dd-gifts-filters-toggle" type="button" aria-expanded={mobileFilters} onClick={()=>setMobileFilters(v=>!v)}>
          <span>{t.filters}</span><span aria-hidden="true">{mobileFilters?"−":"+"}</span>
        </button>
        <div className="dd-gifts-layout">
          <aside className={"dd-gifts-filters"+(mobileFilters?" is-mobile-open":"")}>
            <div className="dd-gifts-filter-head"><strong>{t.filters}</strong><button type="button" onClick={reset}>{t.reset}</button></div>
            <FilterSet name={t.types} items={t.categories} value={criteria.category}
              onSelect={value=>setCriteria(p=>({...p,category:value}))}/>
            <FilterSet name={t.recipients} items={t.recipientsList} value={criteria.recipient}
              onSelect={value=>setCriteria(p=>({...p,recipient:value}))}/>
            <FilterSet name={t.price} items={t.prices} value={criteria.price}
              onSelect={value=>setCriteria(p=>({...p,price:value}))}/>
          </aside>
          <div className="dd-gifts-results">
            <div className="dd-gifts-toolbar">
              <div className="dd-gifts-sort">
                <label htmlFor="dd-gifts-sort">{t.sortLabel}</label>
                <select id="dd-gifts-sort" value={sort} onChange={e=>setSort(e.target.value)}>
                  {t.sortList.map(([key,label])=><option key={key} value={key}>{label}</option>)}
                </select>
              </div>
              <h2>{t.curated}</h2>
            </div>
            {loading?<p className="dd-gifts-message">{t.loading}</p>:
              error?<p className="dd-gifts-message" role="status">{t.error}</p>:
              !gifts.length?<p className="dd-gifts-message">{t.noStock}</p>:
              !filtered.length?<p className="dd-gifts-message">{t.none}</p>:
              <>
                {curatedGifts.length>0&&<section className="dd-gifts-curated-box" aria-label={t.curated}>
                  <div className="dd-gifts-grid">
                    {curatedGifts.map(item=><GiftItem key={item.id} item={item} locale={locale} t={t}/>)}
                  </div>
                </section>}
                {otherGifts.length>0&&<section className="dd-gifts-rest-section" aria-label={locale==="ar"?"كل المنتجات":"All Products"}>
                  <h3 className="dd-gifts-all-products-heading">{locale==="ar"?"كل المنتجات":"All Products"}</h3>
                  <div className="dd-gifts-rest-box">
                    <div className="dd-gifts-grid">
                      {otherGifts.map(item=><GiftItem key={item.id} item={item} locale={locale} t={t}/>)}
                    </div>
                  </div>
                </section>}
                <p className="dd-gifts-found" role="status">{t.show}: {filtered.length}</p>
              </>}
          </div>
        </div>
        <div className="dd-gifts-continue">
          <div><strong>{t.selected}: {giftCount}</strong><p>{t.nextHint}</p></div>
          <div className="dd-gifts-continue-actions">
            <button type="button" className="dd-gifts-back" onClick={()=>router.back()}>{t.back}</button>
            <button type="button" className="dd-gifts-next" onClick={proceed}>{t.next}</button>
          </div>
        </div>
      </div>
    </section>
  </main>;
}
