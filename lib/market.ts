export type NewsItem = { id: string; title: string; url: string; publisher: string; publishedAt: string; coverage: 'headline only' };
export type MarketSnapshot = {
 symbol: string; company: string; currency: string; exchange: string;
 fetchedAt: string; priceAsOf: string; startDate: string; endDate: string;
 closes: { date: string; close: number }[]; changePercent: number;
 news: NewsItem[]; warnings: string[]; source: string;
};
export function normalizeSymbol(value: string) {
 const symbol=value.trim().toUpperCase();
 if(!/^[A-Z0-9][A-Z0-9.^=-]{0,19}$/.test(symbol))throw new Error('Enter a valid ticker, such as AAPL or SHOP.TO.');
 return symbol;
}
export function safeSourceUrl(value: unknown): string|null {
 if(typeof value!=='string')return null;
 try { const u=new URL(value); return u.protocol==='https:'&&!u.username&&!u.password?u.href:null; } catch { return null; }
}
export function parseChart(raw: unknown, symbol: string, now=new Date()): Omit<MarketSnapshot,'news'|'warnings'> {
 const data=raw as {chart?:{result?:{meta?:Record<string,unknown>;timestamp?:number[];indicators?:{quote?:{close?:Array<number|null>}[]}}[]}};
 const result=data?.chart?.result?.[0];const meta=result?.meta;
 if(!meta||meta.symbol!==symbol||!Array.isArray(result?.timestamp))throw new Error('Ticker not found or Yahoo returned an unexpected symbol. Check the exchange suffix.');
 const values=result.indicators?.quote?.[0]?.close??[];
 const closes=result.timestamp.flatMap((time,i)=>{
  const close=values[i];
  return Number.isFinite(time)&&time*1000<=now.getTime()&&typeof close==='number'&&Number.isFinite(close)&&close>0?[{date:new Date(time*1000).toISOString(),close}]:[];
 }).sort((a,b)=>a.date.localeCompare(b.date)).slice(-6);
 if(closes.length<2)throw new Error('Not enough recent price observations to review this stock.');
 const marketTime=typeof meta.regularMarketTime==='number'?meta.regularMarketTime*1000:Date.parse(closes.at(-1)!.date);
 if(!Number.isFinite(marketTime)||marketTime>now.getTime()+60_000)throw new Error('Yahoo returned an invalid price timestamp.');
 return {symbol,company:String(meta.longName??meta.shortName??symbol).slice(0,160),currency:String(meta.currency??'Unknown'),exchange:String(meta.fullExchangeName??meta.exchangeName??'Unknown'),fetchedAt:now.toISOString(),priceAsOf:new Date(marketTime).toISOString(),startDate:closes[0].date,endDate:closes.at(-1)!.date,closes,changePercent:(closes.at(-1)!.close/closes[0].close-1)*100,source:`https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}/history/`};
}
export function parseNews(raw: unknown,symbol: string,now=new Date()): NewsItem[] {
 const news=(raw as {news?:unknown[]})?.news;
 if(!Array.isArray(news))throw new Error('Yahoo did not return a usable news feed.');
 const seen=new Set<string>();const items:NewsItem[]=[];
 for(const item of news){
  const n=item as {title?:unknown;link?:unknown;publisher?:unknown;providerPublishTime?:unknown;relatedTickers?:unknown};
  const url=safeSourceUrl(n.link);const stamp=typeof n.providerPublishTime==='number'?n.providerPublishTime*1000:NaN;
  if(!url||seen.has(url)||typeof n.title!=='string'||!Array.isArray(n.relatedTickers)||!n.relatedTickers.includes(symbol)||!Number.isFinite(stamp)||stamp>now.getTime()||stamp<now.getTime()-7*86400_000)continue;
  seen.add(url);items.push({id:`N${items.length+1}`,title:n.title.slice(0,300),url,publisher:String(n.publisher??'Unknown publisher').slice(0,100),publishedAt:new Date(stamp).toISOString(),coverage:'headline only'});
  if(items.length===8)break;
 }
 return items;
}
export async function fetchMarket(symbol: string,fetcher:typeof fetch=fetch):Promise<MarketSnapshot>{
 symbol=normalizeSymbol(symbol);const now=new Date();
 async function get(url:string){const r=await fetcher(url,{signal:AbortSignal.timeout(15_000),headers:{Accept:'application/json','User-Agent':'Hindsight/0.1 (personal stock research)'}});if(!r.ok)throw new Error(`Yahoo Finance returned HTTP ${r.status}. Please try again later.`);return r.json();}
 const [chart,news]=await Promise.allSettled([get(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`),get(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbol)}&quotesCount=0&newsCount=20`)]);
 if(chart.status!=='fulfilled'){console.warn('Yahoo chart request failed',chart.reason instanceof Error?chart.reason.message:'Unknown provider error');throw new Error('Could not load real prices from Yahoo Finance. No sample data will be substituted.');}
 const snapshot=parseChart(chart.value,symbol,now);const warnings=['Yahoo Finance data may be delayed. Latest daily observation may be an unfinished trading session. Price returns exclude dividends and fees; corporate actions can affect comparisons.'];
 let headlines:NewsItem[]=[];
 try{if(news.status==='rejected')throw news.reason;headlines=parseNews(news.value,symbol,now);}catch{warnings.push('News could not be loaded. A price move alone cannot explain the cause.');}
 if(!headlines.length)warnings.push('No matching headlines from the past seven days were returned.');
 if(now.getTime()-Date.parse(snapshot.priceAsOf)>4*86400_000)warnings.push('Price data is more than four days old; this review may be stale.');
 return {...snapshot,news:headlines,warnings};
}
