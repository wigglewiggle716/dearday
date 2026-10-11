'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const path=require('node:path');
const base=path.resolve(__dirname,'../../docs/email-automation');
const outbox=readFileSync(path.join(base,'STAGED_nonpayment_outbox.sql'),'utf8');
const events=readFileSync(path.join(base,'STAGED_authoritative_event_producers.sql'),'utf8');
test('staging SQL is deliberately kept outside active migrations',()=>{
  assert.match(base,/docs[\\/]email-automation$/);
  assert.match(outbox,/STAGING ONLY/);
  assert.match(events,/STAGING ONLY/);
});
test('four independent DB gates are default disabled',()=>{
  for(const group of ['orders','cancellations','partners','intake'])
    assert.match(outbox,new RegExp("'"+group+"',false"));
  assert.match(outbox,/if not private\.transactional_email_group_is_enabled\(/);
});
test('claim checks category gate and expires stuck lease attempts',()=>{
  assert.match(outbox,/where q\.attempt_count<5/);
  assert.match(outbox,/and private\.transactional_email_group_is_enabled\(/);
  assert.match(outbox,/RETRY_LIMIT_REACHED/);
  assert.match(outbox,/q\.lease_until<clock_timestamp\(\)/);
});
test('only three authoritative transition triggers are defined',()=>{
  const names=events.match(/create trigger [a-z_]+\n/g)||[];
  assert.equal(names.length,3);
  assert.match(events,/after update of status on public\.orders/);
  assert.match(events,/after insert on public\.cancellation_requests/);
  assert.match(events,/after insert or update of status on public\.cancellation_request_items/);
});
test('initial pending payment is never treated as a confirmed booking',()=>{
  assert.match(events,/new\.status='paid' and old\.status<>'pending_payment'/);
  assert.match(events,/new\.status='confirmed' and old\.status<>'paid'/);
  assert.match(events,/new\.status='completed' and old\.status<>'in_progress'/);
});
test('refund requires item-level audited completion and a positive approved amount',()=>{
  assert.match(events,/new\.status='refunded' and new\.refunded_at is not null/);
  assert.match(events,/coalesce\(v_amount,0\)>0/);
});
test('partner recipients must be active users linked to active partners',()=>{
  assert.match(events,/pu\.is_active=true/);
  assert.match(events,/prof\.is_active=true/);
  assert.match(events,/p\.status='active'/);
  assert.match(events,/email_confirmed_at is not null/);
});
test('payment received outbox is not overwritten',()=>{
  assert.doesNotMatch(events,/create trigger queue_payment_received_email/);
  assert.doesNotMatch(outbox,/drop table.*order_email_outbox/i);
});
