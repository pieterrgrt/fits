import { fail } from '@sveltejs/kit';
import { alle, doe } from '#lib/server/db.js';
import * as data from '#lib/server/data.js';
import { oefening } from '#lib/oefeningen.js';
import { verloopMetRecords, slaapEnPrestatie } from '#lib/groei.js';
import { vandaag, plusDagen } from '#lib/datum.js';

export const load = ({ locals }) => {
	const g = locals.gebruiker;
	const d = vandaag();
	// Hoofdoefeningen: de compounds uit je schema, in schemavolgorde.
	const slugs = [
		...new Set(
			data
				.dagen(g.id)
				.flatMap((dag) => dag.items)
				.filter((it) => it.slug && !it.wissel && oefening(it.slug).soort === 'compound' && oefening(it.slug).meet !== 'sec')
				.map((it) => it.slug)
		)
	];
	const kracht = slugs.map((slug) => {
		const sessies = data
			.geschiedenis(g.id, slug, { limiet: 60 })
			.reverse()
			.map((s) => ({ datum: s.datum, sets: s.sets.filter((x) => x.gewicht > 0 && x.reps > 0 && x.reps <= 20) }))
			.filter((s) => s.sets.length);
		const verloop = verloopMetRecords(sessies);
		const eerste = verloop[0];
		const laatste = verloop[verloop.length - 1];
		return {
			slug,
			naam: oefening(slug).naam,
			verloop,
			records: verloop.filter((v) => v.record).length,
			groei: eerste && laatste && eerste !== laatste ? Math.round(((laatste.e1rm - eerste.e1rm) / eerste.e1rm) * 1000) / 10 : null
		};
	});
	const recenteRecords = kracht
		.flatMap((k) => k.verloop.filter((v) => v.record).map((v) => ({ ...v, naam: k.naam, slug: k.slug })))
		.filter((v) => v.datum >= plusDagen(d, -56))
		.sort((a, b) => (a.datum < b.datum ? 1 : -1))
		.slice(0, 8);

	// Slaap (de nacht ervoor staat op de dag zelf) tegenover hoe sterk je die training was.
	const van = plusDagen(d, -180);
	const trainingen = alle(
		`SELECT t.id, t.datum, r.slaap FROM trainingen t LEFT JOIN dagregels r ON r.gebruiker_id = t.gebruiker_id AND r.datum = t.datum
		 WHERE t.gebruiker_id = ? AND t.eind IS NOT NULL AND t.licht = 0 AND t.datum >= ? ORDER BY t.datum, t.id`,
		g.id, van
	);
	const sets = alle(
		`SELECT s.training_id, s.slug, s.gewicht, s.reps FROM sets s JOIN trainingen t ON t.id = s.training_id
		 WHERE t.gebruiker_id = ? AND t.eind IS NOT NULL AND t.licht = 0 AND t.datum >= ? AND s.gewicht > 0 AND s.reps BETWEEN 1 AND 20`,
		g.id, van
	);
	const slaap = slaapEnPrestatie(trainingen.map((t) => ({ ...t, sets: sets.filter((s) => s.training_id === t.id) })));

	return { titel: 'Groei', kracht, recenteRecords, slaap, stang: g.stang ?? 20, lichteWeek: data.isLichteWeek(g.id, d) };
};

export const actions = {
	stang: async ({ request, locals }) => {
		const f = await request.formData();
		const kg = Number(String(f.get('stang')).replace(',', '.'));
		if (!Number.isFinite(kg) || kg < 0 || kg > 40) return fail(400, { fout: 'Een stang weegt tussen 0 en 40 kg.' });
		doe('UPDATE gebruikers SET stang = ? WHERE id = ?', kg, locals.gebruiker.id);
		return { stangOk: true };
	}
};
