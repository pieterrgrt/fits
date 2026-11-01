/*
  Hardloopsporen: GPX/TCX/FIT importeren (upload of een map op de server, ook de Strava-export),
  opslaan als vereenvoudigde lijn en koppelen aan een cardio-activiteit.

  Ruwe bestanden staan in FITS_SPOREN (standaard <FITS_DATA>/sporen):
    uploads/<gebruiker>/<hash>.gpx|.tcx|.fit  wat je via de app uploadt (uitgepakt), om later opnieuw te verwerken
    al het andere                          wordt ingelezen met "Map importeren" (Strava-export: activities/ + activities.csv)
*/
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { FITS_SPOREN } from '$app/env/private';
import { map, een, alle, doe, transactie } from './db.js';
import { lees, leesFit, isFit, samenvatting, vereenvoudig, codeer, decodeer, lokaal, stravaIndex, sleutelVan } from '#lib/spoor.js';

export const sporenMap = FITS_SPOREN ?? path.join(map, 'sporen');
const uploadMap = (gebruikerId) => path.join(sporenMap, 'uploads', String(gebruikerId));

export const MAX_GROOTTE = 50 * 1024 * 1024; // uitgepakt
const SOORTEN_MET_SPOOR = new Set(['Run', 'TrailRun', 'VirtualRun', 'Walk', 'Hike', 'Ride', 'Swim']);

/** Pakt .gz uit (herkend aan de inhoud) en geeft tekst, of { fout }. */
function uitpakken(buf, bestand) {
	try {
		if (buf[0] === 0x1f && buf[1] === 0x8b) buf = zlib.gunzipSync(buf, { maxOutputLength: MAX_GROOTTE });
	} catch {
		return { fout: 'Kon het bestand niet uitpakken.' };
	}
	if (buf.length > MAX_GROOTTE) return { fout: 'Te groot.' };
	if (isFit(buf)) return { buf, fit: true };
	return { buf, tekst: buf.toString('utf8') };
}

/** Naïeve lokale tijden ('YYYY-MM-DDTHH:MM:SS', eventueel met Z) als seconden, om te vergelijken. */
const sec = (t) => Date.parse(t.slice(0, 19) + 'Z') / 1000;

/** Bestaande activiteit (Strava of eerder ingevoerd) die binnen 2 minuten van dit begin startte. */
function zelfdeActiviteit(gebruikerId, begin) {
	const kandidaten = alle('SELECT id, begin FROM activiteiten WHERE gebruiker_id = ? AND datum = ?', gebruikerId, begin.slice(0, 10));
	return kandidaten.find((a) => Math.abs(sec(a.begin) - sec(begin)) <= 120 && !a.id.startsWith('eigen-'))?.id ?? null;
}

/**
 * Importeert één bestand.
 * @returns {{ status: 'nieuw', id: number } | { status: 'dubbel' } | { status: 'fout', fout: string, zonderGps?: boolean }}
 */
