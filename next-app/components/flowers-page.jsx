"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BrandedDropdown from "./branded-dropdown";
import PlanningStepper from "./planning-stepper";
import { QuantityAction, money, useCart } from "./cart-provider";
import { useCatalog } from "./live-catalog";
import { getNextPlanningStep, readPlanningServices } from "../lib/planning-flow";
import { pathFor } from "../lib/locales";

// The labels, price ranges, metadata keys, content order, card groups and
// visual hierarchy come from production commit 5d97cc4, which loads its
// Flowers UI from approved-pages/dear-day-live-catalog.js (not flowers.html).
const strings={
  ar:{
    title:"الورد", subtitle:"بوكيهات وبوكسات وفازات حسب اللون ونوع الورد والمناسبة.",
    filters:"فلترة النتائج",reset:"إعادة ضبط",search:"بحث",searchPlaceholder:"اسم المنتج أو البراند",
    price:"السعر",priceOptions:[["all","كل الأسعار"],["under1000","أقل من 1000"],["1000-1500","1,000–1,500"],["1500-2000","1,500–2,000"],["2000plus","2000 فأكثر"]],
    arrangement:"نوع التنسيق",flower_type:"نوع الورد",color:"اللون",occasions:"المناسبة",stems:"عدد الورود",
    all:"الكل",stemsOptions:[["","الكل"],["12","≤ 12"],["20","13–20"],["21","21+"]],
    same_day:"توصيل اليوم",sort:"ترتيب المنتجات",
    sortOptions:[["featured","الأكثر مناسبة"],["price_asc","السعر: الأقل أولًا"],["price_desc","السعر: الأعلى أولًا"]],
    picks:"مختارات",allProducts:"كل المنتجات",notFound:"مفيش نتائج مطابقة للفلاتر دي.",
    loading:"جاري تحميل اختيارات الورد…",loadError:"تعذر تحميل الورد المنشور. حاول مرة تانية لاحقًا.",
    emptyCatalog:"لا توجد منتجات ورد منشورة حاليًا.",
    tags:{best:"الأكثر طلبًا",new:"جديد"},
    arrangementMap:{bouquet:"بوكيه",box:"بوكس",vase:"فازة",bridal:"بوكيه عروسة"},
    typeMap:{roses:"روز",mixed:"مشكل",sunflower:"دوار شمس",gypsophila:"جيبسوفيلا"},
    colorMap:{red:"أحمر",pink:"وردي",white:"أبيض",yellow:"أصفر",purple:"موف",pastel:"باستيل",mixed:"مشكل"},
    occasionsMap:{birthday:"عيد ميلاد",anniversary:"ذكرى",engagement:"خطوبة",graduation:"تخرج",thank_you:"شكر",get_well:"سلامتك",housewarming:"منزل جديد",wedding:"زفاف",promotion:"ترقية",proposal:"طلب زواج",baby_shower:"Baby Shower"},
    stemsLabel:"وردة",customTitle:"تصميم ورد مخصص؟",customCopy:"شاركنا صورة التصميم وملاحظاتك، وفريق Dear Day هيراجع طلبك ويتواصل معاك.",
    customUpload:"ارفع تصميمك",
    next:"حفظ ومتابعة التخطيط",nextNote:"الورد اللي اخترته محفوظ في السلة المشتركة.",
    selectedLabel:"ورد في السلة",countLabel:"منتجات ورد",brand:"Dear Day"
  },
  en:{
    title:"Flowers",subtitle:"Bouquets, boxes and vases by color, flower type and occasion.",
    filters:"Filters",reset:"Reset",search:"Search",searchPlaceholder:"Product or brand",
    price:"Price",priceOptions:[["all","All prices"],["under1000","Under 1,000"],["1000-1500","1,000–1,500"],["1500-2000","1,500–2,000"],["2000plus","2,000+"]],
    arrangement:"Arrangement",flower_type:"Flower type",color:"Color",occasions:"Occasion",stems:"Stems",
    all:"All",stemsOptions:[["","All"],["12","≤ 12"],["20","13–20"],["21","21+"]],
    same_day:"Same-day",sort:"Sort products",
    sortOptions:[["featured","Recommended"],["price_asc","Price: low to high"],["price_desc","Price: high to low"]],
    picks:"Dear Day Picks",allProducts:"All Products",notFound:"No products match these filters.",
    loading:"Loading flowers…",loadError:"Published flowers could not be loaded. Please try again.",
    emptyCatalog:"There are no published flower products at the moment.",
    tags:{best:"Best seller",new:"New"},
    arrangementMap:{bouquet:"Bouquet",box:"Box",vase:"Vase",bridal:"Bridal Bouquet"},
    typeMap:{roses:"Roses",mixed:"Mixed",sunflower:"Sunflower",gypsophila:"Gypsophila"},
    colorMap:{red:"Red",pink:"Pink",white:"White",yellow:"Yellow",purple:"Purple",pastel:"Pastel",mixed:"Mixed"},
    occasionsMap:{birthday:"Birthday",anniversary:"Anniversary",engagement:"Engagement",graduation:"Graduation",thank_you:"Thank You",get_well:"Get Well",housewarming:"Housewarming",wedding:"Wedding",promotion:"Promotion",proposal:"Proposal",baby_shower:"Baby Shower"},
    stemsLabel:"stems",customTitle:"Custom flower design?",customCopy:"Share your reference image and notes. The Dear Day team will review your request and get in touch.",
    customUpload:"Send your design",
    next:"Save & continue planning",nextNote:"Your selected flowers are saved in the shared cart.",
    selectedLabel:"Flowers in cart",countLabel:"Flower products",brand:"Dear Day"
  }
};
const names=["arrangement","flower_type","color","occasions"];
function getMeta(product){return product?.metadata||{};}
function metaValues(meta,key){const v=meta[key];return Array.isArray(v)?v.map(String):v==null||v===""?[]:[String(v)];}
function getOptions(items,key,t) {
  const vals=new Set();
  items.forEach(item=>metaValues(getMeta(item),key).forEach(value=>vals.add(value)));
  const lookup=key==="arrangement"?t.arrangementMap:key==="flower_type"?t.typeMap:key==="color"?t.colorMap:t.occasionsMap;
  return [["",t.all],...[...vals].map(x=>[x,lookup?.[x]||x.replaceAll("_"," ")])];
}
function withinPrice(p,key){
  if(key==="under1000")return p<1000;
  if(key==="1000-1500")return p>=1000&&p<=1500;
  if(key==="1500-2000")return p>1500&&p<=2000;
  if(key==="2000plus")return p>2000;
  return true;
}
function stemsMatch(item,value){
  if(!value)return true;
  const n=Number(getMeta(item).stems)||0;
  if(value==="12")return n<=12;
  if(value==="20")return n>=13&&n<=20;
  return n>=21;
}
function FlowerCard({item,locale,t}){
  const meta=getMeta(item);
  const tags=metaValues(meta,"tags");
  const tag=tags.includes("best_seller")?t.tags.best:tags.includes("new")?t.tags.new:null;
  const text=locale==="ar"?item.name_ar:item.name_en;
  const vendor=locale==="ar"?item.vendor_ar:item.vendor_en;
  const description=[
    t.arrangementMap[meta.arrangement]||meta.arrangement,
    t.colorMap[meta.color]||meta.color,
    meta.stems?String(meta.stems)+" "+t.stemsLabel:null
  ].filter(Boolean).join(" · ");
  const product={...item,name:text,ar:item.name_ar,vendor};
  return <article className="dd-flowers-product" aria-label={text}>
    <div className="dd-flowers-product-image">
      {item.image?<img src={item.image} alt={text} loading="lazy"/>:<span aria-hidden="true">Dear Day</span>}
      {tag&&<span className="dd-flowers-product-tag">{tag}</span>}
    </div>
    <div className="dd-flowers-product-body">
      <small>{vendor||t.brand}</small>
      <h3>{text}</h3>
      <p>{description}</p>
      <div className="dd-flowers-product-price">
        <strong>{money(item.price,locale)}</strong>
        <QuantityAction product={product} locale={locale} addLabel={locale==="ar"?"أضف للسلة":"Add"}/>
      </div>
    </div>
  </article>;
}
function FilterSelect({name,choices,value,onChange}) {
  return <label className="dd-flowers-filter-field">
    <span>{name}</span>
    <select value={value} onChange={e=>onChange(e.target.value)}>
      {choices.map(([v,label])=><option value={v} key={v}>{label}</option>)}
    </select>
  </label>;
}
const FLOWER_DESIGN_ENDPOINT="https://hpffdmldtdtwcaoemyso.supabase.co/functions/v1/flower-design-submit";
const designCopy={
  ar:{
    title:"طلب تصميم ورد مخصص",subtitle:"ارفع صورة التصميم وبيانات التواصل، واكتب أي تفاصيل تحب فريقنا يعرفها.",
    name:"اسمك",email:"البريد الإلكتروني",phone:"رقم الموبايل",file:"صورة التصميم",notes:"ملاحظات على التصميم",
    notesHint:"مثال: لون الورد، نوع البوكيه أو البوكس، المناسبة، تاريخ التوصيل، أو أي تعديلات.",
    choose:"اختار صورة (JPG أو PNG أو WebP — بحد أقصى 5 ميجابايت)",send:"إرسال الطلب",
    sending:"جاري إرسال الطلب...",cancel:"إلغاء",close:"إغلاق",
    required:"لازم تختار صورة واضحة حجمها أقل من 5 ميجابايت.",
    invalid:"من فضلك راجع البيانات المدخلة.",
    rate:"تم إرسال عدد كبير من الطلبات. جرّب لاحقًا.",
    error:"حصلت مشكلة أثناء إرسال الطلب. حاول مرة تانية؛ الطلب لم يتسجل.",
    success:"استلمنا صورة تصميم الورد وملاحظاتك بنجاح. فريق خدمة العملاء هيراجع الطلب ويتواصل معاك.",
    ticket:"رقم طلبك",returning:"هنرجعك للصفحة تلقائيًا خلال ثوانٍ."
  },
  en:{
    title:"Custom flower design request",subtitle:"Attach your reference design, leave any notes, and share contact details so our team can follow up.",
    name:"Your name",email:"Email address",phone:"Mobile number",file:"Design photo",notes:"Design notes",
    notesHint:"e.g. flower colours, bouquet or box style, occasion, delivery date, or other requests.",
    choose:"Choose an image (JPG, PNG or WebP — max 5 MB)",send:"Send request",
    sending:"Sending request...",cancel:"Cancel",close:"Close",
    required:"Choose a clear JPG, PNG or WebP image smaller than 5 MB.",
    invalid:"Please check the information provided.",
    rate:"Too many requests have been submitted. Please try again later.",
    error:"We couldn't send the request. Please try again; nothing was submitted.",
    success:"We received your flower design photo and notes. Our customer care team will review your request and get in touch.",
    ticket:"Your request number",returning:"Returning you to the page in a few seconds."
  }
};
function FlowerDesignDialog({locale,onClose}){
  const t=designCopy[locale]||designCopy.ar;
  const [file,setFile]=useState(null);
  const [imageUrl,setImageUrl]=useState("");
  const [pending,setPending]=useState(false);
  const [result,setResult]=useState(null);
  const closeRef=useRef(null);
  useEffect(()=>{
    if(!file){setImageUrl("");return;}
    const url=URL.createObjectURL(file);
    setImageUrl(url);
    return ()=>URL.revokeObjectURL(url);
  },[file]);
  useEffect(()=>{
    const previous=document.activeElement;
    const oldOverflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    closeRef.current?.focus();
    function handleKey(event){if(event.key==="Escape"&&!pending)onClose();}
    document.addEventListener("keydown",handleKey);
    return ()=>{
      document.body.style.overflow=oldOverflow;
      document.removeEventListener("keydown",handleKey);
      if(previous?.isConnected&&typeof previous.focus==="function")previous.focus();
    };
  },[onClose,pending]);
  useEffect(()=>{
    if(result?.type!=="success")return;
    const timer=window.setTimeout(onClose,5500);
    return ()=>window.clearTimeout(timer);
  },[result,onClose]);
  function chooseImage(event){
    const selected=event.target.files?.[0]||null;
    setResult(null);
    if(!selected){setFile(null);return;}
    if(!["image/jpeg","image/png","image/webp"].includes(selected.type)||selected.size>5*1024*1024||selected.size===0){
      setFile(null);setResult({type:"error",text:t.required});
      event.target.value="";return;
    }
    setFile(selected);
  }
  async function submit(event){
    event.preventDefault();
    if(pending||result?.type==="success")return;
    if(!file){setResult({type:"error",text:t.required});return;}
    const form=event.currentTarget;
    if(!form.reportValidity())return;
    const body=new FormData(form);
    body.set("image",file,file.name);
    body.set("locale",locale);
    setPending(true);setResult(null);
    try{
      const response=await fetch(FLOWER_DESIGN_ENDPOINT,{method:"POST",body,cache:"no-store"});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok||payload.ok!==true||!payload.ticket_reference){
        setResult({type:"error",text:response.status===429?t.rate:response.status===400?t.invalid:t.error});
        return;
      }
      setResult({type:"success",text:t.success,reference:payload.ticket_reference});
    }catch{setResult({type:"error",text:t.error});}
    finally{setPending(false);}
  }
  return <div className="dd-flowers-dialog-overlay" dir={locale==="ar"?"rtl":"ltr"}
    onMouseDown={event=>{if(event.target===event.currentTarget&&!pending)onClose();}}>
    <section className="dd-flowers-dialog" role="dialog" aria-modal="true" aria-labelledby="dd-flowers-dialog-title">
      <div className="dd-flowers-dialog-head">
        <h2 id="dd-flowers-dialog-title">{t.title}</h2>
        <button ref={closeRef} className="dd-flowers-dialog-close" type="button" disabled={pending}
          onClick={onClose} aria-label={t.close}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg></button>
      </div>
      {result?.type==="success"?<div className="dd-flowers-dialog-success" role="status" aria-live="polite">
        <span className="dd-flowers-dialog-success-icon" aria-hidden="true">✓</span>
        <p>{t.success}</p><strong>{t.ticket}: <bdi dir="ltr">{result.reference}</bdi></strong>
        <small>{t.returning}</small>
        <button className="dd-flowers-dialog-submit" type="button" onClick={onClose}>{t.close}</button>
      </div>:<form onSubmit={submit}>
        <p className="dd-flowers-dialog-intro">{t.subtitle}</p>
        <div className="dd-flowers-dialog-fields">
          <label>{t.name}<input name="name" required minLength={2} maxLength={160} autoComplete="name"/></label>
          <label>{t.phone}<input name="phone" type="tel" required minLength={6} maxLength={40} autoComplete="tel" inputMode="tel"/></label>
          <label className="dd-flowers-dialog-full">{t.email}<input name="email" type="email" required maxLength={254} autoComplete="email"/></label>
          <label className="dd-flowers-dialog-full">{t.file}
            <input type="file" accept="image/jpeg,image/png,image/webp" required onChange={chooseImage}/>
            <small>{t.choose}</small>
          </label>
          {imageUrl&&<img className="dd-flowers-dialog-preview" alt={t.file} src={imageUrl}/>}
          <label className="dd-flowers-dialog-full">{t.notes}
            <textarea name="notes" maxLength={2000} rows={4} placeholder={t.notesHint}/>
          </label>
        </div>
        <input name="websiteExtra" className="dd-flowers-honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true"/>
        {result?.type==="error"&&<p className="dd-flowers-dialog-error" role="alert">{result.text}</p>}
        <div className="dd-flowers-dialog-actions">
          <button type="button" className="dd-flowers-dialog-cancel" onClick={onClose} disabled={pending}>{t.cancel}</button>
          <button className="dd-flowers-dialog-submit" type="submit" disabled={pending||!file}>{pending?t.sending:t.send}</button>
        </div>
      </form>}
    </section>
  </div>;
}

