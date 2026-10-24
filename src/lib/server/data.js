import { een, alle, doe, transactie } from './db.js';
import { oefening } from '#lib/oefeningen.js';
import { advies, doelVandaag } from '#lib/progressie.js';
import { vandaag as nu, maandag, plusDagen } from '#lib/datum.js';

const leesItem = (x) => ({ ...x, opties: x.opties ? JSON.parse(x.opties) : [], wissel: !!x.wissel, per_stuk: !!x.per_stuk });
const leesDag = (d) => ({ ...d, warmup: d.warmup ? JSON.parse(d.warmup) : null });

export function dagen(gebruikerId) {
	const lijst = alle('SELECT * FROM dagen WHERE gebruiker_id = ? ORDER BY weekdag', gebruikerId).map(leesDag);
	const items = alle(
		'SELECT i.* FROM items i JOIN dagen d ON d.id = i.dag_id WHERE d.gebruiker_id = ? ORDER BY i.positie',
		gebruikerId
	).map(leesItem);
	return lijst.map((d) => ({ ...d, items: items.filter((i) => i.dag_id === d.id) }));
}

export function dag(gebruikerId, weekdagOfId, { opId = false } = {}) {
	const d = een(`SELECT * FROM dagen WHERE gebruiker_id = ? AND ${opId ? 'id' : 'weekdag'} = ?`, gebruikerId, weekdagOfId);
	if (!d) return null;
	return { ...leesDag(d), items: alle('SELECT * FROM items WHERE dag_id = ? ORDER BY positie', d.id).map(leesItem) };
}

export function item(gebruikerId, itemId) {
	const x = een('SELECT i.* FROM items i JOIN dagen d ON d.id = i.dag_id WHERE i.id = ? AND d.gebruiker_id = ?', itemId, gebruikerId);
	return x ? leesItem(x) : null;
}

/**
 * Eerdere sessies van een oefening, nieuwste eerst: [{ training_id, datum, sets }].
 * Trainingen in een lichte week tellen niet mee: daar ga je bewust minder ver.
 */
export function geschiedenis(gebruikerId, slug, { limiet = 12, behalve = null } = {}) {
	const rijen = alle(
		`SELECT s.*, t.datum FROM sets s JOIN trainingen t ON t.id = s.training_id
		 WHERE t.gebruiker_id = ? AND s.slug = ? AND t.id IN (
			SELECT t2.id FROM trainingen t2 JOIN sets s2 ON s2.training_id = t2.id
			WHERE t2.gebruiker_id = ? AND s2.slug = ? AND t2.id IS NOT ? AND t2.licht = 0
			GROUP BY t2.id ORDER BY t2.datum DESC, t2.id DESC LIMIT ?)
		 ORDER BY t.datum DESC, t.id DESC, s.nr`,
		gebruikerId, slug, gebruikerId, slug, behalve, limiet
	);
	const perTraining = new Map();
	for (const r of rijen) {
		if (!perTraining.has(r.training_id)) perTraining.set(r.training_id, { training_id: r.training_id, datum: r.datum, sets: [] });
		perTraining.get(r.training_id).sets.push(r);
	}
	return [...perTraining.values()];
}

export function adviesVoor(gebruikerId, it, vandaag = nu()) {
	if (!it.slug) return { soort: 'kies', tekst: 'Kies zondag een apparaat voor het wisselslot.' };
	return advies(it, oefening(it.slug), geschiedenis(gebruikerId, it.slug), vandaag);
}

export const doelVoor = (gebruikerId, it, behalve) => doelVandaag(it, geschiedenis(gebruikerId, it.slug, { behalve }));

/* ---------- Trainingen ---------- */

/**
 * Trainingen die je vergat af te ronden: na 4 uur sluit Fits ze. Met sets: afgerond op het moment van
 * de laatste set. Zonder sets: weg.
 */
export function sluitVergeten(gebruikerId) {
	transactie(() => {
		const oud = alle("SELECT id FROM trainingen WHERE gebruiker_id = ? AND eind IS NULL AND begin < datetime('now', '-4 hours')", gebruikerId);
		for (const { id } of oud) {
			const laatste = een('SELECT max(gemaakt) AS t FROM sets WHERE training_id = ?', id).t;
			if (laatste) doe("UPDATE trainingen SET eind = ?, notitie = coalesce(notitie, 'Automatisch afgerond') WHERE id = ?", laatste, id);
			else doe('DELETE FROM trainingen WHERE id = ?', id);
		}
	});
}

