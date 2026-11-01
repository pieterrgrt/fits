/*
  Sporen (GPS-tracks) lezen en verwerken: GPX en TCX, afstand en tijd, vereenvoudigen,
  polyline (het compacte formaat van Google/Strava) en een kleine vorm als SVG-pad.
  Geen afhankelijkheden en niets van de server, zodat het ook in de browser kan en goed te testen is.
*/

/** @typedef {{ lat: number, lon: number, tijd: number | null }} Punt  tijd in ms (UTC) of null */

const R = 6371008.8; // gemiddelde straal van de aarde in meter
const rad = (g) => (g * Math.PI) / 180;

/** Afstand tussen twee punten in meter (haversine). */
export function meters(a, b) {
	const dLat = rad(b.lat - a.lat);
	const dLon = rad(b.lon - a.lon);
	const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
	return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

// --- XML (alleen wat GPX en TCX nodig hebben; geen volledige XML-lezer) ---

const ENTITEITEN = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const ontsnap = (s) =>
	s
		.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
		.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) =>
			e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : (ENTITEITEN[e] ?? m)
		)
		.trim();

/** Inhoud van het eerste <tag> (zonder namespace-voorvoegsel) in tekst, of null. */
function eerste(tekst, tag) {
	const m = new RegExp(`<(?:\\w+:)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:\\w+:)?${tag}>`).exec(tekst);
	return m ? ontsnap(m[1]) : null;
}

const attribuut = (kop, naam) => {
	const m = new RegExp(`\\s${naam}\\s*=\\s*["']([^"']*)["']`).exec(kop);
	return m ? m[1] : null;
};

const tijdVan = (s) => {
	if (!s) return null;
	const t = Date.parse(s);
	return Number.isFinite(t) ? t : null;
};

const geldig = (p) => Number.isFinite(p.lat) && Number.isFinite(p.lon) && Math.abs(p.lat) <= 90 && Math.abs(p.lon) <= 180 && !(p.lat === 0 && p.lon === 0);

// Soorten zoals Strava ze noemt (activiteiten.soort), uit wat GPX en TCX schrijven.
const GPX_SOORT = { running: 'Run', run: 'Run', 9: 'Run', trail_running: 'TrailRun', cycling: 'Ride', biking: 'Ride', ride: 'Ride', 1: 'Ride', walking: 'Walk', walk: 'Walk', 10: 'Walk', hiking: 'Hike', hike: 'Hike', 4: 'Hike', swimming: 'Swim', swim: 'Swim' };
const TCX_SOORT = { running: 'Run', biking: 'Ride', other: null };

export function leesGpx(tekst) {
	const punten = [];
	const re = /<(?:\w+:)?trkpt\b([^>]*?)(\/>|>([\s\S]*?)<\/(?:\w+:)?trkpt>)/g;
	for (let m; (m = re.exec(tekst)); ) {
		const p = { lat: Number(attribuut(m[1], 'lat')), lon: Number(attribuut(m[1], 'lon')), tijd: m[3] ? tijdVan(eerste(m[3], 'time')) : null };
		if (geldig(p)) punten.push(p);
	}
	const trk = /<(?:\w+:)?trk\b[\s\S]*?(?=<(?:\w+:)?trkseg\b)/.exec(tekst)?.[0] ?? '';
	const type = (eerste(trk, 'type') ?? '').toLowerCase();
	return { naam: eerste(trk, 'name') ?? eerste(tekst, 'name'), soort: GPX_SOORT[type] ?? null, punten };
}

export function leesTcx(tekst) {
	const punten = [];
	const re = /<(?:\w+:)?Trackpoint\b[^>]*>([\s\S]*?)<\/(?:\w+:)?Trackpoint>/g;
	for (let m; (m = re.exec(tekst)); ) {
		const p = { lat: Number(eerste(m[1], 'LatitudeDegrees')), lon: Number(eerste(m[1], 'LongitudeDegrees')), tijd: tijdVan(eerste(m[1], 'Time')) };
		if (geldig(p)) punten.push(p);
	}
	const sport = (attribuut(/<(?:\w+:)?Activity\b[^>]*>/.exec(tekst)?.[0] ?? '', 'Sport') ?? '').toLowerCase();
	return { naam: eerste(tekst, 'Notes'), soort: TCX_SOORT[sport] ?? null, punten };
}

