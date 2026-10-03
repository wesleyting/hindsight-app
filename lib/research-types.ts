import type { ResearchBundle } from './investigation';
import type { MarketSnapshot } from './market';
export type SavedAnalysis={id:string;symbol:string;kind:'catchup'|'question';question:string;answer:string;createdAt:string;model:string;market:MarketSnapshot;research?:ResearchBundle|null;usage:{inputTokens:number|null;outputTokens:number|null;cachedInputTokens:number|null}};
export type SavedNote={id:string;symbol:string;text:string;createdAt:string};
export type ResearchView={market:MarketSnapshot;analyses:SavedAnalysis[];notes:SavedNote[];cached:boolean};
