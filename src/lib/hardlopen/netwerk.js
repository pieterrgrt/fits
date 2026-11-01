/*
  Het wegennet voor hardlopen (uit OpenStreetMap) en wat Fits ermee doet:
  - welke straatstukken je al liep (sporen op straten leggen),
  - routeren (A*) en ontdekrondjes maken: een rondje vanaf je startpunt over zoveel mogelijk nieuwe stukken.
  Puur rekenwerk, zonder database of netwerk; de server levert de wegen (src/lib/server/straten.js).

  Een weg: { id, naam, soort, straat, knopen: [osm-knoop-id…], punten: [[lat, lon]…] }
  Een segment: het stuk tussen knopen[i] en knopen[i + 1], aangeduid als `${weg}:${i}`.
*/
import { meters } from '#lib/spoor.js';

// --- cellen: het gebied in vakken van ~2 × 2 km, zodat Fits elk stuk OSM maar één keer ophaalt ---

export const CEL_LAT = 0.02;
export const CEL_LON = 0.03;
const celIndex = (lat, lon) => [Math.floor(lat / CEL_LAT), Math.floor(lon / CEL_LON)];
export const celVan = (lat, lon) => celIndex(lat, lon).join(':');
export function celGrenzen(cel) {
	const [i, j] = cel.split(':').map(Number);
	return { zuid: +(i * CEL_LAT).toFixed(6), west: +(j * CEL_LON).toFixed(6), noord: +((i + 1) * CEL_LAT).toFixed(6), oost: +((j + 1) * CEL_LON).toFixed(6) };
}
/** Alle cellen die dit gebied raken. */
export function cellenIn({ zuid, west, noord, oost }) {
	const [i0, j0] = celIndex(zuid, west), [i1, j1] = celIndex(noord, oost);
	const uit = [];
	for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) uit.push(`${i}:${j}`);
	return uit;
}
/** Gebied van `straal` meter rond een punt. */
export function rond(lat, lon, straal) {
	const dLat = straal / 111_320, dLon = straal / (111_320 * Math.cos((lat * Math.PI) / 180));
	return { zuid: lat - dLat, west: lon - dLon, noord: lat + dLat, oost: lon + dLon };
}

// --- OSM-wegen: welke je mag hardlopen en welke als "straat" meetellen ---

const SOORTEN = new Set(['footway', 'path', 'pedestrian', 'living_street', 'residential', 'unclassified', 'tertiary', 'tertiary_link', 'secondary', 'secondary_link', 'primary', 'primary_link', 'track', 'service', 'cycleway', 'steps', 'bridleway', 'road']);
/** Kosten per meter (lager = liever). Paden en woonstraten zijn fijn, grote wegen en trappen minder. */
const FACTOR = { footway: 0.9, path: 0.85, pedestrian: 0.9, track: 0.85, living_street: 0.9, bridleway: 0.9, residential: 1, unclassified: 1, road: 1, service: 1.25, cycleway: 1.2, tertiary: 1.15, tertiary_link: 1.2, secondary: 1.35, secondary_link: 1.4, primary: 1.7, primary_link: 1.7, steps: 2.5 };

/** De Overpass-query voor alle beloopbare wegen in een gebied. */
export const OVERPASS_QUERY = ({ zuid, west, noord, oost }) =>
	`[out:json][timeout:90];way["highway"~"^(${[...SOORTEN].join('|')})$"](${zuid},${west},${noord},${oost});out body geom;`;

/** Zet een OSM-weg (Overpass `out geom`) om, of null als je er niet mag of wilt lopen. */
export function wegUitOsm(e) {
	const t = e.tags ?? {};
	if (e.type !== 'way' || !SOORTEN.has(t.highway) || !e.nodes || !e.geometry || e.nodes.length !== e.geometry.length || e.nodes.length < 2) return null;
	const voet = t.foot ?? '';
	if (['no', 'use_sidepath', 'private'].includes(voet)) return null;
	if (['private', 'no'].includes(t.access) && !['yes', 'designated', 'permissive'].includes(voet)) return null;
	if (t.highway === 'service' && ['parking_aisle', 'driveway', 'drive-through'].includes(t.service)) return null;
	if (t.area === 'yes') return null;
	// Telt mee als "straat" voor je dekking: echte straten en paden, geen stoepen, oversteken of parkeerweggetjes.
	const straat = !['service', 'steps', 'cycleway'].includes(t.highway) && !['sidewalk', 'crossing', 'traffic_island', 'access_aisle'].includes(t.footway) && t.path !== 'sidewalk' ? 1 : 0;
	return { id: e.id, naam: t.name ?? null, soort: t.highway, straat, knopen: e.nodes, punten: e.geometry.map((g) => [g.lat, g.lon]) };
}

