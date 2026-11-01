import { fail } from '@sveltejs/kit';
import * as sporen from '#lib/server/sporen.js';
import { svgPad } from '#lib/spoor.js';
import { vandaag } from '#lib/datum.js';

export const load = ({ locals }) => {
	const g = locals.gebruiker.id;
	const beheerder = locals.gebruiker.rol === 'beheerder';
	return {
		titel: 'Hardlopen',
		totalen: sporen.totalen(g, vandaag().slice(0, 8) + '01'),
		// De lijn zelf blijft op de server; de pagina krijgt alleen een klein SVG-pad.
		sporen: sporen.lijst(g).map(({ lijn, ...s }) => ({ ...s, vorm: svgPad(lijn, 48) })),
		map: beheerder ? sporen.sporenMap : null
	};
};

const MAX_BESTANDEN = 500;

export const actions = {
	upload: async ({ request, locals }) => {
		const f = await request.formData();
		const bestanden = f.getAll('bestanden').filter((b) => b instanceof File && b.size);
		if (!bestanden.length) return fail(400, { fout: 'Kies een of meer GPX- of TCX-bestanden.' });
		if (bestanden.length > MAX_BESTANDEN) return fail(400, { fout: `Hooguit ${MAX_BESTANDEN} bestanden tegelijk.` });
		const lijst = [];
		for (const b of bestanden) lijst.push({ naam: b.name, buf: Buffer.from(await b.arrayBuffer()) });
		return { import: sporen.importeerBestanden(locals.gebruiker.id, lijst) };
	},
	map: async ({ locals }) => {
		// De map is van de hele server: alleen de beheerder leest hem in (in zijn eigen account).
		if (locals.gebruiker.rol !== 'beheerder') return fail(403, { fout: 'Alleen de beheerder kan de map importeren.' });
		const t = sporen.importeerMap(locals.gebruiker.id);
		if (t.geenMap) return fail(400, { fout: `De map ${sporen.sporenMap} bestaat niet.` });
		return { import: t };
	},
	weg: async ({ request, locals }) => {
		const id = Number((await request.formData()).get('id'));
		if (Number.isInteger(id)) sporen.verwijder(locals.gebruiker.id, id);
		return { weg: true };
	}
};
