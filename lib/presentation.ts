// Move citation groups across sentence punctuation without altering their source IDs.
export function citationsAfterPunctuation(text:string){
 return text.replace(/\s*((?:\[(?:P|[NSC]\d+)\][ \t]*)+)([.!?,;:])/g,(_,citations:string,punctuation:string)=>punctuation+citations.trim());
}
export function pricePeriod(start:string,end:string){
 const days=Math.round((Date.parse(end)-Date.parse(start))/86400000);
 return days>=6&&days<=9?'1 week':`${days} days`;
}