const m = (a, b) => meters({ lat: a[0], lon: a[1] }, { lat: b[0], lon: b[1] });

export function lengte(punten) {
	let l = 0;
	for (let i = 1; i < punten.length; i++) l += m(punten[i - 1], punten[i]);
	return l;
}

/** Punten om de `stap` meter langs een lijn ([[lat, lon]…]), begin en eind inbegrepen. */
export function bemonster(punten, stap = 10) {
	if (!punten.length) return [];
	const uit = [punten[0]];
	let rest = 0;
	for (let i = 1; i < punten.length; i++) {
		const a = punten[i - 1], b = punten[i];
		const d = m(a, b);
		let t = stap - rest;
		while (t < d) {
			const f = t / d;
			uit.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
			t += stap;
		}
		rest = d - (t - stap);
	}
	const laatste = punten[punten.length - 1];
	if (uit[uit.length - 1] !== laatste) uit.push(laatste);
	return uit;
}

// --- snel zoeken: punten in een raster van ~30 m ---

const RASTER = 0.0003;
export class PuntIndex {
	constructor(punten = []) {
		this.vakken = new Map();
		for (const p of punten) this.voeg(p);
	}
	sleutel(lat, lon) { return `${Math.floor(lat / RASTER)}:${Math.floor(lon / (RASTER * 1.6))}`; }
	voeg(p, waarde = p) {
		const k = this.sleutel(p[0], p[1]);
		let v = this.vakken.get(k);
		if (!v) this.vakken.set(k, (v = []));
		v.push([p, waarde]);
	}
	/** Dichtstbijzijnde waarde binnen `max` meter (max ≤ ~30 m), of null. */
	dichtbij(p, max) {
		const i = Math.floor(p[0] / RASTER), j = Math.floor(p[1] / (RASTER * 1.6));
		let beste = null, bd = max;
		for (let di = -1; di <= 1; di++)
			for (let dj = -1; dj <= 1; dj++)
				for (const [q, w] of this.vakken.get(`${i + di}:${j + dj}`) ?? []) {
					const d = m(p, q);
					if (d <= bd) { bd = d; beste = w; }
				}
		return beste;
	}
}

/**
 * Welke segmenten van deze wegen liep je met dit spoor? Een segment telt als minstens 70% van de punten
 * erlangs (om de 10 m) binnen 20 m van je spoor ligt.
 * @param wegen  [{ id, punten }]
 * @param spoor  [[lat, lon]…] (mag vereenvoudigd zijn)
 * @returns Map<'weg:seg', lengte in meter>
 */
export function gelopenSegmenten(wegen, spoor, { afstand = 20, deel = 0.7 } = {}) {
	const index = new PuntIndex(bemonster(spoor, 8));
	const uit = new Map();
	for (const w of wegen) {
		for (let s = 0; s < w.punten.length - 1; s++) {
			const stuk = bemonster([w.punten[s], w.punten[s + 1]], 10);
			let raak = 0;
			for (const p of stuk) if (index.dichtbij(p, afstand)) raak++;
			if (raak / stuk.length >= deel) uit.set(`${w.id}:${s}`, m(w.punten[s], w.punten[s + 1]));
		}
	}
	return uit;
}

// --- graaf en routeren ---

export class Netwerk {
	/** @param wegen [{ id, soort, knopen, punten }] — dezelfde weg twee keer is geen probleem */
	constructor(wegen) {
		this.knopen = new Map(); // osm-id → { p: [lat, lon], uit: [randIndex…] }
		this.randen = []; // { a, b, l, weg, seg, f }
		const gezien = new Set();
		for (const w of wegen) {
			if (gezien.has(w.id)) continue;
			gezien.add(w.id);
			const f = FACTOR[w.soort] ?? 1.2;
			for (let i = 0; i < w.knopen.length; i++) {
				if (!this.knopen.has(w.knopen[i])) this.knopen.set(w.knopen[i], { p: w.punten[i], uit: [] });
				if (i === 0 || w.knopen[i] === w.knopen[i - 1]) continue;
				const r = { a: w.knopen[i - 1], b: w.knopen[i], l: m(w.punten[i - 1], w.punten[i]), weg: w.id, seg: i - 1, f, straat: w.straat ?? 1 };
				const idx = this.randen.push(r) - 1;
				this.knopen.get(r.a).uit.push(idx);
				this.knopen.get(r.b).uit.push(idx);
			}
		}
		this.index = new PuntIndex();
		for (const [id, k] of this.knopen) if (k.uit.length) this.index.voeg(k.p, id);
	}

