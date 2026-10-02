import { getChatGPTUser } from '@/app/chatgpt-auth';
import { normalizeSymbol } from '@/lib/market';
import { historyFor,notesFor,json } from '@/lib/research-store';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const user=await getChatGPTUser();if(!user)return json({error:'Sign in required'},401);
 let symbol:string;try{symbol=normalizeSymbol(new URL(request.url).searchParams.get('symbol')??'');}catch{return json({error:'Invalid ticker'},400);}
 try{const [analyses,notes]=await Promise.all([historyFor(user.userId,symbol),notesFor(user.userId,symbol)]);
 const lines=[`# Hindsight: ${symbol}`,`Exported ${new Date().toISOString()}`,'','AI assessments are not verified facts. Headlines are not full articles.','', '## Saved user notes',...notes.map(n=>`- ${n.text} (saved ${n.createdAt})`),'','## Recent analyses (up to 30)'];
 for(const a of analyses){lines.push('',`### ${a.createdAt} — ${a.kind}`,`Model: ${a.model}`,`Question: ${a.question}`,'',a.answer,'',`Price source [P]: ${a.market.source}`,`Price as of: ${a.market.priceAsOf}; retrieved: ${a.market.fetchedAt}`,...a.market.news.map(n=>`- [${n.id}] ${n.title} — ${n.publisher}, ${n.publishedAt}: ${n.url} (headline only)`));}
 return new Response(lines.join('\n'),{headers:{'Content-Type':'text/markdown; charset=utf-8','Content-Disposition':`attachment; filename="hindsight-${symbol}.md"`,'Cache-Control':'no-store'}});
 }catch{return json({error:'Could not export saved research.'},503);}
}
