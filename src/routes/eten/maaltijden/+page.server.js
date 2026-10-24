import { doe } from '#lib/server/db.js';
import { maaltijden } from '#lib/server/eten.js';

export const load = ({ locals }) => ({ titel: 'Mijn maaltijden', maaltijden: maaltijden(locals.gebruiker.id) });

export const actions = {
	weg: async ({ request, locals }) => {
		const f = await request.formData();
		doe('DELETE FROM maaltijden WHERE id = ? AND gebruiker_id = ?', Number(f.get('id')), locals.gebruiker.id);
		return { ok: true };
	}
};