export function importeer(gebruikerId, ruw, bestand, { bron = 'upload', naam = null, soort = null, bewaren = bron === 'upload' } = {}) {
	const u = uitpakken(ruw, bestand);
	if (u.fout) return { status: 'fout', fout: u.fout };
	const hash = crypto.createHash('sha256').update(u.buf).digest('hex');
	if (een('SELECT 1 FROM sporen WHERE gebruiker_id = ? AND hash = ?', gebruikerId, hash)) return { status: 'dubbel' };

	const s = u.fit ? leesFit(u.buf) : lees(u.tekst);
	if (s.fout) return { status: 'fout', fout: s.fout };
	if (s.punten.length < 2) return { status: 'fout', fout: 'Geen GPS-punten in dit bestand.', zonderGps: true };
	const sam = samenvatting(s.punten);
	const lijn = codeer(vereenvoudig(s.punten, 5));
	const begin = sam.begin != null ? lokaal(sam.begin) : null;
	soort = soort || s.soort || 'Run';
	naam = (naam || s.naam || '').trim().slice(0, 120) || null;

	if (bewaren) {
		fs.mkdirSync(uploadMap(gebruikerId), { recursive: true });
		const ext = u.fit ? 'fit' : u.tekst.slice(0, 2000).includes('TrainingCenterDatabase') ? 'tcx' : 'gpx';
		fs.writeFileSync(path.join(uploadMap(gebruikerId), `${hash}.${ext}`), u.buf);
	}

	const id = transactie(() => {
		let activiteit = null;
		if (begin && SOORTEN_MET_SPOOR.has(soort)) {
			activiteit = zelfdeActiviteit(gebruikerId, begin);
			if (!activiteit) {
				activiteit = `spoor-${hash.slice(0, 20)}`;
				doe(
					'INSERT OR IGNORE INTO activiteiten (id, gebruiker_id, soort, naam, datum, begin, duur, afstand) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
					activiteit, gebruikerId, soort, naam, begin.slice(0, 10), begin, sam.bewegend || sam.duur, sam.afstand
				);
			}
		}
		const g = sam.grenzen;
		return doe(
			`INSERT INTO sporen (gebruiker_id, activiteit_id, hash, bron, bestand, soort, naam, begin, datum, afstand, duur, bewegend, punten, lijn, zuid, west, noord, oost)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			gebruikerId, activiteit, hash, bron, path.basename(bestand).slice(0, 200), soort, naam, begin, begin?.slice(0, 10) ?? null,
			sam.afstand, sam.duur, sam.bewegend, s.punten.length, lijn, g.zuid, g.west, g.noord, g.oost
		).lastInsertRowid;
	});
	return { status: 'nieuw', id: Number(id) };
}

const telling = () => ({ nieuw: 0, dubbel: 0, zonderGps: 0, fout: 0, fouten: [] });
function tel(t, bestand, r) {
	if (r.status === 'nieuw') t.nieuw++;
	else if (r.status === 'dubbel') t.dubbel++;
	else if (r.zonderGps) t.zonderGps++; // loopband, zwembad: geen spoor, geen fout
	else {
		t.fout++;
		if (t.fouten.length < 10) t.fouten.push(`${path.basename(bestand)}: ${r.fout}`);
	}
}

/** Importeert geüploade bestanden: [{ naam, buf }]. */
export function importeerBestanden(gebruikerId, bestanden) {
	const t = telling();
	for (const b of bestanden) tel(t, b.naam, importeer(gebruikerId, b.buf, b.naam));
	return t;
}

const LOOPBESTAND = /\.(gpx|tcx|fit)(\.gz)?$/i;

/**
 * Leest alle loopbestanden in FITS_SPOREN (behalve uploads/) in voor deze gebruiker.
 * Staat er een activities.csv naast (Strava-export), dan komen naam en soort daaruit.
 */
export function importeerMap(gebruikerId) {
	const t = telling();
	if (!fs.existsSync(sporenMap)) return { ...t, geenMap: true };
	const loop = (dir, index) => {
		const items = fs.readdirSync(dir, { withFileTypes: true });
		const csv = items.find((i) => i.isFile() && i.name.toLowerCase() === 'activities.csv');
		if (csv) index = stravaIndex(fs.readFileSync(path.join(dir, csv.name), 'utf8'));
		for (const i of items) {
			const p = path.join(dir, i.name);
			if (i.isDirectory()) {
				if (!(dir === sporenMap && i.name === 'uploads')) loop(p, index);
			} else if (i.isFile() && LOOPBESTAND.test(i.name)) {
				const info = index?.get(sleutelVan(i.name)) ?? {};
				tel(t, i.name, importeer(gebruikerId, fs.readFileSync(p), i.name, { bron: 'map', naam: info.naam, soort: info.soort }));
			}
		}
	};
	loop(sporenMap, null);
	return t;
}

export const lijst = (gebruikerId, { soort = null, max = 100 } = {}) =>
	alle(
		`SELECT id, soort, naam, begin, datum, afstand, duur, bewegend, lijn, gematcht FROM sporen WHERE gebruiker_id = ? ${soort ? 'AND soort = ?' : ''}
		 ORDER BY begin IS NULL, begin DESC, id DESC LIMIT ?`,
		...[gebruikerId, ...(soort ? [soort] : []), max]
	);

export function totalen(gebruikerId, vanafMaand) {
	return een(
		`SELECT COUNT(*) aantal, COALESCE(SUM(afstand), 0) afstand,
		        COALESCE(SUM(CASE WHEN datum >= ? THEN 1 ELSE 0 END), 0) aantalMaand, COALESCE(SUM(CASE WHEN datum >= ? THEN afstand END), 0) afstandMaand
		 FROM sporen WHERE gebruiker_id = ? AND soort IN ('Run', 'TrailRun', 'VirtualRun')`,
		vanafMaand, vanafMaand, gebruikerId
	);
}

/** Verwijdert een spoor, de activiteit die Fits erbij maakte en het geüploade bestand. */
export function verwijder(gebruikerId, id) {
	const s = een('SELECT activiteit_id, hash, zuid, west, noord, oost FROM sporen WHERE id = ? AND gebruiker_id = ?', id, gebruikerId);
	if (!s) return;
	transactie(() => {
		doe('DELETE FROM sporen WHERE id = ? AND gebruiker_id = ?', id, gebruikerId);
		// De gelopen straatstukken van dit spoor gaan mee (cascade); loopjes in hetzelfde gebied opnieuw op straten leggen,
		// zodat stukken die je ook toen liep blijven tellen.
		doe('UPDATE sporen SET gematcht = 0 WHERE gebruiker_id = ? AND gematcht = 1 AND noord >= ? AND zuid <= ? AND oost >= ? AND west <= ?', gebruikerId, s.zuid, s.noord, s.west, s.oost);
		if (s.activiteit_id?.startsWith('spoor-') && !een('SELECT 1 FROM sporen WHERE activiteit_id = ?', s.activiteit_id)) {
			doe('DELETE FROM activiteiten WHERE id = ? AND gebruiker_id = ?', s.activiteit_id, gebruikerId);
		}
	});
	for (const ext of ['gpx', 'tcx', 'fit']) fs.rmSync(path.join(uploadMap(gebruikerId), `${s.hash}.${ext}`), { force: true });
}

/** Bij het verwijderen van een account: geüploade bestanden weg (de rijen gaan mee met de gebruiker). */
export const verwijderAlles = (gebruikerId) => fs.rmSync(uploadMap(gebruikerId), { recursive: true, force: true });

export const spoor = (gebruikerId, id) =>
	een('SELECT id, soort, naam, begin, datum, afstand, duur, bewegend, punten, lijn, gematcht, bestand FROM sporen WHERE id = ? AND gebruiker_id = ?', id, gebruikerId);

/** Alle lijnen, voor de kaart. */
export const lijnen = (gebruikerId) => alle('SELECT id, lijn FROM sporen WHERE gebruiker_id = ? ORDER BY begin', gebruikerId);

/** Waar je meestal begint (voor het startpunt van een rondje): het vaakst gebruikte vak van ~200 m. */
export function gebruikelijkeStart(gebruikerId) {
	const tellen = new Map();
	for (const { lijn } of alle("SELECT lijn FROM sporen WHERE gebruiker_id = ? AND soort IN ('Run', 'TrailRun') ORDER BY begin DESC LIMIT 200", gebruikerId)) {
		const [p] = decodeer(lijn);
		if (!p) continue;
		const k = `${Math.round(p[0] * 500)}:${Math.round(p[1] * 300)}`;
		const t = tellen.get(k) ?? { n: 0, p };
		t.n++;
		tellen.set(k, t);
	}
	return [...tellen.values()].sort((a, b) => b.n - a.n)[0]?.p ?? null;
}