export function openTraining(gebruikerId) {
	sluitVergeten(gebruikerId);
	return een('SELECT * FROM trainingen WHERE gebruiker_id = ? AND eind IS NULL ORDER BY id DESC LIMIT 1', gebruikerId);
}

export const training = (gebruikerId, id) => een('SELECT * FROM trainingen WHERE id = ? AND gebruiker_id = ?', id, gebruikerId);

export const setsVan = (trainingId) => alle('SELECT * FROM sets WHERE training_id = ? ORDER BY id', trainingId);

export function startTraining(gebruikerId, dagId, datum = nu()) {
	const d = dag(gebruikerId, dagId, { opId: true });
	if (!d) return null;
	const licht = isLichteWeek(gebruikerId, datum) ? 1 : 0;
	const { lastInsertRowid } = doe('INSERT INTO trainingen (gebruiker_id, dag_id, titel, datum, licht) VALUES (?, ?, ?, ?, ?)', gebruikerId, d.id, d.titel, datum, licht);
	return Number(lastInsertRowid);
}

export function trainingen(gebruikerId, { limiet = 30, voor = null } = {}) {
	const lijst = alle(
		`SELECT * FROM trainingen WHERE gebruiker_id = ? AND eind IS NOT NULL ${voor ? 'AND datum < ?' : ''}
		 ORDER BY datum DESC, id DESC LIMIT ?`,
		...[gebruikerId, ...(voor ? [voor] : []), limiet]
	);
	if (!lijst.length) return [];
	const sets = alle(`SELECT * FROM sets WHERE training_id IN (${lijst.map(() => '?').join(',')}) ORDER BY id`, ...lijst.map((t) => t.id));
	return lijst.map((t) => ({ ...t, sets: sets.filter((s) => s.training_id === t.id) }));
}

/** Sets van een training per oefening, in de volgorde waarin ze gedaan zijn. */
export function perOefening(sets) {
	const groepen = [];
	for (const s of sets) {
		let g = groepen.find((x) => x.slug === s.slug && x.item_id === s.item_id);
		if (!g) groepen.push((g = { slug: s.slug, item_id: s.item_id, sets: [] }));
		g.sets.push(s);
	}
	for (const g of groepen) g.sets.sort((a, b) => a.nr - b.nr);
	return groepen;
}

/* ---------- Schema aanpassen ---------- */

export function zetGewicht(gebruikerId, itemId, nieuw, { reden = 'zondag-check', datum = nu() } = {}) {
	const it = item(gebruikerId, itemId);
	if (!it) return false;
	transactie(() => {
		doe('UPDATE items SET gewicht = ?, sinds = ?, sets_tijdelijk = NULL WHERE id = ?', nieuw, datum, itemId);
		doe('INSERT INTO wijzigingen (item_id, datum, oud, nieuw, reden) VALUES (?, ?, ?, ?, ?)', itemId, datum, it.gewicht, nieuw, reden);
	});
	return true;
}

/* ---------- Week ---------- */

export function week(gebruikerId, datum = nu()) {
	const ma = maandag(datum);
	const zo = plusDagen(ma, 6);
	return {
		maandag: ma,
		zondag: zo,
		trainingen: alle('SELECT id, datum, titel, extra FROM trainingen WHERE gebruiker_id = ? AND eind IS NOT NULL AND datum BETWEEN ? AND ? ORDER BY datum', gebruikerId, ma, zo),
		dagregels: alle('SELECT * FROM dagregels WHERE gebruiker_id = ? AND datum BETWEEN ? AND ? ORDER BY datum', gebruikerId, ma, zo),
		activiteiten: alle('SELECT * FROM activiteiten WHERE gebruiker_id = ? AND datum BETWEEN ? AND ? ORDER BY begin', gebruikerId, ma, zo),
		weekregel: een('SELECT * FROM weekregels WHERE gebruiker_id = ? AND week = ?', gebruikerId, ma)
	};
}

export const dagregel = (gebruikerId, datum = nu()) =>
	een('SELECT * FROM dagregels WHERE gebruiker_id = ? AND datum = ?', gebruikerId, datum) ?? { datum };

export function laatsteGewicht(gebruikerId) {
	return (
		een('SELECT gewicht, datum FROM dagregels WHERE gebruiker_id = ? AND gewicht IS NOT NULL ORDER BY datum DESC LIMIT 1', gebruikerId) ??
		een('SELECT gewicht, week AS datum FROM weekregels WHERE gebruiker_id = ? AND gewicht IS NOT NULL ORDER BY week DESC LIMIT 1', gebruikerId)
	);
}

