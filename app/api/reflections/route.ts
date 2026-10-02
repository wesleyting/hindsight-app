import { getChatGPTUser } from '@/app/chatgpt-auth';
import { env } from 'cloudflare:workers';
import { z } from 'zod';
const input = z.object({symbol:z.enum(['ASTR','MRDN','ORBT']),week:z.enum(['0','1']),note:z.string().trim().min(1).max(6000),status:z.enum(['draft','reviewed'])}).strict();
export const dynamic = 'force-dynamic';
const json = (data:unknown,status=200) => Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
function db(){if(!env.DB)throw new Error('Storage unavailable');return env.DB;}
export async function GET(){
 const user=await getChatGPTUser(); if(!user)return json({error:'Sign in required'},401);
 try{const result=await db().prepare('SELECT symbol, week, note, status, updated_at AS updatedAt FROM reflections WHERE user_id = ? ORDER BY updated_at DESC').bind(user.userId).all();return json({entries:result.results});}catch(error){console.error('Reflection read failed',error);return json({error:'Storage temporarily unavailable'},503);}
}
export async function POST(request:Request){
 const user=await getChatGPTUser();if(!user)return json({error:'Sign in required'},401);
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return json({error:'Invalid origin'},403);
 if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'JSON required'},415);
 const raw=await request.text();if(raw.length>30000)return json({error:'Request too large'},413);
 let value;try{value=input.safeParse(JSON.parse(raw));}catch{return json({error:'Invalid JSON'},400);}
 if(!value.success)return json({error:'Invalid reflection'},400);
 const entry={...value.data,updatedAt:new Date().toISOString()};
 try{await db().prepare('INSERT INTO reflections (user_id,symbol,week,note,status,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(user_id,symbol,week) DO UPDATE SET note=excluded.note,status=excluded.status,updated_at=excluded.updated_at').bind(user.userId,entry.symbol,entry.week,entry.note,entry.status,entry.updatedAt).run();return json({entry});}catch(error){console.error('Reflection save failed',error);return json({error:'Storage temporarily unavailable'},503);}
}
