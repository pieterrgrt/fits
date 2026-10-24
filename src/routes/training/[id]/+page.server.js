import { error, fail, redirect } from '@sveltejs/kit';
import { een, alle, doe } from '#lib/server/db.js';
import * as data from '#lib/server/data.js';
import { PER_SLUG } from '#lib/oefeningen.js';
import { lichteSets } from '#lib/groei.js';

const laad = (locals, id) => {
	data.sluitVergeten(locals.gebruiker.id);
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
	const vandaagAnders = vervangingen(t.id);
	const items = (dag?.items ?? []).map((schemaItem) => {
		// Alleen vandaag een andere oefening? Dan rekent alles verder met die oefening.
		const anders = vandaagAnders.get(schemaItem.id);
		const it = anders ? { ...schemaItem, ...data.vervanging(g.id, schemaItem, anders), sinds: null, sets_tijdelijk: null, vervangt: schemaItem.slug } : schemaItem;
		const vorige = it.slug ? data.geschiedenis(g.id, it.slug, { limiet: 1, behalve: t.id })[0] ?? null : null;
		const aantal = it.sets_tijdelijk ?? it.sets;
		return {
			...it,
			// Lichte week: zelfde gewichten, de helft van de sets, 3 reps over.
			sets_tijdelijk: t.licht ? lichteSets(aantal) : it.sets_tijdelijk,
			beste: it.slug ? data.besteE1rm(g.id, it.slug, t.id) : 0,
			vorige: vorige && { datum: vorige.datum, sets: vorige.sets.map(({ gewicht, reps }) => ({ gewicht, reps })) },
			doel: !it.slug ? [] : t.licht ? Array(lichteSets(aantal)).fill(it.reps_min) : data.doelVoor(g.id, it, t.id),
			advies: it.slug ? data.adviesVoor(g.id, it) : null,
			gedaan: sets.filter((s) => s.item_id === it.id && s.slug === it.slug).map(({ id, nr, gewicht, reps, rir }) => ({ id, nr, gewicht, reps, rir }))
		};
	});
	return { titel: t.titel, training: t, dag, items, stang: g.stang ?? 20 };
};

const vervangingen = (trainingId) =>
	new Map(alle('SELECT item_id, slug FROM vervangingen WHERE training_id = ?', trainingId).map((r) => [r.item_id, r.slug]));

/** Het item zoals het in deze training geldt: met de vervanging voor vandaag, als die er is. */
function itemVandaag(locals, t, itemId) {
	const it = data.item(locals.gebruiker.id, itemId);
	if (!it || it.dag_id !== t.dag_id) return null;
	const anders = vervangingen(t.id).get(it.id);
	return anders ? { ...it, ...data.vervanging(locals.gebruiker.id, it, anders) } : it;
}

const getal = (v) => (v === '' || v == null ? null : Number(String(v).replace(',', '.')));

export const actions = {
	set: async ({ request, locals, params }) => {
		const t = laad(locals, params.id);
		const f = await request.formData();
		const it = itemVandaag(locals, t, Number(f.get('item')));
		if (!it?.slug) return fail(400, { fout: 'Onbekende oefening.' });
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
		data.vervang(locals.gebruiker.id, it, slug);
		return { ok: true };
	},
	vervang: async ({ request, locals, params }) => {
		const t = laad(locals, params.id);
		const f = await request.formData();
		const it = data.item(locals.gebruiker.id, Number(f.get('id')));
		const slug = String(f.get('slug'));
		if (!it || it.dag_id !== t.dag_id || !PER_SLUG[slug]) return fail(400, { fout: 'Kan deze oefening niet vervangen.' });
		if (f.get('bereik') === 'schema') {
			data.vervang(locals.gebruiker.id, it, slug);
			doe('DELETE FROM vervangingen WHERE training_id = ? AND item_id = ?', t.id, it.id);
		} else if (slug === it.slug) {
			doe('DELETE FROM vervangingen WHERE training_id = ? AND item_id = ?', t.id, it.id);
		} else {
			doe('INSERT INTO vervangingen (training_id, item_id, slug) VALUES (?, ?, ?) ON CONFLICT DO UPDATE SET slug = excluded.slug', t.id, it.id, slug);
		}
		return { ok: true };
	},
	terug: async ({ request, locals, params }) => {
		const t = laad(locals, params.id);
		const f = await request.formData();
		doe('DELETE FROM vervangingen WHERE training_id = ? AND item_id = ?', t.id, Number(f.get('id')));
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
