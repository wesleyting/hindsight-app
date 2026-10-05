import type { EvidenceSource } from './investigation.ts';
export function validatedWatchDates(value:unknown,sources:EvidenceSource[],asOf:string){
 const result:{date:string;title:string;status:'reported'|'estimated';sourceId:string}[]=[];
 if(!Array.isArray(value))return result;
 for(const item of value){
  if(!item||typeof item.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(item.date)||typeof item.title!=='string'||!item.title.trim()||item.title.length>80||!['reported','estimated'].includes(item.status))continue;
  const stamp=Date.parse(item.date+'T00:00:00Z');if(!Number.isFinite(stamp)||new Date(stamp).toISOString().slice(0,10)!==item.date||item.date<asOf.slice(0,10))continue;
  const source=sources.find(s=>s.id===item.sourceId&&s.kind==='report'&&s.coverage==='extracted text');if(!source)continue;
  // A date must actually appear in retrieved text, including a year. Citation presence alone is insufficient.
  const when=new Date(stamp),day=when.getUTCDate(),year=when.getUTCFullYear();
  const month=when.toLocaleString('en-US',{month:'long',timeZone:'UTC'}).toLowerCase();
  const text=source.text.toLowerCase().replace(/[,]/g,'').replace(/\s+/g,' ');
  const forms=[item.date,`${month} ${day} ${year}`,`${month.slice(0,3)} ${day} ${year}`,`${day} ${month} ${year}`,`${day} ${month.slice(0,3)} ${year}`];
  if(!forms.some(form=>text.includes(form)))continue;
  if(!result.some(r=>r.date===item.date&&r.title===item.title))result.push({date:item.date,title:item.title.trim(),status:item.status,sourceId:source.id});
  if(result.length===2)break;
 }
 return result.sort((a,b)=>a.date.localeCompare(b.date));
}
