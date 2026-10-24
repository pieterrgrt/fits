import { fail } from '@sveltejs/kit';
import { een, doe } from '#lib/server/db.js';
import { doelenVan } from '#lib/server/etendoelen.js';
import { laatsteGewicht } from '#lib/server/data.js';

export const load = ({ locals }) => {
	const r = een('SELECT gewicht, onderhoud, doel_kcal, doel_water, macro FROM gebruikers WHERE id = ?', locals.gebruiker.id);
	return {
		titel: 'Doelen eten',
		profiel: { ...r, gewicht: laatsteGewicht(locals.gebruiker.id)?.gewicht ?? r.gewicht, vet: r.macro ? JSON.parse(r.macro).vet : 25 },
		doelen: doelenVan(locals.gebruiker.id)
	};
};

const num = (v, min, max) => {
	if (v == null || String(v).trim() === '') return null;
	const n = Number(String(v).replace(',', '.'));
	return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
};

export const actions = {
	default: async ({ request, locals }) => {
		const f = await request.formData();
		const w = {
			gewicht: num(f.get('gewicht'), 30, 300),
			onderhoud: num(f.get('onderhoud'), 800, 7000),
			doel_kcal: num(f.get('doel_kcal'), 800, 8000),
			doel_water: num(f.get('doel_water'), 500, 8000),
			vet: num(f.get('vet'), 15, 45)
		};
		if (Object.values(w).includes(undefined)) return fail(400, { fout: 'Een van de getallen klopt niet.' });
		doe(
			'UPDATE gebruikers SET gewicht = ?, onderhoud = ?, doel_kcal = ?, doel_water = ?, macro = ? WHERE id = ?',
			w.gewicht, w.onderhoud, w.doel_kcal, w.doel_water, JSON.stringify({ vet: w.vet ?? 25 }), locals.gebruiker.id
		);
		return { ok: true };
	}
};
