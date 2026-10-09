"use client";
import {useState} from "react";

const ENDPOINT="https://hpffdmldtdtwcaoemyso.supabase.co/functions/v1/contact-submit";
const COPY={
 ar:{
  heading:"أرسل لنا رسالة",
  intro:"املأ النموذج وفريق Dear Day هيراجع رسالتك.",
  name:"الاسم *",email:"البريد الإلكتروني *",phone:"رقم الهاتف",subject:"الموضوع *",message:"الرسالة *",
  send:"إرسال الرسالة",sending:"جاري إرسال رسالتك…",
  success:"تم إرسال رسالتك بنجاح. رقم الطلب: ",
  error:"تعذّر إرسال الرسالة. حاول مرة أخرى بعد قليل.",
  invalid:"راجع بيانات الرسالة وحاول مرة أخرى.",
  rate:"وصلتنا رسائل كتير من نفس الاتصال. برجاء المحاولة لاحقًا."
 },
 en:{
  heading:"Send us a message",intro:"Fill in the form and the Dear Day team will review your message.",
  name:"Name *",email:"Email *",phone:"Phone",subject:"Subject *",message:"Message *",
  send:"Send Message",sending:"Sending your message…",
  success:"Your message has been sent. Ticket reference: ",
  error:"We couldn't send your message. Please try again shortly.",
  invalid:"Please review your information and try again.",
  rate:"Too many submissions from this connection. Please try again later."
 }
};
export default function ContactForm({locale="ar"}){
 const t=COPY[locale]||COPY.ar;
 const [pending,setPending]=useState(false);
 const [result,setResult]=useState(null);
 const onInput=(event)=>{
  const element=event.currentTarget;
  element.style.height="auto";
  element.style.height=Math.max(120,element.scrollHeight)+"px";
 };
 async function submit(event){
  event.preventDefault();
  if(pending)return;
  const form=event.currentTarget;
  setResult(null);
  if(!form.reportValidity())return;
  const fields=new FormData(form);
  const body={
   name:String(fields.get("name")||"").trim(),
   email:String(fields.get("email")||"").trim(),
   phone:String(fields.get("phone")||"").trim(),
   subject:String(fields.get("subject")||"").trim(),
   message:String(fields.get("message")||"").trim(),
   websiteExtra:String(fields.get("websiteExtra")||""),
   locale
  };
  setPending(true);
  try{
   const response=await fetch(ENDPOINT,{
    method:"POST",mode:"cors",cache:"no-store",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(body)
   });
   const payload=await response.json().catch(()=>({}));
   if(!response.ok||payload.ok!==true||!payload.ticket_reference){
    const msg=response.status===429?t.rate:
      response.status===400?t.invalid:t.error;
    setResult({type:"error",message:msg});
    return;
   }
   form.reset();
   const textarea=form.elements.namedItem("message");
   if(textarea)textarea.style.height="auto";
   setResult({type:"success",message:t.success,reference:payload.ticket_reference});
  }catch{
   setResult({type:"error",message:t.error});
  }finally{
   setPending(false);
  }
 }
 return <form className="form-card" id="contactForm" onSubmit={submit}>
    <h2>{t.heading}</h2>
    <p>{t.intro}</p>
    <div className="form-grid">
      <div className="field">
        <label htmlFor="dd-contact-name">{t.name}</label>
        <input id="dd-contact-name" name="name" autoComplete="name" required
          minLength={2} maxLength={160}/>
      </div>
      <div className="field">
        <label htmlFor="dd-contact-email">{t.email}</label>
        <input id="dd-contact-email" name="email" type="email" autoComplete="email"
          required maxLength={254}/>
      </div>
      <div className="field">
        <label htmlFor="dd-contact-phone">{t.phone}</label>
        <input id="dd-contact-phone" name="phone" type="tel"
          inputMode="tel" autoComplete="tel" maxLength={40}/>
      </div>
      <div className="field">
        <label htmlFor="dd-contact-subject">{t.subject}</label>
        <input id="dd-contact-subject" name="subject" required minLength={3} maxLength={200}/>
      </div>
      <div className="field full">
        <label htmlFor="dd-contact-message">{t.message}</label>
        <textarea id="dd-contact-message" name="message" required
          minLength={10} maxLength={5000} rows={4} onInput={onInput}/>
      </div>
    </div>
    <div className="dd-contact-honeypot" aria-hidden="true">
      <label htmlFor="dd-contact-website-extra">Website</label>
      <input id="dd-contact-website-extra" name="websiteExtra" tabIndex={-1}
        autoComplete="off"/>
    </div>
    <button className="send-btn" type="submit" disabled={pending}>
      {pending?t.sending:t.send}
    </button>
    {result&&<div className={"form-status show "+result.type} id="contactStatus"
      role="status" aria-live="polite">
      {result.message}
      {result.reference&&<strong dir="ltr">{result.reference}</strong>}
    </div>}
 </form>;
}
