import assert from 'node:assert/strict';
import * as A from '../kit/audit.mjs';

const F = { o: [0, 0, 0], a: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] };
const ring = A.lathe(F, [[0, 2], [0, 3], [2, 3], [2, 2]], { name: 'holder' });
const line = (z) => ({ ...A.tube([[0, 0, z], [0, 0, 5]], 2, { name: 'hose' }), tips: [[0, 0, z], null], tipRims: [2, 2] });
assert.equal(A.terminals([line(1)], [ring]).length, 0, 'rim lands on the bore');
assert.equal(A.looseEnds([line(1)], [ring]).length, 0, 'a hollow holder supports the rim, not the empty centre');
assert.equal(A.terminals([line(2.5)], [ring]).length, 1, 'a rim beyond the holder is rejected');
assert.equal(A.looseEnds([line(2.5)], [ring]).length, 1, 'a detached rim stays loose');
const moved = { ...ring, move: [10, 0, 0] };
assert.equal(A.looseEnds([line(1)], [moved], { state: 1 }).length, 1, 'a holder moving away cannot anchor a stationary hose');
console.log('Geometry audit regression: 5 assertions passed.');
