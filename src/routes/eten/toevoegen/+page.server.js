import { fail, redirect } from '@sveltejs/kit';
import * as eten from '#lib/server/eten.js';
import { geldigeDatum } from '#lib/server/etendoelen.js';
import { MAALTIJDEN } from '#lib/voeding.js';

const kies = (url) => {
	const m = url.searchParams.get('maaltijd');
	return MAALTIJDEN.some((x) => x.id === m) ? m : 'tussendoor';
};

export const load = ({ locals, url }) => {
	const g = locals.gebruiker.id;
	return {
		titel: 'Toevoegen',
		maaltijd: kies(url),
		datum: geldigeDatum(url.searchParams.get('datum')),
		recent: eten.recent(g),
		favorieten: eten.favorieten(g),
		maaltijden: eten.maaltijden(g),
		eigen: eten.eigenProducten(g)
	};
};

const num = (v) => (v == null || String(v).trim() === '' ? 0 : Number(String(v).replace(',', '.')));

export const actions = {
	snel: async ({ request, locals, url }) => {
		const f = await request.formData();
		const w = { kcal: num(f.get('kcal')), eiwit: num(f.get('eiwit')), koolh: num(f.get('koolh')), vet: num(f.get('vet')) };
		if (Object.values(w).some((x) => !Number.isFinite(x) || x < 0 || x > 10000) || !w.kcal) return fail(400, { fout: 'Vul minstens de calorieën in.' });
		const datum = geldigeDatum(url.searchParams.get('datum'));
		eten.snelToevoegen(locals.gebruiker.id, { datum, maaltijd: kies(url), naam: String(f.get('naam') ?? '').trim().slice(0, 80), ...w });
		redirect(303, `/eten?datum=${datum}`);
	},
	maaltijd: async ({ request, locals, url }) => {
		const f = await request.formData();
		const m = eten.maaltijden(locals.gebruiker.id).find((x) => x.id === Number(f.get('id')));
		if (!m) return fail(404, { fout: 'Die maaltijd bestaat niet meer.' });
		const porties = Math.max(0.25, Math.min(20, num(f.get('porties')) || 1));
		const datum = geldigeDatum(url.searchParams.get('datum'));
		eten.zetMaaltijd(locals.gebruiker.id, m, { datum, maaltijd: kies(url), porties });
		redirect(303, `/eten?datum=${datum}`);
	}
};
