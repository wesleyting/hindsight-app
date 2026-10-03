import assert from 'node:assert/strict';
import { answerWithDeepSeek,SYSTEM_PROMPT } from '../lib/deepseek.ts';
import { newResearch } from '../lib/investigation.ts';
const context=()=>({market:{symbol:'AAPL',company:'Apple Inc.',news:[{id:'N1',title:'Test headline',coverage:'headline only'}]},previousAnalysis:null,notes:[],research:newResearch()});
const options={apiKey:'test-only',model:'deepseek-flash',messages:[{role:'user',content:'Why did it move?'}]};
const finish=(answer='A headline reports a development. [N1]',prepared=[])=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify({answer,prepared})}}],usage:{prompt_tokens:100,completion_tokens:20,prompt_cache_hit_tokens:64}});
const result=await answerWithDeepSeek({...options,context:context(),fetcher:async(url,init)=>{
 assert.equal(url,'https://api.deepseek.com/chat/completions');const body=JSON.parse(init.body);
 assert.equal(body.max_tokens,2400);assert.equal(body.thinking.type,'disabled');assert.equal(body.messages[0].content,SYSTEM_PROMPT);assert.equal(body.response_format.type,'json_object');
 assert.match(body.messages[1].content,/headline only/);assert.equal(body.messages.at(-1).content,'Why did it move?');return Response.json(finish());
}});
assert.equal(result.usage.inputTokens,100);assert.equal(result.usage.cachedInputTokens,64);
for(const status of [401,402,429,500])await assert.rejects(answerWithDeepSeek({...options,context:context(),fetcher:async()=>new Response('private diagnostic',{status})}),e=>!e.message.includes('private diagnostic'));
for(const payload of [{choices:[{finish_reason:'length',message:{content:'partial'}}]},finish(''),finish('Invented source [S99]'),finish('okay',[{question:'q',answer:'invented [C2]'}]),{choices:[{finish_reason:'stop',message:{content:'not json'}}]}])await assert.rejects(answerWithDeepSeek({...options,context:context(),fetcher:async()=>Response.json(payload)}));
let calls=0,reserved=0;
const researched=await answerWithDeepSeek({...options,context:context(),tavilyKey:'test-only',reserveCall:async()=>{reserved++;},fetcher:async(url,init)=>{
 if(url.includes('tavily'))return Response.json({results:[{title:'Actual report',url:'https://example.com/report',raw_content:'Evidence here.'}]});
 calls++;
 if(calls===1)return Response.json({choices:[{finish_reason:'tool_calls',message:{content:null,tool_calls:[{id:'tool1',type:'function',function:{name:'search_more',arguments:JSON.stringify({query:'contrary evidence',reddit:false})}}]}}],usage:{prompt_tokens:50}});
 const body=JSON.parse(init.body);assert.ok(body.messages.some(m=>m.role==='tool'&&m.content.includes('S1')));return Response.json(finish('Evidence supports a view. [S1]',[{question:'What could change it?',answer:'An unresolved alternative. [S1]'}]));
}});
assert.equal(reserved,2);assert.equal(researched.usage.inputTokens,150);assert.equal(researched.research.sources.length,1);assert.equal(researched.research.prepared.length,1);
await assert.rejects(answerWithDeepSeek({...options,context:context(),reserveCall:async()=>{throw new Error('quota');},fetcher:async()=>{assert.fail('must not call provider');}}),/quota/);
await assert.rejects(answerWithDeepSeek({...options,context:context(),fetcher:async()=>{throw new Error('private network detail');}}),/could not be reached/);
console.log('Passed: structured answers, citation validation, evidence tools, aggregate usage, quota reservation, provider failures. No live calls.');
