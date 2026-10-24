import { error, fail, redirect } from '@sveltejs/kit';
import { doe } from '#lib/server/db.js';
import * as data from '#lib/server/data.js';
import { stravaAan, stravaVan, zetOpStrava } from '#lib/server/strava.js';
import { logTekst } from '#lib/logtekst.js';

const laad = (locals, id) => {
	const t = data.training(locals.gebruiker.id, Number(id));
	if (!t) error(404, 'Deze training bestaat niet.');
	return t;
};

export const load = ({ locals, params }) => {
	const t = laad(locals, params.id);
	const sets = data.setsVan(t.id);
	const strava = stravaVan(locals.gebruiker.id);
	return {
		titel: t.titel,
		training: t,
		groepen: data.perOefening(sets),
		strava: stravaAan() && strava ? { schrijven: (strava.scope ?? '').includes('activity:write') } : null
	};
};

export const actions = {
	strava: async ({ locals, params }) => {
		const t = laad(locals, params.id);
		if (t.strava_id) return { ok: true };
		try {
			const groepen = data.perOefening(data.setsVan(t.id));
			const id = await zetOpStrava(locals.gebruiker.id, t, logTekst(t, groepen));
			doe('UPDATE trainingen SET strava_id = ? WHERE id = ?', String(id), t.id);
			return { ok: true };
		} catch (e) {
			return fail(400, { fout: e.message });
		}
	},
	heropen: async ({ locals, params }) => {
		const t = laad(locals, params.id);
		doe('UPDATE trainingen SET eind = NULL WHERE id = ?', t.id);
		redirect(303, `/training/${t.id}`);
	},
	verwijder: async ({ locals, params }) => {
		const t = laad(locals, params.id);
		doe('DELETE FROM trainingen WHERE id = ?', t.id);
		redirect(303, '/logboek');
	}
};
