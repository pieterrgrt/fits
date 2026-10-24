import { test } from 'node:test';
import assert from 'node:assert/strict';
import { volume, oordeel } from '../src/lib/volume.js';

test('primair telt 1, secundair ½, warming-up en lege sets niet', () => {
	const v = volume([
		{ slug: 'bench-press', reps: 10 },
		{ slug: 'bench-press', reps: 9 },
		{ slug: 'bench-press', reps: 0 },
		{ slug: 'lateral-raise', reps: 12 },
		{ slug: 'scapular-pulldown', reps: 12 }
	]);
	assert.equal(v.borst, 2);
	assert.equal(v.triceps, 1);
	assert.equal(v['schouder-voor'], 1);
	assert.equal(v['schouder-zij'], 1);
	assert.equal(v.rug, 0);
});

test('lats en midden rug in één oefening tellen samen één keer voor Rug', () => {
	assert.equal(volume([{ slug: 'chest-supported-row', reps: 10 }]).rug, 1);
});

test('aantal sets uit een schema', () => {
	assert.equal(volume([{ slug: 'pec-deck', aantal: 3 }]).borst, 3);
	assert.equal(oordeel(8), 'weinig');
	assert.equal(oordeel(14), 'goed');
	assert.equal(oordeel(24), 'veel');
});
