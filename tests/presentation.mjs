import assert from 'node:assert/strict';
import { citationsAfterPunctuation,pricePeriod } from '../lib/presentation.ts';
assert.equal(citationsAfterPunctuation('Funding secured [S1][S2]. Next [N1], perhaps.'),'Funding secured.[S1][S2] Next,[N1] perhaps.');
assert.equal(citationsAfterPunctuation('Already after.[S1] Unpunctuated [S2] detail'),'Already after.[S1] Unpunctuated [S2] detail');
assert.equal(pricePeriod('2026-09-24','2026-10-01'),'September 24 – October 1');
assert.equal(pricePeriod('2026-09-24','2026-09-28'),'September 24 – September 28');
console.log('Passed citation punctuation and honest period labels.');

assert.equal(pricePeriod('2025-12-29','2026-01-05'),'December 29, 2025 – January 5, 2026');
