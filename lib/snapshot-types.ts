import type { MarketSnapshot } from './market';
import type { SavedAnalysis } from './research-types';
export type StockSnapshot={id:string;symbol:string;name:string;createdAt:string;payload:{market:MarketSnapshot;brief:SavedAnalysis;selected:{analysis:SavedAnalysis;title:string;answer:string}|null;expanded:boolean}};
export type SnapshotSummary=Omit<StockSnapshot,'payload'>;
