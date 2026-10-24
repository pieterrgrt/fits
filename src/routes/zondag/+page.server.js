import { fail } from '@sveltejs/kit';
import { doe } from '#lib/server/db.js';
import * as data from '#lib/server/data.js';
import { oefening, PER_SLUG } from '#lib/oefeningen.js';
import { alle } from '#lib/server/db.js';
import { volume, vultAan } from '#lib/volume.js';
import { lichteWeekAdvies, gewichtsTrend, kcalAdvies } from '#lib/groei.js';
import { een } from '#lib/server/db.js';
import { vandaag, maandag, plusDagen } from '#lib/datum.js';

export const load = ({ locals }) => {
	const g = locals.gebruiker.id;
	const d = vandaag();
	const dagen = data.dagen(g).filter((x) => x.soort === 'gym');
	const week = data.week(g, d);
	const gepland = volume(dagen.flatMap((dag) => dag.items.filter((it) => it.slug).map((it) => ({ slug: it.slug, aantal: it.sets_tijdelijk ?? it.sets }))));
	const items = dagen.flatMap((dag) => dag.items.filter((it) => it.slug)).map((it) => data.adviesVoor(g, it, d));
	const volgendeWeek = plusDagen(maandag(d), 7);
	const lichtNu = data.isLichteWeek(g, d);
	const lichtVolgende = data.isLichteWeek(g, volgendeWeek);
	const laatsteFoto = een('SELECT max(datum) AS d FROM fotos WHERE gebruiker_id = ?', g).d;
	const trend = gewichtsTrend(data.wegingen(g, plusDagen(d, -21)), d);
	return {
		titel: 'Zondag-check',
		datum: d,
		week,
		volgendeWeek,
		licht: {
			nu: lichtNu,
			volgende: lichtVolgende,
			advies: lichteWeekAdvies({
				vandaag: d,
				trainingsweken: alle('SELECT DISTINCT datum FROM trainingen WHERE gebruiker_id = ? AND eind IS NOT NULL AND licht = 0', g)
					.map((r) => maandag(r.datum))
					.filter((w, i, l) => l.indexOf(w) === i),
				laatsteLicht: data.laatsteLichteWeek(g),
				weekregels: alle('SELECT energie FROM weekregels WHERE gebruiker_id = ? ORDER BY week DESC LIMIT 2', g),
				vastgelopen: items.filter((a) => a.soort === 'set-minder' || a.soort === 'vervang').length
			})
		},
		laatsteFoto,
		trend: trend && { ...trend, advies: kcalAdvies(trend) },
		volume: {
			gedaan: volume(
				alle(
					`SELECT s.slug, s.reps FROM sets s JOIN trainingen t ON t.id = s.training_id
					 WHERE t.gebruiker_id = ? AND t.datum BETWEEN ? AND ?`,
					g, week.maandag, week.zondag
				)
			),
			gepland
		},
		dagen: dagen.map((dag) => ({
			id: dag.id,
			weekdag: dag.weekdag,
			titel: dag.titel,
			items: dag.items.map((it) => ({
				...it,
				// Wisselslot: welke spiergroepen onder de 10 sets elke optie zou aanvullen.
				opties: it.opties.map((o) => ({ ...o, vult: vultAan(o.slug, gepland) })).sort((a, b) => b.vult.length - a.vult.length || (a.vult[0]?.sets ?? 99) - (b.vult[0]?.sets ?? 99)),
				naam: it.slug ? oefening(it.slug).naam : null,
				advies: data.adviesVoor(g, it, d),
				laatste: it.slug ? data.geschiedenis(g, it.slug, { limiet: 2 }).map((s) => ({ datum: s.datum, sets: s.sets.map(({ gewicht, reps }) => ({ gewicht, reps })) })) : []
			}))
		}))
	};
};

const num = (v, min, max) => {
	if (v == null || String(v).trim() === '') return null;
	const n = Number(String(v).replace(',', '.'));
	return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
};

