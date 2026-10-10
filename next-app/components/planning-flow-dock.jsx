"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {useCart} from "./cart-provider";
import {pathFor} from "../lib/locales";
import {getNextPlanningStep,readPlanningServices} from "../lib/planning-flow";

// Only rendered within ?flow=1 category screens. Package-backed venue
// preferences are informational until an actual booking slot is confirmed.
export default function PlanningFlowDock({locale="ar",current}){
 const router=useRouter(),{items,isLoaded,setOpen}=useCart();
 const [venue,setVenue]=useState(null);
 useEffect(()=>{
  const sync=()=>{
   try{
    const p=JSON.parse(localStorage.getItem("dearDayPlan")||"{}");
    setVenue(Array.isArray(p.venueSelections)&&p.venueSelections[0]?.listing_id?p.venueSelections[0]:null);
   }catch{setVenue(null);}
  };
  sync();window.addEventListener("storage",sync);window.addEventListener("ddplanchange",sync);
  return()=>{window.removeEventListener("storage",sync);window.removeEventListener("ddplanchange",sync);};
 },[]);
 const validItems=items.filter(x=>!x.previewOnly);
 const previews=[...validItems.map(x=>({id:x.key,image:x.image,name:locale==="ar"?x.name_ar||x.ar||x.name:x.name_en||x.name})),
 ...(venue?[{id:"venue:"+venue.listing_id,image:venue.image,name:locale==="ar"?venue.name_ar:venue.name_en}]:[])];
 const next=getNextPlanningStep(current,readPlanningServices());
 return <div className="dd-flow-dock" dir={locale==="ar"?"rtl":"ltr"} aria-label={locale==="ar"?"اختيارات المناسبة":"Occasion selections"}>
  <div className="dd-flow-dock-items">
   <div className="dd-flow-dock-thumbs" aria-hidden="true">{previews.slice(0,4).map(x=>x.image?<img src={x.image} key={x.id} alt=""/>:<span key={x.id}>✓</span>)}</div>
   <div className="dd-flow-dock-summary"><strong>{locale==="ar"?"اختيارات يومك":"Your selections"}: {previews.length}</strong>
    <small>{venue?(locale==="ar"?"المكان اختيار مبدئي، وليس حجزًا":"Venue selection isn't a booking"):(locale==="ar"?"محفوظة في السلة المشتركة":"Saved in the shared cart")}</small></div>
  </div>
  <div className="dd-flow-dock-actions">
   {validItems.length>0&&<button type="button" className="dd-flow-cart" onClick={()=>setOpen(true)}>{locale==="ar"?"عرض اختياراتي":"View my picks"}</button>}
   <button type="button" className="dd-flow-next" disabled={!isLoaded}
     onClick={()=>router.push(pathFor(next,locale)+"?flow=1")}>{locale==="ar"?"التالي":"Next"} <span aria-hidden="true">{locale==="ar"?"←":"→"}</span></button>
  </div>
 </div>;
}
