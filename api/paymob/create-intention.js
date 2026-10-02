const PAYMOB_BASE='https://accept.paymob.com';

function cents(value){
  const n=Number(value);
  return Number.isFinite(n)?Math.max(0,Math.round(n*100)):0;
}
function cleanText(value,max=50){
  return String(value||'').trim().slice(0,max);
}
function integrationIdFor(method){
  const map={
    card:process.env.PAYMOB_CARD_INTEGRATION_ID,
    wallet:process.env.PAYMOB_WALLET_INTEGRATION_ID,
    apple_pay:process.env.PAYMOB_APPLE_PAY_INTEGRATION_ID,
    google_pay:process.env.PAYMOB_GOOGLE_PAY_INTEGRATION_ID
  };
  return map[method]||'';
}
function originFromRequest(req){
  const proto=String(req.headers['x-forwarded-proto']||'https').split(',')[0].trim();
  const host=String(req.headers['x-forwarded-host']||req.headers.host||'').split(',')[0].trim();
  return host?`${proto}://${host}`:'';
}
function intentionExpiration(extras){
  const raw=extras&&typeof extras==='object'?extras.booking_hold_expires_at:null;
  if(!raw)return {expiration:3600,expired:false};
  const expiresAt=Date.parse(String(raw));
  if(!Number.isFinite(expiresAt))return {expiration:3600,expired:false};
  const remaining=Math.floor((expiresAt-Date.now())/1000);
  if(remaining<=90)return {expiration:0,expired:true};
  return {expiration:Math.max(60,Math.min(3600,remaining-30)),expired:false};
}

export default async function handler(req,res){
  if(req.method!=='POST'){
    res.setHeader('Allow','POST');
    return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
  }

  const secretKey=process.env.PAYMOB_SECRET_KEY;
  const publicKey=process.env.PAYMOB_PUBLIC_KEY;
  if(!secretKey||!publicKey){
    return res.status(503).json({error:'PAYMOB_NOT_CONFIGURED'});
  }

  const body=req.body&&typeof req.body==='object'?req.body:{};
  const method=String(body.payment_method||'card');
  const integrationId=integrationIdFor(method);
  if(!integrationId){
    return res.status(400).json({error:'PAYMENT_METHOD_NOT_ENABLED'});
  }

  const amount=cents(body.amount);
  if(!amount){
    return res.status(400).json({error:'INVALID_AMOUNT'});
  }

  const extras=body.extras&&typeof body.extras==='object'?body.extras:{};
  const expiry=intentionExpiration(extras);
  if(expiry.expired){
    return res.status(409).json({error:'BOOKING_HOLD_EXPIRED'});
  }

  const incomingItems=Array.isArray(body.items)?body.items:[];
  const items=incomingItems.map(item=>({
    name:cleanText(item?.name||'Dear Day item',50),
    amount:cents(item?.amount),
    description:cleanText(item?.description||'',255),
    quantity:Math.max(1,Number(item?.quantity)||1)
  })).filter(item=>item.amount>0);

  const itemsTotal=items.reduce((sum,item)=>sum+(item.amount*item.quantity),0);
  const normalizedItems=items.length&&itemsTotal===amount
    ? items
    : [{name:'Dear Day booking',amount,description:'Dear Day booking',quantity:1}];

  const b=body.billing_data||{};
  const billing_data={
    apartment:'NA',
    first_name:cleanText(b.first_name||'Guest',50),
    last_name:cleanText(b.last_name||'-',50),
    street:cleanText(b.street||'NA',100),
    building:'NA',
    phone_number:cleanText(b.phone_number||'',30),
    city:cleanText(b.city||'Cairo',50),
    country:'EG',
    email:cleanText(b.email||'',100),
    floor:'NA',
    state:cleanText(b.city||'Cairo',50),
    postal_code:'NA'
  };
  if(!billing_data.phone_number||!billing_data.email){
    return res.status(400).json({error:'MISSING_BILLING_DATA'});
  }

  const origin=originFromRequest(req);
  const redirectionUrl=process.env.PAYMOB_REDIRECTION_URL||
    (origin?`${origin}/approved-pages/Dear-Day-Payment.html?payment_return=1`:'');
  const notificationUrl=process.env.PAYMOB_NOTIFICATION_URL||'';

  const payload={
    amount,
    currency:'EGP',
    payment_methods:[Number(integrationId)||integrationId],
    items:normalizedItems,
    billing_data,
    extras,
    special_reference:cleanText(body.special_reference||`DD-${Date.now()}`,100),
    expiration:expiry.expiration
  };
  if(redirectionUrl)payload.redirection_url=redirectionUrl;
  if(notificationUrl)payload.notification_url=notificationUrl;

  try{
    const response=await fetch(`${PAYMOB_BASE}/v1/intention/`,{
      method:'POST',
      headers:{
        'Authorization':`Token ${secretKey}`,
        'Content-Type':'application/json'
      },
      body:JSON.stringify(payload)
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok){
      return res.status(response.status||502).json({
        error:'PAYMOB_INTENTION_FAILED',
        detail:data?.detail||data
      });
    }
    if(!data.client_secret){
      return res.status(502).json({error:'PAYMOB_INVALID_RESPONSE'});
    }
    const checkout_url=`${PAYMOB_BASE}/unifiedcheckout/?publicKey=${encodeURIComponent(publicKey)}&clientSecret=${encodeURIComponent(data.client_secret)}`;
    return res.status(201).json({
      checkout_url,
      intention_id:data.id||null,
      intention_order_id:data.intention_order_id||null,
      client_secret:data.client_secret,
      expiration:expiry.expiration
    });
  }catch(error){
    return res.status(502).json({error:'PAYMOB_UNAVAILABLE'});
  }
}
