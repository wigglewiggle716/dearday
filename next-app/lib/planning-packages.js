// Suggested bundles are computed ONLY from current, published and available
// catalog listings. No hard-coded product IDs, placeholder venues or prices.
export const budgetLabels={
  "under-1000":"أقل من 1,000",
  "1000-2500":"1,000–2,500",
  "2500-5000":"2,500–5,000",
  "5000-plus":"5,000+",
  unsure:"غير محدد"
};
const recipes=[
 {id:"sweet-start",ar:"لحظة حلوة",en:"Sweet Moment",types:["cake"]},
 {id:"flower-moment",ar:"لمسة ورد",en:"A Touch of Flowers",types:["flower"]},
 {id:"thoughtful-gift",ar:"هدية مخصوص",en:"Thoughtful Gift",types:["gift"]},
 {id:"gift-and-cake",ar:"هدية وحلو",en:"Gift & Cake",types:["gift","cake"]},
 {id:"flower-and-cake",ar:"ورد وحلو",en:"Flowers & Cake",types:["flower","cake"]},
 {id:"gift-and-flowers",ar:"هدية وورد",en:"Gift & Flowers",types:["gift","flower"]},
 {id:"celebration-trio",ar:"احتفال متكامل",en:"Celebration Trio",types:["gift","cake","flower"]},
 {id:"special-flowers",ar:"ورد ومفاجأة",en:"Flowers & Surprise",types:["flower","gift"]},
 {id:"sweet-gift",ar:"تفصيلة مميزة",en:"Sweet Surprise",types:["cake","gift"]},
 {id:"memorable-experience",ar:"تجربة مميزة",en:"Memorable Experience",types:["venue"]},
 {id:"venue-and-flowers",ar:"سهرة وورد",en:"Evening & Flowers",types:["venue","flower"]},
 {id:"venue-and-gift",ar:"مكان وهدية",en:"Experience & Gift",types:["venue","gift"]},
 {id:"venue-and-cake",ar:"احتفال في مكان مميز",en:"Celebrate Together",types:["venue","cake"]},
 {id:"night-out",ar:"ليلة لا تنسى",en:"Night to Remember",types:["venue","gift","flower"]},
 {id:"full-occasion",ar:"مناسبة متكاملة",en:"The Full Occasion",types:["venue","gift","flower","cake"]}
];
export const serviceForType={gift:"هدايا",flower:"ورد",cake:"شكولاته و كيك",venue:"أماكن وتجارب"};
export function budgetForTotal(n){
 const v=Number(n);
 if(!Number.isFinite(v)||v<0)return null;
 if(v<1000)return "under-1000";
 if(v<=2500)return "1000-2500";
 if(v<=5000)return "2500-5000";
 return "5000-plus";
}
function available(p){
 const price=Number(p?.price);
 return p&&["gift","cake","flower","venue"].includes(p.type)&&p.id&&p.listing_id&&p.partner_id&&
  p.previewOnly!==true&&p.is_available!==false&&Number.isFinite(price)&&price>0;
}
export function composeLivePackages(rows,occasionKey="birthday"){
 const groups={gift:[],cake:[],flower:[],venue:[]};
 for(const [category,type] of [["gifts","gift"],["cakes-sweets","cake"],["flowers","flower"],["venues","venue"]]){
  groups[type]=(Array.isArray(rows?.[category])?rows[category]:[])
    .filter(p=>available(p)&&p.type===type)
    .slice().sort((a,b)=>{
      const match=p=>p.metadata?.occasions?.includes(occasionKey)?1:0;
      return match(b)-match(a)||(Number(b.score)||0)-(Number(a.score)||0)||
        Number(a.price)-Number(b.price)||String(a.id).localeCompare(String(b.id));
    });
 }
 const used=new Set(),bundles=[];
 for(const recipe of recipes){
  if(recipe.types.some(type=>!groups[type].length))continue;
  // Pick genuine current listing IDs. Rotate within groups to form a varied
  // shortlist while never displaying a non-existent named product or quote.
  const variants=Math.max(1,Math.min(14,...recipe.types.map(type=>groups[type].length)));
  let best=null;
  for(let shift=0;shift<variants;shift++){
   const items=recipe.types.map((type,index)=>{
    const bucket=groups[type];
    return bucket[(shift+(index===0?0:index*2))%bucket.length];
   });
   const unique=items.map(p=>p.type+":"+p.id).join("|");
   if(used.has(unique))continue;
   const total=items.reduce((s,p)=>s+Number(p.price),0);
   const rank=items.reduce((s,p)=>s+(p.metadata?.occasions?.includes(occasionKey)?15:0)+(Number(p.score)||0),0);
   const candidate={id:recipe.id,name_ar:recipe.ar,name_en:recipe.en,
     total,budget:budgetForTotal(total),items:items.map(p=>({...p})),
     rank,unique};
   if(!best||candidate.rank>best.rank)best=candidate;
  }
  if(!best)continue;
  used.add(best.unique);
  const {rank,unique,...pkg}=best;
  bundles.push(pkg);
 }
 return bundles;
}
export function selectedServiceNames(pkg){
 return [...new Set((pkg?.items||[]).map(p=>serviceForType[p.type]).filter(Boolean))];
}
