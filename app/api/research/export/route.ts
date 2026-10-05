import { getChatGPTUser } from '@/app/chatgpt-auth';
import { normalizeSymbol } from '@/lib/market';
import { historyFor,notesFor,json } from '@/lib/research-store';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const user=await getChatGPTUser();if(!user)return json({error:'Sign in required'},401);
 let symbol:string;try{symbol=normalizeSymbol(new URL(request.url).searchParams.get('symbol')??'');}catch{return json({error:'Invalid ticker'},400);}
 try{const [analyses,notes]=await Promise.all([historyFor(user.userId,symbol),notesFor(user.userId,symbol)]);
 const lines=[`# Hindsight: ${symbol}`,`Exported ${new Date().toISOString()}`,'','AI assessments are not verified facts. Source coverage varies; extracted text and Reddit samples may be incomplete.','', '## Saved user notes',...notes.map(n=>`- ${n.text} (saved ${n.createdAt})`),'','## Recent analyses (up to 30)'];
 for(const a of analyses){lines.push('',`### ${a.createdAt} — ${a.kind}`,`Model: ${a.model}`,`Question: ${a.question}`,'',a.answer,'',`Price source [P]: ${a.market.source}`,`Price as of: ${a.market.priceAsOf}; retrieved: ${a.market.fetchedAt}`,...a.market.news.map(n=>`- [${n.id}] ${n.title} — ${n.publisher}, ${n.publishedAt}: ${n.url} (headline only)`));if(a.research){if(a.research.brief)lines.push('', '#### At a glance',a.research.brief.takeaway,...(a.research.brief.risk?[`Future risk: ${a.research.brief.risk}`]:[]));lines.push('', '#### Prepared answers',...a.research.prepared.flatMap(q=>[q.question,q.answer,'']), '#### Research evidence',...a.research.sources.map(r=>`- [${r.id}] ${r.title}: ${r.url} (${r.coverage}; published ${r.publishedAt??'unknown'}; retrieved ${r.retrievedAt})`),...a.research.comparisons.map(c=>`- [${c.id}] ${c.symbol} ${c.returnPercent.toFixed(2)}% vs ${c.alternative} ${c.alternativeReturnPercent.toFixed(2)}%, ${c.start} to ${c.end}. ${c.limitations} ${c.source} ${c.alternativeSource}`),...a.research.gaps.map(g=>`- Coverage: ${g}`));}}
 return new Response(lines.join('\n'),{headers:{'Content-Type':'text/markdown; charset=utf-8','Content-Disposition':`attachment; filename="hindsight-${symbol}.md"`,'Cache-Control':'no-store'}});
 }catch{return json({error:'Could not export saved research.'},503);}
}
