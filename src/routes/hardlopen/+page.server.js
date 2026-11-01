import { fail } from '@sveltejs/kit';
import * as sporen from '#lib/server/sporen.js';
import * as straten from '#lib/server/straten.js';
import { svgPad } from '#lib/spoor.js';
import { vandaag } from '#lib/datum.js';

export const load = ({ locals }) => {
	const g = locals.gebruiker.id;
	const beheerder = locals.gebruiker.rol === 'beheerder';
	const nieuw = straten.nieuwPerSpoor(g);
	return {
		titel: 'Hardlopen',
		totalen: sporen.totalen(g, vandaag().slice(0, 8) + '01'),
		dekking: straten.dekking(g),
		// De lijn zelf blijft op de server; de pagina krijgt alleen een klein SVG-pad.
		sporen: sporen.lijst(g).map(({ lijn, ...s }) => ({ ...s, vorm: svgPad(lijn, 48), nieuw: nieuw.get(s.id) ?? 0 })),
		map: beheerder ? sporen.sporenMap : null
	};
};

const MAX_BESTANDEN = 500;

/** Loopjes op straten leggen. `tijd`: hoe lang Fits nog nieuwe stukken wegennet mag gaan ophalen (elk verzoek blijft onder de minuut van nginx). */
async function straatwerk(g, tijd) {
	try {
		return await straten.werkBij(g, { tijd });
	} catch (e) {
		return { gedaan: 0, over: 0, fout: e.message };
	}
}

export const actions = {
	upload: async ({ request, locals }) => {
		const f = await request.formData();
		const bestanden = f.getAll('bestanden').filter((b) => b instanceof File && b.size);
		if (!bestanden.length) return fail(400, { fout: 'Kies een of meer GPX-, TCX- of FIT-bestanden.' });
		if (bestanden.length > MAX_BESTANDEN) return fail(400, { fout: `Hooguit ${MAX_BESTANDEN} bestanden tegelijk.` });
		const lijst = [];
		for (const b of bestanden) lijst.push({ naam: b.name, buf: Buffer.from(await b.arrayBuffer()) });
		const t = sporen.importeerBestanden(locals.gebruiker.id, lijst);
		return { import: t, straten: t.nieuw ? await straatwerk(locals.gebruiker.id, 5_000) : null };
	},
	map: async ({ locals }) => {
		// De map is van de hele server: alleen de beheerder leest hem in (in zijn eigen account).
		if (locals.gebruiker.rol !== 'beheerder') return fail(403, { fout: 'Alleen de beheerder kan de map importeren.' });
		const t = sporen.importeerMap(locals.gebruiker.id);
		if (t.geenMap) return fail(400, { fout: `De map ${sporen.sporenMap} bestaat niet.` });
		return { import: t };
	},
	straten: async ({ locals }) => ({ straten: await straatwerk(locals.gebruiker.id, 8_000) }),
	weg: async ({ request, locals }) => {
		const id = Number((await request.formData()).get('id'));
		if (Number.isInteger(id)) sporen.verwijder(locals.gebruiker.id, id);
		return { weg: true };
	}
};
