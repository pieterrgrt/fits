import { test } from 'node:test';
import assert from 'node:assert/strict';
import { widget } from '#lib/widget.js';

const schema = [
	{ weekdag: 1, titel: 'Push', soort: 'gym' },
	{ weekdag: 2, titel: 'Pull', soort: 'gym' },
	{ weekdag: 3, titel: 'Legs', soort: 'gym' },
	{ weekdag: 7, titel: 'Rust', soort: 'rust' }
];
const basis = {
	datum: '2026-10-27', // dinsdag
	dag: { titel: 'Pull', soort: 'gym', items: [{}, {}, {}] },
	morgen: { titel: 'Legs', soort: 'gym' },
	weekschema: schema,
	week: { trainingen: [{ datum: '2026-10-26' }], activiteiten: [], dagregels: [] },
	open: null,
	dagregel: { slaap: 7.5 },
	eten: { eiwit: 80.4, kcal: 1500 },
	doelen: { eiwit: [140, 155], kcal: 2800 }
};

test('widget: vandaag, pijlers en week', () => {
	const w = widget(basis);
	assert.equal(w.vandaag.status, 'open');
	assert.equal(w.vandaag.oefeningen, 3);
	assert.deepEqual(w.gym, { gedaan: 1, doel: 3 });
	assert.deepEqual(w.eiwit, { vandaag: 80, doel: 140 });
	assert.equal(w.slaap.uren, 7.5);
	assert.equal(w.week.length, 7);
	assert.equal(w.week[0].datum, '2026-10-26');
	assert.equal(w.week[0].gedaan, true);
	assert.equal(w.week[1].vandaag, true);
	assert.equal(w.week[6].soort, 'rust');
});

test('widget: bezig, gedaan en geen schema', () => {
	assert.equal(widget({ ...basis, open: { id: 1 } }).vandaag.status, 'bezig');
	const gedaan = { ...basis, week: { ...basis.week, trainingen: [{ datum: '2026-10-27' }] } };
	assert.equal(widget(gedaan).vandaag.status, 'gedaan');
	assert.equal(widget({ ...basis, dag: null }).vandaag, null);
});
