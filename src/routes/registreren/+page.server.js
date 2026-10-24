import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/env';
import { een, doe, transactie } from '#lib/server/db.js';
import { maakSessie, cookieOpties, COOKIE, wachtwoordProbleem, teVeel, telPoging } from '#lib/server/auth.js';
import { aantalGebruikers, maakGebruiker } from '#lib/server/gebruikers.js';

export const load = ({ locals, url }) => {
	if (locals.gebruiker) redirect(303, '/');
	return { titel: 'Account maken', eerste: aantalGebruikers() === 0, code: url.searchParams.get('code') ?? '' };
};

export const actions = {
	default: async ({ request, cookies, getClientAddress }) => {
		const f = await request.formData();
		const naam = String(f.get('naam') ?? '').trim();
		const email = String(f.get('email') ?? '').trim().toLowerCase();
		const wachtwoord = String(f.get('wachtwoord') ?? '');
		const code = String(f.get('code') ?? '').trim().toUpperCase();
		const terug = { naam, email, code };

		if (teVeel(`registreren|${getClientAddress()}`, 10)) return fail(429, { ...terug, fout: 'Te veel pogingen. Probeer het later opnieuw.' });
		if (!naam || naam.length > 60) return fail(400, { ...terug, fout: 'Vul je naam in.' });
		if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail(400, { ...terug, fout: 'Dat lijkt geen e-mailadres.' });
		const probleem = wachtwoordProbleem(wachtwoord);
		if (probleem) return fail(400, { ...terug, fout: probleem });
		if (een('SELECT 1 FROM gebruikers WHERE email = ?', email)) return fail(400, { ...terug, fout: 'Er is al een account met dit e-mailadres.' });

		// De eerste gebruiker wordt beheerder. Daarna alleen met een geldige uitnodiging.
		const eerste = aantalGebruikers() === 0;
		if (!eerste) {
			const u = een("SELECT * FROM uitnodigingen WHERE code = ? AND gebruikt_door IS NULL AND verloopt > datetime('now')", code);
			if (!u) {
				telPoging(`registreren|${getClientAddress()}`);
				return fail(400, { ...terug, fout: 'Die uitnodigingscode klopt niet of is verlopen.' });
			}
		}
		const id = await maakGebruiker({ naam, email, wachtwoord, rol: eerste ? 'beheerder' : 'lid' });
		if (!eerste) transactie(() => doe('UPDATE uitnodigingen SET gebruikt_door = ? WHERE code = ?', id, code));
		cookies.set(COOKIE, maakSessie(id, request.headers.get('user-agent')), cookieOpties(!dev));
		redirect(303, '/?welkom');
	}
};
