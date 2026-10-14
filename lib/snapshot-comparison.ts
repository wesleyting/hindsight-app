type RecordedMarket={symbol:string;currency:string;priceAsOf:string;closes:{date:string;close:number}[]};

// Use the recorded market timestamps, never snapshot names or save order.
export function snapshotPriceChange(a:RecordedMarket,b:RecordedMarket){
 const timeA=Date.parse(a.priceAsOf),timeB=Date.parse(b.priceAsOf);
 const priceA=a.closes.at(-1)?.close,priceB=b.closes.at(-1)?.close;
 if(a.symbol!==b.symbol||a.currency!==b.currency||!a.currency||a.currency==='Unknown'||
  !Number.isFinite(timeA)||!Number.isFinite(timeB)||timeA===timeB||
  priceA===undefined||priceB===undefined||!Number.isFinite(priceA)||!Number.isFinite(priceB)||priceA<=0||priceB<=0)return null;
 const earlierIndex=timeA<timeB?0:1;
 const from=earlierIndex===0?priceA:priceB,to=earlierIndex===0?priceB:priceA;
 return {earlierIndex,from,to,change:to-from,percent:(to/from-1)*100,currency:a.currency};
}
