"use client";

import { createContext, useContext, useEffect, useMemo, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { pathFor } from "../lib/locales";
import { loadPublicCatalog } from "../lib/catalog";
import { money, QuantityAction } from "./cart-provider";

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

const tabs=[
  {key:"gifts",id:"gifts"},
  {key:"cakes-sweets",id:"cake"},
  {key:"flowers",id:"flowers"},
  {key:"venues",id:"venues"}
];
export function CuratedCatalog({locale,t}) {
  const [active,setActive]=useState("gifts");
  const [progress,setProgress]=useState(1);
  const [atStart,setAtStart]=useState(true);
  const [atEnd,setAtEnd]=useState(false);
  const railRef=useRef(null);
  const {rows,loading,error}=useCatalog();
  const selected = rows[active] || [];
  const isVenue=active==="venues";
  const tabIndex=tabs.findIndex(x=>x.key===active);

  const updateScroll = useCallback(() => {
    const rail=railRef.current;
    if (!rail) return;
    const max=Math.max(0,rail.scrollWidth-rail.clientWidth);
    // RTL scrollLeft is negative in modern browsers; absolute distance
    // works for native LTR/RTL scrolling without changing document direction.
    const distance=Math.min(max,Math.max(0,Math.abs(rail.scrollLeft)));
    const ratio=max ? distance/max : 0;
    const visible=rail.scrollWidth ? Math.min(1,rail.clientWidth/rail.scrollWidth) : 1;
    setProgress(max ? visible+(1-visible)*ratio : 1);
    setAtStart(distance < 3);
    setAtEnd(max-distance < 3);
  },[]);

  useEffect(() => {
    const rail=railRef.current;
    if (!rail || isVenue || loading || error || !selected.length) return;
    rail.scrollTo({left:0,behavior:"instant"});
    const frame=requestAnimationFrame(updateScroll);
    window.addEventListener("resize",updateScroll,{passive:true});
    return () => {
      cancelAnimationFrame(frame);
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
          onClick={()=>{setActive(tab.key);setProgress(1);}}>{t.categoriesShort[i]}</button>)}
      </div>
      {isVenue ? <div className="dd-catalog-venue-cta"><Link href={pathFor("venues",locale)}>{t.view} {t.categoriesShort[tabIndex]}</Link></div>
      : loading ? <p className="dd-catalog-message">{locale==="ar"?"جاري تحميل المنتجات...":"Loading products…"}</p>
      : error ? <p className="dd-catalog-message">{locale==="ar"?"تعذر تحميل المنتجات المنشورة. حاول مجددًا لاحقًا.":"Published products could not be loaded. Please try later."}</p>
      : !selected.length ? <p className="dd-catalog-message">{locale==="ar"?"لا توجد منتجات متاحة حاليًا في هذا القسم.":"No available products in this category."}</p>
      : <>
        <div className="dd-home-carousel dd-live-carousel">
          <button className="dd-carousel-desktop-arrow" type="button" disabled={atStart}
            aria-label={locale==="ar"?"السابق":"Previous"} onClick={()=>scrollCard(-1)}>‹</button>
          <div className="dd-home-carousel-cards" ref={railRef}
            tabIndex={0} role="region" aria-label={t.curated}
            onScroll={updateScroll}>
            {selected.map(item=><ProductCard key={item.id} product={item} locale={locale}/>)}
          </div>
          <button className="dd-carousel-desktop-arrow" type="button" disabled={atEnd}
            aria-label={locale==="ar"?"التالي":"Next"} onClick={()=>scrollCard(1)}>›</button>
        </div>
        <div className="dd-curated-mobile-progress" aria-hidden="true">
          <span style={{width:(progress*100).toFixed(1)+"%"}}/>
        </div>
      </>}
    </div>
  </section>;
}

export function CategoryCatalogPage({locale,slug}) {
  const {rows,loading,error}=useCatalog();
  const key=slug==="cake"?"cakes-sweets":slug;
  const displayName={
    gifts:locale==="ar"?"الهدايا":"Gifts",
    cake:locale==="ar"?"شكولاته و كيك":"Chocolate & Cakes",
    flowers:locale==="ar"?"الورد":"Flowers"
  }[slug];
  const selected=rows[key]||[];
  return <main id="main-content" className="dd-main dd-catalog-page">
    <div className="dd-home-container">
      <h1>{displayName}</h1>
      {loading ? <p className="dd-catalog-message">{locale==="ar"?"جاري تحميل المنتجات...":"Loading products…"}</p>
      :error ? <p className="dd-catalog-message">{locale==="ar"?"تعذر تحميل المنتجات.":"Products are currently unavailable."}</p>
      : selected.length===0 ? <p className="dd-catalog-message">{locale==="ar"?"لا توجد منتجات متاحة حاليًا.":"No products available."}</p>
      : <div className="dd-catalog-grid">{selected.map(item=><ProductCard key={item.id} product={item} locale={locale}/>)}</div>}
    </div>
  </main>;
}
