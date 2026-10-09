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
    customTitle:"عندك تصميم كيك في بالك؟",customCopy:"ارفع صورة للتصميم مع ملاحظاتك، وفريق Dear Day هيراجع طلبك ويتواصل معاك.",
    customButton:"ارفع تصميمك",
    favorites:"إضافة للمفضلة",removeFavorite:"إزالة من المفضلة",
    people:"أشخاص",add:"أضف للسلة",noCake:"مفيش منتجات معروضة حاليًا.",
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
    customTitle:"Have a custom cake design in mind?",customCopy:"Upload a design photo with your notes and the Dear Day team will review your request and get in touch.",
    customButton:"Send your design",
    favorites:"Add to favorites",removeFavorite:"Remove from favorites",
    people:"guests",add:"Add",noCake:"No products available yet.",
    selected:"Cake & sweets in cart",continue:"Save & continue planning",continuation:"Selections stay in the shared cart.",
    titleSection:"Chocolate & Cakes"
  }
};
const filterOrder=["category","people","flavor","design","budget"];
const defaultFilters={q:"",category:"all",people:"all",flavor:"all",design:"all",budget:"all"};
const favoriteKey="dearDayCakeFavorites";
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
const CAKE_DESIGN_ENDPOINT="https://hpffdmldtdtwcaoemyso.supabase.co/functions/v1/cake-design-submit";
const designCopy={
  ar:{
    title:"طلب تصميم كيك مخصص",subtitle:"ارفع صورة التصميم وبيانات التواصل، واكتب أي تفاصيل تحب فريقنا يعرفها.",
    name:"اسمك",email:"البريد الإلكتروني",phone:"رقم الموبايل",file:"صورة التصميم",notes:"ملاحظات على التصميم",
    notesHint:"مثال: عدد الأشخاص، الألوان، النكهة، تاريخ المناسبة، أو التعديلات المطلوبة.",
    choose:"اختار صورة (JPG أو PNG أو WebP — بحد أقصى 5 ميجابايت)",send:"إرسال الطلب",
    sending:"جاري إرسال الطلب...",cancel:"إلغاء",close:"إغلاق",
    required:"لازم تختار صورة واضحة حجمها أقل من 5 ميجابايت.",
    invalid:"من فضلك راجع البيانات المدخلة.",
    rate:"تم إرسال عدد كبير من الطلبات. جرّب لاحقًا.",
    error:"حصلت مشكلة أثناء إرسال الطلب. حاول مرة تانية؛ الطلب لم يتسجل.",
    success:"تم استلام صورة التصميم وملاحظاتك بنجاح. فريق خدمة العملاء هيراجع الطلب ويتواصل معاك.",
    ticket:"رقم طلبك",returning:"هنرجعك للصفحة تلقائيًا خلال ثوانٍ."
  },
  en:{
    title:"Custom cake design request",subtitle:"Attach your reference design, leave any notes, and share contact details so our team can follow up.",
    name:"Your name",email:"Email address",phone:"Mobile number",file:"Design photo",notes:"Design notes",
    notesHint:"e.g. servings, colours, flavour, occasion date or requested changes.",
    choose:"Choose an image (JPG, PNG or WebP — max 5 MB)",send:"Send request",
    sending:"Sending request...",cancel:"Cancel",close:"Close",
    required:"Choose a clear JPG, PNG or WebP image smaller than 5 MB.",
    invalid:"Please check the information provided.",
    rate:"Too many requests have been submitted. Please try again later.",
    error:"We couldn't send the request. Please try again; nothing was submitted.",
    success:"Your image and notes were received. Our customer care team will review the request and get in touch.",
    ticket:"Your request number",returning:"Returning you to the page in a few seconds."
  }
};
function CakeDesignDialog({locale,onClose}){
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
      const response=await fetch(CAKE_DESIGN_ENDPOINT,{method:"POST",body,cache:"no-store"});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok||payload.ok!==true||!payload.ticket_reference){
        setResult({type:"error",text:response.status===429?t.rate:response.status===400?t.invalid:t.error});
        return;
      }
      setResult({type:"success",text:t.success,reference:payload.ticket_reference});
    }catch{setResult({type:"error",text:t.error});}
    finally{setPending(false);}
  }
  return <div className="dd-cake-dialog-overlay" dir={locale==="ar"?"rtl":"ltr"}
    onMouseDown={event=>{if(event.target===event.currentTarget&&!pending)onClose();}}>
    <section className="dd-cake-dialog" role="dialog" aria-modal="true" aria-labelledby="dd-cake-dialog-title">
      <div className="dd-cake-dialog-head">
        <h2 id="dd-cake-dialog-title">{t.title}</h2>
        <button ref={closeRef} className="dd-cake-dialog-close" type="button" disabled={pending}
          onClick={onClose} aria-label={t.close}>×</button>
      </div>
      {result?.type==="success"?<div className="dd-cake-dialog-success" role="status" aria-live="polite">
        <span className="dd-cake-dialog-success-icon" aria-hidden="true">✓</span>
        <p>{t.success}</p><strong>{t.ticket}: <bdi dir="ltr">{result.reference}</bdi></strong>
        <small>{t.returning}</small>
        <button className="dd-cake-dialog-submit" type="button" onClick={onClose}>{t.close}</button>
      </div>:<form onSubmit={submit}>
        <p className="dd-cake-dialog-intro">{t.subtitle}</p>
        <div className="dd-cake-dialog-fields">
          <label>{t.name}<input name="name" required minLength={2} maxLength={160} autoComplete="name"/></label>
          <label>{t.phone}<input name="phone" type="tel" required minLength={6} maxLength={40} autoComplete="tel" inputMode="tel"/></label>
          <label className="dd-cake-dialog-full">{t.email}<input name="email" type="email" required maxLength={254} autoComplete="email"/></label>
          <label className="dd-cake-dialog-full">{t.file}
            <input type="file" accept="image/jpeg,image/png,image/webp" required onChange={chooseImage}/>
            <small>{t.choose}</small>
          </label>
          {imageUrl&&<img className="dd-cake-dialog-preview" alt={t.file} src={imageUrl}/>}
          <label className="dd-cake-dialog-full">{t.notes}
            <textarea name="notes" maxLength={2000} rows={4} placeholder={t.notesHint}/>
          </label>
        </div>
        <input name="websiteExtra" className="dd-cake-honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true"/>
        {result?.type==="error"&&<p className="dd-cake-dialog-error" role="alert">{result.text}</p>}
        <div className="dd-cake-dialog-actions">
          <button type="button" className="dd-cake-dialog-cancel" onClick={onClose} disabled={pending}>{t.cancel}</button>
          <button className="dd-cake-dialog-submit" type="submit" disabled={pending||!file}>{pending?t.sending:t.send}</button>
        </div>
      </form>}
    </section>
  </div>;
}

