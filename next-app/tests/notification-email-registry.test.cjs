'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {EVENT_TEMPLATES,prepareTemplate,normalizeOrderNumber}=require('../lib/notification-email-registry.cjs');

test('eleven supported events have Arabic and English published aliases',()=>{
  assert.equal(Object.keys(EVENT_TEMPLATES).length,11);
  for(const [event,schema] of Object.entries(EVENT_TEMPLATES)){
    const slug=event==='booking_request_received'?'booking-received':event.replaceAll('_','-');
    assert.equal(schema.ar,'dear-day-'+slug+'-ar',event);
    assert.equal(schema.en,'dear-day-'+slug+'-en',event);
    assert.ok(schema.required.length,event);
  }
});
test('Arabic booking receipt normalizes order number',()=>{
  const out=prepareTemplate({event:'booking_request_received',locale:'ar',variables:{CUSTOMER_NAME:'أحمد',ORDER_NUMBER:15}});
  assert.equal(out.template.id,'dear-day-booking-received-ar');
  assert.deepEqual(out.template.variables,{CUSTOMER_NAME:'أحمد',ORDER_NUMBER:'DD-000015'});
});
test('English partner order escapes untrusted input',()=>{
  const out=prepareTemplate({event:'partner_new_order',locale:'en',variables:{PARTNER_NAME:'A&B <Store>',ORDER_NUMBER:'DD-123456'}});
  assert.equal(out.template.id,'dear-day-partner-new-order-en');
  assert.equal(out.template.variables.PARTNER_NAME,'A&amp;B &lt;Store&gt;');
});
test('payment is blocked until a separately approved rollout',()=>{
  assert.throws(()=>prepareTemplate({event:'payment_received',locale:'en',variables:{}}),/EVENT_DEFERRED/);
});
test('missing cancellation details are rejected',()=>{
  assert.throws(()=>prepareTemplate({event:'cancellation_update',locale:'ar',variables:{CUSTOMER_NAME:'A',ORDER_NUMBER:1,CANCELLATION_STATUS:'review'}}),/MISSING_EMAIL_VARIABLE_STATUS_DETAILS/);
});
test('unknown locales and events are not silently accepted',()=>{
  assert.throws(()=>prepareTemplate({event:'order_completed',locale:'fr',variables:{}}),/INVALID_EMAIL_LOCALE/);
  assert.throws(()=>prepareTemplate({event:'account_approved',locale:'en',variables:{}}),/UNKNOWN_EMAIL_EVENT/);
});
test('bad numbers and long details are rejected',()=>{
  assert.throws(()=>normalizeOrderNumber('foo'),/INVALID_ORDER_NUMBER/);
  assert.throws(()=>prepareTemplate({event:'cancellation_update',locale:'ar',variables:{CUSTOMER_NAME:'A',ORDER_NUMBER:1,CANCELLATION_STATUS:'review',STATUS_DETAILS:'x'.repeat(1001)}}),/EMAIL_VARIABLE_TOO_LONG_STATUS_DETAILS/);
});
