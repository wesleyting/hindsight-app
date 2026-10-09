// A conservative guard against describing explicitly dated older events as new.
// This catches date contradictions, not every possible semantic error in a summary.
export function validBriefUpdate(text:string,since:string){
 if(!Number.isFinite(Date.parse(since)))return false;
 const dates=[...text.matchAll(/\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/gi)].map(match=>Date.parse(match[0]));
 const older=dates.some(stamp=>Number.isFinite(stamp)&&stamp<Date.parse(since.slice(0,10)+'T00:00:00Z'));
 return !(older&&/since (?:the |your )?(?:previous|last) (?:assessment|brief|update)/i.test(text));
}