export default function FlowersPage({locale="ar",flow=false}){
  const t=strings[locale]||strings.ar;
  const {rows,loading,error}=useCatalog();
  const {items:cartItems}=useCart();
  const router=useRouter();
  // Preserve the original published database listing order for hero + first six picks.
  // CatalogProvider ranks other categories for the homepage; Flowers does not.
  const all=useMemo(()=>[...(rows.flowers||[])].sort((a,b)=>
    (a.publishedOrder??0)-(b.publishedOrder??0)),[rows.flowers]);
  const [filters,setFilters]=useState({search:"",price:"all",arrangement:"",flower_type:"",color:"",occasions:"",stems:"",same_day:false});
  const [sort,setSort]=useState("featured");
  const [designDialogOpen,setDesignDialogOpen]=useState(false);
  const flowerCount=cartItems.filter(x=>x.type==="flower").reduce((n,x)=>n+Math.max(1,Number(x.quantity)||1),0);
  const options=useMemo(()=>Object.fromEntries(names.map(k=>[k,getOptions(all,k,t)])),[all,locale]);
  const filtered=useMemo(()=>{
    const q=filters.search.trim().toLowerCase();
    return all.filter(item=>{
      const meta=getMeta(item);
      const text=[item.name_ar,item.name_en,item.vendor_ar,item.vendor_en,item.desc_ar,item.desc_en].join(" ").toLowerCase();
      if(q&&!text.includes(q))return false;
      if(!withinPrice(Number(item.price)||0,filters.price))return false;
      for(const key of names) {
        if(filters[key]&&!metaValues(meta,key).includes(filters[key]))return false;
      }
      if(filters.same_day&&!meta.same_day)return false;
      return stemsMatch(item,filters.stems);
    }).sort((a,b)=>sort==="price_asc"?a.price-b.price:
      sort==="price_desc"?b.price-a.price:
      (all.indexOf(a)-all.indexOf(b)));
  },[all,filters,sort]);
  // Live Flowers renders its first six published listings as Dear Day Picks.
  const pickIds=useMemo(()=>new Set(all.slice(0,6).map(item=>item.id)),[all]);
  const picks=filtered.filter(item=>pickIds.has(item.id));
  const rest=filtered.filter(item=>!pickIds.has(item.id));
  const heroImage=all.find(x=>x.image)?.image||"/approved-pages/assets/media/flowers-bouquet.jpg";

  function update(key,value){setFilters(current=>({...current,[key]:value}));}
  function reset(){setFilters({search:"",price:"all",arrangement:"",flower_type:"",color:"",occasions:"",stems:"",same_day:false});setSort("featured");}
  function next(){
    // QuantityAction persists flower products in dearDayCart; never write an
    // independent list that would desynchronize across navigation or devices.
    if(flow){
      router.push(pathFor(getNextPlanningStep("flowers",readPlanningServices()),locale)+"?flow=1");
    }else router.push(pathFor("cart",locale));
  }

  return <>
    {flow&&<PlanningStepper locale={locale} current="flowers"/>}
    <main id="main-content" className="dd-flowers-page" dir={locale==="ar"?"rtl":"ltr"}>
      <div className="dd-flowers-hero">
        <div className="dd-flowers-hero-inner">
          <div className="dd-flowers-hero-photo" style={{backgroundImage:"url("+JSON.stringify(heroImage)+")"}} aria-hidden="true"/>
          <div className="dd-flowers-hero-copy">
            <h1>{t.title}</h1><p>{t.subtitle}</p>
          </div>
        </div>
      </div>
      <div className="dd-flowers-wrap">
        <aside className="dd-flowers-filters" aria-label={t.filters}>
          <div className="dd-flowers-filter-head">
            <strong>{t.filters}</strong><button type="button" onClick={reset}>{t.reset}</button>
          </div>
          <label className="dd-flowers-filter-field">
            <span>{t.search}</span>
            <input type="search" value={filters.search}
              onChange={e=>update("search",e.target.value)} placeholder={t.searchPlaceholder}/>
          </label>
          <FilterSelect name={t.price} choices={t.priceOptions} value={filters.price}
            onChange={value=>update("price",value)}/>
          {names.map(key=><FilterSelect key={key} name={t[key]} choices={options[key]}
            value={filters[key]} onChange={value=>update(key,value)}/>)}
          <FilterSelect name={t.stems} choices={t.stemsOptions} value={filters.stems}
            onChange={value=>update("stems",value)}/>
          <label className="dd-flowers-check">
            <input type="checkbox" checked={filters.same_day}
              onChange={e=>update("same_day",e.target.checked)}/>
            <span>{t.same_day}</span>
          </label>
        </aside>
        <section className="dd-flowers-results" aria-label={t.picks+" Dear Day"}>
          <div className="dd-flowers-top-row">
            <div className="dd-flowers-sort">
              <BrandedDropdown label={t.sort} placeholder={t.sort} locale={locale}
                value={sort} onChange={setSort} options={t.sortOptions}/>
            </div>
            {picks.length>0&&<h2 className="dd-flowers-picks-heading">
              {locale==="ar"?<><span>{t.picks}</span> <span dir="ltr">{t.brand}</span></>:t.picks}
            </h2>}
          </div>
          {loading?<p className="dd-flowers-message">{t.loading}</p>:
            error?<p className="dd-flowers-message" role="alert">{t.loadError}</p>:
            !all.length?<p className="dd-flowers-message">{t.emptyCatalog}</p>:
            !filtered.length?<p className="dd-flowers-message">{t.notFound}</p>:
            <>
              {picks.length>0&&<section className="dd-flowers-products-box" aria-label={t.picks}>
                <div className="dd-flowers-grid">
                  {picks.map(item=><FlowerCard key={item.id} item={item} t={t} locale={locale}/>)}
                </div>
              </section>}
              {rest.length>0&&<section className="dd-flowers-all-section">
                <h2>{t.allProducts}</h2>
                <div className="dd-flowers-products-box">
                  <div className="dd-flowers-grid">
                    {rest.map(item=><FlowerCard key={item.id} item={item} t={t} locale={locale}/>)}
                  </div>
                </div>
              </section>}
            </>}
          <section className="dd-flowers-custom">
            <img className="dd-flowers-custom-photo"
              src="/approved-pages/assets/media/flowers-bouquet.jpg" alt="" loading="lazy"/>
            <div className="dd-flowers-custom-copy">
              <h2>{t.customTitle}</h2><p>{t.customCopy}</p>
            </div>
            <button className="dd-flowers-upload" type="button" onClick={()=>setDesignDialogOpen(true)}>
              <span aria-hidden="true">⇧</span> {t.customUpload}
            </button>
          </section>
          {flow&&<div className="dd-flowers-next">
            <div><strong>{t.selectedLabel}: {flowerCount}</strong><p>{t.nextNote}</p></div>
            <button type="button" onClick={next}>{t.next}</button>
          </div>}
        </section>
      </div>
    </main>
    {designDialogOpen&&<FlowerDesignDialog locale={locale} onClose={()=>setDesignDialogOpen(false)}/>}
  </>;
}
