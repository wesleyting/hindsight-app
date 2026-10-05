import assert from 'node:assert/strict';
import { answerWithDeepSeek,SYSTEM_PROMPT } from '../lib/deepseek.ts';
import { newResearch } from '../lib/investigation.ts';
const context=()=>({market:{symbol:'AAPL',company:'Apple Inc.',news:[{id:'N1',title:'Test headline',coverage:'headline only'}]},previousAnalysis:null,notes:[],research:newResearch()});
const options={apiKey:'test-only',model:'deepseek-flash',messages:[{role:'user',content:'Why did it move?'}]};
const finish=(answer='A headline reports a development. [N1]',prepared=[])=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify({answer,prepared})}}],usage:{prompt_tokens:100,completion_tokens:20,prompt_cache_hit_tokens:64}});
const result=await answerWithDeepSeek({...options,context:context(),fetcher:async(url,init)=>{
 assert.equal(url,'https://api.deepseek.com/chat/completions');const body=JSON.parse(init.body);
 assert.equal(body.max_tokens,3200);assert.equal(body.thinking.type,'disabled');assert.equal(body.messages[0].content,SYSTEM_PROMPT);assert.equal(body.response_format.type,'json_object');
 assert.match(body.messages[1].content,/headline only/);assert.equal(body.messages.at(-1).content,'Why did it move?');return Response.json(finish());
}});
assert.equal(result.usage.inputTokens,100);assert.equal(result.usage.cachedInputTokens,64);
for(const status of [401,402,429,500])await assert.rejects(answerWithDeepSeek({...options,context:context(),fetcher:async()=>new Response('private diagnostic',{status})}),e=>!e.message.includes('private diagnostic'));
for(const payload of [{choices:[{finish_reason:'length',message:{content:'partial'}}]},finish(''),finish('Invented source [S99]'),{choices:[{finish_reason:'stop',message:{content:'not json'}}]}])await assert.rejects(answerWithDeepSeek({...options,context:context(),fetcher:async()=>Response.json(payload)}));
let calls=0,reserved=0;
const researched=await answerWithDeepSeek({...options,context:context(),tavilyKey:'test-only',reserveCall:async()=>{reserved++;},fetcher:async(url,init)=>{
 if(url.includes('tavily'))return Response.json({results:[{title:'Apple Inc. report',url:'https://example.com/report',raw_content:'Evidence here.'}]});
 calls++;
 if(calls===1)return Response.json({choices:[{finish_reason:'tool_calls',message:{content:null,tool_calls:[{id:'tool1',type:'function',function:{name:'search_more',arguments:JSON.stringify({query:'contrary evidence',reddit:false})}}]}}],usage:{prompt_tokens:50}});
 const body=JSON.parse(init.body);assert.ok(body.messages.some(m=>m.role==='tool'&&m.content.includes('S1')));return Response.json(finish('Evidence supports a view. [S1]',[{question:'Next milestone',answer:'An unresolved alternative. [S1]'}]));
}});
assert.equal(reserved,2);assert.equal(researched.usage.inputTokens,150);assert.equal(researched.research.sources.length,1);assert.equal(researched.research.prepared.length,1);
await assert.rejects(answerWithDeepSeek({...options,context:context(),reserveCall:async()=>{throw new Error('quota');},fetcher:async()=>{assert.fail('must not call provider');}}),/quota/);
await assert.rejects(answerWithDeepSeek({...options,context:context(),fetcher:async()=>{throw new Error('private network detail');}}),/could not be reached/);
console.log('Passed: structured answers, citation validation, evidence tools, aggregate usage, quota reservation, provider failures. No live calls.');

// Optional suggestions and writing style must never discard a valid main answer.
const generous=await answerWithDeepSeek({...options,context:context(),fetcher:async()=>Response.json(finish('Useful context '.repeat(250)+'[P]',[{question:'Bad suggestion',answer:'Unsupported [C2]'}]))});
assert.equal(generous.research.prepared.length,0);assert.ok(generous.answer.length>1000);
let rounds=0,repairsReserved=0;
const repaired=await answerWithDeepSeek({...options,context:context(),tavilyKey:'test',reserveCall:async()=>{repairsReserved++;},fetcher:async(url,init)=>{
 if(url.includes('tavily'))return Response.json({results:[]});
 rounds++;const body=JSON.parse(init.body);
 if(rounds<=2)return Response.json({choices:[{finish_reason:'tool_calls',message:{content:null,tool_calls:[{id:'call'+rounds,type:'function',function:{name:'search_more',arguments:JSON.stringify({query:'public company developments',reddit:false})}}]}}]});
 assert.equal(body.tools,undefined);
 if(rounds===3)return Response.json({choices:[{finish_reason:'stop',message:{content:'invalid json'}}]});
 return Response.json(finish('A complete answer [N1]'));
}});
assert.equal(rounds,4);assert.equal(repairsReserved,4);assert.match(repaired.answer,/complete answer/);
console.log('Passed: long valid answers survive, invalid optional suggestions are omitted, and two tool rounds leave room for final-format repair.');

const briefContext=context();briefContext.research.sources.push({id:'S1',title:'Apple announcement',kind:'report',coverage:'extracted text',text:'Company disclosure',url:'https://example.com/a'});
const concise=await answerWithDeepSeek({...options,context:briefContext,fetcher:async()=>Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({answer:'Details [S1]',brief:{takeaway:'Funding supports the factory. [S1]',risk:'More shares could reduce existing stakes. [S1]',upside:'New capacity could support sales. [S1]'},prepared:[{question:'Funding risk',answer:'Debt could become shares. [S1]'},{question:'Reddit sentiment',answer:'No evidence [S1]'},{question:'Unsupported topic',answer:'No source.'}]})}}]})});
assert.equal(concise.research.brief.upside,'New capacity could support sales. [S1]');assert.equal(concise.research.brief.takeaway,'Funding supports the factory. [S1]');assert.equal(concise.research.prepared.length,1);assert.equal(concise.research.prepared[0].question,'Funding risk');
console.log('Passed: structured takeaway/risk and evidence-backed topic filtering without Reddit suggestions.');

let missingBriefCalls=0;
const restored=await answerWithDeepSeek({...options,context:structuredClone(briefContext),kind:'catchup',fetcher:async()=>{missingBriefCalls++;return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({answer:'Complete details [S1]',prepared:[],...(missingBriefCalls>1?{brief:{takeaway:'Funding supports construction. [S1]'}}:{})})}}]});}});
assert.equal(missingBriefCalls,2);assert.ok(restored.research.brief);
console.log('Passed: omitted brief is repaired within the existing model budget.');

await answerWithDeepSeek({...options,context:context(),investigate:true,tavilyKey:'test',fetcher:async(url,init)=>{assert.equal(JSON.parse(init.body).tool_choice.function.name,'search_more');return Response.json(finish());}});
console.log('Passed: Look deeper explicitly requests a fresh research tool call.');
