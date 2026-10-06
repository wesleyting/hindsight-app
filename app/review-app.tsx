"use client";
import { useEffect, useRef, useState } from 'react';
import { ArrowUp, RefreshCw, X, History, Download, ArrowUpRight, TrendingUp, ShieldAlert, CalendarDays, BookOpen, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { ResearchView, SavedAnalysis } from '@/lib/research-types';
import type { MarketSnapshot } from '@/lib/market';
import type { StockSnapshot, SnapshotSummary } from '@/lib/snapshot-types';
import { citationsAfterPunctuation,pricePeriod } from '@/lib/presentation';
const date=(value:string)=>new Date(value).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});
const percent=(value:number)=>`${value>=0?'+':''}${value.toFixed(2)}%`;
type SelectedAnswer={analysis:SavedAnalysis;title:string;answer:string};
export default function ReviewApp(){
 const [ticker,setTicker]=useState(''),[data,setData]=useState<ResearchView|null>(null);
 const [recent,setRecent]=useState<string[]>([]),[configured,setConfigured]=useState(false);
 const [auth,setAuth]=useState(false),[loading,setLoading]=useState(false),[busy,setBusy]=useState(false);
 const [error,setError]=useState(''),[question,setQuestion]=useState('');
 const [selected,setSelected]=useState<SelectedAnswer|null>(null),[pending,setPending]=useState('');
 const [busyKind,setBusyKind]=useState<'catchup'|'question'|null>(null),[briefStatus,setBriefStatus]=useState('');
 const [deleteId,setDeleteId]=useState<string|null>(null);
 const [expanded,setExpanded]=useState(false);
 const [snapshots,setSnapshots]=useState<SnapshotSummary[]>([]),[snapshot,setSnapshot]=useState<StockSnapshot|null>(null);
 const [comparison,setComparison]=useState<StockSnapshot|null>(null);
 const [snapshotBusy,setSnapshotBusy]=useState(false),[snapshotName,setSnapshotName]=useState(''),[snapshotError,setSnapshotError]=useState('');
 const [renameId,setRenameId]=useState<string|null>(null),[renameText,setRenameText]=useState('');
 const [panel,setPanel]=useState<'history'|'sources'|'setup'|null>(null);
 const [sourceAnalysis,setSourceAnalysis]=useState<SavedAnalysis|null>(null);
 const sequence=useRef(0),aiBusy=useRef(false);
 const detailRef=useRef<HTMLDivElement>(null),answerRef=useRef<HTMLElement>(null);
 const scrollRequest=useRef<'detail'|'answer'|null>(null);
 useEffect(()=>{
  const target=scrollRequest.current==='detail'?detailRef.current:scrollRequest.current==='answer'?answerRef.current:null;
  if(!target)return;scrollRequest.current=null;
  const frame=requestAnimationFrame(()=>{target.focus({preventScroll:true});target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});});
  return ()=>cancelAnimationFrame(frame);
 },[expanded,selected,busy]);
 useEffect(()=>{
  fetch('/api/chat').then(r=>r.json()).then(body=>setConfigured((body as {configured?:boolean}).configured===true)).catch(()=>{});
  try{const saved=JSON.parse(localStorage.getItem('hindsight-real-stocks')||'[]');if(Array.isArray(saved)){const valid=saved.filter(s=>typeof s==='string'&&/^[A-Z0-9][A-Z0-9.^=-]{0,19}$/.test(s)).slice(0,50);setRecent(valid);const last=localStorage.getItem('hindsight-last-stock');if(valid.length)void openStock(last&&valid.includes(last)?last:valid[0]);}}catch{}
 },[]);
 async function openStock(symbol:string,refresh=false){
  if(aiBusy.current)return;
  const normalized=symbol.trim().toUpperCase();
  if(!/^[A-Z0-9][A-Z0-9.^=-]{0,19}$/.test(normalized)){setError('Enter a ticker, such as AAPL or SHOP.TO.');return;}
  const current=++sequence.current;
  setLoading(true);setError('');setBriefStatus('');setSnapshot(null);setComparison(null);setData(null);setQuestion('');setSelected(null);setExpanded(false);setPanel(null);setSourceAnalysis(null);
  try{
   let response=await fetch(`/api/research?symbol=${encodeURIComponent(normalized)}${refresh?'&refresh=1':''}`);
   // Reuse the existing loopback-only development sign-in; production still requires authentication.
   if(response.status===401&&process.env.NODE_ENV==='development'&&['127.0.0.1','localhost','[::1]'].includes(window.location.hostname)){
    await fetch('/signin-with-chatgpt?return_to=/',{redirect:'manual'});
    response=await fetch(`/api/research?symbol=${encodeURIComponent(normalized)}${refresh?'&refresh=1':''}`);
   }
   const body=await response.json() as ResearchView&{error?:string};if(current!==sequence.current)return;
   if(!response.ok){if(response.status===401)setAuth(true);throw new Error(body.error||'Could not load this stock.');}
   setAuth(false);setData(body);setTicker('');
   setRecent(previous=>{const next=previous.includes(normalized)?previous:[...previous,normalized];try{localStorage.setItem('hindsight-real-stocks',JSON.stringify(next));localStorage.setItem('hindsight-last-stock',normalized);}catch{}return next;});
  }catch(e){if(current===sequence.current)setError((e as Error).message);}
  finally{if(current===sequence.current)setLoading(false);}
 }
 function removeStock(symbol:string){
  const next=recent.filter(item=>item!==symbol);setRecent(next);
  try{localStorage.setItem('hindsight-real-stocks',JSON.stringify(next));if(localStorage.getItem('hindsight-last-stock')===symbol)localStorage.removeItem('hindsight-last-stock');}catch{}
  if(data?.market.symbol===symbol){if(next.length)void openStock(next[0]);else{++sequence.current;setData(null);setSnapshot(null);setComparison(null);setSelected(null);setExpanded(false);setError('');setPanel(null);}}
 }
 async function ask(kind:'catchup'|'question',text=question,deeper=false,title=text){
  if(!data||aiBusy.current||(!text.trim()&&kind==='question'))return;
  const current=sequence.current,symbol=data.market.symbol;
  scrollRequest.current=kind==='question'?'answer':null;aiBusy.current=true;setBusyKind(kind);setBusy(true);setError('');setBriefStatus('');setPending(kind==='catchup'?'Refreshing your brief':title);if(kind==='question')setSelected(null);
  try{
   const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({symbol,kind,deeper,refresh:kind==='catchup',question:kind==='question'?text:undefined,fetchedAt:data.market.fetchedAt})});
   const body=await response.json() as {analysis:SavedAnalysis;cached:boolean;error?:string};if(current!==sequence.current)return;
   if(!response.ok){if(response.status===401)setAuth(true);throw new Error(body.error||'Could not answer. Please retry.');}
   setData(previous=>previous?{...previous,...(kind==='catchup'?{market:body.analysis.market}:{}),analyses:[body.analysis,...previous.analyses.filter(a=>a.id!==body.analysis.id)].slice(0,30)}:previous);
   if(kind==='catchup')setBriefStatus(body.cached?'Showing saved research.':'Brief refreshed just now.');
   if(kind==='question')setSelected({analysis:body.analysis,title,answer:body.analysis.answer});
   setQuestion(previous=>previous===text?'':previous);
  }catch(e){if(current===sequence.current){if(kind==='catchup')setBriefStatus((e as Error).message);else setError((e as Error).message);}}
  finally{aiBusy.current=false;setBusy(false);setBusyKind(null);setPending('');}
 }
 const view=snapshot?{...data!,market:snapshot.payload.market,analyses:[snapshot.payload.brief]}:data;
 const latest=view?.analyses.find(a=>a.kind==='catchup');
 async function loadSnapshots(){
  if(!data)return;setSnapshotError('');setPanel('history');setSnapshotBusy(true);
  try{const r=await fetch(`/api/snapshots?symbol=${encodeURIComponent(data.market.symbol)}`);const b=await r.json() as {error?:string;snapshots:SnapshotSummary[];snapshot:StockSnapshot};if(!r.ok)throw new Error(b.error);setSnapshots(b.snapshots);}catch(e){setSnapshotError((e as Error).message);}finally{setSnapshotBusy(false);}
 }
 async function saveSnapshot(){
  if(!data||!latest||snapshot)return;setSnapshotBusy(true);setSnapshotError('');
  const prepared=selected?.analysis.research?.prepared.find(p=>p.question===selected.title&&p.answer===selected.answer);
  try{const r=await fetch('/api/snapshots',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({symbol:data.market.symbol,name:snapshotName.trim()||`${data.market.symbol} · ${pricePeriod(data.market.startDate,data.market.endDate)} · ${new Date(data.market.endDate).getUTCFullYear()}`,briefId:latest.id,fetchedAt:data.market.fetchedAt,refreshFailed:data.market.warnings.some(w=>w.startsWith('Refresh failed')),expanded,selected:selected?{id:selected.analysis.id,title:selected.title.slice(0,160),preparedQuestion:prepared?.question}:null})});const b=await r.json() as {error?:string;snapshots:SnapshotSummary[];snapshot:StockSnapshot};if(!r.ok)throw new Error(b.error);setSnapshots(prev=>[{...b.snapshot,rangeStart:b.snapshot.payload.market.startDate,rangeEnd:b.snapshot.payload.market.endDate},...prev]);setSnapshotName('');}catch(e){setSnapshotError((e as Error).message);}finally{setSnapshotBusy(false);}
 }
 async function openSnapshot(id:string){
  setSnapshotBusy(true);setSnapshotError('');
  try{const r=await fetch(`/api/snapshots?id=${encodeURIComponent(id)}`);const b=await r.json() as {error?:string;snapshots:SnapshotSummary[];snapshot:StockSnapshot};if(!r.ok)throw new Error(b.error);const saved=b.snapshot as StockSnapshot;setSnapshot(saved);setComparison(null);setSelected(saved.payload.selected);setExpanded(saved.payload.expanded);setPanel(null);setQuestion('');}catch(e){setSnapshotError((e as Error).message);}finally{setSnapshotBusy(false);}
 }
 async function renameSnapshot(id:string){
  setSnapshotBusy(true);setSnapshotError('');
  try{const r=await fetch('/api/snapshots',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,name:renameText.trim()})});const b=await r.json() as {error?:string;snapshots:SnapshotSummary[];snapshot:StockSnapshot};if(!r.ok)throw new Error(b.error);setSnapshots(prev=>prev.map(s=>s.id===id?{...s,name:renameText.trim()}:s));setSnapshot(prev=>prev?.id===id?{...prev,name:renameText.trim()}:prev);setRenameId(null);}catch(e){setSnapshotError((e as Error).message);}finally{setSnapshotBusy(false);}
 }
 async function deleteSnapshot(id:string){
  setSnapshotBusy(true);setSnapshotError('');
  try{const r=await fetch('/api/snapshots',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});const b=await r.json() as {error?:string};if(!r.ok)throw new Error(b.error);setSnapshots(prev=>prev.filter(item=>item.id!==id));if(snapshot?.id===id)returnToLatest();if(comparison?.id===id)setComparison(null);setDeleteId(null);}catch(e){setSnapshotError((e as Error).message);}finally{setSnapshotBusy(false);}
 }
 async function compareSnapshot(id:string){
  if(!id){setComparison(null);return;}setSnapshotBusy(true);setError('');
  try{const r=await fetch(`/api/snapshots?id=${encodeURIComponent(id)}`);const b=await r.json() as {snapshot:StockSnapshot;error?:string};if(!r.ok)throw new Error(b.error);setComparison(b.snapshot);}catch(e){setError((e as Error).message);}finally{setSnapshotBusy(false);}
 }
 function returnToLatest(){setComparison(null);setSnapshot(null);setSelected(null);setExpanded(false);}

 function showSources(analysis:SavedAnalysis){setSourceAnalysis(analysis);setPanel('sources');}
 return <div className="brief-app"><header className="center-header"><a className="wordmark" href="/">hindsight<span>.</span></a><span className="header-caption">A little perspective.</span><Button variant="outline" className="history-button" disabled={!data||busy||loading} onClick={()=>void loadSnapshots()}><History size={16}/>Snapshots</Button></header>
 <main className="conversation-workspace simple-workspace redesigned-workspace">
 <form className="ticker-form" onSubmit={e=>{e.preventDefault();void openStock(ticker);}}><label htmlFor="ticker">Find a stock</label><div><input id="ticker" value={ticker} onChange={e=>setTicker(e.target.value)} placeholder="Search a ticker, e.g. AAPL…" maxLength={20} autoComplete="off" spellCheck={false}/><Button disabled={loading||busy||!ticker.trim()} type="submit"><Search size={15}/>Open</Button></div></form>
 {!!recent.length&&<nav className="stock-shortcuts" aria-label="Your stocks">{recent.map(symbol=><div className="stock-shortcut" data-active={data?.market.symbol===symbol} key={symbol}><button title={`Open ${symbol}`} aria-pressed={data?.market.symbol===symbol} disabled={busy||loading} onClick={()=>void openStock(symbol)}>{symbol}</button><button className="remove-stock" aria-label={`Remove ${symbol} from your stocks`} title="Remove shortcut; saved research stays" disabled={busy||loading} onClick={()=>removeStock(symbol)}><X size={12}/></button></div>)}</nav>}
 {error&&<div className="notice" role="alert">{error}{auth&&<a href="/signin-with-chatgpt?return_to=/">Sign in locally</a>}</div>}
 {loading&&<p role="status" className="muted">Opening your stock…</p>}
 {!data&&!loading&&<section className="welcome"><h1>What did you miss?</h1><p>Open a stock. Get the important part. Ask if you want more.</p></section>}
 {view&&<>
 {snapshot&&<div className="snapshot-banner"><div><strong>{snapshot.name}</strong><span>Price window: {pricePeriod(snapshot.payload.market.startDate,snapshot.payload.market.endDate)} · Historical view</span></div><Button variant="outline" onClick={returnToLatest}>Back to latest</Button></div>}
 {snapshot&&snapshots.length>1&&<div className="snapshot-comparison"><label htmlFor="compare-snapshot">Compare with</label><select id="compare-snapshot" disabled={snapshotBusy} value={comparison?.id??''} onChange={e=>void compareSnapshot(e.target.value)}><option value="">Choose another snapshot</option>{snapshots.filter(item=>item.id!==snapshot.id).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select>{comparison&&<div className="perspectives">{[snapshot,comparison].map(item=><article className="perspective" key={item.id}><h3>{item.name}</h3><p className="small muted">Saved {date(item.createdAt)}</p><p>{item.payload.market.closes.at(-1)!.close.toFixed(2)} {item.payload.market.currency}<span className="small muted"> · Price as of {new Date(item.payload.market.priceAsOf).toLocaleDateString()}</span></p><Answer analysis={{...item.payload.brief,answer:item.payload.brief.research?.brief?.takeaway??item.payload.brief.answer}}/></article>)}</div>}</div>}
 <section className="stock-overview"><div className="stock-heading"><h1>{view!.market.symbol} <span>{view!.market.company}</span></h1><Button variant="ghost" size="icon" aria-label="Refresh prices" disabled={busy||!!snapshot} onClick={()=>void openStock(view!.market.symbol,true)}><RefreshCw size={16}/></Button></div><PriceBlock market={view!.market}/>{view!.market.warnings.filter(w=>w.startsWith('Refresh failed')||w.startsWith('Price data is more')).map(w=><p className="notice" key={w}>{w}</p>)}</section>
 <section className="brief-card"><div className="section-heading"><h2><Sparkles size={17}/>The short version</h2><Button variant="outline" disabled={busy||!configured||!!snapshot} onClick={()=>void ask('catchup')}><RefreshCw size={14} className={busyKind==='catchup'?'animate-spin motion-reduce:animate-none':undefined}/>{busyKind==='catchup'?'Researching…':latest?'Refresh brief':'Create brief'}</Button></div>
 <p className="brief-refresh-status" role="status">{busyKind==='catchup'?'Checking fresh sources and updating this brief…':briefStatus}</p>
 {latest?<><div className="plain-brief"><Answer analysis={{...latest,answer:latest.research?.brief?.takeaway??latest.answer}}/></div>
 <div className="brief-actions">{latest.research?.brief&&<button className="read-more" aria-expanded={expanded} onClick={()=>{if(!expanded)scrollRequest.current='detail';setExpanded(value=>!value);}}>{expanded?'Read less':'Read more'}<ArrowUpRight size={13}/></button>}<button className="text-action" onClick={()=>showSources(latest)}><BookOpen size={13}/>Sources</button></div>
 {expanded&&latest.research?.brief&&<div className="inline-detail" ref={detailRef} tabIndex={-1}><Answer analysis={latest}/></div>}
 {(latest.research?.brief?.upside||latest.research?.brief?.risk)&&<div className="perspectives">{latest.research.brief.upside&&<article className="perspective upside"><h3><TrendingUp size={16}/>What could work</h3><Answer analysis={{...latest,answer:latest.research.brief.upside}}/></article>}{latest.research.brief.risk&&<article className="perspective downside"><h3><ShieldAlert size={16}/>What could go wrong</h3><Answer analysis={{...latest,answer:latest.research.brief.risk}}/></article>}</div>}
 {!!latest.research?.brief?.watch?.length&&<div className="watch-dates"><h3><CalendarDays size={15}/>On the horizon</h3>{latest.research.brief.watch.map(event=><div className="watch-event" key={event.date+event.title}><time dateTime={event.date}>{new Date(event.date+'T12:00:00Z').toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'})}</time><span><Answer analysis={{...latest,answer:`${event.title} [${event.sourceId}]`}}/><small>{event.status==='estimated'?'Estimated date':'Reported date'}</small></span></div>)}</div>}
 <p className="brief-timestamp">Researched {date(latest.createdAt)}</p></>:<p className="muted small">{configured?'The key development, both sides of the story, and what to watch.':'Connect DeepSeek to create your brief.'}{!configured&&<button className="text-action" onClick={()=>setPanel('setup')}>Set up research</button>}</p>}

 </section>
 {latest?.research?.version===2&&!!latest.research.prepared.length&&<section className="question-options" aria-label="Prepared questions"><p className="small muted">I want to know more about…</p><div className="suggestions">{latest.research.prepared.map(q=><button disabled={busy} key={q.question} aria-pressed={selected?.title===q.question} onClick={()=>{scrollRequest.current='answer';setSelected({analysis:latest,title:q.question,answer:q.answer});}}>{q.question}<span>Open explanation →</span></button>)}</div></section>}
 {((busy&&busyKind==='question')||selected)&&<section className="focus-answer" ref={answerRef} tabIndex={-1} aria-live="polite" aria-label="Selected answer"><div className="section-heading"><h2>{busyKind==='question'?pending:selected?.title}</h2>{!busy&&<Button variant="ghost" size="icon" aria-label="Close answer" onClick={()=>setSelected(null)}><X size={16}/></Button>}</div>{busyKind==='question'?<p role="status" className="small muted">Checking evidence and preparing your answer…</p>:selected&&<><div className="answer-scroll" tabIndex={0}><Answer analysis={{...selected.analysis,answer:selected.answer}}/></div><div className="brief-actions"><button className="text-action" onClick={()=>showSources(selected.analysis)}>Sources used</button><Button variant="outline" size="sm" disabled={!configured||!!snapshot} onClick={()=>void ask('question',`Look deeper into ${selected.title} for ${view!.market.company}. Investigate the specific issue explained here: ${selected.answer.slice(0,650)}. Use fresh company-relevant reports, distinguish confirmed facts from possible risks, and explain it simply.`,true,selected.title)}><Search size={13}/>Look deeper</Button></div></>}</section>}

 {!snapshot&&<section className="ask-section compact-composer"><form className="composer" onSubmit={e=>{e.preventDefault();void ask('question');}}><label className="sr-only" htmlFor="question-input">Ask about {view!.market.company}</label><Textarea id="question-input" value={question} maxLength={1500} onChange={e=>setQuestion(e.target.value)} placeholder={`Ask about ${view!.market.symbol}…`} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();e.currentTarget.form?.requestSubmit();}}}/><div className="composer-footer"><span>{busy?'Research in progress':'Send to research a new question'}</span><Button type="submit" size="icon" aria-label="Research question" disabled={busy||!configured||!question.trim()}><ArrowUp size={18}/></Button></div></form></section>}
 </>}
 </main>
 <Sheet open={panel!==null} onOpenChange={open=>{if(!open)setPanel(null);}}><SheetContent className="detail-sheet"><SheetHeader><SheetTitle>{panel==='history'?'Snapshots':panel==='sources'?'Evidence':'Sources & setup'}</SheetTitle><SheetDescription>{panel==='history'?'Keep a stock view to revisit later. Saving and opening use no AI.':panel==='sources'?'What was available when this answer was written.':'Real data, with limits.'}</SheetDescription></SheetHeader><div className="sheet-body">
 {panel==='history'&&data&&<>
 {!snapshot&&<form className="snapshot-save" onSubmit={e=>{e.preventDefault();void saveSnapshot();}}><label htmlFor="snapshot-name">Save this view</label><input id="snapshot-name" maxLength={80} placeholder={`${data.market.symbol} · ${pricePeriod(data.market.startDate,data.market.endDate)} · ${new Date(data.market.endDate).getUTCFullYear()}`} value={snapshotName} onChange={e=>setSnapshotName(e.target.value)}/><Button type="submit" disabled={snapshotBusy||busy||!latest}>Save snapshot</Button>{!latest&&<p className="small muted">Create a brief first.</p>}</form>}
 {snapshotError&&<p role="alert" className="notice">{snapshotError}</p>}
 {snapshotBusy&&<p role="status" className="small muted">Loading…</p>}
 {!snapshots.length&&!snapshotBusy&&<p className="muted">No snapshots yet. Save a view when it is worth keeping.</p>}
 {snapshots.map(item=><article className="snapshot-entry" key={item.id}>{renameId===item.id?<form onSubmit={e=>{e.preventDefault();void renameSnapshot(item.id);}}><input aria-label="Snapshot name" maxLength={80} value={renameText} onChange={e=>setRenameText(e.target.value)}/><Button size="sm" disabled={snapshotBusy||!renameText.trim()}>Save name</Button><button type="button" className="text-action" onClick={()=>setRenameId(null)}>Cancel</button></form>:<><button className="history-choice" disabled={snapshotBusy} onClick={()=>void openSnapshot(item.id)}><strong>{item.name}</strong><span>{item.rangeStart&&item.rangeEnd?`Price window: ${pricePeriod(item.rangeStart,item.rangeEnd)} · ${new Date(item.rangeEnd).getUTCFullYear()}`:`Saved ${date(item.createdAt)}`}</span></button><button className="text-action" onClick={()=>{setRenameId(item.id);setRenameText(item.name);}}>Rename</button>{deleteId===item.id?<div className="snapshot-delete-confirm"><span>Delete this snapshot? This cannot be undone.</span><Button size="sm" variant="destructive" disabled={snapshotBusy} onClick={()=>void deleteSnapshot(item.id)}>Delete snapshot</Button><button className="text-action" onClick={()=>setDeleteId(null)}>Cancel</button></div>:<button className="text-action delete-snapshot" disabled={snapshotBusy} onClick={()=>setDeleteId(item.id)}>Delete</button>}</>}</article>)}
 {snapshot&&<div className="history-tools"><button className="text-action" onClick={()=>{const blob=new Blob([JSON.stringify(snapshot,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`${snapshot.symbol}-snapshot-${snapshot.id}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}}><Download size={15}/>Download this snapshot</button></div>}
 </>}
 {panel==='sources'&&sourceAnalysis&&<Sources market={sourceAnalysis.market} research={sourceAnalysis.research}/>}
 {panel==='setup'&&<><p>Yahoo Finance supplies prices. Tavily retrieves company-specific article passages. Reddit and social-media sources are disabled because we could not reliably verify their relevance. Coverage can be incomplete, and prices may be delayed.</p><p>DeepSeek explains the evidence. Your questions, saved context and retrieved text are sent to it. Answers and sources are saved locally. AI can misinterpret evidence.</p><p>Opening a saved answer makes no API call. New research uses at most four model calls, including formatting repair, and four searches. The daily limit is 30 model calls. Nothing runs automatically in the background.</p><p>{configured?'DeepSeek is configured.':'Set DEEPSEEK_API_KEY and TAVILY_API_KEY in the ignored .dev.vars file, then restart.'}</p><a href="/signin-with-chatgpt?return_to=/">Local sign-in</a></>}
 </div></SheetContent></Sheet></div>;
}
function PriceBlock({market}:{market:MarketSnapshot}){
 const prices=market.closes.map(p=>p.close),low=Math.min(...prices),high=Math.max(...prices),range=high-low||1;
 const points=prices.map((price,i)=>`${8+i/(prices.length-1)*664},${108-(price-low)/range*80}`).join(' ');
 const stockUrl=`https://finance.yahoo.com/quote/${encodeURIComponent(market.symbol)}/`;
 const color=market.changePercent>=0?'#26856d':'#b65c67';
 return <div className="price-card"><div className="price-card-heading"><div><p className="price-numbers">{prices[0].toFixed(2)} <span aria-hidden="true">→</span> {prices.at(-1)!.toFixed(2)} <strong className={market.changePercent>=0?'positive':'negative'}>{percent(market.changePercent)}</strong></p><p className="small muted">{market.currency} · {pricePeriod(market.startDate,market.endDate)}</p></div><a className="yahoo-link" href={stockUrl} target="_blank" rel="noreferrer">Yahoo Finance<ArrowUpRight size={14}/></a></div><a className="chart-link" href={stockUrl} target="_blank" rel="noreferrer" aria-label={`View ${market.symbol} on Yahoo Finance`}><svg viewBox="0 0 680 130" role="img" aria-label={`Daily price trend: ${percent(market.changePercent)} across shown dates`}><defs><linearGradient id="price-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".14"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>{[28,68,108].map(y=><line key={y} x1="8" x2="672" y1={y} y2={y} stroke="#e8ecef" strokeDasharray="3 5"/>)}<polygon points={`8,126 ${points} 672,126`} fill="url(#price-fill)"/><polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round"/>{market.closes.map((p,i)=><circle key={p.date} cx={8+i/(prices.length-1)*664} cy={108-(p.close-low)/range*80} r="3" fill="white" stroke={color} strokeWidth="1.5"><title>{new Date(p.date).toLocaleDateString()}: {p.close.toFixed(2)} {market.currency}</title></circle>)}</svg><span className="chart-link-hint">Open on Yahoo Finance <ArrowUpRight size={12}/></span></a><div className="chart-caption"><span>Daily observations · May be delayed</span><span>Range {low.toFixed(2)}–{high.toFixed(2)}</span></div></div>;
}
function Answer({analysis}:{analysis:SavedAnalysis}){
 const sources:Record<string,string>={P:analysis.market.source,...Object.fromEntries(analysis.market.news.map(n=>[n.id,n.url])),...Object.fromEntries((analysis.research?.sources??[]).map(n=>[n.id,n.url])),...Object.fromEntries((analysis.research?.comparisons??[]).map(n=>[n.id,n.alternativeSource]))};
 return <p className="generated-answer">{citationsAfterPunctuation(analysis.answer).split(/(\[(?:P|[NSC]\d+)\])/g).map((part,i)=>{const key=part.slice(1,-1);return /^\[(P|[NSC]\d+)\]$/.test(part)&&sources[key]?<sup key={i} className="source-citation"><a href={sources[key]} aria-label={`Source ${key}`} title={`Open source ${key}`} target="_blank" rel="noreferrer">{key}</a></sup>:part;})}</p>;
}
function Sources({market,research}:{market:MarketSnapshot;research?:SavedAnalysis['research']}){return <div className="sources">{research&&<><p className="small muted">Investigated {date(research.searchedAt)}. Search and extracted text may be incomplete.</p>{research.gaps.map((gap,i)=><p className="small muted" key={i}>{gap}</p>)}{research.sources.map(source=><div className="source-record" key={source.id}><a href={source.url} target="_blank" rel="noreferrer">[{source.id}] {source.title}</a><p>{source.kind==='reddit'?'Public Reddit sample':'Web source'} · {source.coverage} · {source.publishedAt?date(source.publishedAt):'Publication date unavailable'} · Retrieved {date(source.retrievedAt)}</p><details><summary>Text available to the AI</summary><p className="small" style={{whiteSpace:'pre-wrap'}}>{source.text}</p></details></div>)}{research.comparisons.map(c=><div className="source-record" key={c.id}><p>[{c.id}] {c.start} to {c.end}: {c.symbol} {percent(c.returnPercent)} vs {c.alternative} {percent(c.alternativeReturnPercent)}. Difference: {c.differencePoints.toFixed(2)} percentage points.</p><p>{c.limitations}</p><a href={c.source} target="_blank" rel="noreferrer">{c.symbol} prices</a> · <a href={c.alternativeSource} target="_blank" rel="noreferrer">{c.alternative} prices</a></div>)}</>}<div className="source-record"><a href={market.source} target="_blank" rel="noreferrer">[P] Yahoo Finance price history</a><p>Price as of {date(market.priceAsOf)} · Retrieved {date(market.fetchedAt)}</p></div>{market.news.map(n=><div className="source-record" key={n.id}><a href={n.url} target="_blank" rel="noreferrer">[{n.id}] {n.title}</a><p>{n.publisher} · {date(n.publishedAt)} · Headline only</p></div>)}{!market.news.length&&<p className="small muted">No matching recent news returned. This does not establish that no news exists.</p>}</div>;}
