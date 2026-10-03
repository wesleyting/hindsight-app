import { normalizeSymbol, safeSourceUrl, type MarketSnapshot } from './market.ts';
export type EvidenceSource={id:string;title:string;url:string;text:string;coverage:'extracted text'|'search excerpt';kind:'report'|'reddit';publishedAt:string|null;retrievedAt:string};
export type Comparison={id:string;symbol:string;alternative:string;requestedStart:string;start:string;end:string;currency:string;returnPercent:number;alternativeReturnPercent:number;differencePoints:number;source:string;alternativeSource:string;limitations:string};
export type ResearchBundle={version:number;sources:EvidenceSource[];gaps:string[];comparisons:Comparison[];prepared:{question:string;answer:string}[];searchedAt:string;searches:number};
export function newResearch():ResearchBundle{return {version:1,sources:[],gaps:[],comparisons:[],prepared:[],searchedAt:new Date().toISOString(),searches:0};}
export async function searchEvidence(key:string,query:string,reddit=false,fetcher:typeof fetch=fetch):Promise<EvidenceSource[]>{
 const response=await fetcher('https://api.tavily.com/search',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(20_000),body:JSON.stringify({query:query.slice(0,350),search_depth:'advanced',topic:'general',time_range:'week',max_results:3,include_raw_content:'text',include_answer:false,...(reddit?{include_domains:['reddit.com']}:{})})});
 if(!response.ok)throw new Error('Research search unavailable. Check Tavily configuration or credit.');
 const body=await response.json() as {results?:{title?:string;url?:string;content?:string;raw_content?:string;published_date?:string}[]};
 if(!Array.isArray(body.results))throw new Error('Research search returned no usable source list.');
 const now=new Date().toISOString();const seen=new Set<string>();
 return body.results.slice(0,3).flatMap(r=>{
  const url=safeSourceUrl(r.url);if(!url||seen.has(url))return [];
  const host=new URL(url).hostname;const isReddit=host==='reddit.com'||host.endsWith('.reddit.com');
  if(reddit&&(!isReddit||!new URL(url).pathname.includes('/comments/')))return [];
  const raw=typeof r.raw_content==='string'?r.raw_content.trim():'';const excerpt=typeof r.content==='string'?r.content.trim():'';
  if(!raw&&!excerpt)return [];seen.add(url);
  const published=Date.parse(r.published_date??'');
  return [{id:'',title:String(r.title??host).slice(0,250),url,text:raw?boundedPassages(raw,excerpt,query):excerpt.slice(0,3500),coverage:raw?'extracted text' as const:'search excerpt' as const,kind:isReddit?'reddit' as const:'report' as const,publishedAt:Number.isFinite(published)&&published<=Date.now()?new Date(published).toISOString():null,retrievedAt:now}];
 });
}
// Keep the provider's relevant excerpt plus nearby article passages, not pages of navigation.
export function boundedPassages(raw:string,excerpt:string,query:string){
 const terms=query.toLowerCase().match(/[a-z0-9]{4,}/g)??[];
 const paragraphs=raw.split(/\n\s*\n/).map((text,index)=>({text:text.trim(),index})).filter(p=>p.text.length>80&&!/^\[.*\]\(.*\)$/.test(p.text));
 const ranked=paragraphs.map(p=>({...p,score:terms.filter(term=>p.text.toLowerCase().includes(term)).length})).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,5).sort((a,b)=>a.index-b.index);
 return `Search-selected excerpt:\n${excerpt.slice(0,1000)}\n\nBounded extracted passages (not a complete article/thread):\n${ranked.map(p=>p.text.slice(0,1800)).join('\n\n')||raw}`.slice(0,3500);
}
export function addEvidence(bundle:ResearchBundle,sources:EvidenceSource[]){if(sources.some(s=>s.kind==='reddit'))bundle.gaps=bundle.gaps.filter(g=>!g.startsWith('No usable Reddit threads'));for(const source of sources){if(bundle.sources.length>=12)break;if(!bundle.sources.some(s=>s.url===source.url))bundle.sources.push({...source,id:`S${bundle.sources.length+1}`});}}
export async function gatherResearch(market:MarketSnapshot,key?:string,fetcher:typeof fetch=fetch){
 const bundle=newResearch();
 if(!key){bundle.gaps.push('Tavily is not configured; only Yahoo headlines are available. No article or Reddit investigation was performed.');return bundle;}
 const query=`${market.company} (${market.symbol})`;
 const results=await Promise.allSettled([searchEvidence(key,`${query} stock recent developments earnings company announcement reasons share price changed`,false,fetcher),searchEvidence(key,`${query} stock discussion bull bear concerns`,true,fetcher)]);
 bundle.searches=2;
 results.forEach((result,i)=>{if(result.status==='fulfilled')addEvidence(bundle,result.value);else bundle.gaps.push(i?'Public Reddit search failed.':'Article search failed. Check Tavily configuration or credit.');});
 if(!bundle.sources.some(s=>s.kind==='reddit'))bundle.gaps.push('No usable Reddit threads were retrieved. Do not infer Reddit sentiment.');
 bundle.gaps.push('Search covers a limited recent sample, not every source. Publication dates may be missing; extraction may omit context or comments. Reddit contributors are self-selected and may react to the price move.');
 return bundle;
}
// Matched dates and adjusted closes avoid comparing different sessions or split-distorted prices.
export async function compareStocks(symbol:string,alternative:string,start:string,fetcher:typeof fetch=fetch):Promise<Comparison>{
 symbol=normalizeSymbol(symbol);alternative=normalizeSymbol(alternative);
 if(symbol===alternative)throw new Error('Choose a different stock to compare.');
 const stamp=Date.parse(start+'T00:00:00Z');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!Number.isFinite(stamp)||new Date(stamp).toISOString().slice(0,10)!==start||stamp>Date.now()-86400_000||stamp<Date.now()-366*86400_000)throw new Error('Comparison needs a valid past start date within the last year.');
 async function chart(ticker:string){
  const url=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?period1=${Math.floor(stamp/1000)}&period2=${Math.floor(Date.now()/1000)}&interval=1d`;
  const response=await fetcher(url,{headers:{'User-Agent':'Hindsight/0.1 (personal stock research)'},signal:AbortSignal.timeout(15_000)});
  if(!response.ok)throw new Error('Comparison prices could not be retrieved.');
  const body=await response.json() as {chart?:{result?:{meta?:{symbol?:string;currency?:string};timestamp?:number[];indicators?:{adjclose?:{adjclose?:(number|null)[]}[]}}[]}};
  const data=body.chart?.result?.[0];if(data?.meta?.symbol!==ticker||!data.meta.currency)throw new Error('Comparison stock identity could not be verified.');
  const points=new Map<string,number>();
  data.timestamp?.forEach((time,i)=>{const value=data.indicators?.adjclose?.[0]?.adjclose?.[i];const day=new Date(time*1000).toISOString().slice(0,10);if(time*1000>=stamp&&day<new Date().toISOString().slice(0,10)&&typeof value==='number'&&Number.isFinite(value)&&value>0)points.set(day,value);});
  return {points,currency:data.meta.currency};
 }
 const [a,b]=await Promise.all([chart(symbol),chart(alternative)]);
 if(a.currency!==b.currency)throw new Error('Comparison requires stocks in the same currency; foreign exchange is not modeled.');
 const days=[...a.points.keys()].filter(day=>b.points.has(day)).sort();if(days.length<2)throw new Error('Not enough completed matching trading dates for a comparison.');
 const first=days[0],last=days.at(-1)!;
 const change=(points:Map<string,number>)=>(points.get(last)!/points.get(first)!-1)*100;
 return {id:'C1',symbol,alternative,requestedStart:start,start:first,end:last,currency:a.currency,returnPercent:change(a.points),alternativeReturnPercent:change(b.points),differencePoints:change(b.points)-change(a.points),source:`https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}/history/`,alternativeSource:`https://finance.yahoo.com/quote/${encodeURIComponent(alternative)}/history/`,limitations:'Hypothetical equal starting amounts, Yahoo adjusted daily closes, matched completed dates. Excludes fees, taxes and FX. Adjustments are provider-defined; not an execution backtest. A better subsequent return does not establish that a decision was better with the information available then.'};
}
