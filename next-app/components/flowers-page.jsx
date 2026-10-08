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
    stemsLabel:"وردة",customTitle:"تصميم مخصص؟",customCopy:"شارك معنا فكرتك أو صورة مرجعية وسنحتفظ بها مع تفاصيل المناسبة.",
    customUpload:"رفع صورة مرجعية",preview:"معاينة",fileError:"الصورة كبيرة جدًا. اختار صورة أقل من 2 ميجابايت.",
    fileSaveError:"تعذر حفظ الصورة المرجعية في المتصفح. جرّب صورة أصغر.",
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
    stemsLabel:"stems",customTitle:"Custom design?",customCopy:"Share your idea or a reference image and we will keep it with your occasion details.",
    customUpload:"Upload reference image",preview:"Preview",fileError:"This image is too large. Please choose one under 2 MB.",
    fileSaveError:"Could not save that image in the browser. Try a smaller image.",
    next:"Save & continue planning",nextNote:"Your selected flowers are saved in the shared cart.",
    selectedLabel:"Flowers in cart",countLabel:"Flower products",brand:"Dear Day"
  }
};
const names=["arrangement","flower_type","color","occasions"];
const refStorage="dearDayFlowerReferenceImage";
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
  const [refImage,setRefImage]=useState("");
  const [fileError,setFileError]=useState("");
  const inputRef=useRef(null);
  const flowerCount=cartItems.filter(x=>x.type==="flower").reduce((n,x)=>n+Math.max(1,Number(x.quantity)||1),0);
  useEffect(()=>{try{const stored=localStorage.getItem(refStorage);if(stored)setRefImage(stored);}catch{}},[]);
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
  function upload(event){
    const file=event.target.files?.[0];
    if(!file)return;
    if(!file.type.startsWith("image/")||file.size>2*1024*1024){setFileError(t.fileError);event.target.value="";return;}
    const reader=new FileReader();
    reader.onload=()=>{try{
      if(typeof reader.result!=="string")throw new Error("Invalid image data");
      localStorage.setItem(refStorage,reader.result);
      setRefImage(reader.result);setFileError("");
      const plan=JSON.parse(localStorage.getItem("dearDayPlan")||"{}");
      localStorage.setItem("dearDayPlan",JSON.stringify({...plan,hasFlowerReference:true}));
    }catch{setFileError(t.fileSaveError);} };
    reader.onerror=()=>setFileError(t.fileSaveError);
    reader.readAsDataURL(file);
    event.target.value="";
  }
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
              {refImage&&<img className="dd-flowers-ref-preview" src={refImage} alt={t.preview}/>}
              {fileError&&<p role="alert" className="dd-flowers-file-error">{fileError}</p>}
            </div>
            <label className="dd-flowers-upload">
              <span aria-hidden="true">⇧</span> {t.customUpload}
              <input ref={inputRef} type="file" accept="image/*" onChange={upload}/>
            </label>
          </section>
          {flow&&<div className="dd-flowers-next">
            <div><strong>{t.selectedLabel}: {flowerCount}</strong><p>{t.nextNote}</p></div>
            <button type="button" onClick={next}>{t.next}</button>
          </div>}
        </section>
      </div>
    </main>
  </>;
}
