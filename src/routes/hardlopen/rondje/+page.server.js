import { fail } from '@sveltejs/kit';
import * as sporen from '#lib/server/sporen.js';
import * as straten from '#lib/server/straten.js';
import { alle, doe } from '#lib/server/db.js';
import { decodeer } from '#lib/spoor.js';
import { lengte } from '#lib/hardlopen/netwerk.js';

export const load = ({ locals }) => {
	const g = locals.gebruiker.id;
	return {
		titel: 'Ontdekrondje',
		start: sporen.gebruikelijkeStart(g),
		heeftSporen: sporen.lijnen(g).length > 0,
		routes: alle('SELECT id, naam, lijn, afstand, nieuw, lat, lon, gemaakt FROM routes WHERE gebruiker_id = ? ORDER BY gemaakt DESC', g)
	};
};

const getal = (f, k) => Number(String(f.get(k) ?? '').replace(',', '.'));
const plekOk = (lat, lon) => Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 85 && Math.abs(lon) <= 180;

export const actions = {
	zoek: async ({ request, locals }) => {
		const f = await request.formData();
		const lat = getal(f, 'lat'), lon = getal(f, 'lon'), km = getal(f, 'km');
		if (!plekOk(lat, lon)) return fail(400, { fout: 'Kies eerst een startpunt op de kaart.' });
		if (!(km >= 1 && km <= 21)) return fail(400, { fout: 'Kies een afstand tussen 1 en 21 km.' });
		try {
			const r = await straten.rondjes(locals.gebruiker.id, lat, lon, km * 1000);
			if (r.rondjes && !r.rondjes.length) return fail(400, { fout: 'Geen rondje gevonden vanaf hier. Kies een startpunt op of vlak bij een straat of pad.' });
			return { ...r, lat, lon, km };
		} catch (e) {
			return fail(503, { fout: e.message });
		}
	},
	bewaar: async ({ request, locals }) => {
		const f = await request.formData();
		const naam = String(f.get('naam') ?? '').trim().slice(0, 80);
		const lijn = String(f.get('lijn') ?? '');
		const lat = getal(f, 'lat'), lon = getal(f, 'lon'), nieuw = getal(f, 'nieuw');
		if (!naam) return fail(400, { fout: 'Geef het rondje een naam.' });
		let punten;
		try {
			punten = lijn.length <= 60_000 ? decodeer(lijn) : [];
		} catch {
			punten = [];
		}
		if (punten.length < 2 || !punten.every(([a, b]) => plekOk(a, b))) return fail(400, { fout: 'Dit rondje klopt niet.' });
		doe(
			'INSERT INTO routes (gebruiker_id, naam, lijn, afstand, nieuw, lat, lon) VALUES (?, ?, ?, ?, ?, ?, ?)',
			locals.gebruiker.id, naam, lijn, Math.round(lengte(punten)), Number.isFinite(nieuw) ? nieuw : null, plekOk(lat, lon) ? lat : null, plekOk(lat, lon) ? lon : null
		);
		return { bewaard: naam };
	},
	weg: async ({ request, locals }) => {
		const id = Number((await request.formData()).get('id'));
		doe('DELETE FROM routes WHERE id = ? AND gebruiker_id = ?', id, locals.gebruiker.id);
		return { weg: true };
	}
};
