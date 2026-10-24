/*
  Trainingsvolume: harde sets per spiergroep per week. Voor spiergroei is ongeveer 10–20 sets per
  spiergroep per week een goede richting. Een set telt 1 voor de spieren die het werk doen (primair)
  en ½ voor de spieren die meehelpen (secundair). Warming-up telt niet mee.
*/
import { PER_SLUG } from './oefeningen.js';

export const SPIERGROEPEN = [
	{ id: 'borst', naam: 'Borst', spieren: ['borst'] },
	{ id: 'rug', naam: 'Rug', spieren: ['lats', 'midden-rug'] },
	{ id: 'schouder-voor', naam: 'Schouder voor', spieren: ['schouder-voor'] },
	{ id: 'schouder-zij', naam: 'Schouder zij', spieren: ['schouder-zij'] },
	{ id: 'schouder-achter', naam: 'Schouder achter', spieren: ['schouder-achter'] },
	{ id: 'biceps', naam: 'Biceps', spieren: ['biceps'] },
	{ id: 'triceps', naam: 'Triceps', spieren: ['triceps'] },
	{ id: 'quadriceps', naam: 'Quadriceps', spieren: ['quadriceps'] },
	{ id: 'hamstrings', naam: 'Hamstrings', spieren: ['hamstrings'] },
	{ id: 'bil', naam: 'Bil', spieren: ['bil', 'abductoren'] },
	{ id: 'kuiten', naam: 'Kuiten', spieren: ['kuiten'] },
	{ id: 'buik', naam: 'Buik', spieren: ['buik'] }
];
export const BEREIK = [10, 20];

const groepVanSpier = Object.fromEntries(SPIERGROEPEN.flatMap((g) => g.spieren.map((s) => [s, g.id])));

/** sets: [{ slug, reps }] of [{ slug, aantal }] → { groep-id: sets } */
export function volume(sets) {
	const uit = Object.fromEntries(SPIERGROEPEN.map((g) => [g.id, 0]));
	for (const s of sets) {
		const o = PER_SLUG[s.slug];
		if (!o || o.soort === 'warming-up' || s.reps === 0) continue;
		const n = s.aantal ?? 1;
		// Een spier telt per set maar één keer per groep (rug = lats + midden-rug is samen 1).
		const prim = new Set(o.spieren.primair.map((m) => groepVanSpier[m]).filter(Boolean));
		const sec = new Set(o.spieren.secundair.map((m) => groepVanSpier[m]).filter((g) => g && !prim.has(g)));
		for (const g of prim) uit[g] += n;
		for (const g of sec) uit[g] += n / 2;
	}
	for (const g in uit) uit[g] = Math.round(uit[g] * 2) / 2;
	return uit;
}

export const oordeel = (n) => (n < BEREIK[0] ? 'weinig' : n > BEREIK[1] ? 'veel' : 'goed');
