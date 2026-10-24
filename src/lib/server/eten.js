import crypto from 'node:crypto';
import { OFF_URL } from '$app/env/private';
import { een, alle, doe, transactie } from './db.js';
import { BASISVOEDING } from './basisvoeding.js';
import { voor, optellen, MAALTIJDEN } from '#lib/voeding.js';
import { vanOff } from '#lib/off.js';

/* ---------- Producten ---------- */

const leesProduct = (p) => p && { ...p, porties: p.porties ? JSON.parse(p.porties) : [] };

// De basislijst staat in de code; bij het opstarten komt hij (bijgewerkt) in de database.
transactie(() => {
	for (const p of BASISVOEDING) {
		doe(
			`INSERT INTO producten (id, bron, naam, eenheid, kcal, eiwit, koolh, vet, vezels, suiker, porties) VALUES (?, 'basis', ?, ?, ?, ?, ?, ?, ?, ?, ?)
			 ON CONFLICT (id) DO UPDATE SET naam = excluded.naam, eenheid = excluded.eenheid, kcal = excluded.kcal, eiwit = excluded.eiwit,
			 koolh = excluded.koolh, vet = excluded.vet, vezels = excluded.vezels, suiker = excluded.suiker, porties = excluded.porties`,
			p.id, p.naam, p.eenheid, p.kcal, p.eiwit, p.koolh, p.vet, p.vezels, p.suiker, JSON.stringify(p.porties)
		);
	}
});

/** Een product dat deze gebruiker mag zien: basis, Open Food Facts, of een eigen product. */
export const product = (gebruikerId, id) =>
	leesProduct(een('SELECT * FROM producten WHERE id = ? AND (gebruiker_id IS NULL OR gebruiker_id = ?)', id, gebruikerId));

const LIJST = 'id, bron, naam, merk, eenheid, kcal, eiwit, koolh, vet, porties';

/** Zoeken in wat er al is: basislijst, eerder gevonden merkproducten en eigen producten. Vaak gebruikt eerst. */
export function zoekLokaal(gebruikerId, q, limiet = 30) {
	const woorden = q.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 5);
	if (!woorden.length) return [];
	const waar = woorden.map(() => "(lower(naam) LIKE ? OR lower(coalesce(merk, '')) LIKE ?)").join(' AND ');
	const params = woorden.flatMap((w) => [`%${w}%`, `%${w}%`]);
	return alle(
		`SELECT ${LIJST}, (SELECT count(*) FROM eetregels e WHERE e.gebruiker_id = ? AND e.product_id = p.id) AS keer
		 FROM producten p WHERE (gebruiker_id IS NULL OR gebruiker_id = ?) AND ${waar}
		 ORDER BY keer DESC, CASE bron WHEN 'eigen' THEN 0 WHEN 'basis' THEN 1 ELSE 2 END, length(naam) LIMIT ?`,
		gebruikerId, gebruikerId, ...params, limiet
	).map(leesProduct);
}

export const recent = (gebruikerId, limiet = 25) =>
	alle(
		`SELECT ${LIJST.split(', ').map((k) => 'p.' + k).join(', ')}, max(e.gemaakt) AS laatst, e.hoeveelheid, e.portie
		 FROM eetregels e JOIN producten p ON p.id = e.product_id WHERE e.gebruiker_id = ?
		 GROUP BY p.id ORDER BY laatst DESC LIMIT ?`,
		gebruikerId, limiet
	).map(leesProduct);

export const favorieten = (gebruikerId) =>
	alle(`SELECT ${LIJST.split(', ').map((k) => 'p.' + k).join(', ')} FROM favorieten f JOIN producten p ON p.id = f.product_id WHERE f.gebruiker_id = ? ORDER BY p.naam`, gebruikerId).map(leesProduct);

export const eigenProducten = (gebruikerId) =>
	alle(`SELECT ${LIJST} FROM producten WHERE gebruiker_id = ? ORDER BY naam`, gebruikerId).map(leesProduct);

export const isFavoriet = (gebruikerId, id) => !!een('SELECT 1 FROM favorieten WHERE gebruiker_id = ? AND product_id = ?', gebruikerId, id);

export function wisselFavoriet(gebruikerId, id) {
	if (isFavoriet(gebruikerId, id)) doe('DELETE FROM favorieten WHERE gebruiker_id = ? AND product_id = ?', gebruikerId, id);
	else doe('INSERT INTO favorieten (gebruiker_id, product_id) VALUES (?, ?)', gebruikerId, id);
}

