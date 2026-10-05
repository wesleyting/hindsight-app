"use client";
import { useEffect, useRef, useState } from 'react';
import { ArrowUp, RefreshCw, X } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { ResearchView, SavedAnalysis } from '@/lib/research-types';
import type { MarketSnapshot } from '@/lib/market';
const date=(value:string)=>new Date(value).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});
const percent=(value:number)=>`${value>=0?'+':''}${value.toFixed(2)}%`;
type SelectedAnswer={analysis:SavedAnalysis;title:string;answer:string};
export default function ReviewApp(){
 const [ticker,setTicker]=useState(''),[data,setData]=useState<ResearchView|null>(null);
 const [recent,setRecent]=useState<string[]>([]),[configured,setConfigured]=useState(false);
 const [auth,setAuth]=useState(false),[loading,setLoading]=useState(false),[busy,setBusy]=useState(false);
 const [error,setError]=useState(''),[status,setStatus]=useState(''),[question,setQuestion]=useState('');
 const [selected,setSelected]=useState<SelectedAnswer|null>(null),[pending,setPending]=useState('');
 const [expanded,setExpanded]=useState(false);
 const [panel,setPanel]=useState<'history'|'sources'|'setup'|null>(null);
 const [sourceAnalysis,setSourceAnalysis]=useState<SavedAnalysis|null>(null);
 const sequence=useRef(0),aiBusy=useRef(false);
 useEffect(()=>{
  fetch('/api/chat').then(r=>r.json()).then(body=>setConfigured((body as {configured?:boolean}).configured===true)).catch(()=>{});
  try{const saved=JSON.parse(localStorage.getItem('hindsight-real-stocks')||'[]');if(Array.isArray(saved)){const valid=saved.filter(s=>typeof s==='string'&&/^[A-Z0-9][A-Z0-9.^=-]{0,19}$/.test(s)).slice(0,10);setRecent(valid);if(valid[0])void openStock(valid[0]);}}catch{}
 },[]);
 async function openStock(symbol:string,refresh=false){
  if(aiBusy.current)return;
  const normalized=symbol.trim().toUpperCase();
  if(!/^[A-Z0-9][A-Z0-9.^=-]{0,19}$/.test(normalized)){setError('Enter a ticker, such as AAPL or SHOP.TO.');return;}
  const current=++sequence.current;
  setLoading(true);setError('');setStatus('');setData(null);setQuestion('');setSelected(null);setExpanded(false);setPanel(null);setSourceAnalysis(null);
  try{
   const response=await fetch(`/api/research?symbol=${encodeURIComponent(normalized)}${refresh?'&refresh=1':''}`);
   const body=await response.json() as ResearchView&{error?:string};if(current!==sequence.current)return;
   if(!response.ok){if(response.status===401)setAuth(true);throw new Error(body.error||'Could not load this stock.');}
   setAuth(false);setData(body);setTicker('');
   setRecent(previous=>{const next=[normalized,...previous.filter(s=>s!==normalized)].slice(0,10);try{localStorage.setItem('hindsight-real-stocks',JSON.stringify(next));}catch{}return next;});
  }catch(e){if(current===sequence.current)setError((e as Error).message);}
  finally{if(current===sequence.current)setLoading(false);}
 }
 async function ask(kind:'catchup'|'question',text=question,deeper=false,title=text){
  if(!data||aiBusy.current||(!text.trim()&&kind==='question'))return;
  const current=sequence.current,symbol=data.market.symbol;
  aiBusy.current=true;setBusy(true);setError('');setStatus('');setPending(kind==='catchup'?'Updating your catch-up':title);setSelected(null);
  try{
   const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({symbol,kind,deeper,question:kind==='question'?text:undefined,fetchedAt:data.market.fetchedAt})});
   const body=await response.json() as {analysis:SavedAnalysis;cached:boolean;error?:string};if(current!==sequence.current)return;
   if(!response.ok){if(response.status===401)setAuth(true);throw new Error(body.error||'Could not answer. Please retry.');}
   setData(previous=>previous?{...previous,analyses:[body.analysis,...previous.analyses.filter(a=>a.id!==body.analysis.id)].slice(0,30)}:previous);
   if(kind==='catchup')setExpanded(false);
   if(kind==='question')setSelected({analysis:body.analysis,title,answer:body.analysis.answer});
   setQuestion(previous=>previous===text?'':previous);setStatus(body.cached?'Your saved catch-up is still current.':'Saved.');
  }catch(e){if(current===sequence.current)setError((e as Error).message);}
  finally{aiBusy.current=false;setBusy(false);setPending('');}
 }
 const latest=data?.analyses.find(a=>a.kind==='catchup');
 function showSources(analysis:SavedAnalysis){setSourceAnalysis(analysis);setPanel('sources');}
 return <SidebarProvider defaultOpen={false}><Sidebar className="app-sidebar"><SidebarHeader><a className="brand" href="/">hindsight.</a></SidebarHeader><SidebarContent><p className="sidebar-label">YOUR STOCKS</p>{recent.map(symbol=><button className="stock-nav" disabled={busy} key={symbol} onClick={()=>void openStock(symbol)}><strong>{symbol}</strong></button>)}</SidebarContent><SidebarFooter><button className="small muted" onClick={()=>setPanel('setup')}>Sources & setup</button></SidebarFooter></Sidebar>
 <SidebarInset className="app-main"><header className="topbar"><div className="brand-row"><SidebarTrigger/><a href="/">hindsight<span>.</span></a></div><button className="small muted" onClick={()=>setPanel('setup')}>About the data</button></header>
 <main className="conversation-workspace simple-workspace">
 <form className="ticker-form" onSubmit={e=>{e.preventDefault();void openStock(ticker);}}><label htmlFor="ticker">Find a stock</label><div><input id="ticker" value={ticker} onChange={e=>setTicker(e.target.value)} placeholder="Search a ticker…" maxLength={20} autoComplete="off" spellCheck={false}/><Button disabled={loading||busy||!ticker.trim()} type="submit">Open</Button></div></form>
 {!!recent.length&&<nav className="stock-shortcuts" aria-label="Your stocks">{recent.map(symbol=><button key={symbol} aria-pressed={data?.market.symbol===symbol} disabled={busy||loading} onClick={()=>void openStock(symbol)}>{symbol}</button>)}</nav>}
 {error&&<div className="notice" role="alert">{error}{auth&&<a href="/signin-with-chatgpt?return_to=/">Sign in locally</a>}</div>}
 {loading&&<p role="status" className="muted">Opening your stock…</p>}
 {!data&&!loading&&<section className="welcome"><h1>What did you miss?</h1><p>Open a stock. Get the important part. Ask if you want more.</p></section>}
 {data&&<>
 <section className="stock-overview"><div className="stock-heading"><h1>{data.market.symbol} <span>{data.market.company}</span></h1><Button variant="ghost" size="icon" aria-label="Refresh prices" disabled={busy} onClick={()=>void openStock(data.market.symbol,true)}><RefreshCw size={16}/></Button></div><PriceBlock market={data.market}/>{data.market.warnings.filter(w=>w.startsWith('Refresh failed')||w.startsWith('Price data is more')).map(w=><p className="notice" key={w}>{w}</p>)}</section>
 <section className="brief-card"><div className="section-heading"><h2>What matters</h2><button className="text-action" disabled={busy||!configured} onClick={()=>void ask('catchup')}>{latest?'Update catch-up':'Catch me up'}</button></div>
 {latest?<>{latest.research?.brief?<div className="plain-brief"><Answer analysis={{...latest,answer:latest.research.brief.takeaway}}/>{latest.research.brief.risk&&<div className="brief-risk"><span className="small muted">Future risk</span><Answer analysis={{...latest,answer:latest.research.brief.risk}}/></div>}</div>:<div className="plain-brief"><Answer analysis={latest}/></div>}
 <div className="brief-actions">{latest.research?.brief&&<button className="text-action" aria-expanded={expanded} onClick={()=>setExpanded(value=>!value)}>{expanded?'Less detail':'More detail'}</button>}<button className="text-action" onClick={()=>showSources(latest)}>Sources</button><span className="small muted">{date(latest.createdAt)}</span></div>{expanded&&latest.research?.brief&&<div className="inline-detail"><Answer analysis={latest}/></div>}</>:<p className="muted small">{configured?'Get a short explanation based on recent research.':'Connect DeepSeek in local setup to create a catch-up.'}</p>}

 </section>
 {latest?.research?.version===2&&!!latest.research.prepared.length&&<section className="question-options" aria-label="Prepared questions"><p className="small muted">I want to know more about…</p><div className="suggestions">{latest.research.prepared.map(q=><button disabled={busy} key={q.question} aria-pressed={selected?.title===q.question} onClick={()=>{setSelected({analysis:latest,title:q.question,answer:q.answer});setStatus('Opened a saved answer.');}}>{q.question}<span>Open explanation →</span></button>)}</div></section>}
 {(busy||selected)&&<section className="focus-answer" aria-live="polite" aria-label="Selected answer"><div className="section-heading"><h2>{busy?pending:selected?.title}</h2>{!busy&&<Button variant="ghost" size="icon" aria-label="Close answer" onClick={()=>setSelected(null)}><X size={16}/></Button>}</div>{busy?<p role="status" className="small muted">Checking evidence and preparing your answer…</p>:selected&&<><div className="answer-scroll" tabIndex={0}><Answer analysis={{...selected.analysis,answer:selected.answer}}/></div><div className="brief-actions"><button className="text-action" onClick={()=>showSources(selected.analysis)}>Sources used</button><button className="text-action" disabled={!configured} onClick={()=>void ask('question',`Look deeper into ${selected.title} for ${data.market.company}. Investigate the specific issue explained here: ${selected.answer.slice(0,650)}. Use fresh company-relevant reports, distinguish confirmed facts from possible risks, and explain it simply.`,true,selected.title)}>Look deeper · new research</button></div></>}</section>}
 <div className="workspace-footer"><button className="text-action" onClick={()=>setPanel('history')}>Past answers</button><a className="text-action" href={`/api/research/export?symbol=${encodeURIComponent(data.market.symbol)}`} download>Export</a></div>
 <section className="ask-section compact-composer"><form className="composer" onSubmit={e=>{e.preventDefault();void ask('question');}}><label className="sr-only" htmlFor="question-input">Ask about {data.market.company}</label><Textarea id="question-input" value={question} maxLength={1500} onChange={e=>setQuestion(e.target.value)} placeholder={`Ask about ${data.market.symbol}…`} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();e.currentTarget.form?.requestSubmit();}}}/><div className="composer-footer"><span>{busy?'Research in progress':'Send to research a new question'}</span><Button type="submit" size="icon" aria-label="Research question" disabled={busy||!configured||!question.trim()}><ArrowUp size={18}/></Button></div></form><p role="status" className="save-status">{status}</p></section>
 </>}
 </main></SidebarInset>
 <Sheet open={panel!==null} onOpenChange={open=>{if(!open)setPanel(null);}}><SheetContent className="detail-sheet"><SheetHeader><SheetTitle>{panel==='history'?'Past answers':panel==='sources'?'Evidence':'Sources & setup'}</SheetTitle><SheetDescription>{panel==='history'?'Open one saved answer at a time.':panel==='sources'?'What was available when this answer was written.':'Real data, with limits.'}</SheetDescription></SheetHeader><div className="sheet-body">
 {panel==='history'&&data&&<>{data.analyses.length?data.analyses.map(a=><button className="history-choice" key={a.id} onClick={()=>{setSelected({analysis:a,title:a.kind==='catchup'?'Saved catch-up':a.question,answer:a.answer});setPanel(null);}}><strong>{a.kind==='catchup'?'Catch-up':a.question}</strong><span>{date(a.createdAt)}</span></button>):<p>No saved answers yet.</p>}{data.notes.length>0&&<details><summary>Previously saved notes</summary><p className="small">These notes are still included in research.</p>{data.notes.map(n=><div className="saved-note" key={n.id}><p>{n.text}</p><button onClick={async()=>{const r=await fetch(`/api/notes?id=${encodeURIComponent(n.id)}`,{method:'DELETE'});if(r.ok)setData(prev=>prev?{...prev,notes:prev.notes.filter(note=>note.id!==n.id)}:prev);else setError('Could not remove note.');}}>Remove</button></div>)}</details>}</>}
 {panel==='sources'&&sourceAnalysis&&<Sources market={sourceAnalysis.market} research={sourceAnalysis.research}/>}
 {panel==='setup'&&<><p>Yahoo Finance supplies prices. Tavily retrieves company-specific article passages. Reddit and social-media sources are disabled because we could not reliably verify their relevance. Coverage can be incomplete, and prices may be delayed.</p><p>DeepSeek explains the evidence. Your questions, saved context and retrieved text are sent to it. Answers and sources are saved locally. AI can misinterpret evidence.</p><p>Opening a saved answer makes no API call. New research uses at most four model calls, including formatting repair, and four searches. The daily limit is 30 model calls. Nothing runs automatically in the background.</p><p>{configured?'DeepSeek is configured.':'Set DEEPSEEK_API_KEY and TAVILY_API_KEY in the ignored .dev.vars file, then restart.'}</p><a href="/signin-with-chatgpt?return_to=/">Local sign-in</a></>}
 </div></SheetContent></Sheet></SidebarProvider>;
}
function PriceBlock({market}:{market:MarketSnapshot}){
 const prices=market.closes.map(p=>p.close),low=Math.min(...prices),high=Math.max(...prices),range=high-low||1;
 const points=prices.map((price,i)=>`${4+i/(prices.length-1)*212},${44-(price-low)/range*38}`).join(' ');
 return <div className="compact-price"><div><p className="price-numbers">{prices[0].toFixed(2)} <span aria-hidden="true">→</span> {prices.at(-1)!.toFixed(2)} <strong className={market.changePercent>=0?'positive':'negative'}>{percent(market.changePercent)}</strong></p><p className="small muted">{market.currency} · {new Date(market.startDate).toLocaleDateString()}–{new Date(market.endDate).toLocaleDateString()} · May be delayed</p></div><svg viewBox="0 0 220 50" role="img" aria-label={`Price trend, ${percent(market.changePercent)} across shown dates`} className={market.changePercent>=0?'positive':'negative'}><polyline points={points} fill="none" stroke="currentColor" strokeWidth="2"/></svg></div>;
}
function Answer({analysis}:{analysis:SavedAnalysis}){
 const sources:Record<string,string>={P:analysis.market.source,...Object.fromEntries(analysis.market.news.map(n=>[n.id,n.url])),...Object.fromEntries((analysis.research?.sources??[]).map(n=>[n.id,n.url])),...Object.fromEntries((analysis.research?.comparisons??[]).map(n=>[n.id,n.alternativeSource]))};
 return <p className="generated-answer">{analysis.answer.split(/(\[(?:P|[NSC]\d+)\])/g).map((part,i)=>{const key=part.slice(1,-1);return /^\[(P|[NSC]\d+)\]$/.test(part)&&sources[key]?<a key={i} href={sources[key]} target="_blank" rel="noreferrer">{part}</a>:part;})}</p>;
}
function Sources({market,research}:{market:MarketSnapshot;research?:SavedAnalysis['research']}){return <div className="sources">{research&&<><p className="small muted">Investigated {date(research.searchedAt)}. Search and extracted text may be incomplete.</p>{research.gaps.map((gap,i)=><p className="small muted" key={i}>{gap}</p>)}{research.sources.map(source=><div className="source-record" key={source.id}><a href={source.url} target="_blank" rel="noreferrer">[{source.id}] {source.title}</a><p>{source.kind==='reddit'?'Public Reddit sample':'Web source'} · {source.coverage} · {source.publishedAt?date(source.publishedAt):'Publication date unavailable'} · Retrieved {date(source.retrievedAt)}</p><details><summary>Text available to the AI</summary><p className="small" style={{whiteSpace:'pre-wrap'}}>{source.text}</p></details></div>)}{research.comparisons.map(c=><div className="source-record" key={c.id}><p>[{c.id}] {c.start} to {c.end}: {c.symbol} {percent(c.returnPercent)} vs {c.alternative} {percent(c.alternativeReturnPercent)}. Difference: {c.differencePoints.toFixed(2)} percentage points.</p><p>{c.limitations}</p><a href={c.source} target="_blank" rel="noreferrer">{c.symbol} prices</a> · <a href={c.alternativeSource} target="_blank" rel="noreferrer">{c.alternative} prices</a></div>)}</>}<div className="source-record"><a href={market.source} target="_blank" rel="noreferrer">[P] Yahoo Finance price history</a><p>Price as of {date(market.priceAsOf)} · Retrieved {date(market.fetchedAt)}</p></div>{market.news.map(n=><div className="source-record" key={n.id}><a href={n.url} target="_blank" rel="noreferrer">[{n.id}] {n.title}</a><p>{n.publisher} · {date(n.publishedAt)} · Headline only</p></div>)}{!market.news.length&&<p className="small muted">No matching recent news returned. This does not establish that no news exists.</p>}</div>;}
