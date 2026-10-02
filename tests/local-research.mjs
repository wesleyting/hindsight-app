import assert from 'node:assert/strict';
const base='http://127.0.0.1:5173';
const login=await fetch(base+'/signin-with-chatgpt?return_to=/',{redirect:'manual'});
const cookie=login.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
assert.ok(cookie);
async function call(path,options={}){return fetch(base+path,{...options,headers:{Cookie:cookie,'Content-Type':'application/json',...options.headers}});}
for(const path of ['/api/research?symbol=AAPL','/api/research/export?symbol=AAPL'])assert.equal((await fetch(base+path)).status,401);
assert.equal((await call('/api/research?symbol=..%2Fsecret')).status,400);
assert.equal((await call('/api/notes',{method:'POST',headers:{Origin:'https://untrusted.example'},body:JSON.stringify({symbol:'AAPL',text:'must not save'})})).status,403);
const r=await call('/api/research?symbol=AAPL');assert.equal(r.status,200);const data=await r.json();
assert.equal(data.market.symbol,'AAPL');assert.ok(data.market.closes.length>=2);assert.equal(data.cached,true);
const saved=data.analyses.find(a=>a.kind==='catchup');assert.ok(saved,'A live catch-up must already exist');
// Cache reuse was verified during live QA. This repeatable test never calls paid /api/chat.
const marker='QA temporary note '+crypto.randomUUID();let noteId;
try{
 const n=await call('/api/notes',{method:'POST',body:JSON.stringify({symbol:'AAPL',text:marker})});assert.equal(n.status,200);noteId=(await n.json()).note.id;
 const loaded=await(await call('/api/research?symbol=AAPL')).json();assert.ok(loaded.notes.some(n=>n.id===noteId&&n.text===marker));
 const exported=await call('/api/research/export?symbol=AAPL');assert.match(exported.headers.get('content-type'),/text\/markdown/);const md=await exported.text();assert.ok(md.includes(marker));assert.ok(md.includes(saved.answer));assert.ok(md.includes(saved.market.source));
 assert.equal((await call('/api/notes',{method:'POST',body:JSON.stringify({symbol:'AAPL',text:'x'.repeat(601)})})).status,400);
}finally{if(noteId)assert.equal((await call('/api/notes?id='+noteId,{method:'DELETE'})).status,200);}
console.log('Passed: real AAPL load, saved live catch-up, authentication, origin checks, ticker validation, note persistence/limits/cleanup, Markdown export.');
console.log('First live call token usage:',JSON.stringify(saved.usage));
