// Gewichten tonen zoals in het logboek: "2× 6 kg", "360 lbs", "–20 kg" (hulp), "zoek gewicht".

export const getal = (n) =>
	n == null ? '' : Number(n).toLocaleString('nl-NL', { maximumFractionDigits: 2 }).replace('-', '–');

export function gewichtTekst(x, { leeg = 'zoek gewicht', eenheid = true } = {}) {
	if (x?.gewicht == null) return leeg;
	if (x.gewicht === 0) return 'lichaamsgewicht';
	const e = eenheid ? ` ${x.eenheid ?? 'kg'}` : '';
	return `${x.per_stuk ? '2× ' : ''}${getal(x.gewicht)}${e}`;
}

/** Reps als "12/11/10/9" */
export const repsTekst = (sets) => sets.map((s) => s.reps).join('/');
