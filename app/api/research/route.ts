import { getChatGPTUser } from '@/app/chatgpt-auth';
import { normalizeSymbol } from '@/lib/market';
import { marketFor,historyFor,notesFor,json } from '@/lib/research-store';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const user=await getChatGPTUser();if(!user)return json({error:'Sign in to open your stock research.'},401);
 let symbol:string;const url=new URL(request.url);
 try{symbol=normalizeSymbol(url.searchParams.get('symbol')??'');}catch{return json({error:'Enter a valid stock ticker.'},400);}
 try{
  const [data,analyses,notes]=await Promise.all([marketFor(symbol,url.searchParams.get('refresh')==='1'),historyFor(user.userId,symbol),notesFor(user.userId,symbol)]);
  return json({...data,analyses,notes});
 }catch(error){const message=error instanceof Error?error.message:'';return json({error:/Yahoo|Ticker|price|recent/.test(message)?message:'Research storage is unavailable. Check the local database migration.'},503);}
}
