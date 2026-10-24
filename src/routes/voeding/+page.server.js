import { fail } from '@sveltejs/kit';
import { alle, doe } from '#lib/server/db.js';
import * as data from '#lib/server/data.js';
import { vandaag, plusDagen } from '#lib/datum.js';

export const load = ({ locals }) => {
	const g = locals.gebruiker;
	const d = vandaag();
	return {
		titel: 'Eten en slaap',
		datum: d,
		profiel: { gewicht: data.laatsteGewicht(g.id)?.gewicht ?? g.gewicht, onderhoud: g.onderhoud },
		regels: alle('SELECT * FROM dagregels WHERE gebruiker_id = ? AND datum > ? ORDER BY datum DESC', g.id, plusDagen(d, -14)),
		weken: alle('SELECT * FROM weekregels WHERE gebruiker_id = ? ORDER BY week DESC LIMIT 12', g.id)
	};
};

export const actions = {
	profiel: async ({ request, locals }) => {
		const f = await request.formData();
		const gewicht = f.get('gewicht') ? Number(String(f.get('gewicht')).replace(',', '.')) : null;
		const onderhoud = f.get('onderhoud') ? Number(f.get('onderhoud')) : null;
		if ((gewicht != null && !(gewicht > 20 && gewicht < 300)) || (onderhoud != null && !(onderhoud > 800 && onderhoud < 7000)))
			return fail(400, { fout: 'Controleer gewicht en calorieën.' });
		doe('UPDATE gebruikers SET gewicht = ?, onderhoud = ? WHERE id = ?', gewicht, onderhoud, locals.gebruiker.id);
		return { ok: true };
	}
};
