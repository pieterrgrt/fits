import { fail } from '@sveltejs/kit';
import { alle } from '#lib/server/db.js';
import * as data from '#lib/server/data.js';
import { stravaAan, stravaVan, sync } from '#lib/server/strava.js';
import { vandaag, plusDagen, weekdag } from '#lib/datum.js';

export const load = async ({ locals }) => {
	const g = locals.gebruiker.id;
	const d = vandaag();
	const s = stravaVan(g);
	// Eén keer per uur vanzelf bijwerken als je de pagina opent.
	if (stravaAan() && s && (!s.laatst_gesynct || Date.now() - new Date(s.laatst_gesynct.replace(' ', 'T') + 'Z') > 3600_000)) {
		await sync(g).catch(() => {});
	}
	const beenDagen = data.dagen(g).filter((x) => x.code?.startsWith('legs')).map((x) => x.weekdag);
	return {
		titel: 'Cardio',
		strava: { aan: stravaAan(), gekoppeld: !!s, naam: s?.naam, laatst: s?.laatst_gesynct },
		week: data.week(g, d),
		beenDagen,
		activiteiten: alle('SELECT * FROM activiteiten WHERE gebruiker_id = ? AND datum >= ? ORDER BY begin DESC', g, plusDagen(d, -56))
	};
};

export const actions = {
	sync: async ({ locals }) => {
		try {
			return { nieuw: await sync(locals.gebruiker.id) };
		} catch (e) {
			return fail(400, { fout: e.message });
		}
	}
};
