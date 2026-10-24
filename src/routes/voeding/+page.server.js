import { fail } from '@sveltejs/kit';
import { alle, doe } from '#lib/server/db.js';
import { wegingen } from '#lib/server/data.js';
import { gewichtsTrend, kcalAdvies } from '#lib/groei.js';
import { totalenPerDag } from '#lib/server/eten.js';
import { doelenVan } from '#lib/server/etendoelen.js';
import { vandaag, plusDagen } from '#lib/datum.js';

export const load = ({ locals }) => {
	const g = locals.gebruiker.id;
	const d = vandaag();
	const van = plusDagen(d, -27);
	const eten = totalenPerDag(g, van, d);
	const regels = Object.fromEntries(alle('SELECT * FROM dagregels WHERE gebruiker_id = ? AND datum BETWEEN ? AND ?', g, van, d).map((r) => [r.datum, r]));
	const dagen = Array.from({ length: 28 }, (_, i) => {
		const datum = plusDagen(d, -i);
		const e = eten[datum];
		const r = regels[datum] ?? {};
		return {
			datum,
			kcal: e?.kcal ?? r.kcal ?? null,
			eiwit: e?.eiwit ?? r.eiwit ?? null,
			slaap: r.slaap ?? null,
			slaapBron: r.slaap_bron ?? null,
			fasen: r.slaap_fasen ? JSON.parse(r.slaap_fasen) : null,
			water: r.water ?? null,
			gewicht: r.gewicht ?? null
		};
	});
	const gewicht = alle(
		`SELECT datum, gewicht FROM dagregels WHERE gebruiker_id = ? AND gewicht IS NOT NULL AND datum >= ?
		 UNION SELECT week, gewicht FROM weekregels WHERE gebruiker_id = ? AND gewicht IS NOT NULL AND week >= ? ORDER BY 1`,
		g, plusDagen(d, -180), g, plusDagen(d, -180)
	);
	const trend = gewichtsTrend(wegingen(g, plusDagen(d, -21)), d);
	return { titel: 'Overzicht eten en slaap', datum: d, dagen, gewicht, doelen: doelenVan(g), trend: trend && { ...trend, advies: kcalAdvies(trend) } };
};

export const actions = {
	// Caloriedoel bijstellen op basis van je gewichtstrend.
	kcal: async ({ request, locals }) => {
		const f = await request.formData();
		const nieuw = Math.round(Number(f.get('kcal')) / 10) * 10;
		if (!Number.isFinite(nieuw) || nieuw < 800 || nieuw > 8000) return fail(400, { fout: 'Ongeldig caloriedoel.' });
		doe('UPDATE gebruikers SET doel_kcal = ? WHERE id = ?', nieuw, locals.gebruiker.id);
		return { kcalOk: nieuw };
	}
};
