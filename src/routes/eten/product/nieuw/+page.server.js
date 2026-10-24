import { fail, redirect } from '@sveltejs/kit';
import { maakEigenProduct } from '#lib/server/eten.js';

export const load = ({ url }) => ({
	titel: 'Eigen product',
	barcode: /^\d{6,14}$/.test(url.searchParams.get('barcode') ?? '') ? url.searchParams.get('barcode') : '',
	naam: (url.searchParams.get('naam') ?? '').slice(0, 80),
	terug: new URLSearchParams({ maaltijd: url.searchParams.get('maaltijd') ?? '', datum: url.searchParams.get('datum') ?? '' }).toString()
});

const num = (v, leeg = null) => {
	if (v == null || String(v).trim() === '') return leeg;
	const n = Number(String(v).replace(',', '.'));
	return Number.isFinite(n) && n >= 0 && n <= 1000 ? n : undefined;
};

export const actions = {
	default: async ({ request, locals, url }) => {
		const f = await request.formData();
		const w = {
			naam: String(f.get('naam') ?? '').trim().slice(0, 120),
			merk: String(f.get('merk') ?? '').trim().slice(0, 60),
			barcode: /^\d{6,14}$/.test(String(f.get('barcode'))) ? String(f.get('barcode')) : null,
			eenheid: f.get('eenheid') === 'ml' ? 'ml' : 'g',
			kcal: num(f.get('kcal')),
			eiwit: num(f.get('eiwit'), 0),
			koolh: num(f.get('koolh'), 0),
			vet: num(f.get('vet'), 0),
			vezels: num(f.get('vezels')),
			suiker: num(f.get('suiker'))
		};
		const portieGram = num(f.get('portie_gram'));
		const portieNaam = String(f.get('portie_naam') ?? '').trim().slice(0, 30) || 'portie';
		const terug = { ...Object.fromEntries(f), fout: '' };
		if (!w.naam) return fail(400, { ...terug, fout: 'Geef het product een naam.' });
		if (w.kcal == null || Object.values(w).includes(undefined) || portieGram === undefined) return fail(400, { ...terug, fout: 'Controleer de voedingswaarden (per 100 g of ml).' });
		w.porties = portieGram ? [[portieNaam, portieGram]] : [];
		const id = maakEigenProduct(locals.gebruiker.id, w);
		redirect(303, `/eten/product/${encodeURIComponent(id)}?${url.searchParams}`);
	}
};
