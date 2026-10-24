import { fail } from '@sveltejs/kit';
import { alle, doe, een } from '#lib/server/db.js';
import { maakUitnodiging } from '#lib/server/auth.js';

export const load = ({ locals }) => ({
	titel: 'Beheer',
	ik: locals.gebruiker.id,
	gebruikers: alle(
		`SELECT g.id, g.naam, g.email, g.rol, g.gemaakt,
		 (SELECT max(datum) FROM trainingen t WHERE t.gebruiker_id = g.id) AS laatst,
		 (SELECT count(*) FROM trainingen t WHERE t.gebruiker_id = g.id) AS trainingen
		 FROM gebruikers g ORDER BY g.id`
	),
	uitnodigingen: alle(
		`SELECT u.code, u.verloopt, u.gemaakt, g.naam AS gebruikt FROM uitnodigingen u LEFT JOIN gebruikers g ON g.id = u.gebruikt_door
		 ORDER BY u.gemaakt DESC LIMIT 20`
	)
});

export const actions = {
	uitnodiging: ({ locals }) => ({ code: maakUitnodiging(locals.gebruiker.id) }),
	intrekken: async ({ request }) => {
		const f = await request.formData();
		doe('DELETE FROM uitnodigingen WHERE code = ? AND gebruikt_door IS NULL', String(f.get('code')));
		return { ok: true };
	},
	rol: async ({ request, locals }) => {
		const f = await request.formData();
		const id = Number(f.get('id'));
		if (id === locals.gebruiker.id) return fail(400, { fout: 'Je eigen rol pas je niet zelf aan.' });
		const rol = f.get('rol') === 'beheerder' ? 'beheerder' : 'lid';
		doe('UPDATE gebruikers SET rol = ? WHERE id = ?', rol, id);
		return { ok: true };
	},
	uitloggen: async ({ request }) => {
		const f = await request.formData();
		doe('DELETE FROM sessies WHERE gebruiker_id = ?', Number(f.get('id')));
		return { ok: true };
	},
	verwijder: async ({ request, locals }) => {
		const f = await request.formData();
		const id = Number(f.get('id'));
		if (id === locals.gebruiker.id) return fail(400, { fout: 'Verwijder je eigen account via Account.' });
		if (!een('SELECT 1 FROM gebruikers WHERE id = ?', id)) return fail(404, { fout: 'Onbekende gebruiker.' });
		doe('DELETE FROM gebruikers WHERE id = ?', id);
		return { ok: true };
	}
};
