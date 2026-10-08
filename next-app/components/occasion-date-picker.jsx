"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

function dateKey(d) {
  return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
}
function fromKey(s) {
  return s ? new Date(s+"T12:00:00") : new Date();
}

export default function OccasionDatePicker({ locale, value, onChange, label, placeholder }) {
  const [open,setOpen] = useState(false);
  const [view,setView] = useState(() => new Date(new Date().getFullYear(),new Date().getMonth(),1));
  const [position,setPosition] = useState({left:16,top:16});
  const [mounted,setMounted] = useState(false);
  const triggerRef = useRef(null);
  const calendarRef = useRef(null);
  const popupId=useId();
  const dateLocale = locale==="ar" ? "ar-EG" : "en-GB";
  const close = useCallback((restoreFocus=false) => {
    setOpen(false);
    if(restoreFocus) triggerRef.current?.focus();
  },[]);

  const positionCalendar=useCallback(() => {
    if(!triggerRef.current) return;
    const r=triggerRef.current.getBoundingClientRect();
    const vw=window.innerWidth, vh=window.innerHeight;
    const width=Math.min(320,vw-32);
    const height=calendarRef.current?.offsetHeight||380;
    const left=Math.max(16,Math.min(locale==="ar" ? r.right-width : r.left,vw-width-16));
    const below=r.bottom+8;
    const top=below+height > vh-8 && r.top > height+12 ? r.top-height-8 : Math.max(8,Math.min(below,vh-height-8));
    setPosition({left,top});
  },[locale]);

  useEffect(()=>{setMounted(true);},[]);
  useEffect(()=>{
    if(!open)return;
    positionCalendar();
    const handleOutside=(e)=>{
      if(!calendarRef.current?.contains(e.target)&&!triggerRef.current?.contains(e.target))close(false);
    };
    const handleKeyboard=(e)=>{
      if(e.key==="Escape"){ e.preventDefault();close(true); }
    };
    const handlePosition=()=>positionCalendar();
    document.addEventListener("pointerdown",handleOutside);
    window.addEventListener("keydown",handleKeyboard);
    window.addEventListener("resize",handlePosition);
    window.addEventListener("scroll",handlePosition,true);
    return ()=>{
      document.removeEventListener("pointerdown",handleOutside);
      window.removeEventListener("keydown",handleKeyboard);
      window.removeEventListener("resize",handlePosition);
      window.removeEventListener("scroll",handlePosition,true);
    };
  },[open,positionCalendar,close]);

  function toggle() {
    if(open){close(false);return;}
    const selected=fromKey(value);
    setView(new Date(selected.getFullYear(),selected.getMonth(),1));
    setOpen(true);
  }
  function choose(key) {onChange(key);close(true);}
  const display=value
    ? new Intl.DateTimeFormat(dateLocale,{day:"numeric",month:"long",year:"numeric"}).format(fromKey(value))
    : placeholder;
  const year=view.getFullYear(),month=view.getMonth();
  const today=dateKey(new Date());
  const firstWeekday=new Date(year,month,1).getDay();
  const daysInMonth=new Date(year,month+1,0).getDate();
  const weekdays=locale==="ar"?["أحد","إثنين","ثلاثاء","أربعاء","خميس","جمعة","سبت"]:["Su","Mo","Tu","We","Th","Fr","Sa"];
  const cells=Array.from({length:firstWeekday},(_,i)=>({blank:true,key:"blank-"+i}))
    .concat(Array.from({length:daysInMonth},(_,i)=>{
      const day=i+1, d=new Date(year,month,day,12);
      return {blank:false,key:dateKey(d),day,label:new Intl.DateTimeFormat(dateLocale,{dateStyle:"full"}).format(d)};
    }));
  const dialog=(
    <div ref={calendarRef} id={popupId} role="dialog" aria-label={label} dir={locale==="ar"?"rtl":"ltr"}
      className="dd-home-date-calendar" style={{left:position.left,top:position.top}}
      onKeyDown={e=>{
        if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key))return;
        const focused=e.target?.dataset?.date;
        if(!focused)return;
        e.preventDefault();
        const d=fromKey(focused);
        const rtl=locale==="ar";
        const delta={ArrowLeft:rtl?1:-1,ArrowRight:rtl?-1:1,ArrowUp:-7,ArrowDown:7}[e.key];
        d.setDate(d.getDate()+delta);
        const newKey=dateKey(d);
        if(d.getMonth()!==month || d.getFullYear()!==year){
          setView(new Date(d.getFullYear(),d.getMonth(),1));
          requestAnimationFrame(()=>calendarRef.current?.querySelector('[data-date="'+newKey+'"]')?.focus());
        }else{
          calendarRef.current?.querySelector('[data-date="'+newKey+'"]')?.focus();
        }
      }}>
      <div className="dd-home-date-calhead">
        <button type="button" aria-label={locale==="ar"?"الشهر السابق":"Previous month"} onClick={()=>setView(new Date(year,month-1,1))}>{locale==="ar"?"›":"‹"}</button>
        <strong aria-live="polite">{new Intl.DateTimeFormat(dateLocale,{month:"long",year:"numeric"}).format(view)}</strong>
        <button type="button" aria-label={locale==="ar"?"الشهر التالي":"Next month"} onClick={()=>setView(new Date(year,month+1,1))}>{locale==="ar"?"‹":"›"}</button>
      </div>
      <div className="dd-home-date-grid">
        {weekdays.map(day=><span className="dd-home-date-weekday" key={day}>{day}</span>)}
        {cells.map(day=>day.blank?<span key={day.key}/>:<button
          type="button" key={day.key} data-date={day.key} aria-label={day.label}
          aria-pressed={day.key===value} aria-current={day.key===today?"date":undefined}
          onClick={()=>choose(day.key)}
        >{new Intl.NumberFormat(dateLocale,{useGrouping:false}).format(day.day)}</button>)}
      </div>
      <div className="dd-home-date-calfooter">
        <button type="button" onClick={()=>choose("")}>{locale==="ar"?"مسح":"Clear"}</button>
        <button type="button" onClick={()=>choose(today)}>{locale==="ar"?"اليوم":"Today"}</button>
      </div>
    </div>
  );

  return <>
    <div className="dd-home-date-field">
      <span className="dd-home-date-label">{label}</span>
      <div className="dd-home-date-control">
        <button ref={triggerRef} type="button" className="dd-home-date-trigger"
          aria-expanded={open} aria-haspopup="dialog" aria-controls={open?popupId:undefined}
          aria-label={label+": "+display} onClick={toggle}>
          <span className="dd-home-date-copy">{display}</span>
          <span className="dd-home-date-left" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 3v3M17 3v3M4.5 9h15M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V7A1.5 1.5 0 0 1 5 5.5Z"/>
            </svg>
            <span>⌄</span>
          </span>
        </button>
      </div>
    </div>
    {mounted&&open&&createPortal(dialog,document.body)}
  </>;
}
