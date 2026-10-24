import { een } from './db.js';
import { laatsteGewicht } from './data.js';
import { doelen } from '#lib/voeding.js';
import { vandaag } from '#lib/datum.js';

export const geldigeDatum = (d) => (/^\d{4}-\d{2}-\d{2}$/.test(d ?? '') ? d : vandaag());

/** Dagdoelen voor eten en water, uit profiel en laatst gelogd gewicht. */
export function doelenVan(gebruikerId) {
	const rij = een('SELECT gewicht, onderhoud, doel_kcal, doel_water, macro FROM gebruikers WHERE id = ?', gebruikerId);
	return doelen({ ...rij, macro: rij.macro ? JSON.parse(rij.macro) : null, gewicht: laatsteGewicht(gebruikerId)?.gewicht ?? rij.gewicht });
}
