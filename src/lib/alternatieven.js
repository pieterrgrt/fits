// Welke oefeningen een andere kunnen vervangen: dezelfde spiergroep eerst.
import { OEFENINGEN, PER_SLUG } from './oefeningen.js';

const GROEPEN = {
	borst: 'Borst',
	rug: 'Rug',
	schouders: 'Schouders',
	armen: 'Armen',
	benen: 'Benen',
	core: 'Core'
};
const GROEP_VAN = {
	borst: 'borst',
	lats: 'rug', 'midden-rug': 'rug', onderrug: 'rug', trapezius: 'rug',
	'schouder-voor': 'schouders', 'schouder-zij': 'schouders', 'schouder-achter': 'schouders',
	biceps: 'armen', triceps: 'armen', onderarm: 'armen',
	quadriceps: 'benen', hamstrings: 'benen', bil: 'benen', kuiten: 'benen', adductoren: 'benen', abductoren: 'benen',
	buik: 'core'
};

/** De spiergroep van een oefening (naar zijn eerste primaire spier). */
export const groepVan = (slug) => GROEPEN[GROEP_VAN[PER_SLUG[slug]?.spieren.primair[0]]] ?? 'Overig';

/**
 * Oefeningen die dezelfde spieren trainen, beste eerst.
 * Score: gedeelde primaire spieren zwaar (de belangrijkste spier nog zwaarder), gedeelde secundaire licht,
 * zelfde soort (compound/isolatie) een beetje.
 */
export function alternatieven(slug) {
	const o = PER_SLUG[slug];
	if (!o) return [];
	const p = new Set(o.spieren.primair);
	const s = new Set(o.spieren.secundair);
	return OEFENINGEN.filter((x) => x.slug !== slug && x.soort !== 'warming-up')
		.map((x) => {
			let score = 0;
			for (const m of x.spieren.primair) score += p.has(m) ? 4 : s.has(m) ? 0 : -1;
			for (const m of x.spieren.secundair) score += p.has(m) || s.has(m) ? 1 : 0;
			if (x.spieren.primair[0] === o.spieren.primair[0]) score += 2;
			if (x.soort === o.soort) score += 1;
			return { slug: x.slug, score };
		})
		.filter((x) => x.score >= 4)
		.sort((a, b) => b.score - a.score)
		.map((x) => x.slug);
}
