import crypto from 'node:crypto';
import { fail } from '@sveltejs/kit';
import { alle, doe } from '#lib/server/db.js';
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
		datum: d,
		strava: { aan: stravaAan(), gekoppeld: !!s, naam: s?.naam, laatst: s?.laatst_gesynct },
		week: data.week(g, d),
		beenDagen,
		activiteiten: alle('SELECT * FROM activiteiten WHERE gebruiker_id = ? AND datum >= ? ORDER BY begin DESC', g, plusDagen(d, -56))
	};
};

// Soorten die je zelf kunt invoeren (zelfde namen als Strava gebruikt).
const SOORTEN = ['Run', 'Swim', 'Ride', 'Walk', 'Rowing', 'Workout'];

export const actions = {
	nieuw: async ({ request, locals }) => {
		const f = await request.formData();
		const soort = String(f.get('soort'));
		const datum = String(f.get('datum') ?? '');
		const minuten = Number(String(f.get('duur') ?? '').replace(',', '.'));
		const km = f.get('afstand') ? Number(String(f.get('afstand')).replace(',', '.')) : null;
		if (!SOORTEN.includes(soort)) return fail(400, { fout: 'Kies wat je deed.' });
		if (!/^\d{4}-\d{2}-\d{2}$/.test(datum) || datum > plusDagen(vandaag(), 1)) return fail(400, { fout: 'Kies een datum.' });
		if (!(minuten > 0 && minuten <= 1440)) return fail(400, { fout: 'Vul in hoeveel minuten.' });
		if (km != null && !(km >= 0 && km <= 1000)) return fail(400, { fout: 'Die afstand klopt niet.' });
		const naam = String(f.get('naam') ?? '').trim().slice(0, 80) || null;
		doe(
			'INSERT INTO activiteiten (id, gebruiker_id, soort, naam, datum, begin, duur, afstand) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
			`eigen-${crypto.randomUUID()}`, locals.gebruiker.id, soort, naam, datum, `${datum}T12:00:00`, Math.round(minuten * 60), km != null ? km * 1000 : null
		);
		return { toegevoegd: true };
	},
	weg: async ({ request, locals }) => {
		const f = await request.formData();
		const id = String(f.get('id'));
		// Alleen zelf ingevoerde activiteiten; die van Strava komen bij de volgende keer bijwerken toch terug.
		if (id.startsWith('eigen-')) doe('DELETE FROM activiteiten WHERE id = ? AND gebruiker_id = ?', id, locals.gebruiker.id);
		return { ok: true };
	},
	sync: async ({ locals }) => {
		try {
			return { nieuw: await sync(locals.gebruiker.id) };
		} catch (e) {
			return fail(400, { fout: e.message });
		}
	}
};
