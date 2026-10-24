import { error, fail, redirect } from '@sveltejs/kit';
import { doe, een } from '#lib/server/db.js';
import * as eten from '#lib/server/eten.js';
import { geldigeDatum } from '#lib/server/etendoelen.js';
import { MAALTIJDEN, portieTekst } from '#lib/voeding.js';

const laad = (locals, id) => {
	const p = eten.product(locals.gebruiker.id, id);
	if (!p) error(404, 'Dit product bestaat niet (meer).');
	return p;
};

export const load = ({ locals, params, url }) => {
	const p = laad(locals, params.id);
	const vorige = een('SELECT hoeveelheid, portie FROM eetregels WHERE gebruiker_id = ? AND product_id = ? ORDER BY id DESC LIMIT 1', locals.gebruiker.id, p.id);
	return {
		titel: p.naam,
		product: p,
		favoriet: eten.isFavoriet(locals.gebruiker.id, p.id),
		vorige,
		maaltijd: MAALTIJDEN.some((m) => m.id === url.searchParams.get('maaltijd')) ? url.searchParams.get('maaltijd') : null,
		datum: geldigeDatum(url.searchParams.get('datum'))
	};
};

export const actions = {
	toevoegen: async ({ request, locals, params }) => {
		const p = laad(locals, params.id);
		const f = await request.formData();
		const maaltijd = String(f.get('maaltijd'));
		if (!MAALTIJDEN.some((m) => m.id === maaltijd)) return fail(400, { fout: 'Kies een maaltijd.' });
		const aantal = Number(String(f.get('aantal') ?? '').replace(',', '.'));
		const portie = String(f.get('portie') ?? '');
		const gram = portie === '' ? 1 : (p.porties.find(([n]) => n === portie)?.[1] ?? null);
		if (gram == null || !(aantal > 0 && aantal * gram <= 5000)) return fail(400, { fout: 'Die hoeveelheid klopt niet.' });
		const hoeveelheid = Math.round(aantal * gram * 10) / 10;
		const datum = geldigeDatum(String(f.get('datum')));
		eten.voegToe(locals.gebruiker.id, { datum, maaltijd, product: p, hoeveelheid, portie: portie ? portieTekst(aantal, portie, hoeveelheid, p.eenheid) : `${hoeveelheid} ${p.eenheid}` });
		redirect(303, `/eten?datum=${datum}`);
	},
	favoriet: async ({ locals, params }) => {
		const p = laad(locals, params.id);
		eten.wisselFavoriet(locals.gebruiker.id, p.id);
		return { ok: true };
	},
	verwijder: async ({ locals, params }) => {
		const p = laad(locals, params.id);
		if (p.bron !== 'eigen') return fail(400, { fout: 'Alleen eigen producten kun je verwijderen.' });
		doe('DELETE FROM producten WHERE id = ? AND gebruiker_id = ?', p.id, locals.gebruiker.id);
		doe('DELETE FROM favorieten WHERE product_id = ?', p.id);
		redirect(303, '/eten/toevoegen');
	}
};
