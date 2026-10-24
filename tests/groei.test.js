import { test } from 'node:test';
import assert from 'node:assert/strict';
import { e1rm, verloopMetRecords, isRecord, lichteWeekAdvies, lichteSets, gewichtsTrend, kcalAdvies, schijvenPerKant, nogNietHersteld, slaapEnPrestatie } from '../src/lib/groei.js';

test('records: alleen een hoger geschat maximum dan ooit telt', () => {
	const v = verloopMetRecords([
		{ datum: '2026-10-01', sets: [{ gewicht: 50, reps: 8 }] },
		{ datum: '2026-10-05', sets: [{ gewicht: 50, reps: 10 }, { gewicht: 50, reps: 9 }] },
		{ datum: '2026-10-09', sets: [{ gewicht: 50, reps: 9 }] }
	]);
	assert.deepEqual(v.map((x) => x.record), [false, true, false]);
	assert.equal(v[1].reps, 10);
	assert.ok(isRecord({ gewicht: 55, reps: 8 }, [{ gewicht: 50, reps: 10 }]));
	assert.ok(!isRecord({ gewicht: 50, reps: 8 }, []));
	assert.equal(Math.round(e1rm(100, 5)), 117);
});

test('lichte week: na 6 weken, bij weinig energie of veel vastlopen', () => {
	const weken = ['2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28', '2026-10-05', '2026-10-12'];
	assert.equal(lichteWeekAdvies({ trainingsweken: weken }).voorstel, true);
	assert.equal(lichteWeekAdvies({ trainingsweken: weken, laatsteLicht: '2026-09-21' }).voorstel, false);
	assert.equal(lichteWeekAdvies({ trainingsweken: [], weekregels: [{ energie: 4 }, { energie: 3 }] }).voorstel, true);
	assert.equal(lichteWeekAdvies({ trainingsweken: [], vastgelopen: 3 }).voorstel, true);
	assert.equal(lichteSets(4), 2);
	assert.equal(lichteSets(3), 2);
});

test('gewichtstrend en caloriestap', () => {
	const w = (d, g) => ({ datum: d, gewicht: g });
	const vlak = [w('2026-10-04', 75), w('2026-10-08', 75.1), w('2026-10-12', 74.9), w('2026-10-16', 75), w('2026-10-20', 75)];
	const t = gewichtsTrend(vlak, '2026-10-24');
	assert.ok(Math.abs(t.perWeek) < 0.1);
	assert.equal(kcalAdvies(t).stap, 150);
	const stijgend = [w('2026-10-04', 75), w('2026-10-11', 75.2), w('2026-10-18', 75.4), w('2026-10-24', 75.6)];
	assert.equal(kcalAdvies(gewichtsTrend(stijgend, '2026-10-24')).stap, 0);
	assert.equal(gewichtsTrend([w('2026-10-20', 75)], '2026-10-24'), null);
});

test('schijven per kant', () => {
	assert.deepEqual(schijvenPerKant(52.5), [15, 1.25]);
	assert.deepEqual(schijvenPerKant(100), [25, 15]);
	assert.deepEqual(schijvenPerKant(20), []);
	assert.equal(schijvenPerKant(51), null);
	assert.equal(schijvenPerKant(15), null);
});

test('herstel: 6+ sets in de laatste 48 uur', () => {
	const nu = Date.parse('2026-10-24T18:00:00Z');
	const sets = Array.from({ length: 6 }, () => ({ slug: 'db-curl', gemaakt: '2026-10-23 18:00:00' }));
	const groepen = () => ['biceps'];
	assert.deepEqual(nogNietHersteld(sets, ['biceps', 'rug'], groepen, nu), [{ groep: 'biceps', sets: 6, uren: 24 }]);
	assert.deepEqual(nogNietHersteld(sets, ['biceps'], groepen, nu + 30 * 3600_000), []);
});

test('slaap en prestatie: vergelijkt korte en goede nachten', () => {
	const t = (datum, slaap, reps) => ({ datum, slaap, sets: [{ slug: 'bench-press', gewicht: 50, reps }] });
	const r = slaapEnPrestatie([t('2026-10-01', 8, 10), t('2026-10-03', 6, 8), t('2026-10-05', 8.5, 10), t('2026-10-07', 6.5, 8), t('2026-10-09', 8, 10), t('2026-10-11', 6, 8), t('2026-10-13', 8, 11)]);
	assert.equal(r.kort.n, 3);
	assert.equal(r.goed.n, 3);
	assert.ok(r.goed.score > r.kort.score);
	assert.equal(r.genoeg, true);
});
