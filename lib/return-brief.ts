export type WatchDate={date:string;title:string;status:string};

export function returnWatchDates(events:WatchDate[],today:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(today))return [];
 return events.filter(event=>/^\d{4}-\d{2}-\d{2}$/.test(event.date)&&Number.isFinite(Date.parse(event.date)))
  .map(event=>({...event,state:event.date<today?'passed':event.date===today?'today':'upcoming'}))
  .sort((a,b)=>{
   // First show the nearest date to today, with past dates clearly marked for checking.
   const distance=(date:string)=>Math.abs(Date.parse(date)-Date.parse(today));
   return distance(a.date)-distance(b.date)||a.date.localeCompare(b.date);
  }).slice(0,3);
}

export function returnBriefQuestion(company:string,symbol:string,since:string){
 return `What materially changed for ${company} (${symbol}) since my saved brief on ${since}? Research company-specific developments after that date. Lead with at most three short bullets explaining what changed, why it matters in plain language, and whether it strengthens or weakens the earlier outlook. Verify whether previously listed watch dates actually resulted in an announcement; a passed date alone is not evidence. Separate newly discovered older coverage from genuinely new events. Cite retrieved sources and clearly say when coverage is incomplete or no material change was established. Do not assume a price move proves a particular cause.`;
}
