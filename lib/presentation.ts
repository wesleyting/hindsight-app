// Move citation groups across sentence punctuation without altering their source IDs.
export function citationsAfterPunctuation(text:string){
 return text.replace(/\s*((?:\[(?:P|[NSC]\d+)\][ \t]*)+)([.!?,;:])/g,(_,citations:string,punctuation:string)=>punctuation+citations.trim());
}
export function pricePeriod(start:string,end:string){
 const first=new Date(start),last=new Date(end);
 const acrossYears=first.getUTCFullYear()!==last.getUTCFullYear();
 const format=new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',...(acrossYears?{year:'numeric' as const}:{}),timeZone:'UTC'});
 return `${format.format(first)} – ${format.format(last)}`;
}

// Compare actual observations, not fetch times: fetching the same quote is not new data.
export function pricesChangedSinceBrief(current:{closes:{date:string;close:number}[]},previous:{closes:{date:string;close:number}[]}){
 const now=current.closes.at(-1),then=previous.closes.at(-1);
 if(!now||!then||!Number.isFinite(now.close)||!Number.isFinite(then.close))return false;
 const nowDate=Date.parse(now.date),thenDate=Date.parse(then.date);
 if(!Number.isFinite(nowDate)||!Number.isFinite(thenDate))return false;
 return nowDate>thenDate||(nowDate===thenDate&&now.close!==then.close);
}
