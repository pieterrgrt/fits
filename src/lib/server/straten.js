/*
  Straten die je kent: het wegennet uit OpenStreetMap (via Overpass) ophalen en in de database bewaren,
  je sporen op die straten leggen en ontdekrondjes maken.

  Ophalen gaat per cel van ~2 × 2 km en maar één keer; daarna werkt alles uit de eigen database.
  De publieke Overpass-servers zijn soms vol: Fits probeert dan de volgende en gaat later verder.
*/
import { OVERPASS_URL } from '$app/env/private';
import { een, alle, doe, transactie } from './db.js';
import { codeer, decodeer, vereenvoudig } from '#lib/spoor.js';
import { OVERPASS_QUERY, wegUitOsm, cellenIn, celGrenzen, celVan, rond, lengte, bemonster, gelopenSegmenten, Netwerk, ontdekrondjes } from '#lib/hardlopen/netwerk.js';

const BRONNEN = OVERPASS_URL ? [OVERPASS_URL] : ['https://overpass-api.de/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
const LOOPSOORTEN = ['Run', 'TrailRun', 'Walk', 'Hike'];

async function vraag(bron, query, signal) {
	const r = await fetch(bron, {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': 'Fits/1.0 (https://fits.alduslab.eu)' },
		body: 'data=' + encodeURIComponent(query),
		signal
	});
	if (!r.ok) throw new Error(`Overpass ${r.status}`);
	const json = await r.json();
	if (json.remark && /runtime error|timed out|out of memory/i.test(json.remark)) throw new Error(json.remark);
	return json.elements ?? [];
}

/**
 * Vraagt alle bronnen tegelijk en neemt het eerste goede antwoord (de publieke servers zijn wisselend druk).
 * Stopt uiterlijk na `ms`, zodat een verzoek nooit langer duurt dan nginx wacht.
 */
async function overpass(grenzen, ms) {
	const query = OVERPASS_QUERY(grenzen);
	const stop = new AbortController();
	const klok = setTimeout(() => stop.abort(new Error('duurde te lang')), ms);
	try {
		return await Promise.any(BRONNEN.map((b) => vraag(b, query, stop.signal)));
	} catch (e) {
		const reden = e instanceof AggregateError ? e.errors.map((x) => x?.message ?? x).join(', ') : e.message;
		throw new Error(`Het wegennet ophalen lukte niet (${reden}).`);
	} finally {
		clearTimeout(klok);
		stop.abort();
	}
}

function bewaarWegen(cel, elementen) {
	const wegen = elementen.map(wegUitOsm).filter(Boolean);
	transactie(() => {
		for (const w of wegen) {
			doe(
				'INSERT OR REPLACE INTO osm_wegen (id, naam, soort, straat, knopen, lijn, lengte) VALUES (?, ?, ?, ?, ?, ?, ?)',
				w.id, w.naam, w.soort, w.straat, JSON.stringify(w.knopen), codeer(w.punten.map(([lat, lon]) => ({ lat, lon }))), lengte(w.punten)
			);
			let zuid = 90, noord = -90, west = 180, oost = -180;
			for (const [lat, lon] of w.punten) {
				zuid = Math.min(zuid, lat); noord = Math.max(noord, lat); west = Math.min(west, lon); oost = Math.max(oost, lon);
			}
			for (const c of cellenIn({ zuid, west, noord, oost })) doe('INSERT OR IGNORE INTO osm_weg_cel (cel, weg_id) VALUES (?, ?)', c, w.id);
		}
		doe('INSERT OR REPLACE INTO osm_cellen (cel, wegen) VALUES (?, ?)', cel, wegen.length);
	});
}

const ontbrekend = (cellen) => {
	const er = new Set(alle('SELECT cel FROM osm_cellen WHERE cel IN (SELECT value FROM json_each(?))', JSON.stringify(cellen)).map((r) => r.cel));
	return cellen.filter((c) => !er.has(c));
};

let wachtrij = Promise.resolve();
/**
 * Haalt ontbrekende cellen op, de dichtstbijzijnde eerst, zolang er tijd is (één verzoek tegelijk voor de hele server).
 * @returns {Promise<{ over: number }>} hoeveel cellen nog ontbreken
 */
export function haalCellen(cellen, { tijd = 8_000, perCel = 38_000 } = {}) {
	const begin = Date.now(); // vanaf nu, ook als er eerst een ander verzoek moet afronden
	const klus = wachtrij.then(async () => {
		let over = ontbrekend(cellen);
		// Een nieuwe cel alleen beginnen als er nog tijd is; één cel mag hooguit `perCel` duren.
		while (over.length && Date.now() - begin < tijd) {
			const cel = over[0];
			bewaarWegen(cel, await overpass(celGrenzen(cel), perCel));
			over = over.slice(1);
		}
		return { over: over.length };
	});
	wachtrij = klus.catch(() => {});
	return klus;
}

/** Alle wegen in deze cellen, met punten. */
export function wegenIn(cellen) {
	return alle(
		'SELECT id, naam, soort, straat, knopen, lijn FROM osm_wegen WHERE id IN (SELECT weg_id FROM osm_weg_cel WHERE cel IN (SELECT value FROM json_each(?)))',
		JSON.stringify(cellen)
	).map((w) => ({ id: w.id, naam: w.naam, soort: w.soort, straat: w.straat, knopen: JSON.parse(w.knopen), punten: decodeer(w.lijn) }));
}

/** Cellen die een spoor raakt (met 30 m marge, zodat een straat net over de grens ook meedoet). */
function cellenVanSpoor(punten) {
	const s = new Set();
	for (const [lat, lon] of bemonster(punten, 50)) for (const c of cellenIn(rond(lat, lon, 30))) s.add(c);
	return [...s];
}

const MAX_CELLEN_PER_SPOOR = 60;

/**
 * Legt sporen die nog niet op straten liggen op het wegennet. Haalt zo nodig eerst OSM op.
 * @returns {Promise<{ gedaan: number, over: number, fout?: string }>}
 */
export async function werkBij(gebruikerId, { tijd = 8_000 } = {}) {
	const begin = Date.now();
	const sporen = alle(
		`SELECT id, lijn, datum FROM sporen WHERE gebruiker_id = ? AND gematcht = 0 AND soort IN (SELECT value FROM json_each(?)) ORDER BY begin DESC`,
		gebruikerId, JSON.stringify(LOOPSOORTEN)
	);
	let gedaan = 0, fout;
	for (const s of sporen) {
		if (Date.now() - begin > 30_000) break; // de rest in een volgende ronde
		const punten = decodeer(s.lijn);
		const cellen = cellenVanSpoor(punten);
		if (cellen.length > MAX_CELLEN_PER_SPOOR) {
			doe('UPDATE sporen SET gematcht = 2 WHERE id = ?', s.id);
			continue;
		}
		if (ontbrekend(cellen).length) {
			const rest = tijd - (Date.now() - begin);
			if (rest <= 0) break;
			try {
				if ((await haalCellen(cellen, { tijd: rest })).over) break;
			} catch (e) {
				fout = e.message;
				break;
			}
		}
		const segmenten = gelopenSegmenten(wegenIn(cellen), punten);
		transactie(() => {
			for (const [sleutel, l] of segmenten) {
				const [weg, seg] = sleutel.split(':').map(Number);
				// Het vroegste loopje over een stuk is het loopje waarop het nieuw was.
				doe(
					`INSERT INTO gelopen (gebruiker_id, weg_id, seg, lengte, spoor_id, datum) VALUES (?, ?, ?, ?, ?, ?)
					 ON CONFLICT (gebruiker_id, weg_id, seg) DO UPDATE SET spoor_id = excluded.spoor_id, datum = excluded.datum
					 WHERE gelopen.spoor_id IS NULL OR COALESCE(excluded.datum, '9999') < COALESCE(gelopen.datum, '9999')`,
					gebruikerId, weg, seg, l, s.id, s.datum
				);
			}
			doe('UPDATE sporen SET gematcht = 1 WHERE id = ?', s.id);
		});
		gedaan++;
	}
	const over = een(`SELECT COUNT(*) n FROM sporen WHERE gebruiker_id = ? AND gematcht = 0 AND soort IN (SELECT value FROM json_each(?))`, gebruikerId, JSON.stringify(LOOPSOORTEN)).n;
	return { gedaan, over, fout };
}

/** Hoeveel van de straten in jouw gebied (de cellen waar je liep) je kent. */
export function dekking(gebruikerId) {
	const r = een(
		`WITH c AS (SELECT DISTINCT wc.cel FROM gelopen g JOIN osm_weg_cel wc ON wc.weg_id = g.weg_id WHERE g.gebruiker_id = ?),
		      w AS (SELECT DISTINCT weg_id FROM osm_weg_cel WHERE cel IN (SELECT cel FROM c))
		 SELECT (SELECT COUNT(*) FROM c) cellen,
		        (SELECT COALESCE(SUM(lengte), 0) FROM osm_wegen WHERE straat = 1 AND id IN (SELECT weg_id FROM w)) totaal,
		        (SELECT COUNT(DISTINCT naam) FROM osm_wegen WHERE straat = 1 AND naam IS NOT NULL AND id IN (SELECT weg_id FROM w)) namen`,
		gebruikerId
	);
	const g = een(
		`SELECT COALESCE(SUM(g.lengte), 0) gelopen, COUNT(DISTINCT w.naam) namen FROM gelopen g JOIN osm_wegen w ON w.id = g.weg_id
		 WHERE g.gebruiker_id = ? AND w.straat = 1`,
		gebruikerId
	);
	return { cellen: r.cellen, totaal: r.totaal, gelopen: g.gelopen, namen: r.namen, namenGelopen: g.namen };
}

/** Nieuwe meters straat per spoor (het loopje waarop een stuk voor het eerst gelopen werd). */
export function nieuwPerSpoor(gebruikerId) {
	return new Map(
		alle(
			`SELECT g.spoor_id id, SUM(g.lengte) m FROM gelopen g JOIN osm_wegen w ON w.id = g.weg_id
			 WHERE g.gebruiker_id = ? AND w.straat = 1 GROUP BY g.spoor_id`,
			gebruikerId
		).map((r) => [r.id, r.m])
	);
}

/** Straatnamen die met dit loopje nieuw waren. */
export const nieuweStraten = (gebruikerId, spoorId) =>
	alle(
		`SELECT w.naam, SUM(g.lengte) m FROM gelopen g JOIN osm_wegen w ON w.id = g.weg_id
		 WHERE g.gebruiker_id = ? AND g.spoor_id = ? AND w.straat = 1 AND w.naam IS NOT NULL GROUP BY w.naam HAVING m >= 50 ORDER BY m DESC`,
		gebruikerId, spoorId
	);

/** Het gebied dat nodig is voor een rondje van `doel` meter vanaf (lat, lon). */
export const cellenVoorRondje = (lat, lon, doel) => {
	const cellen = cellenIn(rond(lat, lon, doel * 0.33 + 300));
	const [ci, cj] = celVan(lat, lon).split(':').map(Number);
	// De dichtstbijzijnde eerst ophalen.
	return cellen.sort((a, b) => {
		const [ai, aj] = a.split(':').map(Number), [bi, bj] = b.split(':').map(Number);
		return Math.hypot(ai - ci, aj - cj) - Math.hypot(bi - ci, bj - cj);
	});
};

/**
 * Ontdekrondjes vanaf (lat, lon). Haalt eerst het wegennet op als dat er nog niet is;
 * lukt dat niet binnen de tijd, dan { laden: { klaar, totaal } } en vraag je het opnieuw.
 */
export async function rondjes(gebruikerId, lat, lon, doel, { tijd = 8_000 } = {}) {
	const cellen = cellenVoorRondje(lat, lon, doel);
	let over, fout;
	try {
		({ over } = await haalCellen(cellen, { tijd }));
	} catch (e) {
		over = ontbrekend(cellen).length;
		fout = e.message;
	}
	if (over) return { laden: { klaar: cellen.length - over, totaal: cellen.length, fout } };
	const net = new Netwerk(wegenIn(cellen));
	const gelopen = new Set(alle('SELECT weg_id, seg FROM gelopen WHERE gebruiker_id = ?', gebruikerId).map((r) => `${r.weg_id}:${r.seg}`));
	const lijn = (punten) => codeer(vereenvoudig(punten.map(([la, lo]) => ({ lat: la, lon: lo })), 2));
	return {
		rondjes: ontdekrondjes(net, [lat, lon], doel, gelopen).map((r) => ({
			lengte: r.lengte,
			nieuw: r.nieuw,
			dubbel: r.dubbel,
			lijn: lijn(r.punten),
			stukken: r.stukken.map((s) => ({ nieuw: s.nieuw, lijn: lijn(s.punten) }))
		}))
	};
}
