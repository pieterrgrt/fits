import { error } from '@sveltejs/kit';
import { alle } from '#lib/server/db.js';
import * as data from '#lib/server/data.js';
import { oefening } from '#lib/oefeningen.js';

export const load = ({ locals, params }) => {
	const o = oefening(params.slug);
	if (!o) error(404, 'Deze oefening kennen we niet.');
	const g = locals.gebruiker.id;
	return {
		titel: o.naam,
		slug: o.slug,
		geschiedenis: data.geschiedenis(g, o.slug, { limiet: 40 }).map((s) => ({ datum: s.datum, sets: s.sets.map(({ gewicht, reps, eenheid, per_stuk }) => ({ gewicht, reps, eenheid, per_stuk })) })),
		inSchema: alle(
			`SELECT d.weekdag, d.titel, i.sets, i.reps_min, i.reps_max, i.gewicht, i.per_stuk, i.eenheid, i.sinds, i.wissel
			 FROM items i JOIN dagen d ON d.id = i.dag_id WHERE d.gebruiker_id = ? AND (i.slug = ? OR i.opties LIKE ?)`,
			g, o.slug, `%"${o.slug}"%`
		)
	};
};
