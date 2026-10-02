import assert from 'node:assert/strict';
import {stocks,percentChange,normalized} from '../lib/reviews.ts';
for (const s of stocks) for (let w=0;w<2;w++) { assert.equal(normalized(s.prices[w])[0],0); assert.equal(s.prices[w].length,s.benchmark[w].length); }
assert.ok(Math.abs(percentChange(stocks[0].prices[0])-4.8)<1e-10);
assert.ok(Math.abs(percentChange(stocks[1].prices[0])+2)<1e-10);
assert.ok(Math.abs(percentChange(stocks[2].prices[0])+7)<1e-10);
assert.throws(()=>percentChange([0,1])); assert.throws(()=>percentChange([100,NaN]));
for (const s of stocks) for (const q of s.questions) for(const id of q.evidence) assert.ok(s.evidence.some(e=>e.id===id),`Missing source ${id}`);
console.log('Passed: return calculations, invalid inputs, matching periods, evidence references.');
