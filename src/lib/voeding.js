// Rekenwerk voor het eetdagboek. Geen database hier, zodat het te testen is (tests/voeding.test.js).

export const MAALTIJDEN = [
	{ id: 'ontbijt', naam: 'Ontbijt' },
	{ id: 'lunch', naam: 'Lunch' },
	{ id: 'avond', naam: 'Avondeten' },
	{ id: 'tussendoor', naam: 'Tussendoor' }
];
export const VELDEN = ['kcal', 'eiwit', 'koolh', 'vet', 'vezels', 'suiker'];

/** Voedingswaarden voor een hoeveelheid (gram of ml) van een product met waarden per 100. */
export function voor(product, hoeveelheid) {
	const f = hoeveelheid / 100;
	const uit = {};
	for (const v of VELDEN) uit[v] = product[v] == null ? null : Math.round(product[v] * f * 10) / 10;
	return uit;
}

export function optellen(regels) {
	const t = Object.fromEntries(VELDEN.map((v) => [v, 0]));
	for (const r of regels) for (const v of VELDEN) t[v] += r[v] ?? 0;
	for (const v of VELDEN) t[v] = Math.round(t[v] * 10) / 10;
	return t;
}

/**
 * Doelen per dag. Uit het schema: eiwit 1,8–2 g per kg, calorieën +300–500 boven onderhoud.
 * Vet standaard 25% van de calorieën, koolhydraten de rest.
 */
export function doelen({ gewicht, onderhoud, doel_kcal, macro, doel_water } = {}) {
	const kcal = doel_kcal ?? (onderhoud ? onderhoud + 400 : gewicht ? Math.round((gewicht * 33 + 400) / 10) * 10 : 2600);
	const bereik = onderhoud && !doel_kcal ? [onderhoud + 300, onderhoud + 500] : [kcal - 100, kcal + 100];
	const eiwit = gewicht ? [Math.round(gewicht * 1.8), Math.round(gewicht * 2)] : [140, 155];
	const vetProcent = macro?.vet ?? 25;
	const vet = Math.round((kcal * vetProcent) / 100 / 9);
	const koolh = Math.max(0, Math.round((kcal - eiwit[1] * 4 - vet * 9) / 4));
	return { kcal, bereik, eiwit, vet, koolh, vetProcent, water: doel_water ?? 2500, geschat: !onderhoud && !doel_kcal };
}

/** "2 × snee (70 g)" of "150 g" */
export function portieTekst(aantal, portie, gram, eenheid = 'g') {
	const g = `${Math.round(gram)} ${eenheid}`;
	if (!portie) return g;
	const a = Number.isInteger(aantal) ? aantal : String(aantal).replace('.', ',');
	return `${a} × ${portie} (${g})`;
}
