import { fail, redirect } from '@sveltejs/kit';
import { doe } from '#lib/server/db.js';
import * as data from '#lib/server/data.js';
import { vandaag, weekdag, plusDagen } from '#lib/datum.js';
import { oefening } from '#lib/oefeningen.js';

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
		gewicht,
		onderhoud: g.onderhoud,
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
		const waarden = {
			slaap: getalOfNull(f.get('slaap'), 0, 16),
			eiwit: getalOfNull(f.get('eiwit'), 0, 600),
			kcal: getalOfNull(f.get('kcal'), 0, 10000),
			gewicht: getalOfNull(f.get('gewicht'), 20, 300)
		};
		if (Object.values(waarden).includes(undefined)) return fail(400, { dagFout: 'Een van de getallen klopt niet.' });
		doe(
			`INSERT INTO dagregels (gebruiker_id, datum, slaap, eiwit, kcal, gewicht) VALUES (?, ?, ?, ?, ?, ?)
			 ON CONFLICT (gebruiker_id, datum) DO UPDATE SET slaap = excluded.slaap, eiwit = excluded.eiwit, kcal = excluded.kcal, gewicht = excluded.gewicht`,
			locals.gebruiker.id, datum, waarden.slaap, waarden.eiwit, waarden.kcal, waarden.gewicht
		);
		return { opgeslagen: true };
	}
};
