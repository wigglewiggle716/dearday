// One approved customer-journey order for every page (Arabic and English).
export const planningSteps = [
  {id:"plan",service:null,ar:"اختيار الخدمات",en:"Choose services"},
  {id:"venues",service:"أماكن وتجارب",ar:"الأماكن والتجارب",en:"Places & Experiences"},
  {id:"gifts",service:"هدايا",ar:"الهدايا",en:"Gifts"},
  {id:"flowers",service:"ورد",ar:"الورد",en:"Flowers"},
  {id:"cake",service:"شكولاته و كيك",ar:"شكولاته و كيك",en:"Chocolate & Cakes"},
  {id:"details",service:null,ar:"تفاصيل المناسبة",en:"Occasion Details"},
  {id:"review",service:null,ar:"مراجعة وحجز",en:"Review & Booking"}
];
export function getNextPlanningStep(current,services=[]) {
  const selected=new Set(Array.isArray(services)?services:[]);
  const position=planningSteps.findIndex(step=>step.id===current);
  for(const step of planningSteps.slice(Math.max(0,position+1))){
    if(step.service ? selected.has(step.service) : step.id==="details")return step.id;
  }
  return "details";
}
export function readPlanningServices(){
  if(typeof window==="undefined")return [];
  try {
    const data=JSON.parse(localStorage.getItem("dearDayPlan")||"{}");
    return Array.isArray(data?.services)?data.services:[];
  } catch { return []; }
}
