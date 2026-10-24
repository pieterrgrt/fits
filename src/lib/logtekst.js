// Een training als tekst, zoals het logboek in het oorspronkelijke document:
//   11 sep — Push A
//   Bench 40: 12/11/10/9
import { mooi } from './datum.js';
import { oefening } from './oefeningen.js';
import { getal } from './gewicht.js';

export function logTekst(t, groepen) {
	const regels = [`${mooi(t.datum)} — ${t.titel}`];
	for (const g of groepen) {
		const o = oefening(g.slug);
		const s = g.sets[0];
		const gewicht = s.gewicht == null || s.gewicht === 0 ? '' : ` ${getal(s.gewicht)}${s.eenheid === 'lbs' ? ' lbs' : ''}`;
		regels.push(`${o?.kort ?? g.slug}${gewicht}: ${g.sets.map((x) => x.reps).join('/')}`);
	}
	if (t.notitie) regels.push(`Notitie: ${t.notitie}`);
	return regels.join('\n');
}
