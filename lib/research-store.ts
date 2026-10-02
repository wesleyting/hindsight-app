import { env } from 'cloudflare:workers';
import { fetchMarket, type MarketSnapshot } from './market';
import type { SavedAnalysis, SavedNote } from './research-types';
export function database(){if(!env.DB)throw new Error('Database unavailable. Apply the local research migration first.');return env.DB;}
export async function marketFor(symbol:string,refresh=false){
 const db=database();
 const cached=await db.prepare('SELECT payload,fetched_at FROM market_cache WHERE symbol=?').bind(symbol).first<{payload:string;fetched_at:string}>();
 if(!refresh&&cached&&Date.now()-Date.parse(cached.fetched_at)<15*60_000)return {market:JSON.parse(cached.payload) as MarketSnapshot,cached:true};
 let market:MarketSnapshot;
 try{market=await fetchMarket(symbol);}catch(error){
  if(cached){const old=JSON.parse(cached.payload) as MarketSnapshot;return {market:{...old,warnings:[...old.warnings,'Refresh failed. Showing saved market data from '+old.fetchedAt+'. This is not a fresh quote.']},cached:true};}
  throw error;
 }
 await db.prepare('INSERT INTO market_cache(symbol,payload,fetched_at) VALUES(?,?,?) ON CONFLICT(symbol) DO UPDATE SET payload=excluded.payload,fetched_at=excluded.fetched_at').bind(symbol,JSON.stringify(market),market.fetchedAt).run();
 return {market,cached:false};
}
export type AnalysisRow={id:string;symbol:string;kind:'catchup'|'question';question:string;answer:string;created_at:string;model:string;market:string;usage:string};
export function analysisFromRow(row:AnalysisRow):SavedAnalysis{return {id:row.id,symbol:row.symbol,kind:row.kind,question:row.question,answer:row.answer,createdAt:row.created_at,model:row.model,market:JSON.parse(row.market),usage:JSON.parse(row.usage)};}
export async function historyFor(userId:string,symbol:string){
 const rows=await database().prepare('SELECT * FROM analyses WHERE user_id=? AND symbol=? ORDER BY created_at DESC LIMIT 30').bind(userId,symbol).all<AnalysisRow>();
 return rows.results.map(analysisFromRow);
}
export async function notesFor(userId:string,symbol:string){
 const rows=await database().prepare('SELECT id,symbol,text,created_at AS createdAt FROM saved_notes WHERE user_id=? AND symbol=? ORDER BY created_at DESC LIMIT 8').bind(userId,symbol).all<SavedNote>();return rows.results;
}
export async function hashContext(value:unknown){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)));return Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('');}
export const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export function validOrigin(request:Request){const origin=request.headers.get('origin');return !origin||origin===new URL(request.url).origin;}
