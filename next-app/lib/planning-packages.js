// Original 15 example bundles from approved Birthday Planning page on main.
// These are planning suggestions, not live catalog stock or bookable offers.
export const PACKAGES=[
    {id:'mini-cookies',name:'لحظة حلوة',budget:'under-1000',items:[
      {type:'cake',id:'cookies',name:'Chocolate Cookies Box',price:650}
    ]},
    {id:'mini-cupcakes',name:'احتفال صغير',budget:'under-1000',items:[
      {type:'cake',id:'cupcakes',name:'Signature Cupcakes Box',price:750}
    ]},
    {id:'mini-personal',name:'لمسة شخصية',budget:'under-1000',items:[
      {type:'gift',id:'personal',name:'هدية Personalized بالاسم',price:950}
    ]},

    {id:'flowers-cookies',name:'ورد وحلو',budget:'1000-2500',items:[
      {type:'gift',id:'bouquet',name:'بوكيه ورد فاخر',price:850},
      {type:'cake',id:'cookies',name:'Chocolate Cookies Box',price:650}
    ]},
    {id:'personal-cupcakes',name:'تفصيلة مخصوص',budget:'1000-2500',items:[
      {type:'gift',id:'personal',name:'هدية Personalized بالاسم',price:950},
      {type:'cake',id:'cupcakes',name:'Signature Cupcakes Box',price:750}
    ]},
    {id:'giftbox-pink',name:'Classic Celebration',budget:'1000-2500',items:[
      {type:'gift',id:'giftbox',name:'صندوق هدايا مخصص',price:1200},
      {type:'cake',id:'pink',name:'Pink Celebration Cake',price:950}
    ]},
    {id:'bracelet-cookies',name:'هدية أنيقة',budget:'1000-2500',items:[
      {type:'gift',id:'silver-bracelet',name:'إسورة فضة Minimal',price:1100},
      {type:'cake',id:'cookies',name:'Chocolate Cookies Box',price:650}
    ]},

    {id:'ovio-romance',name:'عشاء وورد',budget:'2500-5000',items:[
      {type:'venue',id:'ovio',name:'Ovio Restaurant',price:1800},
      {type:'gift',id:'bouquet',name:'بوكيه ورد فاخر',price:850},
      {type:'cake',id:'cookies',name:'Chocolate Cookies Box',price:650}
    ]},
    {id:'boulud-pink',name:'Café Celebration',budget:'2500-5000',items:[
      {type:'venue',id:'boulud',name:'Café Boulud',price:2200},
      {type:'cake',id:'pink',name:'Pink Celebration Cake',price:950}
    ]},
    {id:'terrace-gift',name:'Terrace Surprise',budget:'2500-5000',items:[
      {type:'venue',id:'terrace',name:'The Terrace Lounge',price:2500},
      {type:'gift',id:'giftbox',name:'صندوق هدايا مخصص',price:1200},
      {type:'cake',id:'cupcakes',name:'Signature Cupcakes Box',price:750}
    ]},
    {id:'zooba-cupcakes',name:'Garden Birthday',budget:'2500-5000',items:[
      {type:'venue',id:'zooba',name:'Zooba Garden',price:3200},
      {type:'cake',id:'cupcakes',name:'Signature Cupcakes Box',price:750}
    ]},

    {id:'ovio-ring',name:'Signature Night',budget:'5000-plus',items:[
      {type:'venue',id:'ovio',name:'Ovio Restaurant',price:1800},
      {type:'gift',id:'ring',name:'خاتم فضة بحجر بسيط',price:2900},
      {type:'cake',id:'berry',name:'Chocolate Berry Cake',price:1100}
    ]},
    {id:'terrace-watch',name:'Elegant Evening',budget:'5000-plus',items:[
      {type:'venue',id:'terrace',name:'The Terrace Lounge',price:2500},
      {type:'gift',id:'watch-classic',name:'ساعة Classic بإطار Burgundy',price:2350},
      {type:'cake',id:'berry',name:'Chocolate Berry Cake',price:1100}
    ]},
    {id:'nacelle-perfume',name:'Premium Experience',budget:'5000-plus',items:[
      {type:'venue',id:'nacelle',name:'Nacelle Experience',price:3500},
      {type:'gift',id:'perfume',name:'عطر Signature 75ml',price:1750},
      {type:'cake',id:'pink',name:'Pink Celebration Cake',price:950}
    ]},
    {id:'scarabeo-silver',name:'Silver Moment',budget:'5000-plus',items:[
      {type:'venue',id:'scarabeo',name:'Scarabeo',price:2800},
      {type:'gift',id:'silver-necklace',name:'سلسلة فضة بحلية بسيطة',price:1450},
      {type:'cake',id:'lotus',name:'Lotus Dream Cake',price:1000}
    ]}
  ].map(p=>({...p,total:p.items.reduce((s,i)=>s+i.price,0)}));

export const budgetLabels = {
  "under-1000":"أقل من 1,000",
  "1000-2500":"1,000–2,500",
  "2500-5000":"2,500–5,000",
  "5000-plus":"5,000+",
  "unsure":"غير محدد"
};
