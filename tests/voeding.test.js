import { test } from 'node:test';
import assert from 'node:assert/strict';
import { voor, optellen, doelen } from '../src/lib/voeding.js';
import { leesRegels, nacht } from '../src/lib/slaap.js';

test('voedingswaarden per hoeveelheid', () => {
	const kwark = { kcal: 60, eiwit: 10, koolh: 3.8, vet: 0.2, vezels: 0, suiker: 3.8 };
	assert.deepEqual(voor(kwark, 250), { kcal: 150, eiwit: 25, koolh: 9.5, vet: 0.5, vezels: 0, suiker: 9.5 });
	assert.equal(optellen([voor(kwark, 250), voor(kwark, 150)]).eiwit, 40);
});

test('doelen uit gewicht en onderhoud', () => {
	const d = doelen({ gewicht: 75, onderhoud: 2600 });
	assert.equal(d.kcal, 3000);
	assert.deepEqual(d.bereik, [2900, 3100]);
	assert.deepEqual(d.eiwit, [135, 150]);
	assert.equal(d.vet, 83);
	assert.equal(d.koolh, Math.round((3000 - 150 * 4 - 83 * 9) / 4));
	assert.equal(doelen({ gewicht: 75 }).geschat, true);
});

test('slaap: één nacht met fasen, in bed en wakker tellen niet', () => {
	const tekst = [
		'2026-10-23T23:30:00+02:00|2026-10-24T07:30:00+02:00|In bed',
		'2026-10-23T23:45:00+02:00|2026-10-24T01:45:00+02:00|Kern',
		'2026-10-24T01:45:00+02:00|2026-10-24T02:45:00+02:00|Diep',
		'2026-10-24T02:45:00+02:00|2026-10-24T03:00:00+02:00|Wakker',
		'2026-10-24T03:00:00+02:00|2026-10-24T05:00:00+02:00|Kern',
		'2026-10-24T05:00:00+02:00|2026-10-24T07:00:00+02:00|REM',
		// dubbele meting van de iPhone, overlapt
		'2026-10-24T05:30:00+02:00|2026-10-24T06:30:00+02:00|REM'
	].join('\n');
	const n = nacht(leesRegels(tekst));
	assert.equal(n.datum, '2026-10-24');
	assert.equal(n.minuten, 7 * 60);
	assert.deepEqual(n.fasen, { diep: 60, kern: 240, rem: 120, wakker: 15 });
});

test('slaap: middagdutje na de nacht hoort er niet bij als er 2+ uur tussen zit, de laatste nacht telt', () => {
	const tekst = [
		'2026-10-22T23:00:00+02:00|2026-10-23T07:00:00+02:00|Slapend',
		'2026-10-23T23:30:00+02:00|2026-10-24T06:30:00+02:00|Slapend'
	].join('\n');
	const n = nacht(leesRegels(tekst));
	assert.equal(n.datum, '2026-10-24');
	assert.equal(n.minuten, 420);
});

test('slaap: rommel wordt genegeerd', () => {
	assert.equal(nacht(leesRegels('onzin\n|\n2026-10-24T01:00:00Z|2026-10-24T00:00:00Z|Kern')), null);
});

import { vanOff } from '../src/lib/off.js';

test('Open Food Facts-product omzetten', () => {
	const p = vanOff({
		code: '8710400000000',
		product_name: 'Magere kwark',
		brands: 'Huismerk, Ander',
		quantity: '500 g',
		serving_size: '150 g',
		serving_quantity: 150,
		nutriments: { 'energy-kcal_100g': 59, proteins_100g: 10.2, carbohydrates_100g: 3.9, fat_100g: 0.1, sugars_100g: 3.9, salt_100g: 0.1 }
	});
	assert.equal(p.id, 'off:8710400000000');
	assert.equal(p.merk, 'Huismerk');
	assert.equal(p.eenheid, 'g');
	assert.deepEqual(p.porties, [['portie (150 g)', 150], ['verpakking', 500]]);
	assert.equal(p.eiwit, 10.2);
});

test('Open Food Facts: kJ omrekenen, liters herkennen, zonder naam overslaan', () => {
	const cola = vanOff({ code: '5449000000996', product_name: 'Cola', quantity: '1,5 l', nutriments: { energy_100g: 180 } });
	assert.equal(cola.kcal, 43);
	assert.equal(cola.eenheid, 'ml');
	assert.deepEqual(cola.porties, []);
	assert.equal(vanOff({ code: '1', nutriments: { 'energy-kcal_100g': 10 } }), null);
});
