import { error, fail, redirect } from '@sveltejs/kit';
import { een, doe } from '#lib/server/db.js';
import * as data from '#lib/server/data.js';
import { PER_SLUG } from '#lib/oefeningen.js';

const laad = (locals, id) => {
	const t = data.training(locals.gebruiker.id, Number(id));
	if (!t) error(404, 'Deze training bestaat niet.');
	return t;
};

export const load = ({ locals, params }) => {
	const g = locals.gebruiker;
	const t = laad(locals, params.id);
	if (t.eind) redirect(303, `/logboek/${t.id}`);
	const dag = t.dag_id ? data.dag(g.id, t.dag_id, { opId: true }) : null;
	const sets = data.setsVan(t.id);
	const items = (dag?.items ?? []).map((it) => {
		const vorige = it.slug ? data.geschiedenis(g.id, it.slug, { limiet: 1, behalve: t.id })[0] ?? null : null;
		return {
			...it,
			vorige: vorige && { datum: vorige.datum, sets: vorige.sets.map(({ gewicht, reps }) => ({ gewicht, reps })) },
			doel: it.slug ? data.doelVoor(g.id, it, t.id) : [],
			advies: it.slug ? data.adviesVoor(g.id, it) : null,
			gedaan: sets.filter((s) => s.item_id === it.id).map(({ id, nr, gewicht, reps, rir }) => ({ id, nr, gewicht, reps, rir }))
		};
	});
	return { titel: t.titel, training: t, dag, items };
};

const getal = (v) => (v === '' || v == null ? null : Number(String(v).replace(',', '.')));

export const actions = {
	set: async ({ request, locals, params }) => {
		const t = laad(locals, params.id);
		const f = await request.formData();
		const it = data.item(locals.gebruiker.id, Number(f.get('item')));
		if (!it || it.dag_id !== t.dag_id || !it.slug) return fail(400, { fout: 'Onbekende oefening.' });
		const nr = Number(f.get('nr'));
		const reps = Number(f.get('reps'));
		const gewicht = getal(f.get('gewicht'));
		const rir = f.get('rir') === '' || f.get('rir') == null ? null : Number(f.get('rir'));
		if (!Number.isInteger(nr) || nr < 1 || nr > 12) return fail(400, { fout: 'Ongeldige set.' });
		if (!Number.isInteger(reps) || reps < 0 || reps > 600) return fail(400, { fout: 'Ongeldig aantal reps.' });
		if (gewicht != null && (!Number.isFinite(gewicht) || Math.abs(gewicht) > 2000)) return fail(400, { fout: 'Ongeldig gewicht.' });
		doe(
			`INSERT INTO sets (training_id, item_id, slug, nr, gewicht, eenheid, per_stuk, reps, rir) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
			 ON CONFLICT (training_id, item_id, slug, nr) DO UPDATE SET gewicht = excluded.gewicht, reps = excluded.reps, rir = excluded.rir`,
			t.id, it.id, it.slug, nr, gewicht, it.eenheid, it.per_stuk ? 1 : 0, reps, Number.isInteger(rir) ? rir : null
		);
		return { ok: true };
	},
	weg: async ({ request, locals, params }) => {
		const t = laad(locals, params.id);
		const f = await request.formData();
		doe('DELETE FROM sets WHERE id = ? AND training_id = ?', Number(f.get('set')), t.id);
		return { ok: true };
	},
	kies: async ({ request, locals, params }) => {
		const t = laad(locals, params.id);
		const f = await request.formData();
		const it = data.item(locals.gebruiker.id, Number(f.get('item')));
		const slug = String(f.get('slug'));
		if (!it || !it.wissel || it.dag_id !== t.dag_id || !PER_SLUG[slug]) return fail(400, { fout: 'Kan dat niet kiezen.' });
		const hint = it.opties.find((o) => o.slug === slug)?.hint ?? null;
		doe('UPDATE items SET slug = ?, gewicht = NULL, sinds = NULL, notitie = ? WHERE id = ?', slug, hint, it.id);
		return { ok: true };
	},
	afronden: async ({ request, locals, params }) => {
		const t = laad(locals, params.id);
		const f = await request.formData();
		const extra = ['A', 'B', 'C'].includes(String(f.get('extra'))) ? String(f.get('extra')) : null;
		const notitie = String(f.get('notitie') ?? '').trim().slice(0, 2000) || null;
		doe("UPDATE trainingen SET eind = datetime('now'), notitie = ?, extra = ? WHERE id = ?", notitie, extra, t.id);
		redirect(303, `/logboek/${t.id}?klaar`);
	},
	stoppen: async ({ locals, params }) => {
		const t = laad(locals, params.id);
		if (een('SELECT count(*) AS n FROM sets WHERE training_id = ?', t.id).n > 0)
			return fail(400, { fout: 'Er staan al sets in deze training. Rond hem af of verwijder eerst de sets.' });
		doe('DELETE FROM trainingen WHERE id = ?', t.id);
		redirect(303, '/');
	}
};
