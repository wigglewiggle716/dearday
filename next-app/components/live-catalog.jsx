"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
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
  const [start,setStart]=useState(0);
  const {rows,loading,error}=useCatalog();
  const selected = rows[active] || [];
  const isVenue=active==="venues";
  const tabIndex=tabs.findIndex(x=>x.key===active);
  const pageSize=4;
  return <section className="dd-home-curated" id="curated-picks">
    <div className="dd-home-container">
      <div className="dd-home-curated-heading">
        <div><h2>{t.curated}</h2><p>{t.curatedNote}</p></div>
        <Link href={pathFor(tabs[tabIndex].id,locale)}>{t.viewAll} {t.categoriesShort[tabIndex]} {locale==="ar"?"←":"→"}</Link>
      </div>
      <div className="dd-home-tabs" role="tablist" aria-label={t.curated}>
        {tabs.map((tab,i) => <button key={tab.key} type="button" role="tab" aria-selected={tab.key===active}
          onClick={()=>{setActive(tab.key);setStart(0);}}>{t.categoriesShort[i]}</button>)}
      </div>
      {isVenue ? <div className="dd-catalog-venue-cta"><Link href={pathFor("venues",locale)}>{t.view} {t.categoriesShort[tabIndex]}</Link></div>
      : loading ? <p className="dd-catalog-message">{locale==="ar"?"جاري تحميل المنتجات...":"Loading products…"}</p>
      : error ? <p className="dd-catalog-message">{locale==="ar"?"تعذر تحميل المنتجات المنشورة. حاول مجددًا لاحقًا.":"Published products could not be loaded. Please try later."}</p>
      : !selected.length ? <p className="dd-catalog-message">{locale==="ar"?"لا توجد منتجات متاحة حاليًا في هذا القسم.":"No available products in this category."}</p>
      : <div className="dd-home-carousel dd-live-carousel">
        <button type="button" disabled={start===0} aria-label={locale==="ar"?"السابق":"Previous"} onClick={()=>setStart(v=>Math.max(0,v-1))}>‹</button>
        <div className="dd-home-carousel-cards">
          {selected.slice(start,start+pageSize).map(item=><ProductCard key={item.id} product={item} locale={locale}/>)}
        </div>
        <button type="button" disabled={start+pageSize>=selected.length} aria-label={locale==="ar"?"التالي":"Next"} onClick={()=>setStart(v=>Math.min(Math.max(0,selected.length-pageSize),v+1))}>›</button>
      </div>}
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
