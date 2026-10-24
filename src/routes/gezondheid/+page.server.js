import { een } from '#lib/server/db.js';
import { maakSleutel, sleutelsVan, trekIn } from '#lib/server/sleutels.js';

export const load = ({ locals, url }) => ({
	titel: 'Apple Gezondheid',
	adres: `${url.origin}/api/gezondheid`,
	sleutels: sleutelsVan(locals.gebruiker.id),
	laatste: een(
		"SELECT datum, slaap, slaap_fasen FROM dagregels WHERE gebruiker_id = ? AND slaap_bron = 'gezondheid' ORDER BY datum DESC LIMIT 1",
		locals.gebruiker.id
	)
});

export const actions = {
	maak: async ({ request, locals }) => {
		const f = await request.formData();
		const naam = String(f.get('naam') ?? '').trim().slice(0, 40) || 'iPhone';
		return { sleutel: maakSleutel(locals.gebruiker.id, naam) };
	},
	intrekken: async ({ request, locals }) => {
		const f = await request.formData();
		trekIn(locals.gebruiker.id, Number(f.get('id')));
		return { ok: true };
	}
};
