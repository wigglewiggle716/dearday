const EN=document.documentElement.lang.startsWith('en');
const text=(ar,en)=>EN?en:ar;
let clientPromise,reviewed=null,busy=false;
const value=id=>String(document.getElementById(id)?.value||'').trim();
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')||fallback}catch{return fallback}}
function request(){
 const plan=read('dearDayPlan',{}),d=plan.eventDetails||{},cart=window.DDCart?.read()||read('dearDayCart',[]);
 const items=cart.map(x=>({listing_id:x.listing_id||x.listingId||x.id,quantity:x.type==='venue'?1:Number(x.quantity||1)}));
 if(!items.length||items.some(x=>!/^[-0-9a-f]{36}$/i.test(x.listing_id)||!Number.isInteger(x.quantity)||x.quantity<1))throw new Error('INVALID_CART');
 const event={date:d.eventDate||plan.date||'',time:d.eventTime||'',occasion:plan.occasionKey||plan.occasion||'',address:d.address||value('billingAddress'),phone:value('payerPhone'),recipient:d.celebrant||value('payerName'),area:plan.area||value('billingCity'),note:d.notes||d.specialRequests||''};
 if(!event.date||!event.time||!event.address||!event.phone)throw new Error('MISSING_DELIVERY_DETAILS');
 return {p_items:items,p_event:event};
}
async function client(){
 if(!clientPromise)clientPromise=(async()=>{
  if(!window.DEAR_DAY_SUPABASE)await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/approved-pages/dear-day-supabase-config.js';s.onload=resolve;s.onerror=reject;document.head.append(s)});
  const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm'),cfg=window.DEAR_DAY_SUPABASE;
  return createClient(cfg.url,cfg.publishableKey,{auth:{storage:localStorage.getItem('ddAuthRemember')==='0'?sessionStorage:localStorage,persistSession:true,autoRefreshToken:true}});
 })().catch(e=>{clientPromise=null;throw e});
 return clientPromise;
}
function message(msg){document.getElementById('ddCheckoutStatus').textContent=msg}
function friendly(error){
 const m=String(error?.message||'');
 if(m.includes('CUSTOMER_LOGIN_REQUIRED'))return text('سجّل الدخول بحساب عميل لمراجعة السعر وإنشاء الطلب.','Sign in with a customer account to review the price and create an order.');
 if(m.includes('INVALID_CART'))return text('السلة تحتوي على اختيار قديم أو غير صالح. أعد اختياره من الكتالوج الحالي.','Your cart contains an outdated or invalid selection. Select it again from the current catalog.');
 if(/MISSING_DELIVERY|INVALID_EVENT/.test(m))return text('أكمل تاريخ ووقت المناسبة وعنوان التوصيل ورقم الهاتف أولًا.','Complete the event date, time, delivery address and phone number first.');
 if(m.includes('PRICE_CHANGED'))return text('السعر اتغيّر. راجع السعر المحدّث قبل المتابعة.','The price changed. Review the updated quote before continuing.');
 if(m.includes('ORDER_EXPIRED'))return text('انتهى الحجز المؤقت. راجع السعر لبدء طلب جديد.','The temporary reservation expired. Review the price to start a new order.');
 if(/STOCK|UNAVAILABLE|CONFIGURATION/.test(m))return text('أحد الاختيارات غير متاح بالكمية أو الموعد المطلوب. ارجع للسلة لتعديله.','A selection is unavailable for this quantity or date. Update your cart.');
 if(m.includes('TOO_MANY'))return text('لديك طلبات معلّقة. انتظر انتهاء الحجز المؤقت قبل المحاولة مجددًا.','You have pending orders. Wait for the temporary reservations to expire before retrying.');
 return text('تعذر مراجعة الطلب الآن. حاول مرة أخرى.','Could not review the order. Please try again.');
}
function showQuote(q){
 const format=n=>'EGP '+new Intl.NumberFormat(EN?'en-US':'ar-EG').format(Number(n));
 document.getElementById('subtotal').textContent=format(q.subtotal);document.getElementById('grandTotal').textContent=format(q.grand_total);
 const host=document.getElementById('miniItems');host.replaceChildren();
 for(const line of q.items){const row=document.createElement('div');row.className='mini-item';row.style.gridTemplateColumns='1fr auto';const name=document.createElement('span');name.textContent=(EN?line.name_en:line.name)+' × '+line.quantity;const price=document.createElement('strong');price.textContent=format(line.line_total);row.append(name,price);host.append(row)}
 message(text('ده السعر الحالي المعتمد. الطلب لسه ما اتعملش، ومفيش دفع تم.','This is the current confirmed price. No order has been created and no payment has been made.'));
}
async function authenticated(){const s=await client(),{data,error}=await s.auth.getUser();if(error||!data?.user)throw new Error('CUSTOMER_LOGIN_REQUIRED');return {s,user:data.user}}
async function quote(){const args=request(),{s,user}=await authenticated();const {data,error}=await s.rpc('prepare_checkout',args);if(error)throw error;reviewed={args,signature:JSON.stringify(args),user:user.id,quote:data};showQuote(data);return reviewed}
async function prepare(){
 if(busy)return null;busy=true;
 try{
  const args=request(),{s,user}=await authenticated();
  const key='ddCheckoutRequest:'+user.id,signature=JSON.stringify(args);let saved=read(key,null);
  if(saved?.signature!==signature||saved.expires_at&&Date.parse(saved.expires_at)<=Date.now())saved=null;
  if(!saved&&(!reviewed||reviewed.user!==user.id||reviewed.signature!==signature)){await quote();return null}
  if(!saved){saved={signature,key:crypto.randomUUID(),quote_token:reviewed.quote.quote_token};localStorage.setItem(key,JSON.stringify(saved))}
  const {data,error}=await s.rpc('prepare_checkout',{...args,p_key:saved.key,p_quote_token:saved.quote_token});
  if(error){if(String(error.message).includes('PRICE_CHANGED')){localStorage.removeItem(key);reviewed=null;await quote()}if(String(error.message).includes('ORDER_EXPIRED')){localStorage.removeItem(key);reviewed=null}throw error}
  saved.order_id=data.order_id;saved.expires_at=data.expires_at;localStorage.setItem(key,JSON.stringify(saved));
  message(text('تم إنشاء الطلب بحجز مؤقت. لم يتم الدفع أو تأكيد التنفيذ بعد.','Order created with a temporary reservation. Payment and fulfillment are not yet confirmed.'));return data;
 }catch(e){message(friendly(e));return null}finally{busy=false}
}
function mount(){
 const pay=document.getElementById('payNow');if(!pay)return;const box=document.createElement('div');box.style.cssText='margin:14px 0;font-size:12px;line-height:1.8';
 const btn=document.createElement('button');btn.type='button';btn.textContent=text('مراجعة السعر الحالي','Review current price');btn.style.cssText='padding:10px 14px;border:1px solid #6B3540;border-radius:12px;background:#fff;color:#6B3540;cursor:pointer';
 const status=document.createElement('p');status.id='ddCheckoutStatus';status.setAttribute('role','status');status.textContent=text('السعر الظاهر من السلة يُراجع حسب الأسعار والتوفر الحاليين قبل إنشاء الطلب.','Cart prices are checked against current prices and availability before creating your order.');
 btn.onclick=async()=>{if(busy)return;busy=true;btn.disabled=true;try{await quote()}catch(e){reviewed=null;message(friendly(e))}finally{busy=false;btn.disabled=false}};box.append(btn,status);pay.before(box);
}
window.DDCheckout={prepare,quote};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
