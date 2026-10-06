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
