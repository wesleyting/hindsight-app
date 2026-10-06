import assert from 'node:assert/strict';
const base='http://127.0.0.1:5173';
const login=await fetch(base+'/signin-with-chatgpt?return_to=/',{redirect:'manual'});
const cookie=login.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
async function call(path,method='GET',body,headers={}){return fetch(base+path,{method,headers:{Cookie:cookie,'Content-Type':'application/json',...headers},body:body?JSON.stringify(body):undefined});}
assert.equal((await fetch(base+'/api/snapshots?symbol=TE')).status,401);
assert.equal((await call('/api/snapshots','POST',{}, {Origin:'https://untrusted.example'})).status,403);
const view=await(await call('/api/research?symbol=TE')).json();
const brief=view.analyses.find(a=>a.kind==='catchup');assert.ok(brief);
const prepared=brief.research?.prepared[0];
const input={symbol:'TE',name:'QA snapshot',briefId:brief.id,fetchedAt:view.market.fetchedAt,expanded:true,refreshFailed:view.market.warnings.some(w=>w.startsWith('Refresh failed')),selected:prepared?{id:brief.id,title:prepared.question,preparedQuestion:prepared.question}:null};
assert.equal((await call('/api/snapshots','POST',{...input,fetchedAt:'old'})).status,409);
assert.equal((await call('/api/snapshots','POST',{...input,briefId:crypto.randomUUID()})).status,404);
let id;
try{
 const created=await call('/api/snapshots','POST',input);assert.equal(created.status,201);const saved=(await created.json()).snapshot;id=saved.id;
 assert.deepEqual(saved.payload.market,view.market);assert.deepEqual(saved.payload.brief,brief);
 if(prepared)assert.equal(saved.payload.selected.answer,prepared.answer);
 assert.equal(saved.payload.expanded,true);
 assert.equal((await call('/api/snapshots','PATCH',{id,name:'Renamed snapshot'})).status,200);
 const reopened=(await(await call('/api/snapshots?id='+id)).json()).snapshot;
 assert.equal(reopened.name,'Renamed snapshot');assert.deepEqual(reopened.payload,saved.payload);
 assert.ok((await(await call('/api/snapshots?symbol=TE')).json()).snapshots.some(s=>s.id===id));
 assert.equal((await call('/api/snapshots','PATCH',{id,name:''})).status,400);
}finally{if(id){assert.equal((await call('/api/snapshots','DELETE',{id})).status,200);assert.equal((await call('/api/snapshots?id='+id)).status,404);}}
console.log('Passed snapshot authentication, origin, stale view checks, save/list/rename/reopen, content preservation, validation and cleanup. No AI calls.');
