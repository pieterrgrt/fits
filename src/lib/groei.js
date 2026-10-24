/*
  Rekenregels voor groei. Geen database hier, zodat alles te testen is (tests/groei.test.js).
*/
import { PER_SLUG } from './oefeningen.js';
import { dagenTussen, plusDagen } from './datum.js';

/* ---------- Kracht en records ---------- */

/** Geschat maximum voor 1 herhaling (Epley). Alleen zinvol tot ±12 reps. */
export const e1rm = (gewicht, reps) => (gewicht > 0 && reps > 0 ? gewicht * (1 + reps / 30) : 0);

/**
 * Records in een reeks sessies (oudste eerst): [{ datum, sets: [{ gewicht, reps }] }].
 * Geeft per sessie de beste set en of die een record was (hoger geschat maximum dan ooit ervoor).
 */
export function verloopMetRecords(sessies) {
	let beste = 0;
	return sessies.map((s) => {
		const top = s.sets.reduce((a, x) => (e1rm(x.gewicht, x.reps) > e1rm(a.gewicht, a.reps) ? x : a), s.sets[0] ?? { gewicht: 0, reps: 0 });
		const waarde = e1rm(top.gewicht, top.reps);
		const record = waarde > beste && beste > 0;
		if (waarde > beste) beste = waarde;
		return { datum: s.datum, gewicht: top.gewicht, reps: top.reps, e1rm: Math.round(waarde * 10) / 10, record };
	});
}

/** Is deze set een record ten opzichte van alles ervoor? */
export function isRecord(set, eerder) {
	const nu = e1rm(set.gewicht, set.reps);
	return nu > 0 && eerder.length > 0 && eerder.every((x) => e1rm(x.gewicht, x.reps) < nu);
}

/* ---------- Lichte week (deload) ---------- */

/**
 * Wanneer een lichte week voorstellen?
 * - 6 of meer trainingsweken sinds de vorige lichte week (of sinds je begon), of
 * - twee weekregels op rij met energie ≤ 4, of
 * - deze week veel signalen: 3+ oefeningen waar de laatste set niet meer lukt.
 */
export function lichteWeekAdvies({ vandaag, trainingsweken, laatsteLicht, weekregels = [], vastgelopen = 0 }) {
	const sinds = laatsteLicht ? trainingsweken.filter((w) => w > laatsteLicht).length : trainingsweken.length;
	const moe = weekregels.slice(0, 2).length === 2 && weekregels.slice(0, 2).every((w) => w.energie != null && w.energie <= 4);
	if (sinds >= 6) return { voorstel: true, reden: `Je traint ${sinds} weken achter elkaar zonder lichte week.`, sinds };
	if (moe) return { voorstel: true, reden: 'Je energie was twee weken op rij 4 of lager.', sinds };
	if (vastgelopen >= 3) return { voorstel: true, reden: `Bij ${vastgelopen} oefeningen loop je vast.`, sinds };
	return { voorstel: false, sinds };
}

/** Sets in een lichte week: de helft, naar boven afgerond. */
export const lichteSets = (sets) => Math.max(1, Math.ceil(sets / 2));

/* ---------- Gewichtstrend ---------- */

/**
 * Trend uit losse wegingen: [{ datum, gewicht }] (oudste eerst).
 * Gebruikt de wegingen van de laatste 21 dagen; kleinste-kwadratenlijn → kg per week.
 */
export function gewichtsTrend(wegingen, vandaag) {
	const recent = wegingen.filter((w) => dagenTussen(w.datum, vandaag) <= 21 && dagenTussen(w.datum, vandaag) >= 0);
	if (recent.length < 4 || dagenTussen(recent[0].datum, recent[recent.length - 1].datum) < 10) return null;
	const xs = recent.map((w) => dagenTussen(recent[0].datum, w.datum));
	const ys = recent.map((w) => w.gewicht);
	const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
	const my = ys.reduce((a, b) => a + b, 0) / ys.length;
	const helling = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / xs.reduce((a, x) => a + (x - mx) ** 2, 0);
	const perWeek = Math.round(helling * 7 * 100) / 100;
	const gem7 = recent.filter((w) => dagenTussen(w.datum, vandaag) < 7).map((w) => w.gewicht);
	return { perWeek, gemiddeld: gem7.length ? Math.round((gem7.reduce((a, b) => a + b, 0) / gem7.length) * 10) / 10 : null, metingen: recent.length };
}

/**
 * Advies op calorieën. Doel uit je schema: +2 tot +3 kg in 3 maanden ≈ 0,15–0,25 kg per week (+ wat speling).
 */
