import assert from 'node:assert/strict';
import { citationsAfterPunctuation,pricePeriod } from '../lib/presentation.ts';
assert.equal(citationsAfterPunctuation('Funding secured [S1][S2]. Next [N1], perhaps.'),'Funding secured.[S1][S2] Next,[N1] perhaps.');
assert.equal(citationsAfterPunctuation('Already after.[S1] Unpunctuated [S2] detail'),'Already after.[S1] Unpunctuated [S2] detail');
assert.equal(pricePeriod('2026-09-24','2026-10-01'),'September 24 – October 1');
assert.equal(pricePeriod('2026-09-24','2026-09-28'),'September 24 – September 28');
console.log('Passed citation punctuation and honest period labels.');

assert.equal(pricePeriod('2025-12-29','2026-01-05'),'December 29, 2025 – January 5, 2026');

const {pricesChangedSinceBrief}=await import('../lib/presentation.ts');
const observed=(date,close)=>({closes:[{date,close}]});
const baseline=observed('2026-10-08',3.44);
assert.equal(pricesChangedSinceBrief(observed('2026-10-09',3.44),baseline),true,'A new session matters even with an unchanged close');
assert.equal(pricesChangedSinceBrief(observed('2026-10-08',3.45),baseline),true,'Same-session quote updates matter');
assert.equal(pricesChangedSinceBrief(observed('2026-10-08',3.44),baseline),false,'Re-fetching identical observations needs no warning');
assert.equal(pricesChangedSinceBrief(observed('2026-10-07',4),baseline),false,'Older fallback data is not a new observation');
assert.equal(pricesChangedSinceBrief({closes:[]},baseline),false);
assert.equal(pricesChangedSinceBrief(observed('invalid',4),baseline),false);
console.log('Passed brief price freshness checks.');
