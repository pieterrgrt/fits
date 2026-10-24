import { fail } from '@sveltejs/kit';
import { een, alle, doe } from '#lib/server/db.js';
import { oefening } from '#lib/oefeningen.js';
import { vandaag, plusDagen } from '#lib/datum.js';

const e1rm = (g, r) => g * (1 + r / 30);

function voortgang(g, d) {
	if (d.soort === 'lift') {
		const sets = alle(
			`SELECT s.gewicht, s.reps, t.datum FROM sets s JOIN trainingen t ON t.id = s.training_id
			 WHERE t.gebruiker_id = ? AND s.slug = ? AND t.datum >= ?`,
			g, d.slug, d.start
		);
		if (!d.gewicht) {
			const beste = Math.max(0, ...sets.map((s) => s.reps));
			return { waarde: Math.min(1, beste / d.reps), tekst: beste ? `Beste: ${beste} rep${beste === 1 ? '' : 's'}` : 'Nog geen pull-up gelogd', behaald: beste >= d.reps ? sets.find((s) => s.reps >= d.reps)?.datum : null };
		}
		const gehaald = sets.filter((s) => s.gewicht >= d.gewicht && s.reps >= d.reps).sort((a, b) => a.datum.localeCompare(b.datum))[0];
		const beste = sets.reduce((a, s) => (e1rm(s.gewicht ?? 0, s.reps) > e1rm(a?.gewicht ?? 0, a?.reps ?? 0) ? s : a), null);
		return {
			waarde: beste ? Math.min(1, e1rm(beste.gewicht, beste.reps) / e1rm(d.gewicht, d.reps)) : 0,
			tekst: beste ? `Beste: ${String(beste.gewicht).replace('.', ',')} × ${beste.reps}` : 'Nog niets gelogd',
			behaald: gehaald?.datum ?? null
		};
	}
	if (d.soort === 'verhogingen') {
		const items = alle('SELECT i.id, i.gewicht FROM items i JOIN dagen dg ON dg.id = i.dag_id WHERE dg.gebruiker_id = ? AND i.slug = ?', g, d.slug);
		const ids = items.map((i) => i.id);
		const verhoogd = ids.length
			? een(`SELECT count(*) AS n FROM wijzigingen WHERE item_id IN (${ids.map(() => '?').join(',')}) AND oud IS NOT NULL AND nieuw > oud AND datum >= ?`, ...ids, d.start).n
			: 0;
		const gevonden = items.some((i) => i.gewicht != null);
		return { waarde: Math.min(1, verhoogd / d.aantal), tekst: `${gevonden ? 'Gewicht gevonden' : 'Nog geen gewicht'} · ${verhoogd}/${d.aantal} keer verhoogd`, behaald: gevonden && verhoogd >= d.aantal ? vandaag() : null };
	}
	if (d.soort === 'lichaamsgewicht') {
		const reeks = alle(
			`SELECT datum, gewicht FROM dagregels WHERE gebruiker_id = ? AND gewicht IS NOT NULL
			 UNION ALL SELECT week AS datum, gewicht FROM weekregels WHERE gebruiker_id = ? AND gewicht IS NOT NULL ORDER BY datum`,
			g, g
		);
		if (reeks.length < 2) return { waarde: 0, tekst: 'Log je gewicht in de dagregel of weekregel' };
		const begin = reeks.find((r) => r.datum >= plusDagen(d.start, -7)) ?? reeks[0];
		const nu = reeks[reeks.length - 1];
		const verschil = Math.round((nu.gewicht - begin.gewicht) * 10) / 10;
		return { waarde: Math.max(0, Math.min(1, verschil / d.gewicht)), tekst: `${verschil >= 0 ? '+' : ''}${String(verschil).replace('.', ',')} kg sinds ${begin.datum}`, behaald: verschil >= d.gewicht ? nu.datum : null };
	}
	return { waarde: d.behaald ? 1 : 0, tekst: '', behaald: d.behaald };
}

export const load = ({ locals }) => {
	const g = locals.gebruiker.id;
	const doelen = alle('SELECT * FROM doelen WHERE gebruiker_id = ? ORDER BY volgorde, id', g).map((d) => {
		const v = voortgang(g, d);
		if (v.behaald && !d.behaald && d.soort !== 'vrij') doe('UPDATE doelen SET behaald = ? WHERE id = ?', v.behaald, d.id);
		const { tekst: stand, ...rest } = v;
		return { ...d, ...rest, stand, behaald: d.behaald ?? v.behaald, oefening: d.slug ? oefening(d.slug)?.naam : null };
	});
	return { titel: 'Doelen', doelen, vandaag: vandaag() };
};

export const actions = {
	nieuw: async ({ request, locals }) => {
		const f = await request.formData();
		const tekst = String(f.get('tekst') ?? '').trim().slice(0, 120);
		if (!tekst) return fail(400, { fout: 'Beschrijf je doel.' });
		const deadline = /^\d{4}-\d{2}-\d{2}$/.test(String(f.get('deadline'))) ? String(f.get('deadline')) : null;
		doe("INSERT INTO doelen (gebruiker_id, soort, tekst, start, deadline, volgorde) VALUES (?, 'vrij', ?, ?, ?, 99)", locals.gebruiker.id, tekst, vandaag(), deadline);
		return { ok: true };
	},
	vink: async ({ request, locals }) => {
		const f = await request.formData();
		doe("UPDATE doelen SET behaald = CASE WHEN behaald IS NULL THEN ? ELSE NULL END WHERE id = ? AND gebruiker_id = ? AND soort = 'vrij'", vandaag(), Number(f.get('id')), locals.gebruiker.id);
		return { ok: true };
	},
	weg: async ({ request, locals }) => {
		const f = await request.formData();
		doe('DELETE FROM doelen WHERE id = ? AND gebruiker_id = ?', Number(f.get('id')), locals.gebruiker.id);
		return { ok: true };
	}
};
