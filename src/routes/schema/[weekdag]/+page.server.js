import { error, fail } from '@sveltejs/kit';
import { een, doe, transactie } from '#lib/server/db.js';
import * as data from '#lib/server/data.js';
import { OEFENINGEN, PER_SLUG, oefening } from '#lib/oefeningen.js';
import { vandaag } from '#lib/datum.js';

const laadDag = (locals, weekdag) => {
	const d = data.dag(locals.gebruiker.id, Number(weekdag));
	if (!d) error(404, 'Die dag bestaat niet.');
	return d;
};

export const load = ({ locals, params }) => {
	const d = laadDag(locals, params.weekdag);
	return {
		titel: d.titel,
		dag: { ...d, items: d.items.map((it) => ({ ...it, advies: data.adviesVoor(locals.gebruiker.id, it) })) },
		bibliotheek: OEFENINGEN.filter((o) => o.soort !== 'warming-up').map(({ slug, naam }) => ({ slug, naam }))
	};
};

const num = (v, { min = -Infinity, max = Infinity, leeg = null } = {}) => {
	if (v == null || String(v).trim() === '') return leeg;
	const n = Number(String(v).replace(',', '.'));
	return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
};

const eigenItem = (locals, d, id) => {
	const it = data.item(locals.gebruiker.id, Number(id));
	if (!it || it.dag_id !== d.id) error(404, 'Onbekende oefening.');
	return it;
};