/** Herkent GPX of TCX aan de inhoud. Geeft { naam, soort, punten } of { fout }. */
export function lees(tekst) {
	const begin = tekst.slice(0, 2000);
	if (/<(?:\w+:)?gpx\b/.test(begin)) return leesGpx(tekst);
	if (/<(?:\w+:)?TrainingCenterDatabase\b/.test(begin)) return leesTcx(tekst);
	return { fout: 'Geen GPX- of TCX-bestand.' };
}

// --- afstand, tijd, samenvatting ---

export function afstand(punten) {
	let m = 0;
	for (let i = 1; i < punten.length; i++) m += meters(punten[i - 1], punten[i]);
	return m;
}

/**
 * Begin, duur (totaal), bewegende tijd, afstand en grenzen.
 * Bewegend: stukken waarin je minstens 0,5 m/s ging (stilstaan en pauzes tellen niet).
 */
export function samenvatting(punten) {
	let bewegend = 0;
	let zuid = 90, noord = -90, west = 180, oost = -180;
	for (let i = 0; i < punten.length; i++) {
		const p = punten[i];
		zuid = Math.min(zuid, p.lat); noord = Math.max(noord, p.lat);
		west = Math.min(west, p.lon); oost = Math.max(oost, p.lon);
		if (i && p.tijd != null && punten[i - 1].tijd != null) {
			const dt = (p.tijd - punten[i - 1].tijd) / 1000;
			if (dt > 0 && meters(punten[i - 1], p) / dt >= 0.5) bewegend += dt;
		}
	}
	const tijden = punten.map((p) => p.tijd).filter((t) => t != null);
	const begin = tijden.length ? tijden[0] : null;
	const eind = tijden.length ? tijden[tijden.length - 1] : null;
	return {
		begin,
		duur: begin != null ? Math.round((eind - begin) / 1000) : null,
		bewegend: begin != null ? Math.round(bewegend) : null,
		afstand: Math.round(afstand(punten)),
		grenzen: punten.length ? { zuid, west, noord, oost } : null
	};
}

// --- vereenvoudigen (Douglas-Peucker in meters) ---

/** Laat punten weg die minder dan `tolerantie` meter van de lijn afwijken. Begin en eind blijven. */
export function vereenvoudig(punten, tolerantie = 5) {
	if (punten.length < 3) return punten.slice();
	// Platte projectie rond het midden: ruim nauwkeurig genoeg voor een loopje.
	const lat0 = rad(punten[0].lat);
	const xy = punten.map((p) => [rad(p.lon) * Math.cos(lat0) * R, rad(p.lat) * R]);
	const houden = new Uint8Array(punten.length);
	houden[0] = houden[punten.length - 1] = 1;
	const stapel = [[0, punten.length - 1]];
	const t2 = tolerantie * tolerantie;
	while (stapel.length) {
		const [a, b] = stapel.pop();
		const [ax, ay] = xy[a], [bx, by] = xy[b];
		const dx = bx - ax, dy = by - ay;
		const l2 = dx * dx + dy * dy;
		let max = -1, imax = -1;
		for (let i = a + 1; i < b; i++) {
			const [px, py] = xy[i];
			const t = l2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2)) : 0;
			const ex = ax + t * dx - px, ey = ay + t * dy - py;
			const d2 = ex * ex + ey * ey;
			if (d2 > max) { max = d2; imax = i; }
		}
		if (max > t2) {
			houden[imax] = 1;
			stapel.push([a, imax], [imax, b]);
		}
	}
	return punten.filter((_, i) => houden[i]);
}

// --- polyline (precisie 5, zoals Google en Strava) ---

export function codeer(punten) {
	let uit = '', vLat = 0, vLon = 0;
	const getal = (n) => {
		let v = n < 0 ? ~(n << 1) : n << 1;
		while (v >= 0x20) { uit += String.fromCharCode((0x20 | (v & 0x1f)) + 63); v >>= 5; }
		uit += String.fromCharCode(v + 63);
	};
	for (const p of punten) {
		const lat = Math.round(p.lat * 1e5), lon = Math.round(p.lon * 1e5);
		getal(lat - vLat); getal(lon - vLon);
		vLat = lat; vLon = lon;
	}
	return uit;
}

