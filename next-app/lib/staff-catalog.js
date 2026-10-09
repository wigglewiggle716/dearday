// Browser-safe read-only catalog presentation and payload helpers. No privileged keys.
export const kinds=["product","service","venue","experience"];
export const statuses=["draft","pending_review","published","rejected","archived"];
export const CATALOG_PAGE_SIZE=40;
export function localeName(row,locale){
  return (locale==="en"?row?.name_en||row?.name_ar:row?.name_ar||row?.name_en)||"—";
}
export function proposedOf(version){
  const p=version?.metadata?.proposed;
  return p&&typeof p==="object"&&!Array.isArray(p)?p:{};
}
export function latestOf(versions,id){
  return versions.find(v=>v.listing_id===id)||null;
}
export function priceLabel(value,currency,locale){
  if(value==null)return "—";
  try{return new Intl.NumberFormat(locale==="ar"?"ar-EG":"en-EG",{style:"currency",currency:currency||"EGP",maximumFractionDigits:2}).format(Number(value));}
  catch{return String(value)+" EGP";}
}
export function dateLabel(value,locale){
  if(!value)return "—";
  const d=new Date(value);
  return Number.isNaN(d.getTime())?"—":new Intl.DateTimeFormat(locale==="ar"?"ar-EG":"en-GB",{day:"numeric",month:"short",year:"numeric"}).format(d);
}
export function plainMedia(value){
  return Array.isArray(value)?value.filter(v=>typeof v==="string"||v?.url).map(v=>typeof v==="string"?v:v.url).filter(Boolean):[];
}
export function blankDraft(){
  return {id:"",partner_id:"",category_id:"",kind:"product",name_ar:"",name_en:"",
    description_ar:"",description_en:"",price:"",compare_at_price:"",
    is_available:true,stock_qty:"",capacity_per_day:"",media:"",submit:false};
}
export function draftFromListing(listing,version){
  const p=proposedOf(version);
  return {
    id:listing.id,
    partner_id:p.partner_id??listing.partner_id,
    category_id:(Object.prototype.hasOwnProperty.call(p,"category_id")?p.category_id:listing.category_id)??"",
    kind:p.kind??listing.kind,
    name_ar:version?.name_ar||"",
    name_en:version?.name_en||"",
    description_ar:version?.description_ar||"",
    description_en:version?.description_en||"",
    price:String(version?.price??""),
    compare_at_price:version?.compare_at_price==null?"":String(version.compare_at_price),
    stock_qty:(Object.prototype.hasOwnProperty.call(p,"stock_qty")?p.stock_qty:listing.stock_qty)==null?"":String(Object.prototype.hasOwnProperty.call(p,"stock_qty")?p.stock_qty:listing.stock_qty),
    capacity_per_day:(Object.prototype.hasOwnProperty.call(p,"capacity_per_day")?p.capacity_per_day:listing.capacity_per_day)==null?"":String(Object.prototype.hasOwnProperty.call(p,"capacity_per_day")?p.capacity_per_day:listing.capacity_per_day),
    is_available:(p.is_available??listing.is_available)===true,
    media:plainMedia(version?.media).join("\n"),
    submit:false
  };
}
export function createVersionPayload(draft,userId){
 const price=Number(draft.price);
 const compare=draft.compare_at_price.trim()===""?null:Number(draft.compare_at_price);
 const stock=draft.stock_qty.trim()===""?null:Number(draft.stock_qty);
 const capacity=draft.capacity_per_day.trim()===""?null:Number(draft.capacity_per_day);
 if(!draft.partner_id||!draft.name_ar.trim()||!kinds.includes(draft.kind)||
    draft.price.trim()===""||!Number.isFinite(price)||price<0||
    (compare!=null&&(!Number.isFinite(compare)||compare<0))||
    (stock!=null&&(!Number.isInteger(stock)||stock<0))||
    (capacity!=null&&(!Number.isInteger(capacity)||capacity<0)))throw new Error("invalid");
 const media=draft.media.split(/\r?\n/g).map(x=>x.trim()).filter(Boolean);
 if(media.length>12||media.some(u=>!/^https:\/\/[^\s/]+(?:\/[^\s]*)?$/i.test(u)))throw new Error("invalid_media");
 const proposed={
  partner_id:draft.partner_id,category_id:draft.category_id||null,kind:draft.kind,
  is_available:Boolean(draft.is_available),stock_qty:stock,capacity_per_day:capacity
 };
 return {
  proposed,
  version:{
   status:draft.submit?"pending_review":"draft",
   name_ar:draft.name_ar.trim(),name_en:draft.name_en.trim()||null,
   description_ar:draft.description_ar.trim()||null,description_en:draft.description_en.trim()||null,
   price,compare_at_price:compare,currency:"EGP",media,
   metadata:{source:"staff_react",proposed},
   ...(draft.submit?{submitted_by:userId,submitted_at:new Date().toISOString()}:{})
  }
 };
}
