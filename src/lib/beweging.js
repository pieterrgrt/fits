// Beweging: overgangen tussen pagina's en binnen een pagina.
// Alles volgt "liever geen beweging" op het toestel: dan staat alles stil (duur 0).
import { cubicOut } from 'svelte/easing';
import { slide, fade, fly } from 'svelte/transition';

const stil = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const duur = (ms) => (stil() ? 0 : ms);

// Benadert --veer uit tokens.css (cubic-bezier(0.2, 0.8, 0.2, 1)): snel weg, zacht aankomen.
export const veer = (t) => 1 - Math.pow(1 - t, 3.2);

/** Uit- en inklappen (accordeon, regels in een lijst). */
export const glijd = (node, { duration = 240, ...rest } = {}) => slide(node, { duration: duur(duration), easing: veer, ...rest });

/** Verschijnen: een klein stukje omhoog en invagen. */
export const verschijn = (node, { y = 8, duration = 200, ...rest } = {}) => fly(node, { y, duration: duur(duration), easing: cubicOut, ...rest });

/** Vervagen (achtergrond van een paneel). */
export const vervaag = (node, { duration = 200, ...rest } = {}) => fade(node, { duration: duur(duration), ...rest });

/** Paneel dat van onderen omhoog schuift. */
export const paneel = (node, { duration = 280 } = {}) => ({
	duration: duur(duration),
	easing: veer,
	css: (t, u) => `transform: translateY(${u * 100}%); opacity: ${Math.min(1, t * 2)}`
});

// ---------- Pagina-overgangen ----------

const TABS = ['/', '/schema', '/eten', '/logboek', '/meer'];
const MEER = ['/meer', '/zondag', '/doelen', '/cardio', '/account', '/beheer', '/uitleg', '/voeding', '/oefeningen', '/gezondheid', '/groei', '/fotos', '/ontwerp'];

/** Bij welke tab hoort een pad (index in de tabbalk), of -1. */
export function tabVan(pad) {
	if (pad === '/' || pad.startsWith('/training')) return 0;
	if (MEER.some((m) => pad.startsWith(m))) return 4;
	return TABS.findIndex((t, i) => i > 0 && i < 4 && pad.startsWith(t));
}

const diepte = (pad) => pad.split('/').filter(Boolean).length;

/**
 * Welke kant de nieuwe pagina op komt:
 * 'vooruit' (dieper of naar rechts), 'terug' (minder diep of naar links), of 'zelfde' (alleen vervagen).
 * @param {URL} van @param {URL} naar
 */
export function richting(van, naar) {
	const a = van.pathname;
	const b = naar.pathname;
	if (a === b) {
		// Zelfde pagina, andere dag (eten): vergelijk de datum. Geen datum = vandaag, de laatste dag.
		const da = van.searchParams.get('datum') ?? '9999';
		const db = naar.searchParams.get('datum') ?? '9999';
		return da === db ? 'zelfde' : db > da ? 'vooruit' : 'terug';
	}
	const ta = tabVan(a);
	const tb = tabVan(b);
	if (ta !== tb && ta >= 0 && tb >= 0) return tb > ta ? 'vooruit' : 'terug';
	const d = diepte(b) - diepte(a);
	return d > 0 ? 'vooruit' : d < 0 ? 'terug' : 'zelfde';
}

export const magBewegen = () => !stil();
