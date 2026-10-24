import * as data from '#lib/server/data.js';
import { oefening } from '#lib/oefeningen.js';
import { weekdag, vandaag } from '#lib/datum.js';

export const load = ({ locals }) => ({
	titel: 'Schema',
	vandaag: weekdag(vandaag()),
	dagen: data.dagen(locals.gebruiker.id).map((d) => ({
		...d,
		items: d.items.map((it) => ({ ...it, kort: it.slug ? oefening(it.slug)?.kort : null }))
	}))
});
