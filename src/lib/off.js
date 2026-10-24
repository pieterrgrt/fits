// Open Food Facts-product omzetten naar het Fits-formaat (waarden per 100 g of 100 ml).

const getal = (v) => (v === '' || v == null || !Number.isFinite(Number(v)) ? null : Math.round(Number(v) * 10) / 10);

/** Zet een Open Food Facts-product om naar ons formaat. Zonder naam of calorieën: overslaan. */
export function vanOff(p) {
	const n = p?.nutriments ?? {};
	const naam = (p?.product_name_nl || p?.product_name || p?.generic_name || '').trim();
	let kcal = getal(n['energy-kcal_100g']);
	if (kcal == null && n['energy_100g'] != null) kcal = getal(Number(n['energy_100g']) / 4.184);
	if (!naam || kcal == null || !p.code) return null;
	const vloeibaar = /\b\d+([.,]\d+)?\s*(ml|cl|l)\b/i.test(p.quantity ?? '');
	const porties = [];
	const portie = getal(p.serving_quantity);
	if (portie && portie > 0 && portie < 2000) porties.push([p.serving_size ? `portie (${p.serving_size})` : 'portie', portie]);
	const pak = /(\d+([.,]\d+)?)\s*(g|ml|cl|kg|l)\b/i.exec(p.quantity ?? '');
	if (pak) {
		const factor = { g: 1, ml: 1, cl: 10, kg: 1000, l: 1000 }[pak[3].toLowerCase()];
		const totaal = Number(pak[1].replace(',', '.')) * factor;
		if (totaal > 0 && totaal <= 1000 && totaal !== portie) porties.push(['verpakking', totaal]);
	}
	return {
		id: `off:${p.code}`,
		bron: 'off',
		barcode: String(p.code),
		naam: naam.slice(0, 120),
		merk: (p.brands ?? '').split(',')[0].trim().slice(0, 60) || null,
		eenheid: vloeibaar ? 'ml' : 'g',
		kcal,
		eiwit: getal(n.proteins_100g) ?? 0,
		koolh: getal(n.carbohydrates_100g) ?? 0,
		vet: getal(n.fat_100g) ?? 0,
		vezels: getal(n.fiber_100g),
		suiker: getal(n.sugars_100g),
		zout: getal(n.salt_100g),
		porties
	};
}