/** @returns {[number, number][]} [lat, lon]-paren */
export function decodeer(lijn) {
	const uit = [];
	let i = 0, lat = 0, lon = 0;
	const getal = () => {
		let v = 0, schuif = 0, b;
		do { b = lijn.charCodeAt(i++) - 63; v |= (b & 0x1f) << schuif; schuif += 5; } while (b >= 0x20 && i <= lijn.length);
		return v & 1 ? ~(v >> 1) : v >> 1;
	};
	while (i < lijn.length) {
		lat += getal(); lon += getal();
		uit.push([lat / 1e5, lon / 1e5]);
	}
	return uit;
}

/** SVG-pad (viewBox 0 0 maat maat) van een polyline, voor een kleine vorm van het loopje. Noorden boven. */
export function svgPad(lijn, maat = 48, rand = 3) {
	const pt = decodeer(lijn);
	if (pt.length < 2) return '';
	const k = Math.cos(rad(pt[0][0]));
	const xs = pt.map(([, lon]) => lon * k), ys = pt.map(([lat]) => -lat);
	const minX = Math.min(...xs), minY = Math.min(...ys);
	const schaal = (maat - 2 * rand) / Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY, 1e-9);
	const offX = (maat - (Math.max(...xs) - minX) * schaal) / 2, offY = (maat - (Math.max(...ys) - minY) * schaal) / 2;
	let d = '', vorig = '';
	for (let i = 0; i < pt.length; i++) {
		const s = `${((xs[i] - minX) * schaal + offX).toFixed(1)} ${((ys[i] - minY) * schaal + offY).toFixed(1)}`;
		if (s !== vorig) d += (d ? 'L' : 'M') + s;
		vorig = s;
	}
	return d;
}

// --- tijd ---

/** UTC-ms als lokale tijd 'YYYY-MM-DDTHH:MM:SS' (zoals Strava start_date_local, zonder zone). */
export function lokaal(ms, tijdzone = 'Europe/Amsterdam') {
	return new Intl.DateTimeFormat('sv-SE', { timeZone: tijdzone, dateStyle: 'short', timeStyle: 'medium' }).format(new Date(ms)).replace(' ', 'T');
}

// --- CSV (activities.csv uit de Strava-export: velden tussen aanhalingstekens, met komma's en regeleinden) ---

export function leesCsv(tekst) {
	const rijen = [];
	let rij = [], veld = '', binnen = false;
	tekst = tekst.replace(/^﻿/, '');
	for (let i = 0; i < tekst.length; i++) {
		const c = tekst[i];
		if (binnen) {
			if (c === '"') {
				if (tekst[i + 1] === '"') { veld += '"'; i++; } else binnen = false;
			} else veld += c;
		} else if (c === '"') binnen = true;
		else if (c === ',') { rij.push(veld); veld = ''; }
		else if (c === '\n' || c === '\r') {
			if (c === '\r' && tekst[i + 1] === '\n') i++;
			rij.push(veld); veld = '';
			if (rij.length > 1 || rij[0] !== '') rijen.push(rij);
			rij = [];
		} else veld += c;
	}
	if (veld !== '' || rij.length) { rij.push(veld); rijen.push(rij); }
	return rijen;
}

/**
 * Uit activities.csv: per bestandsnaam (zonder map, zonder .gz) de naam en soort.
 * Kolomnamen in het Engels of Nederlands; de eerste kolom met die naam telt.
 */
export function stravaIndex(tekst) {
	const [kop, ...rijen] = leesCsv(tekst);
	if (!kop) return new Map();
	const kolom = (...namen) => kop.findIndex((k) => namen.includes(k.trim().toLowerCase()));
	const iBestand = kolom('filename', 'bestandsnaam');
	const iNaam = kolom('activity name', 'naam activiteit', 'activiteitsnaam');
	const iSoort = kolom('activity type', 'type activiteit', 'activiteitstype');
	const index = new Map();
	if (iBestand < 0) return index;
	for (const r of rijen) {
		const bestand = (r[iBestand] ?? '').trim();
		if (!bestand) continue;
		const soort = iSoort >= 0 ? (r[iSoort] ?? '').replace(/\s+/g, '') : '';
		index.set(sleutelVan(bestand), { naam: iNaam >= 0 ? r[iNaam]?.trim() || null : null, soort: soort || null });
	}
	return index;
}

/** 'activities/123.gpx.gz' → '123.gpx' */
export const sleutelVan = (bestand) => bestand.split(/[\\/]/).pop().replace(/\.gz$/i, '').toLowerCase();
