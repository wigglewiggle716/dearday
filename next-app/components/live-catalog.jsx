"use client";

import { createContext, useContext, useEffect, useMemo, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { pathFor } from "../lib/locales";
import { loadPublicCatalog } from "../lib/catalog";
import { money, QuantityAction } from "./cart-provider";
import PlanningStepper from "./planning-stepper";
import { getNextPlanningStep, readPlanningServices } from "../lib/planning-flow";

const CatalogContext = createContext({ rows: {gifts:[],"cakes-sweets":[],flowers:[]}, loading:true, error:null });
export function CatalogProvider({ children }) {
  const [rows,setRows] = useState({gifts:[],"cakes-sweets":[],flowers:[]});
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState(null);
  useEffect(() => {
    let active = true;
    loadPublicCatalog().then(data => {if (active) setRows(data);})
      .catch(err => { if (active) setError(err.message || "Catalog unavailable"); })
      .finally(() => {if (active) setLoading(false);});
    return () => {active=false;};
  }, []);
  const value = useMemo(() => ({rows,loading,error}),[rows,loading,error]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}
export function useCatalog() { return useContext(CatalogContext); }

export function ProductCard({product,locale}) {
  const name=locale==="ar"?product.name_ar:product.name_en;
  const vendor=locale==="ar"?product.vendor_ar:product.vendor_en;
  const cartProduct={...product,name,ar:product.name_ar,vendor};
  return <article className="dd-product-card">
    <div className="dd-product-media">
      {product.image ? <img alt={name} src={product.image} loading="lazy"/> : <div className="dd-product-image-fallback" aria-hidden="true">Dear Day</div>}
    </div>
    <div className="dd-product-body">
      <small>{vendor || "Dear Day"}</small>
      <h3 title={name}>{name}</h3>
      <div className="dd-product-buy">
        <strong>{money(product.price,locale)}</strong>
        <QuantityAction product={cartProduct} locale={locale}/>
      </div>
    </div>
  </article>;
}

// Matches the six venue previews shown in the original homepage.
// They are showcase entries (not confirmed bookable live listings).
const originalVenuePicks = [
  {id:"terrace",name_en:"The Terrace Lounge",name_ar:"تجربة عشاء خارجية",price:2500,image:"/approved-pages/assets/media/venue-01.jpg",vendor_ar:"الشيخ زايد",vendor_en:"Sheikh Zayed",meta_ar:"مطعم وكافيهات",meta_en:"Restaurant & café",rating:4.8},
  {id:"ovio",name_en:"Ovio Restaurant",name_ar:"عشاء هادئ ومميز",price:1800,image:"/approved-pages/assets/media/venue-02.jpg",vendor_ar:"مصر الجديدة",vendor_en:"Heliopolis",meta_ar:"مطعم وكافيهات",meta_en:"Restaurant & café",rating:4.7},
  {id:"zooba",name_en:"Zooba Garden",name_ar:"جلسة جاردن خاصة",price:3200,image:"/approved-pages/assets/media/venue-03.jpg",vendor_ar:"الزمالك",vendor_en:"Zamalek",meta_ar:"مكان خاص",meta_en:"Private place",rating:4.6},
  {id:"boulud",name_en:"Café Boulud",name_ar:"تجربة عشاء أنيقة",price:2200,image:"/approved-pages/assets/media/venue-04.jpg",vendor_ar:"التجمع الخامس",vendor_en:"New Cairo",meta_ar:"مطعم وكافيهات",meta_en:"Restaurant & café",rating:4.8},
  {id:"nacelle",name_en:"Nacelle Experience",name_ar:"تجربة مسائية مختلفة",price:3500,image:"/approved-pages/assets/media/venue-05.jpg",vendor_ar:"أكتوبر",vendor_en:"6th of October",meta_ar:"تجربة وترفيه",meta_en:"Experience",rating:4.9},
  {id:"scarabeo",name_en:"Scarabeo",name_ar:"عشاء بإضاءة دافئة",price:2800,image:"/approved-pages/assets/media/venue-06.jpg",vendor_ar:"الشيخ زايد",vendor_en:"Sheikh Zayed",meta_ar:"مكان خاص",meta_en:"Private place",rating:4.7}
];

function VenuePreviewCard({ product, locale }) {
  const name=locale==="ar"?product.name_ar:product.name_en;
  const vendor=locale==="ar"?product.vendor_ar:product.vendor_en;
  const sub=locale==="ar"?product.meta_ar:product.meta_en;
  return <article className="dd-product-card dd-venue-preview">
    <div className="dd-product-media">
      <img src={product.image} alt={name} loading="lazy" />
      <span className="dd-venue-preview-tag">{locale==="ar"?"تجربة":"Experience"}</span>
    </div>
    <div className="dd-product-body">
      <small>{vendor || "Dear Day"}</small>
      <h3>{name}</h3>
      <p className="dd-venue-preview-meta">{sub} · ★ {product.rating}</p>
      <div className="dd-product-buy">
        <strong>{money(product.price,locale)}</strong>
        <Link className="dd-cart-add" href={pathFor("venues",locale)}>{locale==="ar"?"عرض التجربة":"View experience"}</Link>
      </div>
    </div>
  </article>;
}

const tabs=[
  {key:"gifts",id:"gifts"},
  {key:"cakes-sweets",id:"cake"},
  {key:"flowers",id:"flowers"},
  {key:"venues",id:"venues"}
];
export function CuratedCatalog({locale,t}) {
  const [active,setActive]=useState("gifts");
  const [progress,setProgress]=useState({fraction:0,thumb:1});
  const [atStart,setAtStart]=useState(true);
  const [atEnd,setAtEnd]=useState(false);
  const railRef=useRef(null);
  const {rows,loading,error}=useCatalog();
  const isVenue=active==="venues";
  const selected = isVenue ? originalVenuePicks : (rows[active] || []);
  const tabIndex=tabs.findIndex(x=>x.key===active);

  const updateScroll = useCallback(() => {
    const rail=railRef.current;
    if(!rail)return;
    const max=Math.max(0,rail.scrollWidth-rail.clientWidth);
    const firstCard=rail.querySelector(".dd-product-card");
    const track=rail.getBoundingClientRect();
    const first=firstCard?.getBoundingClientRect();
    // Card geometry works on iOS Safari, Chrome, LTR and RTL without assuming
    // a particular browser's signed scrollLeft convention.
    const travel=first ? (locale==="ar"
      ? first.right-track.right
      : track.left-first.left) : 0;
    const distance=Math.min(max,Math.max(0,travel));
    const fraction=max ? distance/max : 0;
    const thumb=max ? Math.max(.14,Math.min(1,rail.clientWidth/rail.scrollWidth)) : 1;
    setProgress({fraction,thumb});
    setAtStart(distance<3);
    setAtEnd(max-distance<3);
  },[locale]);

  useEffect(() => {
    const rail=railRef.current;
    if (!rail || (!isVenue && (loading || error)) || !selected.length) return;
    // Reset to first card when category changes and reevaluate after layout.
    rail.scrollTo({left:0,behavior:"instant"});
    const frame=requestAnimationFrame(updateScroll);
    const observer=typeof ResizeObserver!=="undefined" ? new ResizeObserver(updateScroll) : null;
    observer?.observe(rail);
    window.addEventListener("resize",updateScroll,{passive:true});
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize",updateScroll);
    };
  },[active,isVenue,loading,error,selected.length,updateScroll]);

  const scrollCard=(direction) => {
    const rail=railRef.current;
    if(!rail)return;
    const cards=rail.querySelectorAll(".dd-product-card");
    const gap=cards.length>1?Math.abs(cards[1].offsetLeft-cards[0].offsetLeft):rail.clientWidth/2;
    rail.scrollBy({left:(locale==="ar"?-1:1)*gap*direction,behavior:"smooth"});
  };

  return <section className="dd-home-curated" id="curated-picks">
    <div className="dd-home-container">
      <div className="dd-home-curated-heading">
        <div><h2>{t.curated}</h2><p>{t.curatedNote}</p></div>
        <Link href={pathFor(tabs[tabIndex].id,locale)}>{t.viewAll} {t.categoriesShort[tabIndex]} {locale==="ar"?"←":"→"}</Link>
      </div>
      <div className="dd-home-tabs" role="tablist" aria-label={t.curated}>
        {tabs.map((tab,i) => <button key={tab.key} type="button" role="tab" aria-selected={tab.key===active}
          onClick={()=>{setActive(tab.key);setProgress({fraction:0,thumb:1});}}>{t.categoriesShort[i]}</button>)}
      </div>
      {!isVenue && loading ? <p className="dd-catalog-message">{locale==="ar"?"جاري تحميل المنتجات...":"Loading products…"}</p>
      : !isVenue && error ? <p className="dd-catalog-message">{locale==="ar"?"تعذر تحميل المنتجات المنشورة. حاول مجددًا لاحقًا.":"Published products could not be loaded. Please try later."}</p>
      : !selected.length ? <p className="dd-catalog-message">{locale==="ar"?"لا توجد منتجات متاحة حاليًا في هذا القسم.":"No available products in this category."}</p>
      : <>
        <div className="dd-home-carousel dd-live-carousel">
          <button className="dd-carousel-desktop-arrow" type="button" disabled={atStart}
            aria-label={locale==="ar"?"السابق":"Previous"} onClick={()=>scrollCard(-1)}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {locale==="ar"?<path d="m9 5 7 7-7 7"/>:<path d="m15 5-7 7 7 7"/>}
            </svg>
          </button>
          <div className="dd-home-carousel-cards" ref={railRef}
            tabIndex={0} role="region" aria-label={t.curated}
            onScroll={updateScroll}>
            {selected.map(item=>isVenue
              ? <VenuePreviewCard key={item.id} product={item} locale={locale}/>
              : <ProductCard key={item.id} product={item} locale={locale}/>)}
          </div>
          <button className="dd-carousel-desktop-arrow" type="button" disabled={atEnd}
            aria-label={locale==="ar"?"التالي":"Next"} onClick={()=>scrollCard(1)}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {locale==="ar"?<path d="m15 5-7 7 7 7"/>:<path d="m9 5 7 7-7 7"/>}
            </svg>
          </button>
        </div>
        <div className="dd-curated-mobile-progress" aria-hidden="true">
          <span style={{
            width:(progress.thumb*100).toFixed(2)+"%",
            transform:"translate3d("+((locale==="ar"?-1:1)*84*(1-progress.thumb)*progress.fraction).toFixed(2)+"px,0,0)"
          }}/>
        </div>
      </>}
    </div>
  </section>;
}

export function CategoryCatalogPage({locale,slug,flow=false}) {
  const router=useRouter();
  const {rows,loading,error}=useCatalog();
  const key=slug==="cake"?"cakes-sweets":slug;
  const displayName={
    gifts:locale==="ar"?"الهدايا":"Gifts",
    cake:locale==="ar"?"شكولاته و كيك":"Chocolate & Cakes",
    flowers:locale==="ar"?"الورد":"Flowers"
  }[slug];
  const selected=rows[key]||[];
  const goNext=()=>router.push(pathFor(getNextPlanningStep(slug,readPlanningServices()),locale)+"?flow=1");
  return <>
    {flow&&<PlanningStepper locale={locale} current={slug}/>}
    <main id="main-content" className="dd-main dd-catalog-page">
    <div className="dd-home-container">
      <h1>{displayName}</h1>
      {loading ? <p className="dd-catalog-message">{locale==="ar"?"جاري تحميل المنتجات...":"Loading products…"}</p>
      :error ? <p className="dd-catalog-message">{locale==="ar"?"تعذر تحميل المنتجات.":"Products are currently unavailable."}</p>
      : selected.length===0 ? <p className="dd-catalog-message">{locale==="ar"?"لا توجد منتجات متاحة حاليًا.":"No products available."}</p>
      : <div className="dd-catalog-grid">{selected.map(item=><ProductCard key={item.id} product={item} locale={locale}/>)}</div>}
      {flow&&<div className="dd-planning-continue">
        <span>{locale==="ar"?"اختياراتك محفوظة في السلة":"Your selections stay in the cart"}</span>
        <button type="button" onClick={goNext}>{locale==="ar"?"حفظ ومتابعة":"Save & continue"}</button>
      </div>}
    </div>
  </main>
  </>;
}
