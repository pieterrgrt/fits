import { fail, redirect } from '@sveltejs/kit';
import { doe } from '#lib/server/db.js';
import * as data from '#lib/server/data.js';
import * as eten from '#lib/server/eten.js';
import { doelenVan } from '#lib/server/etendoelen.js';
import { vandaag, weekdag, plusDagen } from '#lib/datum.js';
import { oefening } from '#lib/oefeningen.js';
import { nogNietHersteld, lichteSets } from '#lib/groei.js';
import { groepenVan, SPIERGROEPEN } from '#lib/volume.js';

export const load = ({ locals }) => {
	const g = locals.gebruiker;
	const d = vandaag();
	const dagVanVandaag = data.dag(g.id, weekdag(d));
	const week = data.week(g.id, d);
	const alleDagen = data.dagen(g.id);
	const open = data.openTraining(g.id);
	const items = (dagVanVandaag?.items ?? []).map((it) => {
		const o = it.slug ? oefening(it.slug) : null;
		return { ...it, naam: o?.naam ?? 'Wisselslot', kort: o?.kort, advies: data.adviesVoor(g.id, it, d) };
	});
	// Herstel: spiergroepen die je vandaag traint en de laatste 48 uur al zwaar hebt gedaan.
	const herstel = dagVanVandaag?.soort === 'gym' && !open && !week.trainingen.some((t) => t.datum === d)
		? nogNietHersteld(data.recenteSets(g.id), [...new Set(items.flatMap((it) => (it.slug ? groepenVan(it.slug) : [])))], groepenVan).map((h) => ({
				...h,
				naam: SPIERGROEPEN.find((x) => x.id === h.groep).naam
			}))
		: [];
	const licht = data.isLichteWeek(g.id, d);
	if (licht) for (const it of items) it.sets_tijdelijk = lichteSets(it.sets_tijdelijk ?? it.sets);
	const gewicht = data.laatsteGewicht(g.id)?.gewicht ?? g.gewicht;
	return {
		titel: 'Vandaag',
		datum: d,
		dag: dagVanVandaag && { ...dagVanVandaag, items },
		gisteren: data.dag(g.id, weekdag(plusDagen(d, -1))),
		morgen: data.dag(g.id, weekdag(plusDagen(d, 1))),
		week,
		weekschema: alleDagen.map(({ id, weekdag, titel, soort, code }) => ({ id, weekdag, titel, soort, code })),
		open,
		dagregel: data.dagregel(g.id, d),
		eten: eten.dag(g.id, d).totaal,
		etenDoelen: doelenVan(g.id),
		gewicht,
		onderhoud: g.onderhoud,
		herstel,
		licht,
		gedaanVandaag: week.trainingen.some((t) => t.datum === d)
	};
};

const getalOfNull = (v, min, max) => {
	if (v == null || v === '') return null;
	const n = Number(String(v).replace(',', '.'));
	return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
};

export const actions = {
	start: async ({ request, locals }) => {
		const f = await request.formData();
		const open = data.openTraining(locals.gebruiker.id);
		if (open) redirect(303, `/training/${open.id}`);
		const id = data.startTraining(locals.gebruiker.id, Number(f.get('dag')));
		if (!id) return fail(400, { fout: 'Die dag bestaat niet.' });
		redirect(303, `/training/${id}`);
	},
	dagregel: async ({ request, locals }) => {
		const f = await request.formData();
		const datum = String(f.get('datum') ?? vandaag());
		const waarden = { slaap: getalOfNull(f.get('slaap'), 0, 16), gewicht: getalOfNull(f.get('gewicht'), 20, 300) };
		if (Object.values(waarden).includes(undefined)) return fail(400, { dagFout: 'Een van de getallen klopt niet.' });
		const oud = data.dagregel(locals.gebruiker.id, datum);
		// Slaap die je zelf aanpast, is daarna van jou (niet meer uit Gezondheid).
		const bron = waarden.slaap === oud.slaap ? (oud.slaap_bron ?? null) : waarden.slaap == null ? null : 'zelf';
		doe(
			`INSERT INTO dagregels (gebruiker_id, datum, slaap, gewicht, slaap_bron) VALUES (?, ?, ?, ?, ?)
			 ON CONFLICT (gebruiker_id, datum) DO UPDATE SET slaap = excluded.slaap, gewicht = excluded.gewicht, slaap_bron = excluded.slaap_bron`,
			locals.gebruiker.id, datum, waarden.slaap, waarden.gewicht, bron
		);
		return { opgeslagen: true };
	}
};
