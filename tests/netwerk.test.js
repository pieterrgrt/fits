import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Netwerk, gelopenSegmenten, ontdekrondjes, bemonster, lengte, wegUitOsm, celVan, cellenIn, celGrenzen, verplaats } from '#lib/hardlopen/netwerk.js';

// Een raster van straten: N × N kruispunten, ~100 m uit elkaar. Rijen zijn wegen 1000+i, kolommen 2000+j.
const N = 31, D = 0.0009, LAT = 52, LON = 5, DLON = D / Math.cos((LAT * Math.PI) / 180);
const knoop = (i, j) => i * 1000 + j + 1;
const p = (i, j) => [LAT + i * D, LON + j * DLON];
const wegen = [];
for (let i = 0; i < N; i++) wegen.push({ id: 1000 + i, soort: 'residential', straat: 1, knopen: Array.from({ length: N }, (_, j) => knoop(i, j)), punten: Array.from({ length: N }, (_, j) => p(i, j)) });
for (let j = 0; j < N; j++) wegen.push({ id: 2000 + j, soort: 'residential', straat: 1, knopen: Array.from({ length: N }, (_, i) => knoop(i, j)), punten: Array.from({ length: N }, (_, i) => p(i, j)) });
const net = new Netwerk(wegen);
const midden = p(15, 15);

test('cellen', () => {
	assert.equal(celVan(52.091, 5.121), '2604:170');
	assert.deepEqual(celGrenzen('2604:170'), { zuid: 52.08, west: 5.1, noord: 52.1, oost: 5.13 });
	assert.equal(cellenIn({ zuid: 52.081, west: 5.101, noord: 52.121, oost: 5.129 }).length, 3);
});

test('bemonsteren en lengte', () => {
	const lijn = [p(0, 0), p(0, 10)];
	assert.ok(Math.abs(lengte(lijn) - 1000) < 5);
	const s = bemonster(lijn, 10);
	assert.ok(s.length >= 100 && s.length <= 102, String(s.length));
});

test('OSM-wegen: stoepen tellen niet als straat, privé en verboden voor voetgangers vallen af', () => {
	const basis = { type: 'way', id: 1, nodes: [1, 2], geometry: [{ lat: 52, lon: 5 }, { lat: 52.001, lon: 5 }] };
	assert.equal(wegUitOsm({ ...basis, tags: { highway: 'residential', name: 'Dorpsstraat' } }).straat, 1);
	assert.equal(wegUitOsm({ ...basis, tags: { highway: 'footway', footway: 'sidewalk' } }).straat, 0);
	assert.equal(wegUitOsm({ ...basis, tags: { highway: 'cycleway', foot: 'use_sidepath' } }), null);
	assert.equal(wegUitOsm({ ...basis, tags: { highway: 'service', access: 'private' } }), null);
	assert.equal(wegUitOsm({ ...basis, tags: { highway: 'motorway' } }), null);
	assert.equal(wegUitOsm({ ...basis, tags: { highway: 'service', service: 'parking_aisle' } }), null);
});

test('route: kortste weg in het raster', () => {
	const r = net.route(knoop(0, 0), knoop(3, 4));
	assert.ok(Math.abs(r.l - 700) < 10, String(r.l));
	assert.equal(r.knopen[0], knoop(0, 0));
	assert.equal(r.knopen.at(-1), knoop(3, 4));
	assert.equal(net.dichtsteKnoop([LAT + 0.0001, LON + 0.0001]), knoop(0, 0));
});

test('gelopen segmenten: je spoor langs een straat, niet de straat ernaast', () => {
	// Een spoor 8 m naast rij 5, van kolom 2 tot 8 (GPS wijkt altijd iets af).
	const spoor = [[p(5, 2)[0] + 0.00007, p(5, 2)[1]], [p(5, 8)[0] + 0.00007, p(5, 8)[1]]];
	const g = gelopenSegmenten(wegen, spoor);
	for (let s = 2; s < 8; s++) assert.ok(g.has(`1005:${s}`), `1005:${s}`);
	assert.ok(!g.has('1005:1') && !g.has('1005:8'));
	assert.ok(!g.has('1006:4') && !g.has('1004:4'));
	assert.ok(![...g.keys()].some((k) => k.startsWith('20')), 'dwarsstraten niet');
	assert.ok(Math.abs(g.get('1005:3') - 100) < 2);
});

test('ontdekrondje: ongeveer de gevraagde lengte, terug bij de start', () => {
	const rondjes = ontdekrondjes(net, midden, 5000);
	assert.ok(rondjes.length >= 2);
	for (const r of rondjes) {
		assert.ok(Math.abs(r.lengte - 5000) / 5000 < 0.15, String(r.lengte));
		assert.deepEqual(r.punten[0], midden);
		assert.deepEqual(r.punten.at(-1), midden);
		assert.ok(r.dubbel / r.lengte < 0.2, `dubbel ${r.dubbel}`);
	}
});

test('ontdekrondje: kiest de kant met nieuwe straten', () => {
	// Alles ten noorden van het midden (rij ≥ 15) al gelopen.
	const gelopen = new Set();
	for (const w of wegen) for (let s = 0; s < N - 1; s++) {
		const rij = w.id < 2000 ? w.id - 1000 : s;
		if (rij >= 15) gelopen.add(`${w.id}:${s}`);
	}
	const [beste] = ontdekrondjes(net, midden, 4000, gelopen);
	assert.ok(beste.nieuw / beste.lengte > 0.7, `${beste.nieuw} van ${beste.lengte}`);
	const zuidelijk = beste.punten.filter((q) => q[0] < midden[0] - 0.0001).length / beste.punten.length;
	assert.ok(zuidelijk > 0.6, String(zuidelijk));
});

test('verplaatsen', () => {
	const q = verplaats([52, 5], 1000, 90);
	assert.ok(Math.abs(q[0] - 52) < 1e-9 && q[1] > 5);
});
