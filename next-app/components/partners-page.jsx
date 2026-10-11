"use client";

import { useRef, useState } from "react";

// Mirrors production partners.html / partners-en.html, SHA
// 5d97cc458910279646ec10a18ffecaca81a6854d.
// Partner intake is not connected yet. Until a secure backend exists, never
// persist applicants' personal data locally or pretend to submit it.
const INTAKE_URL="https://hpffdmldtdtwcaoemyso.supabase.co/functions/v1/partner-apply";
const partners=[
  ["The Gift Studio","Gifts"],["Luna Silver","Jewelry"],["Maison DD","Gifts"],
  ["Roses & More","Flowers"],["Bloom & Co.","Flowers"],["Velvet Bakery","Cakes"],
  ["Little Whisk","Cakes"],["Bake & Bloom","Cakes"],["Skyline Rooftop","Venue"],
  ["Maison Garden","Venue"],["Lumière Dining","Dining"],["Candle Room","Experience"]
];
const groups=[
  ["Gifts & Hampers","هدايا وبوكسات","Gifts & Hampers"],
  ["Flowers & Plants","ورد ونباتات","Flowers & Plants"],
  ["Cakes & Desserts","شكولاته و كيك","Cakes & Desserts"],
  ["Jewelry & Accessories","مجوهرات وإكسسوارات","Jewelry & Accessories"],
  ["Restaurants","مطاعم","Restaurants"],
  ["Venues","أماكن وقاعات","Venues"],
  ["Experiences","تجارب وأنشطة","Experiences & Activities"],
  ["Decor & Coordination","ديكور وتنسيق مناسبات","Decor & Event Coordination"]
];
const partnershipOptions=[
  ["Commission per order / booking","عمولة على كل طلب / حجز","Commission per order / booking"],
  ["Platform listing and visibility","Listing وظهور داخل المنصة","Platform listing and visibility"],
  ["Joint packages and bundles","باقات وتجميعات مشتركة","Joint packages and bundles"],
  ["Venue or experience bookings","حجوزات أماكن أو تجارب","Venue or experience bookings"],
  ["Open to discussing the best model","مفتوح لمناقشة أنسب نموذج","Open to discussing the best model"]
];
const content={
  ar:{
    hero:"كبر شغلك مع مناسبات متخططة بعناية",
    heroText:"لو عندك Gift Shop، Bakery، Venue، Experience أو خدمة بتكمّل المناسبات، Dear Day يقدر يوصلك بعملاء بيدوروا فعلًا على تجربة كاملة ومناسبة لميزانيتهم.",
    heroButton:"انضم كشريك",
    networkTitle:"براندات وأماكن موجودة في اختيارات Dear Day",
    networkLabel:"شبكة شركاء Dear Day",
    benefitTitle:"الشراكة معمولة عشان تسهّل البيع، مش تعقّده",
    benefits:[
      ["طلبات بنية شراء واضحة","العميل داخل وهو محدد المناسبة والميزانية والتاريخ، فاختياراتك بتظهر في سياق أقرب للشراء."],
      ["ظهور منظم للبراند","منتجاتك أو مكانك يظهروا وسط تجربة متناسقة، مش مجرد listing منفصل من غير سياق."],
      ["تنسيق أسهل للطلب","تفاصيل المناسبة والمنتجات والحجز تتجمع في flow واحد، وده يقلل اللخبطة في التواصل."]
    ],
    categoriesTitle:"الفئات اللي بنبني عليها الشبكة",
    applicationTitle:"طلب انضمام كشريك",
    applicationIntro:"كل البيانات اللي محتاجينها علشان نراجع طلب الشراكة بشكل كامل.",
    sectionBusiness:"بيانات النشاط",sectionOffer:"مجالات النشاط",
    sectionDigital:"التواجد الرقمي",sectionModel:"تفاصيل الشراكة",sectionDocuments:"المستندات",
    companyName:"اسم الشركة / البراند *",contactName:"اسم الشخص المسؤول *",
    email:"البريد الإلكتروني *",phone:"رقم الموبايل / واتساب *",
    phonePlaceholder:"01xxxxxxxxx",country:"الدولة *",countryName:"مصر",
    city:"المدينة / المحافظة *",chooseCity:"اختار المدينة",cities:["القاهرة","الجيزة","أخرى"],
    yearsInBusiness:"عدد سنوات النشاط",yearsPlaceholder:"مثال: 3",
    categoriesPrompt:"اختار كل المجالات اللي نشاطك بيقدمها *",
    categoryError:"اختار مجال واحد على الأقل أو اكتب مجال آخر.",
    otherCategory:"مجال آخر",otherPlaceholder:"اكتب المجال لو مش موجود فوق",
    description:"وصف الشركة / النشاط *",
    descriptionPlaceholder:"عرّفنا بالبراند، أهم المنتجات أو الخدمات، نطاق الأسعار، وأي معلومات مهمة.",
    website:"الموقع الإلكتروني",socialMedia:"Instagram / Social Media",
    socialPlaceholder:"@brand أو رابط الحساب",
    partnershipModel:"نموذج الشراكة المفضل *",chooseModel:"اختار نموذج الشراكة",
    currentPartnerships:"شراكات حالية",
    currentPlaceholder:"اكتب أسماء المنصات أو البراندات اللي بتتعاون معاها حاليًا، لو موجودة.",
    companyProfile:"Company Profile (PDF) *",
    companyProfileHelp:"ارفق ملف PDF يعرّف بالشركة أو البراند.",
    productList:"قائمة المنتجات أو الخدمات (اختياري)",
    productListHelp:"ممكن ترفق قائمة المنتجات أو الخدمات والأسعار لو متاحة.",
    submit:"إرسال طلب الانضمام",
    pdfError:"اختار ملف Company Profile بصيغة PDF.",
    sendSuccess:"تم إرسال طلب الانضمام بنجاح. هنراجع بياناتك ونتواصل معاك.",
    sendError:"تعذّر إرسال طلب الانضمام. تأكد من الملفات وحاول مرة تانية.",
    rateLimited:"وصلتنا طلبات كتير من نفس الاتصال. برجاء المحاولة لاحقًا.",
    sending:"جاري إرسال الطلب…",
    optional:"اختياري"
  },
  en:{
    eyebrow:"Dear Day Partners",
    hero:"Grow your business through thoughtfully planned occasions.",
    heroText:"If you run a gift shop, bakery, venue, experience, restaurant, jewelry brand, or service that completes a special day, Dear Day can connect you with customers who are already planning around a real occasion, date, and budget.",
    heroButton:"Become a Partner",
    networkEyebrow:"Our network",
    networkTitle:"Brands and places featured across the Dear Day experience",
    networkText:"We are building a curated network of businesses that can come together to create more complete occasions.",
    networkLabel:"Dear Day partner network",
    benefitEyebrow:"Why Dear Day",
    benefitTitle:"A partnership designed to make selling simpler",
    benefits:[
      ["Customers with clear intent","Customers arrive with an occasion, date, and budget already in mind, so your offer appears in a context that is closer to a real purchase decision."],
      ["Stronger brand visibility","Your products, venue, or service appears as part of a complete experience rather than as an isolated listing with no context."],
      ["Smoother order coordination","Occasion details, products, and bookings come together in one flow, helping reduce back-and-forth and fragmented communication."]
    ],
    categoriesEyebrow:"Partner types",
    categoriesTitle:"The categories behind our growing network",
    applicationTitle:"Partner Application",
    applicationIntro:"Share the information below so we can review your business and potential fit with the Dear Day network.",
    sectionBusiness:"Business details",sectionBusinessEyebrow:"Business information",
    sectionOffer:"What do you offer?",sectionOfferEyebrow:"Business activity",
    sectionDigital:"Digital presence",sectionDigitalEyebrow:"Online presence",
    sectionModel:"Partnership preferences",sectionModelEyebrow:"Partnership details",
    sectionDocuments:"Supporting documents",sectionDocumentsEyebrow:"Documents",
    companyName:"Company / Brand Name *",contactName:"Contact Person *",
    email:"Email Address *",phone:"Mobile / WhatsApp Number *",
    phonePlaceholder:"01xxxxxxxxx",country:"Country *",countryName:"Egypt",
    city:"City / Governorate *",chooseCity:"Choose a city",cities:["Cairo","Giza","Other"],
    yearsInBusiness:"Years in Business",yearsPlaceholder:"e.g. 3",
    categoriesPrompt:"Select every category your business offers *",
    categoryError:"Please select at least one category or enter another category.",
    otherCategory:"Other Category",otherPlaceholder:"Add a category if it is not listed above",
    description:"Business Description *",
    descriptionPlaceholder:"Tell us about your brand, key products or services, typical price range, and anything else we should know.",
    website:"Website",socialMedia:"Instagram / Social Media",
    socialPlaceholder:"@brand or profile URL",
    partnershipModel:"Preferred Partnership Model *",chooseModel:"Choose a partnership model",
    currentPartnerships:"Current Partnerships",
    currentPlaceholder:"List any platforms or brands you currently work with, if applicable.",
    companyProfile:"Company Profile (PDF) *",
    companyProfileHelp:"Attach a PDF introducing your brand.",
    productList:"Product List (Optional)",
    productListHelp:"You may attach a product or service list with prices, if available.",
    submit:"Submit Application",
    pdfError:"Please select a PDF company profile.",
    sendSuccess:"Your application was submitted successfully. Our team will review it and get in touch.",
    sendError:"We couldn't submit your application. Please check the attachments and try again.",
    rateLimited:"Too many applications from this connection. Please try again later.",
    sending:"Submitting application…",
    optional:"Optional"
  }
};
const benefitsCategories=[
 "Gift Shops","Flowers","Jewelry","Cakes & Desserts",
 "Restaurants","Venues","Experiences","Decor & Coordination"
];

