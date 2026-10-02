import assert from 'node:assert/strict';
import { answerWithDeepSeek,SYSTEM_PROMPT } from '../lib/deepseek.ts';
const context={market:{symbol:'AAPL',company:'Apple Inc.',news:[{id:'N1',title:'Test headline',coverage:'headline only'}]},previousAnalysis:null,notes:[]};
const options={apiKey:'test-only',model:'deepseek-flash',context,messages:[{role:'user',content:'Why did it move?'}]};
const result=await answerWithDeepSeek({...options,fetcher:async(url,init)=>{
 assert.equal(url,'https://api.deepseek.com/chat/completions');const body=JSON.parse(init.body);
 assert.equal(body.max_tokens,1200);assert.equal(body.thinking.type,'disabled');assert.equal(body.messages[0].content,SYSTEM_PROMPT);
 assert.match(body.messages[1].content,/headline only/);assert.equal(body.messages.at(-1).content,'Why did it move?');
 return Response.json({choices:[{finish_reason:'stop',message:{content:'A headline reports a development. [N1]'}}],usage:{prompt_tokens:100,completion_tokens:20,prompt_cache_hit_tokens:64}});
}});
assert.equal(result.usage.inputTokens,100);assert.equal(result.usage.cachedInputTokens,64);
for(const status of [401,402,429,500])await assert.rejects(answerWithDeepSeek({...options,fetcher:async()=>new Response('private diagnostic',{status})}),e=>!e.message.includes('private diagnostic'));
for(const choice of [{finish_reason:'length',message:{content:'partial'}},{finish_reason:'stop',message:{content:''}},{finish_reason:'stop',message:{content:'Invented source [N99]'}}])await assert.rejects(answerWithDeepSeek({...options,fetcher:async()=>Response.json({choices:[choice]})}));
await assert.rejects(answerWithDeepSeek({...options,fetcher:async()=>{throw new Error('private network detail');}}),/could not be reached/);
console.log('Passed: provider request, source limits, token usage, rejected citations, incomplete answers, provider/network errors. No live API calls.');
