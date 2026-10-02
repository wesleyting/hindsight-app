import { getChatGPTUser } from '@/app/chatgpt-auth';
import { env } from 'cloudflare:workers';
import { z } from 'zod';
import { normalizeSymbol } from '@/lib/market';
import { answerWithDeepSeek,PROMPT_VERSION } from '@/lib/deepseek';
import { database,marketFor,historyFor,notesFor,hashContext,json,validOrigin,analysisFromRow,type AnalysisRow } from '@/lib/research-store';
export const dynamic='force-dynamic';
const input=z.object({symbol:z.string().max(20),kind:z.enum(['catchup','question']),question:z.string().trim().max(1500).optional(),fetchedAt:z.string().datetime()}).strict();
export async function GET(){return json({provider:'deepseek',configured:Boolean(env.DEEPSEEK_API_KEY?.trim()),dataMode:'real',dailyLimit:30});}
export async function POST(request:Request){
 const user=await getChatGPTUser();if(!user)return json({error:'Sign in to ask DeepSeek.'},401);
 if(!validOrigin(request))return json({error:'Invalid origin'},403);
 if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'JSON required'},415);
 const raw=await request.text();if(raw.length>5000)return json({error:'Question is too long.'},413);
 let value;try{value=input.safeParse(JSON.parse(raw));}catch{return json({error:'Invalid JSON'},400);}
 if(!value.success)return json({error:'Invalid question'},400);
 let symbol:string;try{symbol=normalizeSymbol(value.data.symbol);}catch{return json({error:'Invalid ticker'},400);}
 const {kind,fetchedAt}=value.data;
 const question=kind==='catchup'?'Catch me up on this stock. What happened, what might explain it, and what should I watch? Compare with the previous saved assessment if one exists.':value.data.question;
 if(!question)return json({error:'Write a question first.'},400);
 let token:string|undefined;
 try{
  const db=database();
  const {market}=await marketFor(symbol);
  if(market.fetchedAt!==fetchedAt)return json({error:'The market context changed. Refresh this stock before asking again.'},409);
  const [history,notes]=await Promise.all([historyFor(user.userId,symbol),notesFor(user.userId,symbol)]);
  const model=env.DEEPSEEK_MODEL||'deepseek-flash';
  const {fetchedAt:_,...stableMarket}=market;
  const hash=await hashContext({market:stableMarket,notes:notes.map(n=>n.text),model,promptVersion:PROMPT_VERSION,kind,question});
  // A saved catch-up is free to reopen; conversation questions are always contextual.
  if(kind==='catchup'){
   const cached=await db.prepare('SELECT * FROM analyses WHERE user_id=? AND symbol=? AND context_hash=? AND created_at>? ORDER BY created_at DESC LIMIT 1').bind(user.userId,symbol,hash,new Date(Date.now()-6*3600_000).toISOString()).first<AnalysisRow>();
   if(cached)return json({analysis:analysisFromRow(cached),cached:true});
  }
  const apiKey=env.DEEPSEEK_API_KEY?.trim();if(!apiKey)return json({error:'Add DEEPSEEK_API_KEY to .dev.vars and restart the server. Real market data and saved notes work without it.'},503);
  const lockToken=crypto.randomUUID();
  const lock=await db.prepare('INSERT INTO ai_locks(user_id,token,expires_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET token=excluded.token,expires_at=excluded.expires_at WHERE ai_locks.expires_at<? RETURNING token').bind(user.userId,lockToken,Date.now()+90_000,Date.now()).first<{token:string}>();
  if(!lock)return json({error:'An answer is already being prepared. Please wait.'},429);token=lockToken;
  const usage=await db.prepare('INSERT INTO ai_usage(user_id,day,count) VALUES(?,?,1) ON CONFLICT(user_id,day) DO UPDATE SET count=count+1 WHERE count<30 RETURNING count').bind(user.userId,new Date().toISOString().slice(0,10)).first();
  if(!usage)return json({error:'Daily limit reached (30 AI requests per account, reset at midnight UTC). Saved research is still available.'},429);
  const previous=history.find(a=>a.kind==='catchup');
  const context={market,previousAnalysis:previous?{createdAt:previous.createdAt,answer:previous.answer.slice(0,2500)}:null,notes:notes.map(n=>({text:n.text,createdAt:n.createdAt}))};
  const recent=kind==='question'?history.filter(a=>a.kind==='question').slice(0,2).reverse().flatMap(a=>[{role:'user' as const,content:a.question},{role:'assistant' as const,content:a.answer.slice(0,2000)}]):[];
  const result=await answerWithDeepSeek({apiKey,model,context,messages:[...recent,{role:'user',content:question}]});
  const analysis={id:crypto.randomUUID(),symbol,kind,question,answer:result.answer,createdAt:new Date().toISOString(),model,market,usage:result.usage};
  await db.prepare('INSERT INTO analyses(id,user_id,symbol,kind,question,answer,context_hash,market,model,usage,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(analysis.id,user.userId,symbol,kind,question,result.answer,hash,JSON.stringify(market),model,JSON.stringify(result.usage),analysis.createdAt).run();
  return json({analysis,cached:false});
 }catch(error){const message=error instanceof Error?error.message:'';return json({error:message.startsWith('DeepSeek')?message:'Could not complete and save this analysis. Check the connection and database before retrying.'},502);}
 finally{if(token)await database().prepare('DELETE FROM ai_locks WHERE user_id=? AND token=?').bind(user.userId,token).run().catch(()=>{});}
}
