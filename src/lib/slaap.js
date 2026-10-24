/*
  Slaap uit Apple Gezondheid. De opdracht (Shortcut) op je iPhone stuurt de slaapmetingen als regels:
    2026-10-24T00:12:00+02:00|2026-10-24T03:40:00+02:00|Kern
  Dit bestand rekent daar één nacht van: welke datum, hoeveel echt geslapen, en per fase.
*/

const UUR = 3600_000;
const datumIn = (ms, tz = 'Europe/Amsterdam') =>
	new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));

function fase(waarde) {
	const w = (waarde ?? '').toLowerCase();
	if (/in bed|inbed/.test(w)) return 'bed';
	if (/wakker|awake/.test(w)) return 'wakker';
	if (/diep|deep/.test(w)) return 'diep';
	if (/rem/.test(w)) return 'rem';
	if (/kern|core|licht|light/.test(w)) return 'kern';
	return 'slaap'; // "Slapend" / "Asleep" zonder fase (oudere apparaten)
}

/** Overlappende stukken samenvoegen (Watch en iPhone meten soms allebei). */
function samenvoegen(stukken) {
	const gesorteerd = [...stukken].sort((a, b) => a.van - b.van);
	const uit = [];
	for (const s of gesorteerd) {
		const laatste = uit[uit.length - 1];
		if (laatste && s.van <= laatste.tot) laatste.tot = Math.max(laatste.tot, s.tot);
		else uit.push({ ...s });
	}
	return uit;
}
const minuten = (stukken) => Math.round(samenvoegen(stukken).reduce((a, s) => a + (s.tot - s.van), 0) / 60000);

export function leesRegels(tekst) {
	return String(tekst ?? '')
		.split(/\r?\n/)
		.map((r) => r.trim())
		.filter(Boolean)
		.map((r) => {
			const [van, tot, waarde = ''] = r.split('|').map((x) => x.trim());
			return { van: Date.parse(van), tot: Date.parse(tot), fase: fase(waarde) };
		})
		.filter((s) => Number.isFinite(s.van) && Number.isFinite(s.tot) && s.tot > s.van && s.tot - s.van < 16 * UUR);
}

/**
 * Eén nacht uit losse metingen. Stukken met minder dan 2 uur ertussen horen bij dezelfde nacht;
 * de laatste nacht telt. De datum is de dag waarop je wakker werd.
 */
export function nacht(stukken) {
	const slaap = stukken.filter((s) => s.fase !== 'bed' && s.fase !== 'wakker');
	if (!slaap.length) return null;
	const blokken = samenvoegen(slaap);
	let begin = blokken.length - 1;
	while (begin > 0 && blokken[begin].van - blokken[begin - 1].tot < 2 * UUR) begin--;
	const van = blokken[begin].van;
	const tot = blokken[blokken.length - 1].tot;
	const binnen = (s) => s.tot > van && s.van < tot;
	const deze = slaap.filter(binnen);
	const fasen = {};
	for (const f of ['diep', 'kern', 'rem', 'slaap']) {
		const m = minuten(deze.filter((s) => s.fase === f));
		if (m) fasen[f] = m;
	}
	const wakker = minuten(stukken.filter((s) => s.fase === 'wakker' && binnen(s)));
	if (wakker) fasen.wakker = wakker;
	return { datum: datumIn(tot), minuten: minuten(deze), van, tot, fasen };
}
