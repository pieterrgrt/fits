import { fail } from '@sveltejs/kit';
import * as fotos from '#lib/server/fotos.js';
import { vandaag } from '#lib/datum.js';

export const load = ({ locals }) => ({ titel: 'Fotoverloop', vandaag: vandaag(), reeksen: fotos.reeksen(locals.gebruiker.id) });

const datumOk = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && d <= vandaag() && d >= '2000-01-01';

export const actions = {
	nieuw: async ({ request, locals }) => {
		const f = await request.formData();
		const datum = String(f.get('datum') ?? '');
		if (!datumOk(datum)) return fail(400, { fout: 'Kies een datum (niet in de toekomst).' });
		let aantal = 0;
		for (const kant of fotos.KANTEN) {
			const bestand = f.get(kant);
			if (!(bestand instanceof File) || !bestand.size) continue;
			const r = fotos.bewaar(locals.gebruiker.id, datum, kant, Buffer.from(await bestand.arrayBuffer()));
			if (r.fout) return fail(400, { fout: `${kant}: ${r.fout}` });
			aantal++;
		}
		if (!aantal) return fail(400, { fout: 'Kies minstens één foto.' });
		return { nieuw: datum };
	},
	weg: async ({ request, locals }) => {
		const f = await request.formData();
		const datum = String(f.get('datum') ?? '');
		const ids = [...fotos.reeksen(locals.gebruiker.id).filter((r) => r.datum === datum)].flatMap((r) => fotos.KANTEN.map((k) => r[k]).filter(Boolean));
		for (const id of ids) fotos.verwijder(locals.gebruiker.id, id);
		return { weg: datum };
	}
};
