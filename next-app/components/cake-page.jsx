"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PlanningStepper from "./planning-stepper";
import BrandedDropdown from "./branded-dropdown";
import { QuantityAction, money, useCart } from "./cart-provider";
import { cakePrototypeCards } from "../lib/cake-preview";
import { getNextPlanningStep, readPlanningServices } from "../lib/planning-flow";
import { pathFor } from "../lib/locales";

// Reproduces the current production cake page. Its 12 sample cards are not
// live partner stock: the UI marks them as prototype and checkout stays disabled.
const textByLocale={
  ar:{
    title:"كيك لكل لحظة",
    intro:"اختار شكولاته و كيك اللي تناسب المناسبة، وعدد الأشخاص، والذوق اللي بتحبه. ولو عندك تصميم في بالك ارفعلنا صورة مرجعية.",
    search:"ابحث عن كيك أو حلويات...",
    filters:"الفلاتر",reset:"إعادة ضبط",
    groupNames:{category:"نوع المنتج",people:"عدد الأشخاص",flavor:"النكهة",design:"التصميم",budget:"السعر"},
    groupValues:{
      category:[["all","الكل"],["cake","Birthday Cake"],["cupcakes","Cupcakes"],["dessert","Dessert Box"],["cookies","Cookies"]],
      people:[["all","الكل"],["6-8","6–8"],["8-10","8–10"],["12","12+"]],
      flavor:[["all","الكل"],["chocolate","Chocolate"],["vanilla","Vanilla"],["lotus","Lotus"],["mixed","Mixed"]],
      design:[["all","الكل"],["classic","Classic"],["minimal","Minimal"],["floral","Floral"],["premium","Premium"]],
      budget:[["all","الكل"],["low","أقل من 1,000"],["mid","1,000–2,500"],["high","أكثر من 2,500"]]
    },
    sort:"الترتيب",sortList:[["featured","الترتيب المقترح"],["asc","السعر: الأقل أولًا"],["desc","السعر: الأعلى أولًا"]],
    featured:"مختارات Dear Day",allProducts:"كل المنتجات",none:"مفيش منتجات مطابقة للفلاتر الحالية.",
    customTitle:"تصميم مخصص؟",customCopy:"شارك معنا فكرتك أو صورة مرجعية وسنحتفظ بها مع تفاصيل المناسبة.",
    customButton:"رفع صورة مرجعية",customPreview:"المعاينة",
    uploadSaved:"تم حفظ الصورة المرجعية",uploadError:"اختار صورة حجمها أقل من 2 ميجابايت.",
    uploadStorage:"ماقدرناش نحفظ الصورة في المتصفح؛ جرب صورة أصغر.",
    favorites:"إضافة للمفضلة",removeFavorite:"إزالة من المفضلة",
    people:"أشخاص",add:"أضف للسلة",noCake:"مفيش منتجات معروضة حاليًا.",
    note:"المنتجات والأسعار المعروضة أمثلة للتصميم، مش مخزون أو أسعار تعاقدية مؤكدة.",
    selected:"منتجات كيك أو حلويات في السلة",continue:"حفظ ومتابعة التخطيط",continuation:"الاختيارات محفوظة في السلة المشتركة.",
    titleSection:"شكولاته و كيك"
  },
  en:{
    title:"A cake for every moment",eyebrow:"🎂 Chocolate & Cakes",
    intro:"Choose cakes and sweets that fit the occasion, guest count and flavour you love. If you already have a design in mind, you can upload a reference image too.",
    search:"Search cakes or sweets...",
    filters:"Filters",reset:"Reset",
    groupNames:{category:"Product type",people:"Guest count",flavor:"Flavour",design:"Design",budget:"Price"},
    groupValues:{
      category:[["all","All"],["cake","Birthday Cake"],["cupcakes","Cupcakes"],["dessert","Dessert Box"],["cookies","Cookies"]],
      people:[["all","All"],["6-8","6–8"],["8-10","8–10"],["12","12+"]],
      flavor:[["all","All"],["chocolate","Chocolate"],["vanilla","Vanilla"],["lotus","Lotus"],["mixed","Mixed"]],
      design:[["all","All"],["classic","Classic"],["minimal","Minimal"],["floral","Floral"],["premium","Premium"]],
      budget:[["all","All"],["low","Under 1,000"],["mid","1,000–2,500"],["high","Over 2,500"]]
    },
    sort:"Sort",sortList:[["featured","Recommended"],["asc","Price: Low to High"],["desc","Price: High to Low"]],
    featured:"Dear Day Picks",allProducts:"All Products",none:"No products match the current filters.",
    customTitle:"Have a custom design in mind?",customCopy:"Share your idea or upload a reference image and we will keep it with your occasion details.",
    customButton:"Upload reference image",customPreview:"Reference preview",
    uploadSaved:"Reference image saved",uploadError:"Choose an image smaller than 2 MB.",
    uploadStorage:"Could not save the image in this browser. Try a smaller one.",
    favorites:"Add to favorites",removeFavorite:"Remove from favorites",
    people:"guests",add:"Add",noCake:"No products available yet.",
    note:"Products and prices are design examples, not confirmed stock or contracted prices.",
    selected:"Cake & sweets in cart",continue:"Save & continue planning",continuation:"Selections stay in the shared cart.",
    titleSection:"Chocolate & Cakes"
  }
};
const filterOrder=["category","people","flavor","design","budget"];
const defaultFilters={q:"",category:"all",people:"all",flavor:"all",design:"all",budget:"all"};
const favoriteKey="dearDayCakeFavorites",imageKey="dearDayCakeReferenceImage";
function readPlan(){
  try {const p=JSON.parse(localStorage.getItem("dearDayPlan")||"{}");return p&&typeof p==="object"&&!Array.isArray(p)?p:{};}catch{return {};}
}
function budgetDistance(price,key){
  const bands={"under-1000":[0,1000,700],"1000-2500":[1000,2500,1750],
    "2500-5000":[2500,5000,3750],"5000-plus":[5000,Infinity,6000]};
  const band=bands[key];if(!band)return 0;
  const [min,max,target]=band,p=Number(price)||0;
  return p>=min&&p<=max?Math.abs(p-target):p<min?100000+(min-p):100000+(p-max);
}
function matching(product,criteria){
  const {q,category,people,flavor,design,budget}=criteria;
  if(category!=="all"&&product.category!==category)return false;
  if(people!=="all"&&product.people!==people)return false;
  if(flavor!=="all"&&product.flavor!==flavor)return false;
  if(design!=="all"&&product.design!==design)return false;
  if(budget==="low"&&product.price>=1000)return false;
  if(budget==="mid"&&(product.price<1000||product.price>2500))return false;
  if(budget==="high"&&product.price<=2500)return false;
  return !q || [product.name,product.ar,product.vendor].join(" ").toLowerCase().includes(q.trim().toLowerCase());
}
function CakeCard({product,locale,t,isFavorite,onFavorite,selected}){
  const name=locale==="ar"?product.ar:product.name;
  const metadata=(product.people==="12"?"12+":product.people)+" "+t.people+" · "+product.flavor;
  const cartProduct={
    id:product.id,listing_id:product.id,type:"cake",name,
    name_ar:product.ar,ar:product.ar,price:product.price,
    image:product.img,vendor:product.vendor,meta:metadata,
    previewOnly:true
  };
  return <article className={"dd-cake-card"+(selected?" is-selected":"")} id={"dd-cake-"+product.id}>
    <div className="dd-cake-card-image">
      <img src={product.img} alt={name} loading="lazy"/>
      <button type="button" className={"dd-cake-heart"+(isFavorite?" is-favorite":"")}
        aria-label={isFavorite?t.removeFavorite:t.favorites} aria-pressed={isFavorite}
        onClick={()=>onFavorite(product.id)}>{isFavorite?"♥":"♡"}</button>
    </div>
    <div className="dd-cake-card-content">
      <small>{product.vendor}</small>
      <h3>{name}</h3>
      <p>{metadata}</p>
      <div className="dd-cake-buy">
        <strong>{money(product.price,locale)}</strong>
        <QuantityAction locale={locale} product={cartProduct} addLabel={t.add}/>
      </div>
    </div>
  </article>;
}
function FilterGroup({name,choices,value,onChange}){
  return <section className="dd-cake-filter-group">
    <h3>{name}</h3>
    <div className="dd-cake-chips" role="group" aria-label={name}>
      {choices.map(([key,label])=><button type="button" key={key}
        className={"dd-cake-chip"+(key===value?" is-active":"")} aria-pressed={key===value}
        onClick={()=>onChange(key)}>{label}</button>)}
    </div>
  </section>;
}
export default function CakePage({locale="ar",flow=false,standalone=false,incoming=null}){
  const t=textByLocale[locale]||textByLocale.ar;
  const router=useRouter();
  const {items,isLoaded}=useCart();
  const [filters,setFilters]=useState(defaultFilters);
  const [sort,setSort]=useState("featured");
  const [budget,setBudget]=useState("unsure");
  const [favorites,setFavorites]=useState([]);
  const [reference,setReference]=useState("");
  const [uploadMessage,setUploadMessage]=useState("");
  const [filterOpen,setFilterOpen]=useState(true);
  const fileInput=useRef(null);
  const previewIDs=useMemo(()=>new Set(cakePrototypeCards.map(x=>x.id)),[]);
  const previewInCart=items.filter(x=>x.type==="cake"&&previewIDs.has(String(x.id)));
  const previewCount=previewInCart.reduce((n,x)=>n+Math.max(1,Number(x.quantity)||1),0);

  useEffect(()=>{
    let p=standalone?{}:readPlan();
    if(!standalone&&incoming&&typeof incoming==="string"&&incoming.length<20000){
      try {const inData=JSON.parse(incoming);if(inData&&typeof inData==="object"&&!Array.isArray(inData))p={...p,...inData};}catch{}
    }
    setBudget(p.budgetKey||p.budget||"unsure");
    try {
      const fav=JSON.parse(localStorage.getItem(favoriteKey)||"[]");
      if(Array.isArray(fav))setFavorites(fav.filter(x=>typeof x==="string").slice(0,100));
      const r=localStorage.getItem(imageKey);
      if(r?.startsWith("data:image/"))setReference(r);
    }catch{}
  },[standalone,incoming]);

  useEffect(()=>{
    if(!isLoaded)return;
    // Shared cart is the single source of truth for quantities. Avoid removing
    // unrelated products saved by the Gifts/Flowers pages.
    const plan=readPlan();
    const cakeSelections=items.filter(item=>item.type==="cake").map(item=>({
      id:item.id,name:item.name,ar:item.ar,vendor:item.vendor,
      price:item.price,quantity:item.quantity,previewOnly:!!item.previewOnly
    }));
    try{localStorage.setItem("dearDayPlan",JSON.stringify({...plan,cakeSelections}));}catch{}
  },[items,isLoaded]);

  function selectFilter(key,value){setFilters(current=>({...current,[key]:value}));}
  function reset(){setFilters(defaultFilters);setSort("featured");}
  function favoriteToggle(id){
    setFavorites(old=>{
      const next=old.includes(id)?old.filter(x=>x!==id):[...old,id];
      try{localStorage.setItem(favoriteKey,JSON.stringify(next));}catch{}
      return next;
    });
  }
  function upload(event) {
    const file=event.target.files?.[0];
    if(!file)return;
    if(!file.type.startsWith("image/")||file.size>2*1024*1024){
      setUploadMessage(t.uploadError);event.target.value="";return;
    }
    const reader=new FileReader();
    reader.onload=()=>{
      try {
        const img=reader.result;
        if(typeof img!=="string"||!img.startsWith("data:image/"))throw Error("Bad reference");
        localStorage.setItem(imageKey,img);
        const p=readPlan();
        localStorage.setItem("dearDayPlan",JSON.stringify({...p,hasCakeReference:true}));
        setReference(img);setUploadMessage(t.uploadSaved);
      }catch{setUploadMessage(t.uploadStorage);}
    };
    reader.onerror=()=>setUploadMessage(t.uploadStorage);
    reader.readAsDataURL(file);event.target.value="";
  }
  function continuePlanning(){
    if(flow)router.push(pathFor(getNextPlanningStep("cake",readPlanningServices()),locale)+"?flow=1");
    else router.push(pathFor("cart",locale));
  }

  const visible=useMemo(()=>{
    const arr=cakePrototypeCards.filter(p=>matching(p,filters));
    return arr.sort((a,b)=>sort==="asc"?a.price-b.price:
      sort==="desc"?b.price-a.price:
      budgetDistance(a.price,budget)-budgetDistance(b.price,budget)||
      cakePrototypeCards.indexOf(a)-cakePrototypeCards.indexOf(b));
  },[filters,sort,budget]);
  const curated=visible.filter(p=>p.isPick),rest=visible.filter(p=>!p.isPick);
  function draw(items){
    return items.map(p=><CakeCard key={p.id} product={p} locale={locale} t={t}
      selected={previewInCart.some(x=>String(x.id)===p.id)}
      isFavorite={favorites.includes(p.id)} onFavorite={favoriteToggle}/>);
  }
  return <>
    {flow&&<PlanningStepper locale={locale} current="cake"/>}
    <main id="main-content" className="dd-cake-page" dir={locale==="ar"?"rtl":"ltr"}>
      <section className="dd-cake-hero">
        <div className="dd-cake-container">
          <div className="dd-cake-hero-box">
            <div className="dd-cake-hero-photo" role="img" aria-label={t.titleSection}/>
            <div className="dd-cake-hero-copy">
              {t.eyebrow&&<span className="dd-cake-eyebrow">{t.eyebrow}</span>}
              <h1>{t.title}</h1><p>{t.intro}</p>
            </div>
          </div>
        </div>
      </section>
      <div className="dd-cake-container dd-cake-layout">
        <aside className={"dd-cake-filters"+(filterOpen?" is-open":"")} aria-label={t.filters}>
          <div className="dd-cake-search">
            <span aria-hidden="true">⌕</span>
            <input type="search" value={filters.q}
              onChange={e=>selectFilter("q",e.target.value)} placeholder={t.search}
              aria-label={t.search}/>
          </div>
          <div className="dd-cake-filter-head">
            <strong>{t.filters}</strong>
            <button type="button" onClick={reset}>{t.reset}</button>
            <button className="dd-cake-filter-collapse" type="button" aria-expanded={filterOpen}
              onClick={()=>setFilterOpen(x=>!x)} aria-label={t.filters}>{filterOpen?"−":"+"}</button>
          </div>
          <div className="dd-cake-filter-groups">
            {filterOrder.map(key=><FilterGroup key={key} name={t.groupNames[key]}
              choices={t.groupValues[key]} value={filters[key]}
              onChange={val=>selectFilter(key,val)}/>)}
          </div>
        </aside>
        <section className="dd-cake-results" aria-label={t.titleSection}>
          <div className="dd-cake-top-row">
            {locale==="ar"?<div className="dd-cake-sort dd-cake-sort-custom">
              <BrandedDropdown label={t.sort} placeholder={t.sort} locale={locale}
                options={t.sortList} value={sort} onChange={setSort}/>
            </div>:<div className="dd-cake-sort dd-cake-sort-native">
              <label className="dd-cake-sort-label" htmlFor="dd-cake-sort">{t.sort}</label>
              <select id="dd-cake-sort" value={sort} onChange={e=>setSort(e.target.value)}>
                {t.sortList.map(([k,label])=><option key={k} value={k}>{label}</option>)}
              </select>
            </div>}
            {curated.length>0&&<h2>{t.featured}</h2>}
          </div>
          {!visible.length?<p className="dd-cake-no-results">{t.none}</p>:<>
            {curated.length>0&&<section className="dd-cake-curated">
              <div className="dd-cake-grid">{draw(curated)}</div>
            </section>}
            {rest.length>0&&<section className="dd-cake-rest">
              <h2>{t.allProducts}</h2>
              <div className="dd-cake-rest-box"><div className="dd-cake-grid">{draw(rest)}</div></div>
            </section>}
          </>}
          <div className="dd-cake-custom">
            <img src="/approved-pages/assets/media/custom-cake.jpg" alt="" loading="lazy"/>
            <div className="dd-cake-custom-copy">
              <h2>{t.customTitle}</h2><p>{t.customCopy}</p>
              {reference&&<img className="dd-cake-reference-preview" src={reference} alt={t.customPreview}/>}
              {uploadMessage&&<p className="dd-cake-upload-message" role="status">{uploadMessage}</p>}
            </div>
            <label className="dd-cake-upload">
              <span aria-hidden="true">⇧</span> {t.customButton}
              <input ref={fileInput} type="file" accept="image/*" onChange={upload}/>
            </label>
          </div>
          <p className="dd-cake-disclaimer">{t.note}</p>
          {flow&&<div className="dd-cake-continue">
            <div><strong>{t.selected}: {previewCount}</strong><p>{t.continuation}</p></div>
            <button type="button" onClick={continuePlanning}>{t.continue}</button>
          </div>}
        </section>
      </div>
    </main>
  </>;
}
