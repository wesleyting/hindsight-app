"use client";
import { useEffect,useState } from 'react';
import { ArrowRight,Search } from 'lucide-react';
import type { MarketSnapshot } from '@/lib/market';
import type { SavedAnalysis } from '@/lib/research-types';
import { snapshotPriceChange } from '@/lib/snapshot-comparison';
import { returnWatchDates } from '@/lib/return-brief';
import { Button } from '@/components/ui/button';

export function ReturnBrief({market,brief,disabled,onResearch}:{market:MarketSnapshot;brief:SavedAnalysis;disabled:boolean;onResearch:()=>void}){
 const [today,setToday]=useState('');
 useEffect(()=>{setToday(new Date().toISOString().slice(0,10));},[]);
 const change=snapshotPriceChange(brief.market,market);
 const newer=change?.earlierIndex===0?change:null;
 const events=returnWatchDates(brief.research?.brief?.watch??[],today);
 if(!newer&&!events.some(e=>e.state!=='upcoming'))return null;
 const shortDate=(value:string)=>new Date(value).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
 return <section className="return-brief" aria-label="Since your last brief">
  <div className="return-heading"><div><span className="card-eyebrow">Since your last brief</span><p>Last researched {shortDate(brief.createdAt)}</p></div><Button variant="outline" disabled={disabled} onClick={onResearch}><Search size={14}/>Research what changed</Button></div>
  {newer&&<div className="return-move"><strong className={newer.percent>=0?'positive':'negative'}>{newer.percent>=0?'+':''}{newer.percent.toFixed(2)}%</strong><span>{newer.from.toFixed(2)} <ArrowRight size={13}/> {newer.to.toFixed(2)} {newer.currency}<small>Price observations: {shortDate(brief.market.priceAsOf)} → {shortDate(market.priceAsOf)} · excludes dividends</small></span></div>}
  {!!events.length&&<ul className="return-events">{events.map((event,index)=><li key={event.date+index}><span className={`return-event-state ${event.state}`}>{event.state==='passed'?'Date passed — check outcome':event.state==='today'?'Listed for today':'Coming up'}</span><span>{event.title.replace(/\[(?:P|[NSC]\d+)\]/g,'').trim()}<small>{shortDate(event.date)}{event.status==='estimated'?' · estimated':''}</small></span></li>)}</ul>}
  <p className="return-footnote">From saved research. Research what changed checks fresh sources and uses AI.</p>
 </section>;
}
