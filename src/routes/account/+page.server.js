import { fail, redirect } from '@sveltejs/kit';
import { een, alle, doe, transactie } from '#lib/server/db.js';
import { COOKIE, klopt, hash, wachtwoordProbleem, sessiesVan, stopSessie } from '#lib/server/auth.js';
import { zetStartschema } from '#lib/server/gebruikers.js';
import { stravaAan, stravaVan, ontkoppel } from '#lib/server/strava.js';

export const load = ({ locals }) => {
	const g = locals.gebruiker;
	const s = stravaVan(g.id);
	return {
		titel: 'Account',
		profiel: { naam: g.naam, email: g.email, rol: g.rol },
		sessies: sessiesVan(g.id).map((x) => ({ ...x, dit: x.id === g.sessie_id, id: x.id.slice(0, 12) })),
		strava: { aan: stravaAan(), gekoppeld: !!s, naam: s?.naam, schrijven: (s?.scope ?? '').includes('activity:write') }
	};
};

export const actions = {
	profiel: async ({ request, locals }) => {
		const f = await request.formData();
		const naam = String(f.get('naam') ?? '').trim().slice(0, 60);
		const email = String(f.get('email') ?? '').trim().toLowerCase();
		if (!naam) return fail(400, { profielFout: 'Vul je naam in.' });
		if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail(400, { profielFout: 'Dat lijkt geen e-mailadres.' });
		if (een('SELECT 1 FROM gebruikers WHERE email = ? AND id != ?', email, locals.gebruiker.id)) return fail(400, { profielFout: 'Dat e-mailadres is al in gebruik.' });
		doe('UPDATE gebruikers SET naam = ?, email = ? WHERE id = ?', naam, email, locals.gebruiker.id);
		return { profielOk: true };
	},
	wachtwoord: async ({ request, locals }) => {
		const f = await request.formData();
		const huidig = String(f.get('huidig') ?? '');
		const nieuw = String(f.get('nieuw') ?? '');
		const g = een('SELECT wachtwoord FROM gebruikers WHERE id = ?', locals.gebruiker.id);
		if (!(await klopt(huidig, g.wachtwoord))) return fail(400, { wwFout: 'Je huidige wachtwoord klopt niet.' });
		const probleem = wachtwoordProbleem(nieuw);
		if (probleem) return fail(400, { wwFout: probleem });
		const versleuteld = await hash(nieuw);
		transactie(() => {
			doe('UPDATE gebruikers SET wachtwoord = ? WHERE id = ?', versleuteld, locals.gebruiker.id);
			// Alle andere apparaten uitloggen
			doe('DELETE FROM sessies WHERE gebruiker_id = ? AND id != ?', locals.gebruiker.id, locals.gebruiker.sessie_id);
		});
		return { wwOk: true };
	},
	sessie: async ({ request, locals }) => {
		const f = await request.formData();
		const begin = String(f.get('id') ?? '');
		const s = alle('SELECT id FROM sessies WHERE gebruiker_id = ?', locals.gebruiker.id).find((x) => x.id.startsWith(begin) && begin.length >= 12);
		if (s && s.id !== locals.gebruiker.sessie_id) doe('DELETE FROM sessies WHERE id = ?', s.id);
		return { ok: true };
	},
	overal: async ({ locals }) => {
		doe('DELETE FROM sessies WHERE gebruiker_id = ? AND id != ?', locals.gebruiker.id, locals.gebruiker.sessie_id);
		return { ok: true };
	},
	ontkoppel: async ({ locals }) => {
		await ontkoppel(locals.gebruiker.id);
		return { ok: true };
	},
	herstel: async ({ request, locals }) => {
		const f = await request.formData();
		if (f.get('zeker') !== 'ja') return fail(400, { herstelFout: 'Vink aan dat je het zeker weet.' });
		transactie(() => {
			doe('DELETE FROM dagen WHERE gebruiker_id = ?', locals.gebruiker.id);
			zetStartschema(locals.gebruiker.id);
		});
		return { herstelOk: true };
	},
	verwijder: async ({ request, locals, cookies }) => {
		const f = await request.formData();
		const g = een('SELECT wachtwoord, rol FROM gebruikers WHERE id = ?', locals.gebruiker.id);
		if (!(await klopt(String(f.get('wachtwoord') ?? ''), g.wachtwoord))) return fail(400, { weg: 'Wachtwoord klopt niet.' });
		if (g.rol === 'beheerder' && een("SELECT count(*) AS n FROM gebruikers WHERE rol = 'beheerder'").n === 1 && een('SELECT count(*) AS n FROM gebruikers').n > 1)
			return fail(400, { weg: 'Je bent de enige beheerder. Maak eerst iemand anders beheerder.' });
		await ontkoppel(locals.gebruiker.id);
		doe('DELETE FROM gebruikers WHERE id = ?', locals.gebruiker.id);
		stopSessie(cookies.get(COOKIE));
		cookies.delete(COOKIE, { path: '/' });
		redirect(303, '/inloggen');
	}
};
