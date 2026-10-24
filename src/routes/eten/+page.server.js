import { fail } from '@sveltejs/kit';
import { doe } from '#lib/server/db.js';
import { geldigeDatum, doelenVan } from '#lib/server/etendoelen.js';
import * as eten from '#lib/server/eten.js';
import * as data from '#lib/server/data.js';
import { MAALTIJDEN } from '#lib/voeding.js';
import { vandaag, plusDagen } from '#lib/datum.js';

export const load = ({ locals, url }) => {
	const g = locals.gebruiker;
	const datum = geldigeDatum(url.searchParams.get('datum'));
	const gisteren = eten.dag(g.id, plusDagen(datum, -1));
	return {
		titel: 'Eten',
		datum,
		vandaag: vandaag(),
		dag: eten.dag(g.id, datum),
		gisteren: Object.fromEntries(gisteren.maaltijden.map((m) => [m.id, m.regels.length])),
		doelen: doelenVan(g.id),
		water: data.dagregel(g.id, datum).water ?? 0,
		vasten: eten.vastenNu(g.id)
	};
};

const maaltijdOk = (m) => MAALTIJDEN.some((x) => x.id === m);

export const actions = {
	weg: async ({ request, locals }) => {
		const f = await request.formData();
		doe('DELETE FROM eetregels WHERE id = ? AND gebruiker_id = ?', Number(f.get('id')), locals.gebruiker.id);
		return { ok: true };
	},
	water: async ({ request, locals }) => {
		const f = await request.formData();
		const datum = geldigeDatum(String(f.get('datum')));
		const nu = data.dagregel(locals.gebruiker.id, datum).water ?? 0;
		const nieuw = Math.max(0, Math.min(8000, nu + Number(f.get('ml') || 0)));
		doe(
			`INSERT INTO dagregels (gebruiker_id, datum, water) VALUES (?, ?, ?)
			 ON CONFLICT (gebruiker_id, datum) DO UPDATE SET water = excluded.water`,
			locals.gebruiker.id, datum, nieuw
		);
		return { ok: true };
	},
	kopieer: async ({ request, locals }) => {
		const f = await request.formData();
		const datum = geldigeDatum(String(f.get('datum')));
		const maaltijd = String(f.get('maaltijd'));
		if (!maaltijdOk(maaltijd)) return fail(400, { fout: 'Onbekende maaltijd.' });
		eten.kopieer(locals.gebruiker.id, { van: plusDagen(datum, -1), naar: datum, maaltijd });
		return { ok: true };
	},
	bewaar: async ({ request, locals }) => {
		const f = await request.formData();
		const datum = geldigeDatum(String(f.get('datum')));
		const maaltijd = String(f.get('maaltijd'));
		const naam = String(f.get('naam') ?? '').trim().slice(0, 60);
		if (!naam) return fail(400, { fout: 'Geef de maaltijd een naam.' });
		const regels = eten.dag(locals.gebruiker.id, datum).regels.filter((r) => r.maaltijd === maaltijd);
		if (!regels.length) return fail(400, { fout: 'Deze maaltijd is nog leeg.' });
		eten.bewaarMaaltijd(locals.gebruiker.id, naam, regels);
		return { bewaard: naam };
	},
	vasten: async ({ request, locals }) => {
		const f = await request.formData();
		const nu = eten.vastenNu(locals.gebruiker.id);
		if (nu) doe("UPDATE vasten SET eind = ? WHERE id = ?", new Date().toISOString(), nu.id);
		else {
			const uren = [12, 14, 16, 18, 20].includes(Number(f.get('uren'))) ? Number(f.get('uren')) : 16;
			doe('INSERT INTO vasten (gebruiker_id, begin, doel_uren) VALUES (?, ?, ?)', locals.gebruiker.id, new Date().toISOString(), uren);
		}
		return { ok: true };
	}
};
