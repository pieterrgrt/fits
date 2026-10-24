import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advies, doelVandaag, volgendGewicht } from '../src/lib/progressie.js';

const item = (x = {}) => ({ gewicht: 50, eenheid: 'kg', per_stuk: 0, sets: 4, reps_min: 8, reps_max: 12, sinds: '2026-10-01', ...x });
const compound = { soort: 'compound', stap: 'stang' };
const raise = { soort: 'isolatie', stap: 'raise' };
const s = (datum, reps, gewicht = 50, rir = null) => ({ datum, sets: reps.map((r) => ({ gewicht, reps: r, rir })) });

test('bovenkant in alle sets → zwaarder', () => {
	const a = advies(item(), compound, [s('2026-10-20', [12, 12, 12, 12])], '2026-10-25');
	assert.equal(a.soort, 'zwaarder');
	assert.equal(a.nieuw, 52.5);
});

test('niet in alle sets → doorgaan met +1 per set', () => {
	const a = advies(item(), compound, [s('2026-10-20', [12, 11, 10, 9])], '2026-10-25');
	assert.equal(a.soort, 'doorgaan');
	assert.deepEqual(a.doel, [12, 12, 11, 10]);
});

test('alleen tot falen gehaald → nog niet', () => {
	const a = advies(item(), compound, [s('2026-10-20', [12, 12, 12, 12], 50, 0)], '2026-10-25');
	assert.equal(a.soort, 'falen');
});

test('isolatie: laatste set tot falen mag', () => {
	const sessie = { datum: '2026-10-20', sets: [{ gewicht: 35, reps: 15, rir: 1 }, { gewicht: 35, reps: 15, rir: 1 }, { gewicht: 35, reps: 15, rir: 0 }] };
	const a = advies(item({ gewicht: 35, sets: 3, reps_min: 12, reps_max: 15 }), { soort: 'isolatie', stap: 'machine' }, [sessie], '2026-10-25');
	assert.equal(a.soort, 'zwaarder');
	assert.equal(a.nieuw, 37.5);
});

test('raises: hooguit +1 kg per maand', () => {
	const it = item({ gewicht: 6, per_stuk: 1, sets: 3, reps_min: 12, reps_max: 15, sinds: '2026-10-10' });
	const a = advies(it, raise, [s('2026-10-20', [15, 15, 15], 6)], '2026-10-25');
	assert.equal(a.soort, 'wacht');
	const b = advies({ ...it, sinds: '2026-09-01' }, raise, [s('2026-10-20', [15, 15, 15], 6)], '2026-10-25');
	assert.equal(b.soort, 'zwaarder');
	assert.equal(b.nieuw, 7);
});

test('laatste set drie keer gemist → één set minder', () => {
	const sessies = [s('2026-10-20', [10, 9, 8, 6]), s('2026-10-13', [10, 9, 8, 7]), s('2026-10-06', [10, 9, 8, 7])];
	const a = advies(item(), compound, sessies, '2026-10-25');
	assert.equal(a.soort, 'set-minder');
	assert.equal(a.sets, 3);
});

test('vier weken stilstand → vervangen', () => {
	const sessies = [s('2026-10-20', [10, 9, 9, 8]), s('2026-09-25', [10, 10, 9, 8])];
	const a = advies(item({ sinds: '2026-09-20' }), compound, sessies, '2026-10-25');
	assert.equal(a.soort, 'vervang');
});

test('zoek gewicht: neemt het zwaarste gewicht met de onderkant', () => {
	const sessie = { datum: '2026-10-20', sets: [{ gewicht: 20, reps: 12 }, { gewicht: 30, reps: 9 }, { gewicht: 35, reps: 6 }] };
	const a = advies(item({ gewicht: null }), compound, [sessie], '2026-10-25');
	assert.equal(a.soort, 'zoek');
	assert.equal(a.nieuw, 30);
});

test('stappen per soort', () => {
	assert.equal(volgendGewicht(item({ gewicht: 37.5 }), { stap: 'machine' }), 40);
	assert.equal(volgendGewicht(item({ gewicht: 60 }), { stap: 'machine' }), 65);
	assert.equal(volgendGewicht(item({ gewicht: 10 }), { stap: 'dumbbell' }), 11);
	assert.equal(volgendGewicht(item({ gewicht: 360, eenheid: 'lbs' }), { stap: 'machine' }), 370);
	assert.equal(volgendGewicht(item({ gewicht: -20 }), { stap: 'lichaam' }), -15);
});

test('doel vandaag zonder geschiedenis = onderkant', () => {
	assert.deepEqual(doelVandaag(item(), []), [8, 8, 8, 8]);
});