export function maakEigenProduct(gebruikerId, w) {
	const id = `eigen:${crypto.randomUUID()}`;
	doe(
		`INSERT INTO producten (id, gebruiker_id, bron, barcode, naam, merk, eenheid, kcal, eiwit, koolh, vet, vezels, suiker, porties)
		 VALUES (?, ?, 'eigen', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		id, gebruikerId, w.barcode || null, w.naam, w.merk || null, w.eenheid, w.kcal, w.eiwit, w.koolh, w.vet, w.vezels, w.suiker,
		JSON.stringify(w.porties ?? [])
	);
	return id;
}

/* ---------- Open Food Facts ---------- */

// Open Food Facts is een open database met merkproducten en barcodes (openfoodfacts.org).
// Zij vragen om een eigen User-Agent en om zuinig zoeken: max ~10 zoekopdrachten per minuut.
const OFF = OFF_URL ?? 'https://nl.openfoodfacts.org';
const AGENT = 'Fits/0.2 (https://fits.alduslab.eu)';
const VELDEN = 'code,product_name,product_name_nl,generic_name,brands,quantity,serving_size,serving_quantity,nutriments';

let zoekVenster = [];
const magZoeken = () => {
	const nu = Date.now();
	zoekVenster = zoekVenster.filter((t) => nu - t < 60_000);
	if (zoekVenster.length >= 8) return false;
	zoekVenster.push(nu);
	return true;
};

async function haal(pad) {
	const r = await fetch(OFF + pad, { headers: { 'user-agent': AGENT, accept: 'application/json' }, signal: AbortSignal.timeout(9000) });
	if (r.status === 404) return null;
	if (!r.ok) throw new Error(`Open Food Facts gaf ${r.status}`);
	return r.json();
}

function bewaar(p) {
	doe(
		`INSERT INTO producten (id, bron, barcode, naam, merk, eenheid, kcal, eiwit, koolh, vet, vezels, suiker, zout, porties)
		 VALUES (?, 'off', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		 ON CONFLICT (id) DO UPDATE SET naam = excluded.naam, merk = excluded.merk, eenheid = excluded.eenheid, kcal = excluded.kcal,
		 eiwit = excluded.eiwit, koolh = excluded.koolh, vet = excluded.vet, vezels = excluded.vezels, suiker = excluded.suiker,
		 zout = excluded.zout, porties = excluded.porties, bijgewerkt = datetime('now')`,
		p.id, p.barcode, p.naam, p.merk, p.eenheid, p.kcal, p.eiwit, p.koolh, p.vet, p.vezels, p.suiker, p.zout, JSON.stringify(p.porties)
	);
}

/** Product bij een barcode: eerst eigen producten en wat we al kennen, dan Open Food Facts. */
export async function viaBarcode(gebruikerId, code) {
	if (!/^\d{6,14}$/.test(code)) return null;
	const bekend = een(
		"SELECT * FROM producten WHERE barcode = ? AND (gebruiker_id = ? OR gebruiker_id IS NULL) ORDER BY bron = 'eigen' DESC LIMIT 1",
		code, gebruikerId
	);
	if (bekend && (bekend.bron === 'eigen' || Date.now() - Date.parse(bekend.bijgewerkt + 'Z') < 30 * 86400_000)) return leesProduct(bekend);
	const antwoord = await haal(`/api/v2/product/${code}.json?fields=${VELDEN}`);
	const p = antwoord?.status === 1 || antwoord?.product ? vanOff({ ...antwoord.product, code: antwoord.product?.code ?? code }) : null;
	if (!p) return bekend ? leesProduct(bekend) : null;
	bewaar(p);
	return p;
}

/** Zoeken in Open Food Facts (Nederlandse producten). Gevonden producten bewaren we, dan vind je ze daarna lokaal. */
export async function zoekOnline(q) {
	if (!magZoeken()) throw new Error('Even rustig: Open Food Facts staat maar een paar zoekopdrachten per minuut toe.');
	const p = new URLSearchParams({ search_terms: q, search_simple: '1', action: 'process', json: '1', page_size: '24', fields: VELDEN, sort_by: 'unique_scans_n' });
	const antwoord = await haal(`/cgi/search.pl?${p}`);
	const lijst = (antwoord?.products ?? []).map(vanOff).filter(Boolean);
	transactie(() => lijst.forEach(bewaar));
	return lijst;
}

/* ---------- Dagboek ---------- */

export function dag(gebruikerId, datum) {
	const regels = alle('SELECT * FROM eetregels WHERE gebruiker_id = ? AND datum = ? ORDER BY id', gebruikerId, datum);
	return {
		regels,
		maaltijden: MAALTIJDEN.map((m) => {
			const lijst = regels.filter((r) => r.maaltijd === m.id);
			return { ...m, regels: lijst, totaal: optellen(lijst) };
		}),
		totaal: optellen(regels)
	};
}

/** Totalen per dag over een periode: { datum: totaal } */
export function totalenPerDag(gebruikerId, van, tot) {
	const rijen = alle(
		`SELECT datum, round(sum(kcal)) AS kcal, round(sum(eiwit), 1) AS eiwit, round(sum(koolh), 1) AS koolh, round(sum(vet), 1) AS vet, count(*) AS n
		 FROM eetregels WHERE gebruiker_id = ? AND datum BETWEEN ? AND ? GROUP BY datum`,
		gebruikerId, van, tot
	);
	return Object.fromEntries(rijen.map((r) => [r.datum, r]));
}

export function voegToe(gebruikerId, { datum, maaltijd, product: p, hoeveelheid, portie }) {
	const w = voor(p, hoeveelheid);
	doe(
		`INSERT INTO eetregels (gebruiker_id, datum, maaltijd, product_id, naam, hoeveelheid, portie, kcal, eiwit, koolh, vet, vezels, suiker)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		gebruikerId, datum, maaltijd, p.id, p.merk ? `${p.naam} · ${p.merk}` : p.naam, hoeveelheid, portie ?? null,
		w.kcal ?? 0, w.eiwit ?? 0, w.koolh ?? 0, w.vet ?? 0, w.vezels, w.suiker
	);
}

export function snelToevoegen(gebruikerId, { datum, maaltijd, naam, kcal, eiwit = 0, koolh = 0, vet = 0 }) {
	doe(
		`INSERT INTO eetregels (gebruiker_id, datum, maaltijd, product_id, naam, hoeveelheid, kcal, eiwit, koolh, vet) VALUES (?, ?, ?, NULL, ?, 1, ?, ?, ?, ?)`,
		gebruikerId, datum, maaltijd, naam || 'Snel toegevoegd', kcal, eiwit, koolh, vet
	);
}

export const maaltijden = (gebruikerId) =>
	alle('SELECT * FROM maaltijden WHERE gebruiker_id = ? ORDER BY naam', gebruikerId).map((m) => {
		const items = JSON.parse(m.items);
		return { ...m, items, totaal: optellen(items) };
	});

/** Een maaltijd van een dag bewaren, bijvoorbeeld je vaste ontbijt. Waarden per portie. */
export function bewaarMaaltijd(gebruikerId, naam, regels, porties = 1) {
	const items = regels.map((r) => ({ product_id: r.product_id, naam: r.naam, hoeveelheid: r.hoeveelheid, portie: r.portie, kcal: r.kcal, eiwit: r.eiwit, koolh: r.koolh, vet: r.vet, vezels: r.vezels, suiker: r.suiker }));
	doe('INSERT INTO maaltijden (gebruiker_id, naam, porties, items) VALUES (?, ?, ?, ?)', gebruikerId, naam, porties, JSON.stringify(items));
}

/** Een bewaarde maaltijd (of een deel van een recept) in het dagboek zetten. */
export function zetMaaltijd(gebruikerId, m, { datum, maaltijd, porties = 1 }) {
	const f = porties / (m.porties || 1);
	transactie(() => {
		for (const it of m.items) {
			doe(
				`INSERT INTO eetregels (gebruiker_id, datum, maaltijd, product_id, naam, hoeveelheid, portie, kcal, eiwit, koolh, vet, vezels, suiker)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				gebruikerId, datum, maaltijd, it.product_id, it.naam, Math.round(it.hoeveelheid * f * 10) / 10,
				f === 1 ? it.portie : null, ...['kcal', 'eiwit', 'koolh', 'vet', 'vezels', 'suiker'].map((k) => (it[k] == null ? null : Math.round(it[k] * f * 10) / 10))
			);
		}
	});
}

export function kopieer(gebruikerId, { van, naar, maaltijd }) {
	doe(
		`INSERT INTO eetregels (gebruiker_id, datum, maaltijd, product_id, naam, hoeveelheid, portie, kcal, eiwit, koolh, vet, vezels, suiker)
		 SELECT gebruiker_id, ?, maaltijd, product_id, naam, hoeveelheid, portie, kcal, eiwit, koolh, vet, vezels, suiker
		 FROM eetregels WHERE gebruiker_id = ? AND datum = ? AND maaltijd = ? ORDER BY id`,
		naar, gebruikerId, van, maaltijd
	);
}

/* ---------- Vasten ---------- */

export const vastenNu = (gebruikerId) => een('SELECT * FROM vasten WHERE gebruiker_id = ? AND eind IS NULL ORDER BY id DESC LIMIT 1', gebruikerId);
export const vastenLaatst = (gebruikerId) => alle('SELECT * FROM vasten WHERE gebruiker_id = ? AND eind IS NOT NULL ORDER BY id DESC LIMIT 7', gebruikerId);
