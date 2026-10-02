import { getChatGPTUser } from '@/app/chatgpt-auth';
import { normalizeSymbol } from '@/lib/market';
import { database,json,validOrigin } from '@/lib/research-store';
import { z } from 'zod';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 const user=await getChatGPTUser();if(!user)return json({error:'Sign in to save notes.'},401);
 if(!validOrigin(request))return json({error:'Invalid origin'},403);
 const raw=await request.text();if(raw.length>4000)return json({error:'Keep each note under 600 characters.'},413);
 let value;try{value=z.object({symbol:z.string().max(20),text:z.string().trim().min(1).max(600)}).strict().safeParse(JSON.parse(raw));}catch{return json({error:'Invalid JSON'},400);}
 if(!value.success)return json({error:'Use a stock ticker and a note of 1–600 characters.'},400);
 let symbol:string;try{symbol=normalizeSymbol(value.data.symbol);}catch{return json({error:'Invalid ticker'},400);}
 const note={id:crypto.randomUUID(),symbol,text:value.data.text,createdAt:new Date().toISOString()};
 try{const result=await database().prepare('INSERT INTO saved_notes(id,user_id,symbol,text,created_at) SELECT ?,?,?,?,? WHERE (SELECT COUNT(*) FROM saved_notes WHERE user_id=? AND symbol=?)<8 RETURNING id').bind(note.id,user.userId,symbol,note.text,note.createdAt,user.userId,symbol).first();if(!result)return json({error:'This stock already has eight saved notes. Remove one before adding more.'},409);return json({note});}catch{return json({error:'Could not save your note. Please retry.'},503);}
}
export async function DELETE(request:Request){
 const user=await getChatGPTUser();if(!user)return json({error:'Sign in required'},401);
 if(!validOrigin(request))return json({error:'Invalid origin'},403);
 const id=new URL(request.url).searchParams.get('id');if(!id||id.length>50)return json({error:'Invalid note'},400);
 try{await database().prepare('DELETE FROM saved_notes WHERE id=? AND user_id=?').bind(id,user.userId).run();return json({ok:true});}catch{return json({error:'Could not remove note.'},503);}
}