export const actions = {
	licht: async ({ request, locals }) => {
		const f = await request.formData();
		const week = plusDagen(maandag(vandaag()), 7);
		if (f.get('aan') === '1') doe('INSERT OR IGNORE INTO lichte_weken (gebruiker_id, week) VALUES (?, ?)', locals.gebruiker.id, week);
		else doe('DELETE FROM lichte_weken WHERE gebruiker_id = ? AND week = ?', locals.gebruiker.id, week);
		return { lichtOk: true };
	},
	gewicht: async ({ request, locals }) => {
		const f = await request.formData();
		const nieuw = num(f.get('gewicht'), -200, 2000);
		if (nieuw == null) return fail(400, { fout: 'Geen geldig gewicht.' });
		if (!data.zetGewicht(locals.gebruiker.id, Number(f.get('item')), nieuw)) return fail(404, { fout: 'Onbekende oefening.' });
		return { gedaan: Number(f.get('item')) };
	},
	reps: async ({ request, locals }) => {
		const f = await request.formData();
		const it = data.item(locals.gebruiker.id, Number(f.get('item')));
		const min = num(f.get('min'), 1, 600);
		const max = num(f.get('max'), 1, 600);
		if (!it || !min || !max) return fail(400, { fout: 'Kan dat niet aanpassen.' });
		doe('UPDATE items SET reps_min = ?, reps_max = ?, sinds = ? WHERE id = ?', min, max, vandaag(), it.id);
		return { gedaan: it.id };
	},
	setMinder: async ({ request, locals }) => {
		const f = await request.formData();
		const it = data.item(locals.gebruiker.id, Number(f.get('item')));
		if (!it) return fail(404, { fout: 'Onbekende oefening.' });
		doe('UPDATE items SET sets_tijdelijk = ? WHERE id = ?', Math.max(1, (it.sets_tijdelijk ?? it.sets) - 1), it.id);
		return { gedaan: it.id };
	},
	vervang: async ({ request, locals }) => {
		const f = await request.formData();
		const it = data.item(locals.gebruiker.id, Number(f.get('item')));
		const slug = String(f.get('slug'));
		if (!it || !PER_SLUG[slug]) return fail(400, { fout: 'Kan niet vervangen.' });
		data.vervang(locals.gebruiker.id, it, slug);
		return { gedaan: it.id };
	},
	wissel: async ({ request, locals }) => {
		const f = await request.formData();
		const it = data.item(locals.gebruiker.id, Number(f.get('item')));
		const slug = String(f.get('slug'));
		if (!it?.wissel || !PER_SLUG[slug]) return fail(400, { fout: 'Kan dat niet kiezen.' });
		data.vervang(locals.gebruiker.id, it, slug);
		return { gedaan: it.id };
	},
	weekregel: async ({ request, locals }) => {
		const f = await request.formData();
		const w = { slaap: num(f.get('slaap'), 0, 16), energie: num(f.get('energie'), 1, 10), gewicht: num(f.get('gewicht'), 20, 300) };
		if (Object.values(w).includes(undefined)) return fail(400, { weekFout: 'Een van de getallen klopt niet.' });
		doe(
			`INSERT INTO weekregels (gebruiker_id, week, slaap, energie, gewicht, gemist, notitie) VALUES (?, ?, ?, ?, ?, ?, ?)
			 ON CONFLICT (gebruiker_id, week) DO UPDATE SET slaap = excluded.slaap, energie = excluded.energie, gewicht = excluded.gewicht, gemist = excluded.gemist, notitie = excluded.notitie`,
			locals.gebruiker.id, maandag(vandaag()), w.slaap, w.energie, w.gewicht,
			String(f.get('gemist') ?? '').trim().slice(0, 200) || null, String(f.get('notitie') ?? '').trim().slice(0, 500) || null
		);
		if (w.gewicht) doe('UPDATE gebruikers SET gewicht = ? WHERE id = ?', w.gewicht, locals.gebruiker.id);
		return { weekOk: true };
	}
};
