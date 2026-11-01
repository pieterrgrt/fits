import { error } from '@sveltejs/kit';
import * as sporen from '#lib/server/sporen.js';
import * as straten from '#lib/server/straten.js';

export const load = ({ locals, params }) => {
	const s = sporen.spoor(locals.gebruiker.id, Number(params.id));
	if (!s) error(404, 'Dit loopje bestaat niet (meer).');
	return { titel: s.naam ?? 'Loopje', spoor: s, nieuweStraten: straten.nieuweStraten(locals.gebruiker.id, s.id) };
};