/* ---------- Oefening vervangen ---------- */

/**
 * Wat er op een plek komt als je een oefening vervangt: gewicht van de vorige keer dat je hem deed
 * (anders zoek gewicht), en een rep-range die bij de soort oefening past.
 */
export function vervanging(gebruikerId, it, slug) {
	const o = oefening(slug);
	const oud = it.slug ? oefening(it.slug) : null;
	const vorige = geschiedenis(gebruikerId, slug, { limiet: 1 })[0]?.sets ?? [];
	const zwaarste = vorige.reduce((a, s) => (s.gewicht != null && (a == null || s.gewicht > a.gewicht) ? s : a), null);
	let [min, max] = [it.reps_min, it.reps_max];
	if (!oud || oud.soort !== o.soort || oud.meet !== o.meet) {
		[min, max] = o.meet === 'sec' ? [45, 45] : o.soort === 'compound' ? [8, 12] : [12, 15];
	}
	return {
		slug,
		gewicht: zwaarste?.gewicht ?? (o.stap === 'lichaam' || o.stap === 'tijd' ? 0 : null),
		eenheid: zwaarste?.eenheid ?? (oud?.stap === o.stap ? it.eenheid : 'kg'),
		per_stuk: zwaarste ? zwaarste.per_stuk : o.stap === 'dumbbell' ? 1 : 0,
		reps_min: min,
		reps_max: max,
		notitie: it.wissel ? (it.opties.find((x) => x.slug === slug)?.hint ?? null) : null
	};
}

export function vervang(gebruikerId, it, slug) {
	const v = vervanging(gebruikerId, it, slug);
	doe(
		'UPDATE items SET slug = ?, gewicht = ?, eenheid = ?, per_stuk = ?, reps_min = ?, reps_max = ?, notitie = ?, sinds = NULL, sets_tijdelijk = NULL WHERE id = ?',
		v.slug, v.gewicht, v.eenheid, v.per_stuk ? 1 : 0, v.reps_min, v.reps_max, v.notitie, it.id
	);
	return v;
}

/* ---------- Groei ---------- */

export const isLichteWeek = (gebruikerId, datum = nu()) =>
	!!een('SELECT 1 FROM lichte_weken WHERE gebruiker_id = ? AND week = ?', gebruikerId, maandag(datum));

export const laatsteLichteWeek = (gebruikerId) =>
	een('SELECT max(week) AS w FROM lichte_weken WHERE gebruiker_id = ?', gebruikerId).w;

/** Hoogste geschatte maximum (Epley) dat je ooit haalde op een oefening, eventueel zonder één training. */
export const besteE1rm = (gebruikerId, slug, behalve = null) =>
	een(
		`SELECT max(s.gewicht * (1 + s.reps / 30.0)) AS m FROM sets s JOIN trainingen t ON t.id = s.training_id
		 WHERE t.gebruiker_id = ? AND s.slug = ? AND s.gewicht > 0 AND s.reps BETWEEN 1 AND 20 AND t.id IS NOT ?`,
		gebruikerId, slug, behalve
	).m ?? 0;

/** Sets van de laatste uren, voor herstel per spiergroep. */
export const recenteSets = (gebruikerId, uren = 48) =>
	alle(
		`SELECT s.slug, s.gemaakt FROM sets s JOIN trainingen t ON t.id = s.training_id
		 WHERE t.gebruiker_id = ? AND s.reps > 0 AND s.gemaakt > datetime('now', ?)`,
		gebruikerId, `-${uren} hours`
	);

/** Wegingen (oudste eerst) uit dagregels, aangevuld met weekregels. */
export const wegingen = (gebruikerId, vanaf) =>
	alle(
		`SELECT datum, gewicht FROM dagregels WHERE gebruiker_id = ? AND gewicht IS NOT NULL AND datum >= ?
		 UNION ALL
		 SELECT week AS datum, gewicht FROM weekregels w WHERE gebruiker_id = ? AND gewicht IS NOT NULL AND week >= ?
		   AND NOT EXISTS (SELECT 1 FROM dagregels d WHERE d.gebruiker_id = w.gebruiker_id AND d.datum = w.week AND d.gewicht IS NOT NULL)
		 ORDER BY datum`,
		gebruikerId, vanaf, gebruikerId, vanaf
	);
