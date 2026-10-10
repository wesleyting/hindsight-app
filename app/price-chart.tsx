"use client";
import { useId,useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { MarketSnapshot } from '@/lib/market';
import { pricePeriod } from '@/lib/presentation';

export function PriceChart({market}:{market:MarketSnapshot}){
 const [active,setActive]=useState<number|null>(null);
 const gradient=useId(),description=useId();
 const values=market.closes.map(p=>p.close),low=Math.min(...values),high=Math.max(...values),range=high-low||1;
 const last=values.length-1,index=Math.min(active??last,last),point=market.closes[index];
 const start=values[0],difference=values[last]-start;
 const pointChange=start>0?(point.close-start)/start*100:null;
 const signed=(value:number)=>`${value<0&&Number(value.toFixed(2))!==0?'−':value>0&&Number(value.toFixed(2))!==0?'+':''}${Math.abs(value).toFixed(2)}`;
 const x=(i:number)=>8+i/Math.max(1,last)*664,y=(price:number)=>108-(price-low)/range*80;
 const points=values.map((value,i)=>`${x(i)},${y(value)}`).join(' ');
 const color=market.changePercent>=0?'#287e68':'#ad5966';
 const formattedDate=new Date(point.date).toLocaleDateString(undefined,{month:'short',day:'numeric',timeZone:'UTC'});
 return <div className="price-card interactive-price-card">
  <div className="price-card-heading"><span className="card-eyebrow">Price overview</span><p className="price-numbers">{values.at(-1)!.toFixed(2)} <span className="price-currency">{market.currency}</span></p><p className={difference>=0?'positive':'negative'}>{signed(difference)} {market.currency} <span>({signed(market.changePercent)}%)</span></p><p className="muted small">over this period</p><p className="price-window">{pricePeriod(market.startDate,market.endDate)}</p><a className="yahoo-link" href={`https://finance.yahoo.com/quote/${encodeURIComponent(market.symbol)}/`} target="_blank" rel="noreferrer">Yahoo Finance<ArrowUpRight size={13}/></a></div>
  <div className="interactive-chart" role="group" tabIndex={0} aria-label="Price chart. Use left and right arrow keys to explore daily prices." aria-describedby={description} onFocus={()=>setActive(last)} onBlur={()=>setActive(null)} onPointerLeave={()=>setActive(null)} onKeyDown={event=>{const key=event.key;if(!['ArrowLeft','ArrowRight','Home','End'].includes(key))return;event.preventDefault();setActive(key==='Home'?0:key==='End'?last:Math.max(0,Math.min(last,index+(key==='ArrowRight'?1:-1))));}}>
   <div className="chart-readout" id={description} aria-live="polite"><span>{formattedDate}</span><span className="chart-point-value"><strong>{point.close.toFixed(2)} {market.currency}</strong>{pointChange!==null&&<span className={pointChange>=0?'positive':'negative'}>{signed(pointChange)}% <span className="muted">since start</span></span>}</span></div>
   <svg viewBox="0 0 680 130" role="img" aria-label="Daily price trend" onPointerMove={event=>{const rect=event.currentTarget.getBoundingClientRect();setActive(Math.max(0,Math.min(last,Math.round(((event.clientX-rect.left)/rect.width*680-8)/664*last))));}} onPointerDown={event=>{const rect=event.currentTarget.getBoundingClientRect();setActive(Math.max(0,Math.min(last,Math.round(((event.clientX-rect.left)/rect.width*680-8)/664*last))));}}>
    <defs><linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".17"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
    {[28,68,108].map(v=><line key={v} x1="8" x2="672" y1={v} y2={v} stroke="#e8eeed" strokeDasharray="3 5"/>)}
    <polygon points={`8,126 ${points} 672,126`} fill={`url(#${gradient})`}/><polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round"/>
    <line x1={x(index)} x2={x(index)} y1="12" y2="126" stroke={color} strokeOpacity=".3" strokeDasharray="3 4"/><circle cx={x(index)} cy={y(point.close)} r="5" fill="white" stroke={color} strokeWidth="2.5"/>
   </svg>
  </div><div className="chart-caption"><span>Daily prices · May be delayed</span><span>Hover, tap or use arrow keys to explore</span></div>
 </div>;
}