export function kcalAdvies(trend) {
	if (!trend) return null;
	if (trend.perWeek < 0.1) return { stap: 150, tekst: `Je komt ${trend.perWeek <= 0 ? 'niet aan' : `maar ${String(trend.perWeek).replace('.', ',')} kg per week aan`}. Eet 150 kcal per dag meer.` };
	if (trend.perWeek > 0.4) return { stap: -100, tekst: `Je komt ${String(trend.perWeek).replace('.', ',')} kg per week aan; meer dan nodig voor spiergroei. Eet 100 kcal per dag minder.` };
	return { stap: 0, tekst: `${String(trend.perWeek).replace('.', ',')} kg per week erbij. Precies goed voor spiergroei.` };
}

/* ---------- Schijven op de stang ---------- */

const SCHIJVEN = [25, 20, 15, 10, 5, 2.5, 1.25];

/** Welke schijven per kant voor een totaalgewicht op een stang. Geeft null als het niet precies kan. */
export function schijvenPerKant(totaal, stang = 20) {
	let rest = Math.round(((totaal - stang) / 2) * 100) / 100;
	if (rest < 0) return null;
	const uit = [];
	for (const s of SCHIJVEN) {
		while (rest >= s - 1e-9) {
			uit.push(s);
			rest = Math.round((rest - s) * 100) / 100;
		}
	}
	return rest > 0.01 ? null : uit;
}

export const gebruiktStang = (slug) => PER_SLUG[slug]?.apparaat?.startsWith('Halterstang') ?? false;

/* ---------- Herstel ---------- */

/**
 * Spiergroepen die je in de laatste 48 uur zwaar hebt getraind (6+ harde sets),
 * voor zover je ze vandaag weer wilt trainen.
 */
export function nogNietHersteld(recenteSets, vandaagGroepen, groepVan, nu = Date.now()) {
	const telling = {};
	for (const s of recenteSets) {
		const uren = (nu - Date.parse(s.gemaakt.replace(' ', 'T') + 'Z')) / 3600_000;
		if (uren > 48) continue;
		for (const g of groepVan(s.slug)) {
			telling[g] ??= { sets: 0, uren: Infinity };
			telling[g].sets++;
			telling[g].uren = Math.min(telling[g].uren, uren);
		}
	}
	return vandaagGroepen.filter((g) => telling[g]?.sets >= 6).map((g) => ({ groep: g, ...telling[g], uren: Math.round(telling[g].uren) }));
}

/* ---------- Slaap en prestaties ---------- */

/**
 * Prestatie per training: gemiddeld geschat maximum per oefening als % van je beste van de 4 weken
 * ervoor. Daarna vergeleken tussen nachten met weinig (< 7 u) en genoeg (≥ 7,5 u) slaap.
 * trainingen: [{ datum, slaap, sets: [{ slug, gewicht, reps }] }] (oudste eerst)
 */
export function slaapEnPrestatie(trainingen) {
	const beste = {}; // slug → [{ datum, waarde }]
	const scores = [];
	for (const t of trainingen) {
		const perOef = {};
		for (const s of t.sets) {
			const w = e1rm(s.gewicht, s.reps);
			if (w > (perOef[s.slug] ?? 0)) perOef[s.slug] = w;
		}
		const pct = [];
		for (const [slug, w] of Object.entries(perOef)) {
			const eerder = (beste[slug] ?? []).filter((x) => dagenTussen(x.datum, t.datum) <= 28);
			const max = Math.max(0, ...eerder.map((x) => x.waarde));
			if (max > 0) pct.push((w / max) * 100);
			(beste[slug] ??= []).push({ datum: t.datum, waarde: w });
		}
		if (pct.length && t.slaap != null) scores.push({ datum: t.datum, slaap: t.slaap, score: pct.reduce((a, b) => a + b, 0) / pct.length });
	}
	const gem = (l) => (l.length ? Math.round((l.reduce((a, x) => a + x.score, 0) / l.length) * 10) / 10 : null);
	const kort = scores.filter((x) => x.slaap < 7);
	const goed = scores.filter((x) => x.slaap >= 7.5);
	return { kort: { n: kort.length, score: gem(kort) }, goed: { n: goed.length, score: gem(goed) }, genoeg: kort.length >= 3 && goed.length >= 3 };
}

export const weekVan = (datum) => plusDagen(datum, -((new Date(datum + 'T00:00:00Z').getUTCDay() + 6) % 7));
