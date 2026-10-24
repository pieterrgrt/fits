/*
  Dubbele progressie, als regels. Geen database hier: alles komt binnen als gewone gegevens,
  zodat het te testen is (tests/progressie.test.js).

  item:    { gewicht, eenheid, per_stuk, sets, sets_tijdelijk, reps_min, reps_max, sinds }
  oef:     oefening uit de bibliotheek ({ soort, stap, meet })
  sessies: [{ datum, sets: [{ gewicht, reps, rir }] }] voor deze oefening, nieuwste eerst
*/

import { dagenTussen, plusDagen, mooi } from './datum.js';
import { getal } from './gewicht.js';

const STAGNATIE_DAGEN = 28;

/** Het volgende gewicht volgens de stappen uit het schema. */
export function volgendGewicht(item, oef) {
	const g = item.gewicht;
	if (g == null) return null;
	if (item.eenheid === 'lbs') return g + 10;
	switch (oef?.stap) {
		case 'stang':
			return g + 2.5;
		case 'dumbbell':
			return g + (g < 12 ? 1 : 2);
		case 'raise':
			return g + 1;
		case 'lichaam':
			return g < 0 ? Math.min(0, g + 5) : null; // minder hulp; zonder hulp: meer reps
		case 'tijd':
			return null;
		default:
			return g + (g < 40 ? 2.5 : 5);
	}
}

const opGewicht = (sessie, g) => sessie.sets.filter((s) => (s.gewicht ?? null) === (g ?? null));
const totaal = (sets) => sets.reduce((a, s) => a + s.reps, 0);

/** Wat je deze sessie per set probeert te halen: vorige keer +1, tot de bovenkant. */
export function doelVandaag(item, sessies) {
	const aantal = item.sets_tijdelijk ?? item.sets;
	const vorige = sessies.find((s) => opGewicht(s, item.gewicht).length);
	const sets = vorige ? opGewicht(vorige, item.gewicht) : [];
	return Array.from({ length: aantal }, (_, n) => {
		const v = sets[n]?.reps;
		return v == null ? item.reps_min : Math.min(item.reps_max, v + 1);
	});
}

/**
 * Advies voor de zondag-check.
 * soort: 'zoek' | 'nieuw' | 'zwaarder' | 'falen' | 'wacht' | 'set-minder' | 'vervang' | 'doorgaan'
 */
export function advies(item, oef, sessies, vandaag) {
	const max = item.reps_max;
	const min = item.reps_min;
	const gepland = item.sets_tijdelijk ?? item.sets;
	const isolatie = oef?.soort === 'isolatie';

	if (item.gewicht == null) {
		const laatste = sessies[0];
		const gevonden = laatste?.sets.filter((s) => s.gewicht != null && s.reps >= min).sort((a, b) => b.gewicht - a.gewicht)[0];
		return {
			soort: 'zoek',
			tekst: gevonden
				? `Vorige keer haalde je ${gevonden.reps} reps op ${getal(gevonden.gewicht)} ${item.eenheid}. Zet dat als je gewicht.`
				: 'Begin licht en bouw per set op tot je in de eerste set ongeveer de onderkant van de range haalt. Dat gewicht noteer je.',
			nieuw: gevonden?.gewicht ?? null
		};
	}

	const opDitGewicht = sessies.map((s) => ({ ...s, sets: opGewicht(s, item.gewicht) })).filter((s) => s.sets.length);
	const laatst = opDitGewicht[0];
	if (!laatst) return { soort: 'nieuw', tekst: 'Nog geen sessie op dit gewicht. Probeer per set de onderkant te halen.' };

	// Tijd (plank): bovenkant gehaald → langer
	if (oef?.meet === 'sec') {
		if (laatst.sets.length >= gepland && laatst.sets.every((s) => s.reps >= max))
			return { soort: 'zwaarder', tekst: `Alle sets ${max} sec gehaald. Maak er ${max + 10} sec van.`, nieuwReps: [min + 10, max + 10] };
		return { soort: 'doorgaan', tekst: `Houd vol tot ${max} sec per set.` };
	}

	const bovenkant = laatst.sets.length >= gepland && laatst.sets.slice(0, gepland).every((s) => s.reps >= max);
	if (bovenkant) {
		// Alleen gehaald door tot falen te gaan? Dan nog niet. Bij isolatie mag de laatste set tot 0.
		const teBeoordelen = isolatie ? laatst.sets.slice(0, gepland - 1) : laatst.sets;
		if (teBeoordelen.some((s) => s.rir === 0))
			return { soort: 'falen', tekst: 'Bovenkant gehaald, maar alleen door tot falen te gaan. Nog niet zwaarder.' };

		if (oef?.stap === 'raise' && item.sinds && dagenTussen(item.sinds, vandaag) < 28) {
			const vanaf = plusDagen(item.sinds, 28);
			return { soort: 'wacht', tekst: `Bovenkant gehaald. Deze gaat hooguit +1 kg per maand: zwaarder vanaf ${mooi(vanaf)}.`, vanaf };
		}
		const nieuw = volgendGewicht(item, oef);
		if (nieuw == null)
			return { soort: 'zwaarder', tekst: 'Bovenkant in alle sets. Zonder hulp: probeer meer reps, of hang extra gewicht aan je riem.', nieuw: null };
		return {
			soort: 'zwaarder',
			tekst: `Bovenkant in alle sets (${laatst.sets.map((s) => s.reps).join('/')}). Volgende keer ${getal(nieuw)} ${item.eenheid}; reps zakken terug naar ${min}. Dat is de bedoeling.`,
			nieuw
		};
	}

	// Laatste set drie sessies op rij onder de onderkant → één set minder
	const drie = opDitGewicht.slice(0, 3);
	if (drie.length === 3 && drie.every((s) => (s.sets[gepland - 1]?.reps ?? 0) < min) && gepland > 2) {
		return {
			soort: 'set-minder',
			tekst: `De laatste set lukte drie sessies op rij niet. Zelfde gewicht, één set minder (${gepland - 1}), en de week erna weer opbouwen.`,
			sets: gepland - 1
		};
	}

	// Vier weken op hetzelfde gewicht zonder dat er reps bijkomen → vervangen
	if (item.sinds && dagenTussen(item.sinds, vandaag) >= STAGNATIE_DAGEN && opDitGewicht.length >= 2) {
		const eerste = opDitGewicht[opDitGewicht.length - 1];
		if (totaal(laatst.sets) <= totaal(eerste.sets))
			return {
				soort: 'vervang',
				tekst: `Al ${Math.floor(dagenTussen(item.sinds, vandaag) / 7)} weken op ${getal(item.gewicht)} ${item.eenheid} en er komen geen reps bij. Vervang hem door een variant uit het wisselslot.`
			};
	}

	const doel = doelVandaag(item, sessies);
	return { soort: 'doorgaan', tekst: `Volgende keer: ${doel.join('/')}. Eén rep meer per set.`, doel };
}
