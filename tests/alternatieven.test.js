import { test } from 'node:test';
import assert from 'node:assert/strict';
import { alternatieven, groepVan } from '../src/lib/alternatieven.js';

test('vervangers trainen dezelfde spieren, de nauwste eerst', () => {
	assert.deepEqual(alternatieven('lat-pulldown').slice(0, 2), ['lat-pulldown-neutraal', 'pull-up']);
	assert.ok(alternatieven('bench-press').slice(0, 4).includes('incline-chest-press'));
	assert.ok(alternatieven('db-curl').every((s) => groepVan(s) === 'Armen'));
	assert.ok(!alternatieven('leg-extension').includes('leg-extension'));
});

test('spiergroep van een oefening', () => {
	assert.equal(groepVan('face-pull'), 'Schouders');
	assert.equal(groepVan('romanian-deadlift'), 'Benen');
	assert.equal(groepVan('onbekend'), 'Overig');
});
