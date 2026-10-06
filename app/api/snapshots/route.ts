import { getChatGPTUser } from '@/app/chatgpt-auth';
import { normalizeSymbol } from '@/lib/market';
import { analysisFromRow,database,json,validOrigin,type AnalysisRow } from '@/lib/research-store';
import type { StockSnapshot } from '@/lib/snapshot-types';
import { z } from 'zod';
export const dynamic='force-dynamic';
const name=z.string().trim().min(1).max(80);
export async function GET(request:Request){
 const user=await getChatGPTUser();if(!user)return json({error:'Sign in required'},401);
 const params=new URL(request.url).searchParams;
 try{
  if(params.has('id')){
   const row=await database().prepare('SELECT id,symbol,name,created_at AS createdAt,payload FROM stock_snapshots WHERE id=? AND user_id=?').bind(params.get('id'),user.userId).first<{id:string;symbol:string;name:string;createdAt:string;payload:string}>();
   return row?json({snapshot:{...row,payload:JSON.parse(row.payload)}}):json({error:'Snapshot not found'},404);
  }
  let symbol:string;try{symbol=normalizeSymbol(params.get('symbol')||'');}catch{return json({error:'Invalid ticker'},400);}
  const rows=await database().prepare("SELECT id,symbol,name,created_at AS createdAt,json_extract(payload,'$.market.startDate') AS rangeStart,json_extract(payload,'$.market.endDate') AS rangeEnd FROM stock_snapshots WHERE user_id=? AND symbol=? ORDER BY created_at DESC").bind(user.userId,symbol).all();
  return json({snapshots:rows.results});
 }catch{return json({error:'Could not load snapshots. Apply the snapshot database migration.'},503);}
}
async function mutate(request:Request,method:'POST'|'PATCH'|'DELETE'){
 const user=await getChatGPTUser();if(!user)return json({error:'Sign in required'},401);
 if(!validOrigin(request))return json({error:'Invalid origin'},403);
 const raw=await request.text();if(raw.length>4000)return json({error:'Request too large'},413);
 let body;try{body=JSON.parse(raw);}catch{return json({error:'Invalid JSON'},400);}
 try{
  if(method!=='POST'){
   const parsed=(method==='PATCH'?z.object({id:z.string().uuid(),name}).strict():z.object({id:z.string().uuid()}).strict()).safeParse(body);
   if(!parsed.success)return json({error:'Provide a valid snapshot and a name of 1–80 characters.'},400);
   const row=method==='PATCH'?await database().prepare('UPDATE stock_snapshots SET name=? WHERE id=? AND user_id=? RETURNING id').bind(name.parse(body.name),parsed.data.id,user.userId).first():await database().prepare('DELETE FROM stock_snapshots WHERE id=? AND user_id=? RETURNING id').bind(parsed.data.id,user.userId).first();
   return row?json({ok:true}):json({error:'Snapshot not found'},404);
  }
  const parsed=z.object({symbol:z.string().max(20),name,briefId:z.string().uuid(),fetchedAt:z.string(),expanded:z.boolean(),refreshFailed:z.boolean().optional(),selected:z.object({id:z.string().uuid(),title:z.string().max(160),preparedQuestion:z.string().max(300).optional()}).nullable()}).strict().safeParse(body);
  if(!parsed.success)return json({error:'Invalid snapshot'},400);
  const input=parsed.data;let symbol:string;try{symbol=normalizeSymbol(input.symbol);}catch{return json({error:'Invalid ticker'},400);}
  const db=database();
  const marketRow=await db.prepare('SELECT payload,fetched_at FROM market_cache WHERE symbol=?').bind(symbol).first<{payload:string;fetched_at:string}>();
  if(!marketRow||marketRow.fetched_at!==input.fetchedAt)return json({error:'Prices changed since this view loaded. Refresh prices before saving.'},409);
  async function analysis(id:string){const row=await db.prepare('SELECT * FROM analyses WHERE id=? AND user_id=? AND symbol=?').bind(id,user!.userId,symbol).first<AnalysisRow>();return row?analysisFromRow(row):null;}
  const brief=await analysis(input.briefId);if(!brief||brief.kind!=='catchup')return json({error:'Brief not found'},404);
  let selected:StockSnapshot['payload']['selected']=null;
  if(input.selected){
   const item=await analysis(input.selected.id);if(!item)return json({error:'Answer not found'},404);
   const prepared=input.selected.preparedQuestion?item.research?.prepared.find(p=>p.question===input.selected!.preparedQuestion):null;
   if(input.selected.preparedQuestion&&!prepared)return json({error:'Explanation not found'},404);
   selected={analysis:item,title:input.selected.title,answer:prepared?.answer??item.answer};
  }
  const market=JSON.parse(marketRow.payload);
  if(input.refreshFailed)market.warnings.push('Refresh failed. Showing saved market data from '+market.fetchedAt+'. This is not a fresh quote.');
  const snapshot:StockSnapshot={id:crypto.randomUUID(),symbol,name:input.name,createdAt:new Date().toISOString(),payload:{market,brief,selected,expanded:input.expanded}};
  await db.prepare('INSERT INTO stock_snapshots(id,user_id,symbol,name,created_at,payload) VALUES(?,?,?,?,?,?)').bind(snapshot.id,user.userId,symbol,snapshot.name,snapshot.createdAt,JSON.stringify(snapshot.payload)).run();
  return json({snapshot},201);
 }catch{return json({error:'Could not save changes to snapshots. Please retry.'},503);}
}
export const POST=(request:Request)=>mutate(request,'POST');
export const PATCH=(request:Request)=>mutate(request,'PATCH');
export const DELETE=(request:Request)=>mutate(request,'DELETE');
