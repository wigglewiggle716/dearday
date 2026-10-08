"use client";

import { useEffect, useId, useRef, useState } from "react";

export default function BrandedDropdown({ label, placeholder, value, onChange, options, locale }) {
  const [open,setOpen]=useState(false);
  const root=useRef(null);
  const listId=useId();
  useEffect(()=>{
    if(!open)return;
    function outside(event){ if(root.current && !root.current.contains(event.target))setOpen(false); }
    function escape(event){ if(event.key==="Escape"){setOpen(false);root.current?.querySelector(".dd-home-dropdown-trigger")?.focus();} }
    document.addEventListener("pointerdown",outside);
    document.addEventListener("keydown",escape);
    return ()=>{document.removeEventListener("pointerdown",outside);document.removeEventListener("keydown",escape);};
  },[open]);
  const chosen=options.find(([key])=>key===value);
  function select(key){onChange(key);setOpen(false);root.current?.querySelector(".dd-home-dropdown-trigger")?.focus();}
  return <div className="dd-home-dropdown-field" ref={root}>
    <span className="dd-home-dropdown-label">{label}</span>
    <button type="button" className="dd-home-dropdown-trigger" aria-haspopup="listbox"
      aria-expanded={open} aria-controls={listId} onClick={()=>setOpen(v=>!v)}
      onKeyDown={e=>{if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();setOpen(true);requestAnimationFrame(()=>root.current?.querySelector(".dd-home-dropdown-menu [role=option]")?.focus());}}}>
      <span>{chosen?chosen[1]:placeholder}</span>
      <svg className="dd-home-dropdown-chevron" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
    </button>
    {open&&<div className="dd-home-dropdown-menu" id={listId} role="listbox" aria-label={label}
      onKeyDown={e=>{
        const items=[...e.currentTarget.querySelectorAll("[role=option]")];
        const i=items.indexOf(document.activeElement);
        if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();items[(i+(e.key==="ArrowDown"?1:-1)+items.length)%items.length]?.focus();}
        if(e.key==="Home"){e.preventDefault();items[0]?.focus();}
        if(e.key==="End"){e.preventDefault();items[items.length-1]?.focus();}
      }}>
      {options.map(([key,text])=><button type="button" role="option" aria-selected={value===key} key={key}
        className="dd-home-dropdown-option" onClick={()=>select(key)}>
        <span>{text}</span><span className="dd-home-dropdown-check" aria-hidden="true">{value===key?"✓":""}</span>
      </button>)}
    </div>}
  </div>;
}

