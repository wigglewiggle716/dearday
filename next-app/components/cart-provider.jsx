"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { dictionaries, pathFor } from "../lib/locales";

const KEY = "dearDayCart";
const CartContext = createContext(null);

function quantity(item) {
  return item?.type === "venue" ? 1 : Math.max(1, Math.floor(Number(item?.quantity) || 1));
}
function price(value) {
  return Math.max(0, Number(value) || 0);
}
function normalizeRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.filter(x => x && typeof x === "object" && typeof x.key === "string" && x.key.length < 180)
    .map(x => ({ ...x, quantity: quantity(x) }));
}
function loadRows() {
  try { return normalizeRows(JSON.parse(localStorage.getItem(KEY) || "[]")); }
  catch { return []; }
}
export function money(value, locale = "ar") {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(price(value));
}
function cartCopy(locale) {
  return locale === "en" ? {
    cart:"My Cart", empty:"Your cart is empty",browse:"Browse products",
    total:"Subtotal",details:"Cart details",close:"Close",remove:"Remove",
    viewCart:"Go to cart", decrease:"Decrease quantity",increase:"Increase quantity",
    title:"Your Cart",item:"item",
    items:"items",back:"Back to products",
    continuePlanning:"Occasion Details",reviewNow:"Review & Book"
  } : {
    cart:"سلة مشترياتي", empty:"السلة فارغة حاليًا",browse:"تصفح المنتجات",
    total:"الإجمالي",details:"تفاصيل السلة",close:"إغلاق",remove:"حذف",
    viewCart:"الانتقال للسلة",decrease:"تقليل الكمية",increase:"زيادة الكمية",
    title:"سلة مشترياتك",item:"منتج",
    items:"منتجات",back:"العودة للمنتجات",
    continuePlanning:"تفاصيل المناسبة",reviewNow:"مراجعة وحجز"
  };
}
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}
export function CartProvider({ children, locale, catalogRows }) {
  const [items, setItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setItems(loadRows());
    setIsLoaded(true);
    const sync = () => setItems(loadRows());
    window.addEventListener("storage", sync);
    window.addEventListener("ddcartchange", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("ddcartchange", sync);
    };
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  const commit = useCallback((updater) => {
    // Re-read storage on every mutation, then notify listeners AFTER updating state.
    const next = normalizeRows(updater(loadRows()));
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    setItems(next);
    window.dispatchEvent(new CustomEvent("ddcartchange", {
      detail: { count: next.reduce((n,x) => n + quantity(x), 0) }
    }));
  }, []);

  const add = useCallback((product) => {
    if (!product?.id || !product?.type || product.type === "venue") return;
    const key = product.type + ":" + String(product.id);
    commit(rows => {
      const existing = rows.find(x => x.key === key);
      if (existing) return rows.map(x => x.key === key ? { ...x, quantity: quantity(x) + 1 } : x);
      return [...rows, {
        key, type: product.type, id: String(product.id),
        listing_id: String(product.listing_id || product.id),
        partner_id: String(product.partner_id || ""),
        name: String(product.name_ar || product.name || product.name_en || ""),
        ar: String(product.name_ar || product.ar || product.name || ""),
        name_ar: String(product.name_ar || product.ar || product.name || ""),
        name_en: String(product.name_en || product.name || product.name_ar || ""),
        vendor: String(product.vendor || product.vendor_ar || product.vendor_en || ""),
        vendor_ar: String(product.vendor_ar || product.vendor || ""),
        vendor_en: String(product.vendor_en || product.vendor || ""),
        price: price(product.price),
        image: String(product.image || ""),
        meta: String(product.meta || ""),
        previewOnly: product.previewOnly === true,
        quantity: 1, addedAt: Date.now()
      }];
    });
  }, [commit]);

  // Replace only products inserted by the previously chosen package.
  // Manually added cart rows are kept, and venue reservations are never
  // created/charged here: a selected venue remains a planning preference.
  const applyPackage = useCallback((pkg) => {
    const products=Array.isArray(pkg?.items)?pkg.items:[];
    commit(rows=>{
      const next=rows.filter(row=>!row.packageId);
      const byKey=new Set(next.map(row=>row.key));
      for(const product of products){
        if(!["gift","cake","flower"].includes(product?.type)||product.previewOnly===true||
          !product.id||!product.listing_id||!product.partner_id||
          !(Number(product.price)>0))continue;
        const key=product.type+":"+String(product.id);
        if(byKey.has(key))continue;
        byKey.add(key);
        next.push({
          key,type:product.type,id:String(product.id),listing_id:String(product.listing_id),
          partner_id:String(product.partner_id),name:String(product.name_ar||product.name_en||""),
          ar:String(product.name_ar||product.name_en||""),name_ar:String(product.name_ar||product.name_en||""),
          name_en:String(product.name_en||product.name_ar||""),
          vendor:String(product.vendor_ar||product.vendor_en||""),
          vendor_ar:String(product.vendor_ar||""),vendor_en:String(product.vendor_en||""),
          price:price(product.price),image:String(product.image||""),meta:String(product.meta||""),
          previewOnly:false,packageId:String(pkg.id),quantity:1,addedAt:Date.now()
        });
      }
      return next;
    });
  },[commit]);

  const change = useCallback((key, delta) => {
    commit(rows => rows.flatMap(row => {
      if (row.key !== key) return [row];
      if (row.type === "venue") return [row];
      const next = quantity(row) + Number(delta);
      return next < 1 ? [] : [{ ...row, quantity: Math.min(99, next) }];
    }));
  }, [commit]);

  const remove = useCallback((key) => commit(rows => rows.filter(x => x.key !== key)), [commit]);
  const clear = useCallback(() => commit(() => []), [commit]);
  const count = items.reduce((n,x) => n + quantity(x), 0);
  const total = items.reduce((n,x) => n + price(x.price) * quantity(x), 0);

  // Match published products by their permanent ID, never by a translated
  // name or array index. This only supplies display labels: stored cart IDs,
  // quantities, prices and images remain untouched on catalog reloads.
  const localizedItems = useMemo(() => {
    const byKey = new Map();
    for (const group of Object.values(catalogRows || {})) {
      if (!Array.isArray(group)) continue;
      for (const product of group) byKey.set(product.type + ":" + String(product.id), product);
    }
    return items.map(item => {
      const published = byKey.get(item.key);
      if (!published) return item;
      return {
        ...item,
        name_ar: published.name_ar || item.name_ar || item.ar || item.name,
        name_en: published.name_en || item.name_en || item.name,
        vendor_ar: published.vendor_ar || item.vendor_ar || item.vendor,
        vendor_en: published.vendor_en || item.vendor_en || item.vendor
      };
    });
  }, [items,catalogRows]);

  const value = useMemo(() => ({
    items, localizedItems, isLoaded, add, applyPackage, change, remove, clear, count, total, open, setOpen
  }), [items,localizedItems,isLoaded,add,applyPackage,change,remove,clear,count,total,open]);

  return <CartContext.Provider value={value}>
    {children}
    <FloatingCart locale={locale}/>
    <CartDrawer locale={locale}/>
  </CartContext.Provider>;
}

export function QuantityAction({ product, locale = "ar", addLabel }) {
  const { items, isLoaded, add, change } = useCart();
  if (product?.type === "venue" || !isLoaded) return null;
  const key = product.type + ":" + String(product.id);
  const current = items.find(x => x.key === key);
  const q = current ? quantity(current) : 0;
  const t = cartCopy(locale);
  if (!q) return <button className="dd-cart-add" type="button" onClick={() => add(product)}>
    {addLabel ?? (locale === "ar" ? "+ أضف للسلة" : "+ Add to cart")}
  </button>;
  return <div className="dd-cart-quantity" aria-label={t.cart}>
    <button type="button" aria-label={t.decrease} onClick={() => change(key,-1)}>−</button>
    <span aria-live="polite">{q}</span>
    <button type="button" aria-label={t.increase} onClick={() => change(key,1)} disabled={q >= 99}>+</button>
  </div>;
}

function CartRows({ locale }) {
  const { localizedItems,change,remove } = useCart();
  const t = cartCopy(locale);
  return <div className="dd-cart-rows">
    {localizedItems.map(item => <article key={item.key} className="dd-cart-row">
      {item.image && <img alt="" src={item.image} className="dd-cart-row-img"/>}
      <div className="dd-cart-row-body">
        <strong>{locale === "ar"
          ? item.name_ar || item.ar || item.name
          : item.name_en || item.name || item.ar}</strong>
        {(locale === "ar" ? item.vendor_ar || item.vendor : item.vendor_en || item.vendor) &&
          <small>{locale === "ar" ? item.vendor_ar || item.vendor : item.vendor_en || item.vendor}</small>}
        <b>{money(item.price * quantity(item),locale)}</b>
        <div className="dd-cart-row-controls">
          {item.type !== "venue" && <div className="dd-cart-quantity">
            <button type="button" onClick={() => change(item.key,-1)} aria-label={t.decrease}>−</button>
            <span>{quantity(item)}</span>
            <button type="button" onClick={() => change(item.key,1)} aria-label={t.increase} disabled={quantity(item) >= 99}>+</button>
          </div>}
          <button type="button" className="dd-cart-remove" onClick={() => remove(item.key)}>{t.remove}</button>
        </div>
      </div>
    </article>)}
  </div>;
}

function FloatingCart({ locale }) {
  const { count, isLoaded, setOpen } = useCart();
  const t = cartCopy(locale);
  return <button className="dd-floating-cart" type="button" disabled={!isLoaded}
    onClick={() => setOpen(true)} aria-label={t.cart}>
    <svg width="27" height="27" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 4h2l2.5 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6.1"/><circle cx="9" cy="20" r="1"/><circle cx="19" cy="20" r="1"/>
    </svg>
    {isLoaded && count > 0 && <span className="dd-floating-count" aria-live="polite">{count}</span>}
  </button>;
}

function CartDrawer({ locale }) {
  const { items,open,setOpen,total,count } = useCart();
  const t = cartCopy(locale);
  const [planningFlow,setPlanningFlow] = useState(false);
  // A cart item does not start the planning journey. Only retain the explicit
  // flow marker from the *current page* when the drawer is opened.
  useEffect(() => {
    if (open) setPlanningFlow(new URLSearchParams(window.location.search).get("flow") === "1");
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = event => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = oldOverflow;
      window.removeEventListener("keydown", key);
      if (prev && typeof prev.focus === "function") prev.focus();
    };
  }, [open,setOpen]);

  if (!open) return null;
  return <div className="dd-drawer-root">
    <button type="button" className="dd-drawer-backdrop" onClick={() => setOpen(false)} aria-label={t.close}/>
    <aside className="dd-cart-drawer" role="dialog" aria-modal="true" aria-label={t.cart}>
      <header className="dd-cart-drawer-header">
        <div><h2>{t.cart}</h2><small>{count} {count === 1 ? t.item : t.items}</small></div>
        <button type="button" onClick={() => setOpen(false)} className="dd-cart-close" aria-label={t.close}>×</button>
      </header>
      {items.length ? <CartRows locale={locale}/> : <div className="dd-cart-empty">
        <p>{t.empty}</p><Link href={pathFor("gifts",locale)+(planningFlow?"?flow=1":"")} onClick={() => setOpen(false)}>{t.browse}</Link>
      </div>}
      <div className="dd-cart-drawer-bottom">
        <div className="dd-cart-total"><strong>{t.total}</strong><strong>{money(total,locale)}</strong></div>
        <Link className="dd-cart-goto" href={pathFor("cart",locale)+(planningFlow?"?flow=1":"")} onClick={() => setOpen(false)}>{t.viewCart}</Link>
      </div>
    </aside>
  </div>;
}

export function CartPage({ locale,flow=false }) {
  const { items,total,isLoaded } = useCart();
  const t = cartCopy(locale);
  return <main id="main-content" className="dd-cart-page dd-main">
    <div className="dd-cart-page-inner">
      <h1>{t.title}</h1>
      <div className="dd-cart-page-box">
        {!isLoaded ? <p className="dd-cart-empty-page" role="status">{locale==="ar"?"جاري تحميل السلة...":"Loading your cart..."}</p>
          : items.length ? <CartRows locale={locale}/> : <p className="dd-cart-empty-page">{t.empty}</p>}
        <div className="dd-cart-total"><strong>{t.total}</strong><strong>{money(total,locale)}</strong></div>
      </div>
      <div className="dd-cart-page-actions">
        <Link href={pathFor("gifts",locale)+(flow?"?flow=1":"")}
          className="dd-cart-back-to-products">{t.back}</Link>
        {isLoaded&&(flow||items.length>0)&&<Link
          href={pathFor(flow?"details":"review",locale)+(flow?"?flow=1":"")}
          className="dd-cart-goto">{flow?t.continuePlanning:t.reviewNow}</Link>}
      </div>
    </div>
  </main>;
}