export default function CakePage({locale="ar",flow=false,standalone=false,incoming=null}){
  const t=textByLocale[locale]||textByLocale.ar;
  const router=useRouter();
  const {items,isLoaded}=useCart();
  const [filters,setFilters]=useState(defaultFilters);
  const [sort,setSort]=useState("featured");
  const [budget,setBudget]=useState("unsure");
  const [favorites,setFavorites]=useState([]);
  const [designDialogOpen,setDesignDialogOpen]=useState(false);
  const [filterOpen,setFilterOpen]=useState(true);
  const previewIDs=useMemo(()=>new Set(cakePrototypeCards.map(x=>x.id)),[]);
  const previewInCart=items.filter(x=>x.type==="cake"&&previewIDs.has(String(x.id)));
  const previewCount=previewInCart.reduce((n,x)=>n+Math.max(1,Number(x.quantity)||1),0);

  useEffect(()=>{
    let p=standalone?{}:readPlan();
    if(!standalone&&incoming&&typeof incoming==="string"&&incoming.length<20000){
      try {
        const inData=JSON.parse(incoming);
        if(inData&&typeof inData==="object"&&!Array.isArray(inData)){
          p={...p,...inData};
          // Keep the journey context when coming from Birthday Planning.
          // Do not change the shared cart here: it has its own persistence.
          localStorage.setItem("dearDayPlan",JSON.stringify(p));
        }
      }catch{}
    }
    setBudget(p.budgetKey||p.budget||"unsure");
    try {
      const fav=JSON.parse(localStorage.getItem(favoriteKey)||"[]");
      if(Array.isArray(fav))setFavorites(fav.filter(x=>typeof x==="string").slice(0,100));
    }catch{}
  },[standalone,incoming]);

  useEffect(()=>{
    if(!isLoaded||standalone)return;
    // Shared cart is the single source of truth for quantities. Avoid removing
    // unrelated products saved by the Gifts/Flowers pages.
    const plan=readPlan();
    const cakeSelections=items.filter(item=>item.type==="cake").map(item=>({
      id:item.id,name:item.name,ar:item.ar,vendor:item.vendor,
      price:item.price,quantity:item.quantity,previewOnly:!!item.previewOnly
    }));
    try{localStorage.setItem("dearDayPlan",JSON.stringify({...plan,cakeSelections}));}catch{}
  },[items,isLoaded,standalone]);

  function selectFilter(key,value){setFilters(current=>({...current,[key]:value}));}
  function reset(){setFilters(defaultFilters);setSort("featured");}
  function favoriteToggle(id){
    setFavorites(old=>{
      const next=old.includes(id)?old.filter(x=>x!==id):[...old,id];
      try{localStorage.setItem(favoriteKey,JSON.stringify(next));}catch{}
      return next;
    });
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
            {<div className="dd-cake-sort dd-cake-sort-custom">
              <BrandedDropdown label={t.sort} placeholder={t.sort} locale={locale}
                options={t.sortList} value={sort} onChange={setSort}/>
            </div>}
            {curated.length>0&&<h2 dir={locale==="ar"?"rtl":"ltr"}>
              {locale==="ar"?<>مختارات <bdi dir="ltr">Dear Day</bdi></>:t.featured}
            </h2>}
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
            </div>
            <button className="dd-cake-upload" type="button" onClick={()=>setDesignDialogOpen(true)}>
              <span aria-hidden="true">⇧</span> {t.customButton}
            </button>
          </div>
          {flow&&<div className="dd-cake-continue">
            <div><strong>{t.selected}: {previewCount}</strong><p>{t.continuation}</p></div>
            <button type="button" onClick={continuePlanning}>{t.continue}</button>
          </div>}
        </section>
      </div>
    </main>
    {designDialogOpen&&<CakeDesignDialog locale={locale} onClose={()=>setDesignDialogOpen(false)}/>}
  </>;
}