function PartnerMarquee({t}){
  return <div className="dd-partners-marquee" aria-label={t.networkLabel}>
    <div className="dd-partners-track">
      {[0,1].map(duplicate=><div key={duplicate} className="dd-partners-set"
        aria-hidden={duplicate===1?"true":undefined} role={duplicate===1?undefined:"list"}>
        {partners.map(([name,type])=><div className="dd-partners-logo" key={name}
          role={duplicate===1?undefined:"listitem"}>
          <strong>{name}</strong><span>{type}</span>
        </div>)}
      </div>)}
    </div>
  </div>;
}

function FormField({id,label,children,full=false,help}){
  return <div className={"dd-partners-field"+(full?" is-full":"")}>
    <label htmlFor={id}>{label}</label>
    {children}
    {help&&<span className="dd-partners-field-note">{help}</span>}
  </div>;
}
function AutoTextarea({id,name,placeholder,required=false}){
  function adjust(event){
    const el=event.currentTarget;
    el.style.height="auto";el.style.height=Math.max(112,el.scrollHeight)+"px";
  }
  return <textarea id={id} name={name} placeholder={placeholder} required={required}
    rows={4} onInput={adjust}/>;
}
function FormSection({title,eyebrow,children}){
  return <section className="dd-partners-form-section">
    <div className="dd-partners-form-section-head">
      {eyebrow&&<small>{eyebrow}</small>}
      <h3>{title}</h3>
    </div>
    <div className="dd-partners-form-grid">{children}</div>
  </section>;
}

