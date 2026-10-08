const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const calls=[];let rate=true;
const client={rpc:async(name,args)=>{calls.push({name,args});return {data:name==='allow_guest_checkout_attempt'?rate:{order_id:'fixture'}}}};
const ctx={module:{exports:{}},require:n=>n==='node:crypto'?require(n):{getSupabaseAdmin:()=>client},Buffer,Date,process:{env:{SUPABASE_SERVICE_ROLE_KEY:'test-secret-only'}}};
vm.runInNewContext(fs.readFileSync('api/checkout/guest.js','utf8'),ctx);
const handler=ctx.module.exports;
async function run(overrides={}){let code=200,body,headers={};await handler({method:'POST',headers:{origin:'https://dear-day.com','content-type':'application/json','x-vercel-forwarded-for':'192.0.2.1'},body:{p_key:'11111111-1111-4111-8111-111111111111',p_guest:'attacker'},...overrides},{setHeader:(k,v)=>headers[k]=v,status(n){code=n;return this},json(v){body=v;return this}});return {code,body,headers}}
(async()=>{
 const a=await run();assert.equal(a.code,200);assert.notEqual(calls.at(-1).args.p_guest,'attacker');assert.match(a.headers['Set-Cookie'],/HttpOnly; SameSite=Strict/);
 const cookie=a.headers['Set-Cookie'].split(';')[0];const one=handler.guestCookie(cookie,'test-secret-only'),two=handler.guestCookie(cookie,'test-secret-only');assert.equal(one.id,two.id);
 assert.notEqual(handler.guestCookie(cookie+'tampered','test-secret-only').id,one.id);
 assert.equal((await run({headers:{origin:'https://evil.example','content-type':'application/json'}})).code,403);
 rate=false;assert.equal((await run()).code,429);
 console.log('PASS guest cookie, origin, server identity and rate boundary');
})().catch(e=>{console.error(e);process.exitCode=1});
