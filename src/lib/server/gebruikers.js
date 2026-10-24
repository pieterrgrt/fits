import { een, doe, transactie } from './db.js';
import { hash } from './auth.js';
import { START_DAGEN, START_DOELEN, DOELEN_START, DOELEN_DEADLINE } from './startschema.js';

export const aantalGebruikers = () => een('SELECT count(*) AS n FROM gebruikers').n;

/** Maakt een account en zet het startschema en de doelen klaar. */
export async function maakGebruiker({ email, naam, wachtwoord, rol = 'lid' }) {
	const versleuteld = await hash(wachtwoord);
	return transactie(() => {
		const { lastInsertRowid: id } = doe('INSERT INTO gebruikers (email, naam, wachtwoord, rol) VALUES (?, ?, ?, ?)', email, naam, versleuteld, rol);
		zetStartschema(id);
		START_DOELEN.forEach((d, n) =>
			doe(
				'INSERT INTO doelen (gebruiker_id, soort, slug, gewicht, reps, aantal, tekst, start, deadline, volgorde) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
				id, d.soort, d.slug ?? null, d.gewicht ?? null, d.reps ?? null, d.aantal ?? null, d.tekst, DOELEN_START, DOELEN_DEADLINE, n
			)
		);
		return Number(id);
	});
}

export function zetStartschema(gebruikerId) {
	for (const d of START_DAGEN) {
		const { lastInsertRowid: dagId } = doe(
			'INSERT INTO dagen (gebruiker_id, weekdag, code, titel, focus, soort, warmup, alternatief) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
			gebruikerId, d.weekdag, d.code, d.titel, d.focus ?? null, d.soort ?? 'gym', d.warmup ? JSON.stringify(d.warmup) : null, d.alternatief ?? null
		);
		d.items.forEach((x, n) =>
			doe(
				`INSERT INTO items (dag_id, positie, slug, sets, reps_min, reps_max, gewicht, per_stuk, eenheid, sinds, notitie, wissel, opties)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				dagId, n + 1, x.slug, x.sets, x.min, x.max, x.gewicht, x.per_stuk ?? 0, x.eenheid ?? 'kg', x.sinds ?? null,
				x.notitie ?? null, x.wissel ? 1 : 0, x.opties ? JSON.stringify(x.opties) : null
			)
		);
	}
}