	/** Dichtstbijzijnde knoop (zoekt steeds wijder, tot ~1 km). */
	dichtsteKnoop(p) {
		const k = this.index.dichtbij(p, 30);
		if (k != null) return k;
		let beste = null, bd = 1000;
		for (const [id, kn] of this.knopen) {
			if (!kn.uit.length) continue;
			const d = m(p, kn.p);
			if (d < bd) { bd = d; beste = id; }
		}
		return beste;
	}

	/**
	 * Kortste (goedkoopste) route met A*.
	 * @param kosten (rand, randIndex) → kosten per meter, ≥ minFactor
	 * @returns { randen: [randIndex…], knopen: [id…], l } of null
	 */
	route(van, naar, kosten = (r) => r.f, minFactor = 0.5) {
		if (van === naar) return { randen: [], knopen: [van], l: 0 };
		const doel = this.knopen.get(naar).p;
		const h = (id) => m(this.knopen.get(id).p, doel) * minFactor;
		const g = new Map([[van, 0]]);
		const via = new Map();
		const heap = new Heap();
		heap.push(h(van), van);
		const klaar = new Set();
		while (heap.size) {
			const id = heap.pop();
			if (id === naar) break;
			if (klaar.has(id)) continue;
			klaar.add(id);
			const gi = g.get(id);
			for (const ri of this.knopen.get(id).uit) {
				const r = this.randen[ri];
				const ander = r.a === id ? r.b : r.a;
				if (klaar.has(ander)) continue;
				const ng = gi + r.l * kosten(r, ri);
				if (ng < (g.get(ander) ?? Infinity)) {
					g.set(ander, ng);
					via.set(ander, [id, ri]);
					heap.push(ng + h(ander), ander);
				}
			}
		}
		if (!via.has(naar)) return null;
		const randen = [], knopen = [naar];
		let l = 0;
		for (let k = naar; k !== van; ) {
			const [vorig, ri] = via.get(k);
			randen.push(ri);
			knopen.push(vorig);
			l += this.randen[ri].l;
			k = vorig;
		}
		return { randen: randen.reverse(), knopen: knopen.reverse(), l };
	}

	/** De punten van een reeks knopen. */
	lijn(knopen) {
		return knopen.map((k) => this.knopen.get(k).p);
	}
}

class Heap {
	constructor() { this.a = []; }
	get size() { return this.a.length; }
	push(prio, w) {
		const a = this.a;
		a.push([prio, w]);
		for (let i = a.length - 1; i > 0; ) {
			const o = (i - 1) >> 1;
			if (a[o][0] <= a[i][0]) break;
			[a[o], a[i]] = [a[i], a[o]];
			i = o;
		}
	}
	pop() {
		const a = this.a, top = a[0], last = a.pop();
		if (a.length) {
			a[0] = last;
			for (let i = 0; ; ) {
				const l = 2 * i + 1, r = l + 1;
				let k = i;
				if (l < a.length && a[l][0] < a[k][0]) k = l;
				if (r < a.length && a[r][0] < a[k][0]) k = r;
				if (k === i) break;
				[a[k], a[i]] = [a[i], a[k]];
				i = k;
			}
		}
		return top[1];
	}
}

// --- ontdekrondjes ---

/** Punt op `afstand` meter in richting `graden` (0 = noord, 90 = oost). */
export function verplaats([lat, lon], afstand, graden) {
	const r = (graden * Math.PI) / 180;
	return [lat + (afstand * Math.cos(r)) / 111_320, lon + (afstand * Math.sin(r)) / (111_320 * Math.cos((lat * Math.PI) / 180))];
}

/**
 * Een rondje in één richting: start → drie tussenpunten op een cirkel → start.
 * Stukken die je al liep kosten meer (je krijgt liever nieuwe), stukken die al in dit rondje zitten nog veel meer
 * (geen heen-en-terug).
 */
