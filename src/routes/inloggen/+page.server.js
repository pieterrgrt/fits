import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/env';
import { een } from '#lib/server/db.js';
import { klopt, nepControle, maakSessie, cookieOpties, COOKIE, teVeel, telPoging, wisPogingen } from '#lib/server/auth.js';
import { aantalGebruikers } from '#lib/server/gebruikers.js';

const veiligNaar = (n) => (typeof n === 'string' && n.startsWith('/') && !n.startsWith('//') ? n : '/');

export const load = ({ locals, url }) => {
	if (locals.gebruiker) redirect(303, veiligNaar(url.searchParams.get('naar')));
	if (aantalGebruikers() === 0) redirect(303, '/registreren');
	return { titel: 'Inloggen' };
};

export const actions = {
	default: async ({ request, cookies, url, getClientAddress }) => {
		const f = await request.formData();
		const email = String(f.get('email') ?? '').trim().toLowerCase();
		const wachtwoord = String(f.get('wachtwoord') ?? '');
		const sleutel = `${getClientAddress()}|${email}`;
		if (teVeel(sleutel)) return fail(429, { email, fout: 'Te veel pogingen. Probeer het over een kwartier opnieuw.' });

		const g = een('SELECT id, wachtwoord FROM gebruikers WHERE email = ?', email);
		const goed = g ? await klopt(wachtwoord, g.wachtwoord) : await nepControle(wachtwoord);
		if (!goed) {
			telPoging(sleutel);
			return fail(400, { email, fout: 'Dat e-mailadres en wachtwoord horen niet bij elkaar.' });
		}
		wisPogingen(sleutel);
		cookies.set(COOKIE, maakSessie(g.id, request.headers.get('user-agent')), cookieOpties(!dev));
		redirect(303, veiligNaar(url.searchParams.get('naar')));
	}
};