export const actions = {
	dag: async ({ request, locals, params }) => {
		const d = laadDag(locals, params.weekdag);
		const f = await request.formData();
		const titel = String(f.get('titel') ?? '').trim().slice(0, 40);
		if (!titel) return fail(400, { fout: 'Geef de dag een naam.' });
		const soort = f.get('soort') === 'rust' ? 'rust' : 'gym';
		const warmup = String(f.get('warmup') ?? '').trim();
		const oud = d.warmup ?? { items: [] };
		doe(
			'UPDATE dagen SET titel = ?, focus = ?, soort = ?, warmup = ? WHERE id = ?',
			titel, String(f.get('focus') ?? '').trim().slice(0, 60) || null, soort, warmup ? JSON.stringify({ ...oud, tekst: warmup }) : null, d.id
		);
		return { ok: 'dag' };
	},
	item: async ({ request, locals, params }) => {
		const d = laadDag(locals, params.weekdag);
		const f = await request.formData();
		const it = eigenItem(locals, d, f.get('id'));
		const w = {
			sets: num(f.get('sets'), { min: 1, max: 10 }),
			min: num(f.get('reps_min'), { min: 1, max: 300 }),
			max: num(f.get('reps_max'), { min: 1, max: 300 }),
			gewicht: num(f.get('gewicht'), { min: -200, max: 2000 })
		};
		if (Object.values(w).includes(undefined) || w.sets == null || w.min == null || w.max == null || w.max < w.min)
			return fail(400, { fout: 'Controleer sets, reps en gewicht.', id: it.id });
		let sinds = /^\d{4}-\d{2}-\d{2}$/.test(String(f.get('sinds'))) ? String(f.get('sinds')) : null;
		// Ander gewicht = vanaf vandaag op dit gewicht. Alleen als je "sinds" niet zelf ook hebt veranderd.
		if (w.gewicht !== it.gewicht && sinds === it.sinds) sinds = w.gewicht == null ? null : vandaag();
		const eenheid = f.get('eenheid') === 'lbs' ? 'lbs' : 'kg';
		transactie(() => {
			doe(
				`UPDATE items SET sets = ?, reps_min = ?, reps_max = ?, gewicht = ?, per_stuk = ?, eenheid = ?, sinds = ?, notitie = ?, sets_tijdelijk = NULL WHERE id = ?`,
				w.sets, w.min, w.max, w.gewicht, f.get('per_stuk') ? 1 : 0, eenheid, sinds, String(f.get('notitie') ?? '').trim().slice(0, 300) || null, it.id
			);
			if (w.gewicht !== it.gewicht) doe('INSERT INTO wijzigingen (item_id, datum, oud, nieuw, reden) VALUES (?, ?, ?, ?, ?)', it.id, vandaag(), it.gewicht, w.gewicht, 'schema');
		});
		return { ok: it.id };
	},
	wissel: async ({ request, locals, params }) => {
		// Andere oefening op deze plek (bv. vervangen na 4 weken stilstand)
		const d = laadDag(locals, params.weekdag);
		const f = await request.formData();
		const it = eigenItem(locals, d, f.get('id'));
		const slug = String(f.get('slug'));
		if (!PER_SLUG[slug]) return fail(400, { fout: 'Onbekende oefening.' });
		// Gewicht van de vorige keer dat je deze oefening deed, en een rep-range die bij de oefening past.
		data.vervang(locals.gebruiker.id, it, slug);
		return { vervangen: it.id };
	},
	opties: async ({ request, locals, params }) => {
		const d = laadDag(locals, params.weekdag);
		const f = await request.formData();
		const it = eigenItem(locals, d, f.get('id'));
		const opties = f.getAll('optie').map(String).filter((s) => PER_SLUG[s]).map((slug) => ({ slug, hint: it.opties.find((o) => o.slug === slug)?.hint }));
		doe('UPDATE items SET opties = ?, wissel = 1 WHERE id = ?', JSON.stringify(opties), it.id);
		return { ok: it.id };
	},
	volgorde: async ({ request, locals, params }) => {
		// Nieuwe volgorde na slepen: alle ids van deze dag, in de nieuwe volgorde.
		const d = laadDag(locals, params.weekdag);
		const f = await request.formData();
		const ids = String(f.get('ids') ?? '').split(',').map(Number);
		const eigen = new Set(d.items.map((x) => x.id));
		if (ids.length !== eigen.size || !ids.every((id) => eigen.has(id))) return fail(400, { fout: 'Volgorde klopt niet; laad de pagina opnieuw.' });
		transactie(() => ids.forEach((id, i) => doe('UPDATE items SET positie = ? WHERE id = ?', i + 1, id)));
		return { ok: true };
	},
	schuif: async ({ request, locals, params }) => {
		const d = laadDag(locals, params.weekdag);
		const f = await request.formData();
		const it = eigenItem(locals, d, f.get('id'));
		const richting = f.get('richting') === 'op' ? -1 : 1;
		const ander = d.items.find((x) => x.positie === it.positie + richting);
		if (ander)
			transactie(() => {
				doe('UPDATE items SET positie = ? WHERE id = ?', ander.positie, it.id);
				doe('UPDATE items SET positie = ? WHERE id = ?', it.positie, ander.id);
			});
		return { ok: true };
	},
	weg: async ({ request, locals, params }) => {
		const d = laadDag(locals, params.weekdag);
		const f = await request.formData();
		const it = eigenItem(locals, d, f.get('id'));
		transactie(() => {
			doe('DELETE FROM items WHERE id = ?', it.id);
			doe('UPDATE items SET positie = positie - 1 WHERE dag_id = ? AND positie > ?', d.id, it.positie);
		});
		return { ok: true };
	},
	nieuw: async ({ request, locals, params }) => {
		const d = laadDag(locals, params.weekdag);
		const f = await request.formData();
		const slug = String(f.get('slug'));
		const o = oefening(slug);
		if (!o) return fail(400, { fout: 'Kies een oefening.' });
		const [min, max] = o.soort === 'compound' ? [8, 12] : o.meet === 'sec' ? [45, 45] : [12, 15];
		const positie = (een('SELECT max(positie) AS p FROM items WHERE dag_id = ?', d.id).p ?? 0) + 1;
		doe(
			'INSERT INTO items (dag_id, positie, slug, sets, reps_min, reps_max, gewicht, per_stuk) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
			d.id, positie, slug, 3, min, max, o.stap === 'lichaam' || o.stap === 'tijd' ? 0 : null, o.stap === 'dumbbell' ? 1 : 0
		);
		return { ok: true };
	}
};
