// Wat de widget op je telefoon (Scriptable) laat zien. Pure functie, zodat het te testen is (tests/widget.test.js).
import { weekdag, maandag, plusDagen } from '#lib/datum.js';

/**
 * @param {object} p
 * @param {string} p.datum           vandaag, JJJJ-MM-DD
 * @param {object|null} p.dag        de dag uit het schema voor vandaag (titel, soort, code, focus, items)
 * @param {object|null} p.morgen     de dag van morgen uit het schema
 * @param {Array} p.weekschema       alle dagen uit het schema
 * @param {object} p.week            uit data.week(): trainingen, dagregels, activiteiten
 * @param {object|null} p.open       training die nu loopt
 * @param {object} p.dagregel        dagregel van vandaag (slaap, eiwit)
 * @param {object} p.eten            totaal van het eetdagboek vandaag
 * @param {object} p.doelen          uit doelenVan()
 */
export function widget({ datum, dag, morgen, weekschema, week, open, dagregel, eten, doelen }) {
	const ma = maandag(datum);
	const gedaanOp = new Set(week.trainingen.map((t) => t.datum));
	const gymDagen = weekschema.filter((d) => d.soort === 'gym');
	const eiwit = Math.round(eten.eiwit || dagregel.eiwit || 0);
	return {
		datum,
		vandaag: dag
			? {
					titel: dag.titel,
					soort: dag.soort,
					focus: dag.focus ?? null,
					oefeningen: (dag.items ?? []).length,
					status: open ? 'bezig' : gedaanOp.has(datum) ? 'gedaan' : dag.soort === 'rust' ? 'rust' : 'open'
				}
			: null,
		morgen: morgen ? { titel: morgen.titel, soort: morgen.soort } : null,
		gym: { gedaan: week.trainingen.length, doel: gymDagen.length },
		eiwit: { vandaag: eiwit, doel: doelen.eiwit[0] },
		kcal: { vandaag: Math.round(eten.kcal || 0), doel: doelen.kcal },
		slaap: { uren: dagregel.slaap ?? null, doel: 8 },
		cardio: { keer: week.activiteiten.length, doel: 3 },
		// ma–zo: per dag of het een gymdag is en of je er was
		week: Array.from({ length: 7 }, (_, i) => {
			const d = plusDagen(ma, i);
			const s = weekschema.find((x) => x.weekdag === weekdag(d));
			return { datum: d, soort: s?.soort ?? null, gedaan: gedaanOp.has(d), vandaag: d === datum };
		})
	};
}
