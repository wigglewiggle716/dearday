'use strict';

// This module only resolves published Resend aliases; it never sends mail.
// Enqueue future messages only from authoritative server-side events, with
// durable idempotency and a default-OFF feature flag.
const EVENT_TEMPLATES = Object.freeze({
  booking_request_received: {ar:'dear-day-booking-received-ar', en:'dear-day-booking-received-en', required:['CUSTOMER_NAME','ORDER_NUMBER']},
  booking_confirmed:        {ar:'dear-day-booking-confirmed-ar', en:'dear-day-booking-confirmed-en', required:['CUSTOMER_NAME','ORDER_NUMBER']},
  order_in_progress:        {ar:'dear-day-order-in-progress-ar', en:'dear-day-order-in-progress-en', required:['CUSTOMER_NAME','ORDER_NUMBER']},
  order_completed:          {ar:'dear-day-order-completed-ar', en:'dear-day-order-completed-en', required:['CUSTOMER_NAME','ORDER_NUMBER']},
  cancellation_requested:  {ar:'dear-day-cancellation-requested-ar', en:'dear-day-cancellation-requested-en', required:['CUSTOMER_NAME','ORDER_NUMBER']},
  cancellation_update:     {ar:'dear-day-cancellation-update-ar', en:'dear-day-cancellation-update-en', required:['CUSTOMER_NAME','ORDER_NUMBER','CANCELLATION_STATUS','STATUS_DETAILS']},
  refund_completed:        {ar:'dear-day-refund-completed-ar', en:'dear-day-refund-completed-en', required:['CUSTOMER_NAME','ORDER_NUMBER','REFUND_AMOUNT']},
  partner_new_order:       {ar:'dear-day-partner-new-order-ar', en:'dear-day-partner-new-order-en', required:['PARTNER_NAME','ORDER_NUMBER']},
  partner_cancellation:    {ar:'dear-day-partner-cancellation-ar', en:'dear-day-partner-cancellation-en', required:['PARTNER_NAME','ORDER_NUMBER','CANCELLATION_STATUS','PARTNER_INSTRUCTIONS']},
  support_received:        {ar:'dear-day-support-received-ar', en:'dear-day-support-received-en', required:['CUSTOMER_NAME','TICKET_NUMBER']},
  partner_application:     {ar:'dear-day-partner-application-ar', en:'dear-day-partner-application-en', required:['CONTACT_NAME','COMPANY_NAME']}
});
const DEFERRED_EVENTS = Object.freeze(['payment_received']);
const LOCALES = Object.freeze(['ar','en']);

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function normalizeOrderNumber(value) {
  const raw=String(value??'').trim();
  if (/^\d{1,15}$/.test(raw)) return 'DD-'+raw.padStart(6,'0');
  if (/^DD-\d{1,15}$/.test(raw)) return raw;
  throw new Error('INVALID_ORDER_NUMBER');
}
function prepareTemplate({event,locale,variables}={}) {
  if (DEFERRED_EVENTS.includes(event)) throw new Error('EVENT_DEFERRED');
  const schema=EVENT_TEMPLATES[event];
  if (!schema) throw new Error('UNKNOWN_EMAIL_EVENT');
  if (!LOCALES.includes(locale)) throw new Error('INVALID_EMAIL_LOCALE');
  if (!variables || typeof variables!=='object' || Array.isArray(variables)) throw new Error('INVALID_EMAIL_VARIABLES');
  const out={};
  for(const key of schema.required) {
    const value=variables[key];
    if ((typeof value!=='string' && typeof value!=='number') || !String(value).trim()) {
      throw new Error('MISSING_EMAIL_VARIABLE_'+key);
    }
    const raw=String(value).trim();
    const limit=(key==='STATUS_DETAILS'||key==='PARTNER_INSTRUCTIONS')?1000:200;
    if (raw.length>limit) throw new Error('EMAIL_VARIABLE_TOO_LONG_'+key);
    out[key]=escapeHtml(key==='ORDER_NUMBER'?normalizeOrderNumber(raw):raw);
  }
  return {template:{id:schema[locale],variables:out}};
}
module.exports={EVENT_TEMPLATES,DEFERRED_EVENTS,prepareTemplate,normalizeOrderNumber};