export default function PartnersPage({locale="ar"}){
  const t=content[locale]||content.ar;
  const categoryRef=useRef(null);
  const [categoryError,setCategoryError]=useState(false);
  const [status,setStatus]=useState(null);
  const [sending,setSending]=useState(false);

  function categoryChange(){
    setCategoryError(false);setStatus(null);
  }
  async function handleSubmit(event){
    event.preventDefault();
    const form=event.currentTarget;
    const chosen=[...form.querySelectorAll('input[name="categories"]:checked')]
      .map(el=>el.value);
    const otherCategory=(form.elements.namedItem("otherCategory")?.value||"").trim();
    const hasCategory=chosen.length>0||otherCategory.length>0;
    setCategoryError(!hasCategory);setStatus(null);
    const valid=form.reportValidity();
    if(!hasCategory){
      categoryRef.current?.scrollIntoView({behavior:"smooth",block:"center"});
      if(valid)categoryRef.current?.querySelector("input")?.focus();
    }
    if(!valid||!hasCategory)return;

    const pdf=form.elements.namedItem("companyProfile")?.files?.[0];
    if(!pdf||(!pdf.name.toLowerCase().endsWith(".pdf")&&pdf.type!=="application/pdf")){
      setStatus({kind:"error",text:t.pdfError});
      form.elements.namedItem("companyProfile")?.focus();return;
    }
    if(sending)return;
    setSending(true);
    try{
      const payload=new FormData(form);
      payload.set("locale",locale==="en"?"en":"ar");
      const response=await fetch(INTAKE_URL,{
        method:"POST",body:payload,mode:"cors",cache:"no-store"
      });
      const json=await response.json().catch(()=>({}));
      if(!response.ok||!json.ok){
        setStatus({kind:"error",text:response.status===429?t.rateLimited:t.sendError});
        return;
      }
      form.reset();
      setCategoryError(false);
      setStatus({kind:"success",text:t.sendSuccess});
    }catch{
      setStatus({kind:"error",text:t.sendError});
    }finally{
      setSending(false);
    }
  }

  return <main id="main-content" className="dd-partners-page" dir={locale==="ar"?"rtl":"ltr"}>
    <section className="dd-partners-hero">
      <div className="dd-partners-wrap dd-partners-hero-grid">
        <div>
          {t.eyebrow&&<span className="dd-partners-eyebrow">{t.eyebrow}</span>}
          <h1>{t.hero}</h1><p>{t.heroText}</p>
          <div className="dd-partners-hero-cta">
            <a href="#partnerForm" className="dd-partners-primary">{t.heroButton}</a>
          </div>
        </div>
      </div>
    </section>
    <section className="dd-partners-showcase" id="partnerNetwork">
      <div className="dd-partners-wrap">
        <div className="dd-partners-section-head">
          {t.networkEyebrow&&<span>{t.networkEyebrow}</span>}
          <h2>{t.networkTitle}</h2>
          {t.networkText&&<p>{t.networkText}</p>}
        </div>
      </div>
      <PartnerMarquee t={t}/>
    </section>
    <section className="dd-partners-benefits">
      <div className="dd-partners-wrap">
        <div className="dd-partners-section-head">
          {t.benefitEyebrow&&<span>{t.benefitEyebrow}</span>}
          <h2>{t.benefitTitle}</h2>
        </div>
        <div className="dd-partners-benefit-grid">
          {t.benefits.map(([title,desc],index)=><article className="dd-partners-benefit" key={title}>
            <i>{String(index+1).padStart(2,"0")}</i><h3>{title}</h3><p>{desc}</p>
          </article>)}
        </div>
      </div>
    </section>
    <section className="dd-partners-categories">
      <div className="dd-partners-wrap">
        <div className="dd-partners-section-head">
          {t.categoriesEyebrow&&<span>{t.categoriesEyebrow}</span>}
          <h2>{t.categoriesTitle}</h2>
        </div>
        <div className="dd-partners-chips">
          {benefitsCategories.map(category=><span key={category}>{category}</span>)}
        </div>
      </div>
    </section>
    <section className="dd-partners-apply" id="partnerForm">
      <div className="dd-partners-wrap dd-partners-apply-grid">
        <form className="dd-partners-form" id="partnerApplication"
          noValidate encType="multipart/form-data" onSubmit={handleSubmit}
          onReset={event=>{
            const form=event.currentTarget;
            // Native form reset completes after the event: shrink any
            // expanded textareas back to their content-sized height.
            requestAnimationFrame(()=>form.querySelectorAll("textarea").forEach(el=>{
              el.style.height="auto";
              el.style.height=Math.max(112,el.scrollHeight)+"px";
            }));
          }}>
          <h2>{t.applicationTitle}</h2><p>{t.applicationIntro}</p>
          <FormSection title={t.sectionBusiness} eyebrow={t.sectionBusinessEyebrow}>
            <FormField id="companyName" label={t.companyName}>
              <input id="companyName" name="companyName" maxLength={200} required/>
            </FormField>
            <FormField id="contactName" label={t.contactName}>
              <input id="contactName" name="contactName" maxLength={200} required/>
            </FormField>
            <FormField id="email" label={t.email}>
              <input id="email" name="email" type="email" autoComplete="email" required/>
            </FormField>
            <FormField id="phone" label={t.phone}>
              <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel"
                placeholder={t.phonePlaceholder} maxLength={40} required/>
            </FormField>
            <FormField id="country" label={t.country}>
              <select id="country" name="country" defaultValue="Egypt" required>
                <option value="Egypt">{t.countryName}</option>
              </select>
            </FormField>
            <FormField id="city" label={t.city}>
              <select id="city" name="city" defaultValue="" required>
                <option value="">{t.chooseCity}</option>
                {t.cities.map(name=><option key={name} value={name}>{name}</option>)}
              </select>
            </FormField>
            <FormField id="yearsInBusiness" label={t.yearsInBusiness}>
              <input id="yearsInBusiness" name="yearsInBusiness" type="number" min="0" step="1"
                placeholder={t.yearsPlaceholder}/>
            </FormField>
          </FormSection>

          <FormSection title={t.sectionOffer} eyebrow={t.sectionOfferEyebrow}>
            <div className="dd-partners-category-block">
              <div className="dd-partners-field-title">{t.categoriesPrompt}</div>
              <div ref={categoryRef} className="dd-partners-checkbox-grid" id="categoryGroup"
                role="group" aria-label={t.categoriesPrompt} aria-describedby={categoryError?"dd-partners-category-error":undefined}>
                {groups.map(([value,ar,en])=><label className="dd-partners-check-option" key={value}>
                  <input type="checkbox" name="categories" value={value}
                    onChange={categoryChange}/>
                  <span>{locale==="ar"?ar:en}</span>
                </label>)}
              </div>
              {categoryError&&<div className="dd-partners-category-error" id="dd-partners-category-error"
                role="alert">{t.categoryError}</div>}
              <FormField id="otherCategory" label={t.otherCategory}>
                <input id="otherCategory" name="otherCategory" maxLength={150}
                  onChange={categoryChange} placeholder={t.otherPlaceholder}/>
              </FormField>
            </div>
            <FormField id="companyDescription" label={t.description} full>
              <AutoTextarea id="companyDescription" name="companyDescription"
                required placeholder={t.descriptionPlaceholder}/>
            </FormField>
          </FormSection>

          <FormSection title={t.sectionDigital} eyebrow={t.sectionDigitalEyebrow}>
            <FormField id="website" label={t.website}>
              <input id="website" name="website" type="url" placeholder="https://..." maxLength={400}/>
            </FormField>
            <FormField id="socialMedia" label={t.socialMedia}>
              <input id="socialMedia" name="socialMedia" placeholder={t.socialPlaceholder} maxLength={400}/>
            </FormField>
          </FormSection>

          <FormSection title={t.sectionModel} eyebrow={t.sectionModelEyebrow}>
            <FormField id="partnershipModel" label={t.partnershipModel} full>
              <select id="partnershipModel" name="partnershipModel" defaultValue="" required>
                <option value="">{t.chooseModel}</option>
                {partnershipOptions.map(([value,ar,en])=><option key={value}
                  value={locale==="ar"?ar:en}>{locale==="ar"?ar:en}</option>)}
              </select>
            </FormField>
            <FormField id="currentPartnerships" label={t.currentPartnerships} full>
              <AutoTextarea id="currentPartnerships" name="currentPartnerships"
                placeholder={t.currentPlaceholder}/>
            </FormField>
          </FormSection>

          <FormSection title={t.sectionDocuments} eyebrow={t.sectionDocumentsEyebrow}>
            <FormField id="companyProfile" label={t.companyProfile} full help={t.companyProfileHelp}>
              <input id="companyProfile" name="companyProfile" type="file"
                accept="application/pdf,.pdf" required/>
            </FormField>
            <FormField id="productList" label={t.productList} full help={t.productListHelp}>
              <input id="productList" name="productList" type="file"
                accept="application/pdf,.pdf,.xlsx,.xls,.csv"/>
            </FormField>
          </FormSection>
          <div className="dd-partners-submit-row">
            <input type="text" name="businessWebsiteExtra" tabIndex={-1}
              autoComplete="off" aria-hidden="true" className="dd-partners-honeypot"/>
            <button className="dd-partners-primary" type="submit" disabled={sending}>
              {sending?t.sending:t.submit}
            </button>
          </div>
          {status&&<div className={"dd-partners-status "+status.kind} role="status" aria-live="polite">
            {status.text}
          </div>}
        </form>
      </div>
    </section>
  </main>;
}