function rondjeIn(net, startKnoop, straal, richting, gelopen, opties) {
	const start = net.knopen.get(startKnoop).p;
	const midden = verplaats(start, straal, richting);
	const tussen = [-90, 0, 90].map((h) => verplaats(midden, straal, richting + h));
	const punten = [startKnoop, ...tussen.map((p) => net.dichtsteKnoop(p)), startKnoop];
	if (punten.some((p) => p == null)) return null;
	const gebruikt = new Map();
	const kosten = (r, ri) => r.f * (gelopen.has(`${r.weg}:${r.seg}`) ? opties.bekend : 1) * (gebruikt.has(ri) ? opties.herhaal : 1);
	const randen = [], knopen = [startKnoop];
	for (let i = 1; i < punten.length; i++) {
		const r = net.route(punten[i - 1], punten[i], kosten, 0.5);
		if (!r) return null;
		for (const ri of r.randen) {
			randen.push(ri);
			gebruikt.set(ri, (gebruikt.get(ri) ?? 0) + 1);
		}
		knopen.push(...r.knopen.slice(1));
	}
	return beoordeel(net, randen, knopen, gelopen);
}

/** Lengte, nieuwe meters en hoeveel van het rondje dubbel gaat. */
export function beoordeel(net, randen, knopen, gelopen) {
	let l = 0, nieuw = 0, dubbel = 0;
	const gezien = new Set();
	for (const ri of randen) {
		const r = net.randen[ri];
		l += r.l;
		if (gezien.has(ri)) dubbel += r.l;
		else if (!gelopen.has(`${r.weg}:${r.seg}`)) nieuw += r.l;
		gezien.add(ri);
	}
	const punten = net.lijn(knopen);
	// Stukken nieuw/bekend, om ze op de kaart verschillend te tekenen. Rand i loopt van punten[i] naar punten[i + 1].
	const stukken = [];
	randen.forEach((ri, i) => {
		const r = net.randen[ri];
		const isNieuw = !gelopen.has(`${r.weg}:${r.seg}`);
		const laatste = stukken.at(-1);
		if (laatste?.nieuw === isNieuw) laatste.punten.push(punten[i + 1]);
		else stukken.push({ nieuw: isNieuw, punten: [punten[i], punten[i + 1]] });
	});
	return { lengte: l, nieuw, dubbel, randen, punten, stukken };
}

/**
 * Ontdekrondjes vanaf `start` ([lat, lon]) van ongeveer `doel` meter.
 * Probeert `richtingen` richtingen, stelt per richting de cirkel bij tot de lengte klopt,
 * en geeft de beste (meeste nieuw, lengte binnen ~10%, weinig dubbel) terug.
 * @param gelopen Set<'weg:seg'>
 * @returns [{ lengte, nieuw, dubbel, richting, punten, stukken: [{ nieuw, punten }] }] beste eerst
 */
export function ontdekrondjes(net, start, doel, gelopen = new Set(), { richtingen = 8, aantal = 3, bekend = 2, herhaal = 5, pogingen = 3 } = {}) {
	const startKnoop = net.dichtsteKnoop(start);
	if (startKnoop == null) return [];
	const opties = { bekend, herhaal };
	const kandidaten = [];
	for (let k = 0; k < richtingen; k++) {
		const richting = (360 / richtingen) * k;
		let straal = doel / 7; // vier hoeken op een cirkel ≈ 5,7 × de straal, plus omwegen langs echte straten
		let beste = null;
		for (let p = 0; p < pogingen; p++) {
			const r = rondjeIn(net, startKnoop, straal, richting, gelopen, opties);
			if (!r || r.lengte < 1) break;
			const fout = Math.abs(r.lengte - doel) / doel;
			if (!beste || fout < beste.fout) beste = { ...r, fout, richting };
			if (fout < 0.05) break;
			straal *= Math.min(1.8, Math.max(0.5, doel / r.lengte));
		}
		if (beste) kandidaten.push(beste);
	}
	const score = (r) => r.nieuw / r.lengte - 2 * Math.max(0, r.fout - 0.08) - 1.5 * (r.dubbel / r.lengte);
	kandidaten.sort((a, b) => score(b) - score(a));
	// Niet drie keer bijna hetzelfde rondje: richtingen minstens 60° uit elkaar.
	const gekozen = [];
	for (const c of kandidaten) {
		if (gekozen.length >= aantal) break;
		if (gekozen.every((g) => Math.min(Math.abs(g.richting - c.richting), 360 - Math.abs(g.richting - c.richting)) >= 60)) gekozen.push(c);
	}
	return gekozen.map(({ lengte, nieuw, dubbel, richting, punten, stukken }) => ({ lengte: Math.round(lengte), nieuw: Math.round(nieuw), dubbel: Math.round(dubbel), richting, punten, stukken }));
}
