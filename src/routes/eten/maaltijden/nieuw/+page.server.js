import { fail, redirect } from '@sveltejs/kit';
import { product, bewaarMaaltijd } from '#lib/server/eten.js';
import { voor } from '#lib/voeding.js';

export const load = () => ({ titel: 'Recept maken' });

export const actions = {
	default: async ({ request, locals }) => {
		const f = await request.formData();
		const naam = String(f.get('naam') ?? '').trim().slice(0, 60);
		const porties = Math.max(1, Math.min(20, Math.round(Number(f.get('porties')) || 1)));
		const ids = f.getAll('product').map(String);
		const grammen = f.getAll('gram').map((g) => Number(String(g).replace(',', '.')));
		if (!naam) return fail(400, { fout: 'Geef het recept een naam.' });
		const regels = [];
		ids.forEach((id, i) => {
			const p = product(locals.gebruiker.id, id);
			const g = grammen[i];
			if (p && g > 0 && g <= 10000) regels.push({ product_id: p.id, naam: p.merk ? `${p.naam} · ${p.merk}` : p.naam, hoeveelheid: g, portie: null, ...voor(p, g) });
		});
		if (!regels.length) return fail(400, { fout: 'Voeg minstens één ingrediënt toe.' });
		bewaarMaaltijd(locals.gebruiker.id, naam, regels, porties);
		redirect(303, '/eten/maaltijden');
	}
};
