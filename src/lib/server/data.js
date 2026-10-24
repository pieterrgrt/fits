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

/** Eerdere sessies van een oefening, nieuwste eerst: [{ training_id, datum, sets }] */
export function geschiedenis(gebruikerId, slug, { limiet = 12, behalve = null } = {}) {
	const rijen = alle(
		`SELECT s.*, t.datum FROM sets s JOIN trainingen t ON t.id = s.training_id
		 WHERE t.gebruiker_id = ? AND s.slug = ? AND t.id IN (
			SELECT t2.id FROM trainingen t2 JOIN sets s2 ON s2.training_id = t2.id
			WHERE t2.gebruiker_id = ? AND s2.slug = ? AND t2.id IS NOT ?
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

export const openTraining = (gebruikerId) =>
	een('SELECT * FROM trainingen WHERE gebruiker_id = ? AND eind IS NULL ORDER BY id DESC LIMIT 1', gebruikerId);

export const training = (gebruikerId, id) => een('SELECT * FROM trainingen WHERE id = ? AND gebruiker_id = ?', id, gebruikerId);

export const setsVan = (trainingId) => alle('SELECT * FROM sets WHERE training_id = ? ORDER BY id', trainingId);

export function startTraining(gebruikerId, dagId, datum = nu()) {
	const d = dag(gebruikerId, dagId, { opId: true });
	if (!d) return null;
	const { lastInsertRowid } = doe('INSERT INTO trainingen (gebruiker_id, dag_id, titel, datum) VALUES (?, ?, ?, ?)', gebruikerId, d.id, d.titel, datum);
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
